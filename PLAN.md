# Plan de mejora — Memoria

> Generado a partir de una revisión completa del código (2026-07-06).
> Estado en ese momento: tests 27/27 en verde, `npm run lint` con **7 errores y 4 warnings**, sin `.env` versionado, RLS activo en todas las tablas.

## Cómo ejecutar este plan

- Trabaja **una tarea a la vez**, en el orden de las fases (cada fase asume la anterior).
- Después de cada tarea: `npm run test:run && npm run lint`. Antes de cerrar una fase: `npm run build`.
- Un commit por tarea (mensajes en inglés). Las tareas de base de datos van siempre en un archivo nuevo en `supabase/migrations/` — nunca editando `001_initial_schema.sql`.
- Cada tarea tiene: **Problema → Archivos → Qué hacer → Verificación**.

---

## Fase 1 — Corrección de bugs (rápida, bajo riesgo)

### 1.1 `TopicFormModal` muestra datos viejos al editar

- **Problema:** el form se inicializa con `useForm({ initialValues })` una sola vez al montar. Como el modal está siempre montado dentro de `TopicTable`, al pulsar "Edit" el input muestra el nombre de la primera renderización, no el del topic elegido.
- **Archivos:** `components/topics/TopicFormModal.tsx:20-23` (referencia del patrón correcto: `components/questions/QuestionFormModal.tsx:38-46`).
- **Qué hacer:** añadir un `useEffect` que haga `form.setValues({ name: topic?.name ?? '' })` cuando cambie `topic?.id`, igual que hace `QuestionFormModal`.
- **Verificación:** crear dos topics, editar el segundo → el input debe mostrar su nombre. Añadir un test de RTL que cubra este caso.

### 1.2 Errores silenciosos al guardar resultados de sesión

- **Problema:** los query builders de Supabase **no rechazan la promesa** cuando hay error — resuelven con `{ error }`. En `commitResults` los `Promise.all` "funcionan" aunque todos los updates fallen, y el `.catch()` final casi nunca se dispara. El usuario cree que su sesión se guardó cuando no fue así.
- **Archivos:** `components/sessions/StudySession.tsx:98-135`.
- **Qué hacer:** recoger los resultados de cada `Promise.all` e inspeccionar `result.error` de cada uno; si alguno falló, mostrar la notificación de error (y no marcar la sesión como completada). Nota: la tarea 2.4 reemplaza todo este bloque por una RPC — si vas a hacer la Fase 2 seguida, puedes fusionar ambas tareas.
- **Verificación:** simular un fallo (p. ej. desconectar la red al terminar la sesión) → debe aparecer la notificación roja.

### 1.3 Limpiar los 7 errores y 4 warnings de lint

- **Problema:** `npm run lint` falla. Errores: `as any` en `app/(protected)/topics/page.tsx:15`, `app/sessions/[id]/page.tsx:32` y `components/topics/TopicTable.tsx:28`; entidades sin escapar en `dashboard/page.tsx:44` y `TopicTable.tsx:39`; `setState` síncrono en effect en `components/ui/ImageUpload.tsx:27`. Warnings: dependencias de hooks en `QuestionFormModal`, `StudySession`, `ImageUpload` y un import sin usar en `SessionConfigurator`.
- **Qué hacer:** tipar los resultados de Supabase con interfaces propias en lugar de `as any` (para los joins, define tipos como el `SessionQuestionWithQuestion` de `StudySession.tsx:11`); escapar las comillas/apóstrofes; en `ImageUpload` derivar el preview sin `setState` dentro del effect (o al menos mover la lógica a un handler). Para los warnings de `exhaustive-deps`, decide caso por caso — no los silencies con `eslint-disable` sin entender por qué.
- **Verificación:** `npm run lint` termina sin errores.

### 1.4 Umbral de memorización duplicado

- **Problema:** el "streak ≥ 10 ⇒ memorizada" vive en `lib/session-logic.ts:65` y está duplicado a mano en `StudySession.tsx:143` (cálculo de `newlyMemorized`). Esto viola la regla de `AGENTS.md` (la lógica de sesión no se duplica en componentes): si mañana cambias el umbral, la pantalla final mentirá.
- **Qué hacer:** exportar `export const MEMORIZED_THRESHOLD = 10` desde `lib/session-logic.ts`, usarla en `computeStreakUpdates` y en `StudySession`.
- **Verificación:** `npm run test:run` en verde; comprobar que no queda ningún `10` mágico relacionado con streaks (`grep -rn "streak" components lib`).

### 1.5 Validación de contraseña inconsistente

- **Problema:** signup exige mínimo 8 caracteres (`SignupForm.tsx:20`) pero login valida mínimo 6 (`LoginForm.tsx:21`).
- **Qué hacer:** en login basta con validar que no esté vacía (la longitud real la decide el servidor); dejar el mínimo de 8 solo en signup.
- **Verificación:** el test de `LoginForm.test.tsx` sigue pasando (ajústalo si validaba el mensaje de 6 caracteres).

---

## Fase 2 — Seguridad y base de datos

> Todas las tareas SQL van en `supabase/migrations/002_security_and_indexes.sql` (o archivos separados si prefieres commits atómicos).

### 2.1 Políticas del bucket `card-images` en una migración ⚠️ la más importante

- **Problema:** las políticas de Storage viven solo en el dashboard (lo dice el comentario final de `001_initial_schema.sql:84-86`). No son auditables ni reproducibles, y si no restringen por carpeta, **cualquier usuario autenticado puede leer/escribir imágenes de otros**. Los paths ya usan el prefijo `userId/` (`ImageUpload.tsx:43`), así que el modelo encaja.
- **Qué hacer:** antes de nada, revisar en el dashboard qué políticas existen hoy (para saber si el hueco es real). Después, codificarlas en la migración:

```sql
-- Requires the 'card-images' bucket to exist (private)
create policy "card-images: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "card-images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "card-images: delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

  Si el dashboard ya tiene políticas equivalentes, bórralas de ahí y deja solo las de la migración (una única fuente de verdad). Si tenía políticas más laxas, esta migración **cierra un hueco real**.
- **Verificación:** con dos usuarios de prueba, intentar `createSignedUrl` sobre un path del otro usuario → debe fallar.

### 2.2 `default auth.uid()` en `user_id`

- **Problema:** los inserts del cliente no envían `user_id` (`TopicFormModal.tsx:27`, `QuestionFormModal.tsx:49`, `SessionConfigurator.tsx:60`) y la migración declara `user_id not null` **sin default**. Si la app funciona hoy es porque la columna se alteró a mano en el dashboard: la migración no reproduce la base real.
- **Qué hacer:**

```sql
alter table topics alter column user_id set default auth.uid();
alter table questions alter column user_id set default auth.uid();
alter table sessions alter column user_id set default auth.uid();
```

- **Verificación:** aplicar la migración sobre una base limpia y comprobar que crear topic/question/session desde la app funciona.

### 2.3 Índices en las foreign keys

- **Problema:** Postgres no crea índices para FKs automáticamente, y las políticas RLS consultan `user_id` en cada request. El join de `session_questions → sessions` de la política se hace sin índice.
- **Qué hacer:**

```sql
create index idx_topics_user_id on topics(user_id);
create index idx_questions_user_id on questions(user_id);
create index idx_questions_topic_id on questions(topic_id);
create index idx_sessions_user_id on sessions(user_id);
create index idx_session_questions_session_id on session_questions(session_id);
create index idx_session_questions_question_id on session_questions(question_id);
```

- **Verificación:** la migración aplica sin errores; la app sigue funcionando.

### 2.4 RPC transaccional `complete_session`

- **Problema:** cerrar una sesión dispara N updates sueltos desde el navegador (`StudySession.tsx:98-135`): sin atomicidad (un fallo a mitad deja streaks inconsistentes) y con la lógica de streaks ejecutándose en el cliente, donde `streak`/`is_memorized` son escribibles a mano.
- **Qué hacer:** crear una función Postgres `complete_session(p_session_id uuid, p_results jsonb)` (`security invoker`, así RLS sigue aplicando) que, en una sola transacción: actualice `session_questions.result` y `was_retried`, recalcule `streak`/`is_memorized` (misma fórmula que `computeStreakUpdates`: correcto ⇒ streak+1, fallo ⇒ 0, memorizada si ≥ umbral) y marque `sessions.completed_at`. En `StudySession`, sustituir todo el bloque `commitResults` por una llamada `supabase.rpc('complete_session', ...)` con manejo de error real.
  - `computeStreakUpdates` y sus tests se conservan como especificación de la lógica; deja un comentario en la función SQL apuntando a `lib/session-logic.ts`.
- **Verificación:** completar una sesión con aciertos y fallos → streaks correctos en la tabla `questions`, sesión marcada como completada; los tests de `session-logic` siguen en verde.

### 2.5 Guard de usuario en el layout protegido

- **Problema:** las páginas protegidas usan `user!.id` (`questions/page.tsx:26`, `sessions/[id]/page.tsx:18`) confiando ciegamente en el middleware. Además `app/sessions/[id]` está **fuera** del grupo `(protected)` — hoy lo cubre el prefijo `/sessions` de `proxy.ts:5`, pero es frágil.
- **Qué hacer:** en `app/(protected)/layout.tsx`, hacer `getUser()` y `redirect('/login')` si no hay usuario. Mover `app/sessions/[id]` dentro de `app/(protected)/sessions/[id]` (la URL no cambia: los route groups no afectan al path; ojo con que el layout de la sidebar no rompa la vista fullscreen de estudio — si molesta, puede necesitar su propio layout anidado). Eliminar los `user!` y manejar el caso null.
- **Verificación:** `npm run build` + navegar deslogueado a `/dashboard` y `/sessions/<id>` → redirect a login.

### 2.6 Security headers

- **Problema:** `next.config.ts` está vacío; no se envían `X-Frame-Options`, `Referrer-Policy`, etc.
- **Qué hacer:** añadir `headers()` en `next.config.ts` con al menos: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Una CSP completa es opcional aquí (con Mantine requiere afinar `style-src`); si la añades, empieza en modo `Content-Security-Policy-Report-Only`.
- **Verificación:** `npm run build && npm run start` y comprobar los headers con `curl -I localhost:3000`.

---

## Fase 3 — Completar features a medias

### 3.1 Mostrar imágenes en la sesión de estudio

- **Problema:** el formulario permite adjuntar imágenes a pregunta y respuesta, pero `StudySession.tsx` solo renderiza texto. La feature está a mitad de camino: el usuario sube una imagen que nunca ve al estudiar.
- **Qué hacer:** el server component `app/sessions/[id]/page.tsx` ya trae `question_image_path`/`answer_image_path`; generar ahí las signed URLs de todas las imágenes de la sesión (en paralelo, `createSignedUrl` con expiración mayor que la duración esperada de la sesión, p. ej. 2h) y pasarlas al componente. En la card, mostrar la imagen de la pregunta siempre y la de la respuesta al revelar (componente `Image` de Mantine).
- **Verificación:** sesión con preguntas con y sin imagen → se ven donde toca y el layout no salta.

### 3.2 Retomar o descartar sesiones incompletas

- **Problema:** una sesión abandonada queda como "Incomplete" en la historia (`SessionHistoryTable.tsx:41`) sin link para retomarla ni acción para borrarla. Es un callejón sin salida.
- **Qué hacer:** en la fila de una sesión incompleta, añadir acciones "Resume" (link a `/sessions/<id>`, que ya funciona porque la página solo redirige si `completed_at` está seteado) y "Discard" (delete de la sesión con modal de confirmación — `session_questions` cae en cascada).
- **Verificación:** abandonar una sesión a la mitad, retomarla desde la historia y completarla; descartar otra y ver que desaparece.

### 3.3 Borrado de imágenes diferido al guardado

- **Problema:** `ImageUpload.handleRemove` (`ImageUpload.tsx:59-65`) borra el archivo del bucket **inmediatamente**, antes de guardar el form → quitar la imagen y cancelar el modal deja la fila apuntando a un archivo borrado. Al revés, subir imagen y cancelar deja huérfanos en Storage.
- **Qué hacer:** `ImageUpload` deja de borrar de Storage; solo notifica `onChange(null)`. `QuestionFormModal` acumula los paths a borrar (imagen quitada o reemplazada) y los elimina **después** de guardar con éxito. Al cancelar, borrar solo los archivos subidos en esa edición que no se guardaron. Los huérfanos históricos se pueden limpiar una vez a mano; no hace falta un job.
- **Verificación:** (a) editar, quitar imagen, cancelar → la imagen sigue visible; (b) quitar imagen y guardar → archivo borrado del bucket; (c) subir imagen y cancelar → el archivo no queda en el bucket.

### 3.4 Layout responsive

- **Problema:** sidebar fija de 220px (`AppSidebar.tsx:32`) y `SimpleGrid cols={4}` fijo (`dashboard/page.tsx:46`); en móvil la app no se puede usar.
- **Qué hacer:** migrar el layout protegido al `AppShell` de Mantine con navbar colapsable + burger en móvil; `cols={{ base: 1, sm: 2, lg: 4 }}` en el dashboard; revisar las tablas (`QuestionTable`, `SessionHistoryTable`) con `Table.ScrollContainer`. La vista de estudio ya es una columna centrada — solo revisar el ancho fijo `w={560}`.
- **Verificación:** probar en el modo responsive del navegador (375px, 768px, 1280px).

---

## Fase 4 — Ideas futuras (ordenadas por valor/esfuerzo)

No son tareas cerradas; cada una merece una mini-sesión de diseño antes de implementar.

1. **Guardado incremental durante la sesión.** Grabar cada primera respuesta al momento (update del `session_question`) en lugar de todo al final → abandonar una sesión no pierde el progreso, y combinado con 3.2 el "Resume" continúa donde ibas de verdad.
2. **Página de perfil real.** `app/(protected)/profile/page.tsx` está vacía: mostrar email, cambio de contraseña (`supabase.auth.updateUser`), y borrar cuenta.
3. **Estadísticas de progreso.** Precisión por topic, evolución de memorizadas en el tiempo. Los datos ya existen (`sessions` + `session_questions`); empieza simple (tabla/una gráfica) antes de meter una librería de charts.
4. **Import/export.** CSV primero (trivial y desbloquea backup); formato Anki después si lo necesitas.
5. **Spaced repetition real (la grande).** Sustituir el streak simple por SM-2 o FSRS: añade `due_date`/`interval`/`ease` a `questions` y cambia `weightedSample` por "preguntas vencidas primero". Todo el diseño actual (lógica pura en `lib/session-logic.ts` con tests) hace esta migración muy tratable. Hazla **después** de 2.4, para que la lógica ya esté centralizada en un solo punto de escritura.
6. **Acciones manuales sobre preguntas.** Reset de streak / desmarcar memorizada desde `QuestionTable`, para corregir cuando el algoritmo se equivoca.

---

## Checklist resumen

- [ ] 1.1 Fix sync de `TopicFormModal` al editar
- [ ] 1.2 Manejo real de errores en `commitResults`
- [ ] 1.3 Lint a cero (7 errores, 4 warnings)
- [ ] 1.4 `MEMORIZED_THRESHOLD` único en `session-logic.ts`
- [ ] 1.5 Unificar validación de contraseñas
- [ ] 2.1 Políticas de Storage en migración ⚠️
- [ ] 2.2 `default auth.uid()` en `user_id`
- [ ] 2.3 Índices en FKs
- [ ] 2.4 RPC `complete_session`
- [ ] 2.5 Guard en layout protegido + mover `sessions/[id]`
- [ ] 2.6 Security headers
- [ ] 3.1 Imágenes en la sesión de estudio
- [ ] 3.2 Retomar/descartar sesiones incompletas
- [ ] 3.3 Borrado de imágenes diferido
- [ ] 3.4 Layout responsive

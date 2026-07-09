This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting

### `pnpm dev` fails with `ERR_PNPM_IGNORED_BUILDS`

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@x.x.x, unrs-resolver@x.x.x
[ERROR] Command failed with exit code 1: pnpm install
```

pnpm 10+ blocks dependencies from running install/build scripts by default (supply-chain
safety). `sharp` and `unrs-resolver` are transitive deps that need to build native binaries,
so pnpm records them as ignored and `pnpm install` exits with code 1 — and `next dev`'s
built-in "deps up to date" check runs `pnpm install`, so it dies too.

Approve the builds once (this runs their scripts and stores the approval in
`pnpm-workspace.yaml`):

```bash
pnpm approve-builds --all
```

Any time a newly added dependency triggers the same error, run `pnpm approve-builds` again
(omit `--all` for an interactive checklist, or pass a package name to approve just one).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

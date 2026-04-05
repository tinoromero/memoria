import { createTheme, type MantineColorsTuple } from '@mantine/core'

const sky: MantineColorsTuple = [
  '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8',
  '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e',
]

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'sky',
  colors: { sky },
  defaultRadius: 'md',
  components: {
    NavLink: {
      styles: {
        root: { borderRadius: '8px' },
      },
    },
  },
})

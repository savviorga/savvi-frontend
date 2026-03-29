import type { Preview } from '@storybook/nextjs-vite'

// Misma hoja que en app/layout.tsx: Tailwind + tokens (@theme, :root).
// Sin esto, los componentes se renderizan sin utilidades ni variables CSS.
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    colors: {
      'primary': '#7D53F6',
      'secondary': '#FBFAFF',
      'primary-light': 'rgb(125 83 246 / 5%)',
      'primary-dim': 'rgb(125 83 246 / 14%)',
      'primary-medium': 'rgb(125 83 246 / 65%)',
      'background': 'rgb(238 241 249/1)',
      'sec-background': '#ECE8FE',
      'sec-dim': 'rgb(253 253 253 / 75%)',
      'dark': '#1e1e1e',
      'icon-color': '#5F6388',
      'white': '#ffffff',
      'gray': {
        '50': '#f9fafb',
        '100': '#f3f4f6',
        '200': '#e5e7eb',
        '300': '#d1d5db',
        '400': '#9ca3af',
        '500': '#6b7280',
        '600': '#4b5563',
        '700': '#374151',
        '800': '#1f2937',
        '900': '#111827',
      },
      'red': {
        '50': '#fef2f2',
        '100': '#fee2e2',
        '200': '#fecaca',
        '600': '#dc2626',
      },
      'green': {
        '50': '#f0fdf4',
        '100': '#dcfce7',
        '200': '#bbf7d0',
        '600': '#16a34a',
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    boxShadow: {
      'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
  },
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/skript-command-builder/', // crucial for GitHub Pages
  plugins: [react()]
});

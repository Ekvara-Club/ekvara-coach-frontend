import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port fixe 5174 (jamais 5173, réservé à EkvaraFrontend athlète) : les deux
// frontends de dev doivent pouvoir tourner en même temps sans conflit.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});

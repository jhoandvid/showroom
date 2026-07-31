import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // maplibre-gl incluye su propio web worker. El preempaquetador de dependencias
    // de Vite reescribe su punto de entrada y luego no puede resolverlo, por lo que
    // los mosaicos nunca se procesan y el estilo no termina de cargar. Excluirlo
    // conserva la resolución del worker propia del paquete.
    exclude: ["maplibre-gl"],
  },
})

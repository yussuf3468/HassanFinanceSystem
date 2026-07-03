import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    // Modern browsers + Capacitor WebView all support es2019; the old
    // es2015 target inflated and slowed every bundle with transpilation.
    target: "es2019",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["lucide-react"],
          supabase: ["@supabase/supabase-js"],
          toast: ["react-toastify"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@supabase/supabase-js"],
    exclude: [],
  },
  server: {
    hmr: {
      overlay: false,
    },
    // Force reload on file changes
    // watch: {
    //   usePolling: true,
    // },
  },
  // Better cache control
  preview: {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
});

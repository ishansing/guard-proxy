import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // SSE stream — needs special handling
      "/api/events/stream": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, _req, res) => {
            // Keep SSE connection alive on disconnect
            res.on("close", () => {
              if (!res.writableEnded) proxyReq.destroy();
            });
          });
        },
      },
      // All other API routes — normal proxy
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

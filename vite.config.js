import { defineConfig } from "vite";
export default defineConfig({
  root: "web",
  base: "/",
  // Shared installation components must use the host application's React.
  resolve: { dedupe: ["react", "react-dom"] },
  build: { outDir: "../dist", assetsDir: "demo-assets", emptyOutDir: true },
});

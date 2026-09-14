import { defineConfig } from "vite";
export default defineConfig({
  root: "web",
  base: "/local/",
  build: { outDir: "../dist", emptyOutDir: true },
});

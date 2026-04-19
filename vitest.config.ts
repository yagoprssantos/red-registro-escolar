import path from "path";
import { defineConfig } from "vitest/config";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "apps", "web", "src"),
      "@shared": path.resolve(templateRoot, "packages", "shared", "src"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["apps/server/test/**/*.test.ts", "apps/server/test/**/*.spec.ts"],
  },
});

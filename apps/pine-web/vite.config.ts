import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readDevTls = (appName: string) => {
  const keyPath = path.resolve(__dirname, `../../.local/tls/${appName}/${appName}.key`);
  const certPath = path.resolve(__dirname, `../../.local/tls/${appName}/${appName}.crt`);
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  return undefined;
};

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/__generated__/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@bootstrap": path.resolve(__dirname, "src/bootstrap"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@features": path.resolve(__dirname, "src/features"),
      "@graphql": path.resolve(__dirname, "src/graphql"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@generated": path.resolve(__dirname, "src/__generated__"),
      "@graphql-typed-document-node/core": path.resolve(
        __dirname,
        "src/shims/graphql-typed-document-node-core.ts",
      ),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    host: "localhost",
    port: 3001,
    https: readDevTls("pine-web"),
  },
  optimizeDeps: {
    include: ["@pine/common/constants"],
  },
});

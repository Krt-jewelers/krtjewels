import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Server tests live next to the edge-function code they cover.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "supabase/functions/**/*.test.ts"],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Edge functions import supabase-js by URL (Deno); tests use a stand-in.
      {
        find: /^https:\/\/esm\.sh\/@supabase\/supabase-js@2$/,
        replacement: path.resolve(__dirname, "./supabase/functions/_shared/testing/fakeSupabase.ts"),
      },
    ],
  },
});

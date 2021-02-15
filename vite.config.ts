import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import pegjs from "rollup-plugin-pegjs";

export default defineConfig({
  plugins: [vue(), pegjs()],
  root: "./",
  build: {
    assetsDir: "resources",
    base: "/arknights-attack-range/",
  },
});

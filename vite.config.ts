import {telefunc} from "telefunc/vite";
import ssr from "vite-plugin-ssr/plugin";
import react from "@vitejs/plugin-react";
import {hattip} from "@hattip/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [hattip(), react({
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ]
    },
  }), ssr(), telefunc()],
});
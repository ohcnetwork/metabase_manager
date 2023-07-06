import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import { UserConfig } from "vite";
import { telefunc } from "telefunc/vite";

const config: UserConfig = {
  plugins: [react(), ssr(), telefunc()],
};

export default config;

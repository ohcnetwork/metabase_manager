import type { Config } from "vike-react/types";
import Layout from "../layouts/LayoutDefault";
import Head from "../layouts/HeadDefault";
import vikeReact from "vike-react";

export default {
  Layout,
  Head,
  title: "Metabase Manager",
  description: "Use Metabase Manager to synchronize your Metabase instance",
  extends: vikeReact,
} satisfies Config;

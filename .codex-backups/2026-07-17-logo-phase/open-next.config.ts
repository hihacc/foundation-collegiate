import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// Avoid recursion: the public `build` script invokes OpenNext, while OpenNext
// must invoke Next.js itself to produce the intermediate application build.
config.buildCommand = "npx next build";

export default config;

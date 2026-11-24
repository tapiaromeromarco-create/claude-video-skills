/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import fs from "node:fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// En el servidor de la nube se usa el Chromium preinstalado; en otra computadora Remotion descarga el suyo.
const CHROMIUM_NUBE = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(CHROMIUM_NUBE)) {
  Config.setBrowserExecutable(CHROMIUM_NUBE);
  Config.setChromiumOpenGlRenderer("swangle");
}

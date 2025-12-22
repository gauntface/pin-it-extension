#!/usr/bin/env node
import { execSync } from "node:child_process";

const version = process.env.EXTENSION_VERSION;
if (!version) {
  throw new Error(`EXTENSION_VERSION not defined`);
}

const releaseName = `pin-it-extension@${version}`;
const releaseOut = execSync(
  "./node_modules/.bin/sentry-cli releases " + `new ${releaseName}`,
);
console.log(releaseOut.toString());

const sourcemapOut = execSync(
  "./node_modules/.bin/sentry-cli sourcemaps " +
    `upload --release=${releaseName} ./dist`,
);
console.log(sourcemapOut.toString());

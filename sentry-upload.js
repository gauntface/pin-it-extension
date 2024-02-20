#!/usr/bin/env node
import {join} from 'path';
import {execSync} from 'node:child_process';
import { readFile} from 'fs/promises';

const manifestPath = join('dist', 'manifest.json');
const manifestBuffer = await readFile(manifestPath);
const manifest = JSON.parse(manifestBuffer.toString());

  const releaseName = `pin-it-extension@${manifest.version}`;
  const releaseOut = execSync(`./node_modules/.bin/sentry-cli releases ` +
    `new ${releaseName}`);
  console.log(releaseOut.toString());

  const sourcemapOut = execSync(`./node_modules/.bin/sentry-cli sourcemaps ` +
    `upload --release=${releaseName} ./dist`);
  console.log(sourcemapOut.toString());

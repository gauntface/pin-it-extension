import { defineConfig } from "vite";
import { resolve, join } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import semver from "semver";
import { readFile, writeFile, rm } from "fs/promises";
import { createWriteStream } from "fs";
import { execSync } from "node:child_process";
import archiver from "archiver";

async function writeManifest() {
  console.log("Setting up extension manifest");
  const manifestBuffer = await readFile(
    resolve(__dirname, "src/manifest.json"),
  );
  const manifest = JSON.parse(manifestBuffer.toString());

  if (process.env.NODE_ENV !== "production") {
    manifest.key = "developmentkalohmonpfgdhimepifhl";
    manifest.name = `Dev: ${manifest.name}`;
    for (const k of Object.keys(manifest.icons)) {
      const parts = manifest.icons[k].split(".");
      manifest.icons[k] = `${parts[0]}-dev.${parts[1]}`;
    }
    for (const k of Object.keys(manifest.action.default_icon)) {
      const parts = manifest.action.default_icon[k].split(".");
      manifest.action.default_icon[k] = `${parts[0]}-dev.${parts[1]}`;
    }
  } else {
    const newVersion = semver.parse(process.env.EXTENSION_VERSION);
    if (!newVersion) {
      throw new Error(
        `Version could not be parsed by semver: '${process.env.EXTENSION_VERSION}'`,
      );
    }
    manifest.version = newVersion.version;
  }

  await writeFile(
    resolve(__dirname, "dist/manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`written manifest`);
}

function injectSentryDebugIDs() {
  console.log("Injecting sentry sourcemaps");
  const sentryCli = resolve(__dirname, "node_modules/.bin/sentry-cli");
  execSync(`${sentryCli} sourcemaps inject ${resolve(__dirname, "dist")}`);
}

async function bundleExtension() {
  console.log("Bundling zip");
  const zipPath = join(resolve(__dirname), "gauntface-pin-it-extension.zip");
  try {
    await rm(zipPath);
  } catch (e) {
    // NOOP
  }

  const output = createWriteStream(zipPath);
  // eslint-disable-next-line new-cap
  const archive = new archiver("zip", {
    zlib: {
      // Sets the compression level
      level: 9,
    },
  });

  const distDir = resolve(__dirname, "dist");

  try {
    await new Promise((resolve, reject) => {
      output.on("close", () => {
        resolve(null);
      });

      output.on("end", () => {
        console.log("Output End event");
      });

      // good practice to catch warnings (ie stat failures and other
      // non-blocking errors)
      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          console.warn(`Archiver warning: ${err.message}`);
        } else {
          reject(err);
        }
      });

      // good practice to catch this error explicitly
      archive.on("error", (err) => {
        reject(err);
      });

      // pipe archive data to the file
      archive.pipe(output);

      // append files from a sub-directory and naming it `gauntface-pin-it-extension`
      // within the archive
      archive.directory(distDir, false);

      // finalize the archive (ie we are done appending files but streams have to
      // finish yet)
      // 'close', 'end' or 'finish' may be fired right after calling this method
      // so register to them beforehand
      archive.finalize();
    });
  } catch (err) {
    console.error(`Error while zipping: ${err}`);
    throw err;
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        options: resolve(__dirname, "options.html"),
        sw: resolve(__dirname, "src/background/sw.ts"),
      },
      output: {
        entryFileNames: (file) => {
          if (file.name === "sw") {
            return "scripts/background/sw.js";
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
  plugins: [
    svelte(),
    {
      name: "bundle-extension",
      closeBundle: async () => {
        await writeManifest();
        await injectSentryDebugIDs();
        await bundleExtension();
      },
    },
  ],
});

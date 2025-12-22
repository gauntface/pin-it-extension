import { svelte } from "@sveltejs/vite-plugin-svelte";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { cp, readFile, rm, writeFile } from "fs/promises";
import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { join, resolve } from "path";
import semver from "semver";
import { defineConfig } from "vite";

async function copyDist(buildDir: string) {
  const distDir = resolve(__dirname, "dist");
  await cp(distDir, buildDir, { recursive: true });
  console.log(`Copied ${distDir} to ${buildDir}`);
}

async function writeManifest(browserType: BrowserType, buildDir: string) {
  console.log("Setting up extension manifest");
  const manifestBuffer = await readFile(
    resolve(__dirname, "src/manifest.json"),
  );
  const manifest = JSON.parse(manifestBuffer.toString());

  switch (browserType) {
    case "firefox": {
      // FF options pages are generally shown in an inline tab
      manifest["options_ui"] = {
        page: "options.html",
      };

      manifest["background"]["scripts"] = ["scripts/background/sw.js"];
      break;
    }
    case "chrome": {
      // Chrome is nicer with a full page tab
      manifest["options_page"] = "options.html";
      // Chrome supports service workers
      manifest["background"]["service_worker"] = "scripts/background/sw.js";

      if (process.env.NODE_ENV !== "production") {
        // Add dev key so refreshes are consistent
        manifest.key = "developmentkalohmonpfgdhimepifhl";
      }
      break;
    }
    default: {
      const bt: never = browserType;
      throw new Error(`Unsupported browser type: ${bt}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
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

  const manifestPath = resolve(buildDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`written manifest to ${manifestPath}`);
}

function injectSentryDebugIDs() {
  console.log("Injecting sentry sourcemaps");
  const sentryCli = resolve(__dirname, "node_modules/.bin/sentry-cli");
  execSync(`${sentryCli} sourcemaps inject ${resolve(__dirname, "dist")}`);
}

async function bundleExtension(
  browserType: BrowserType,
  buildDir: string,
  zipsDir: string,
) {
  console.log("Bundling zip");
  await mkdir(zipsDir, { recursive: true });
  const zipPath = join(
    zipsDir,
    `gauntface-pin-it-extension-${browserType}.zip`,
  );
  try {
    await rm(zipPath);
  } catch (e) {
    // NOOP
  }

  const output = createWriteStream(zipPath);
  // eslint-disable-next-line new-cap
  const archive = archiver("zip", {
    zlib: {
      // Sets the compression level
      level: 9,
    },
  });

  const distDir = resolve(buildDir);

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

async function bundleExtensionSrc() {
  console.log("Bundling src zip");
  const zipPath = join(resolve(__dirname), "gauntface-pin-it-src.zip");
  try {
    await rm(zipPath);
  } catch (e) {
    // NOOP
  }

  const output = createWriteStream(zipPath);
  // eslint-disable-next-line new-cap
  const archive = archiver("zip", {
    zlib: {
      // Sets the compression level
      level: 9,
    },
  });

  const srcDir = resolve(__dirname, "src");

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
      archive.directory(srcDir, false);

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
        const buildPath = path.join(__dirname, "build");
        const buildZipsPath = path.join(buildPath, "zip");
        const chromePath = path.join(buildPath, "chrome");
        const ffPath = path.join(buildPath, "firefox");

        await injectSentryDebugIDs();

        const builds: Array<{ browser: BrowserType; path: string }> = [
          {
            browser: "chrome",
            path: chromePath,
          },
          {
            browser: "firefox",
            path: ffPath,
          },
        ];
        for (const b of builds) {
          await copyDist(b.path);
          await writeManifest(b.browser, b.path);
          await bundleExtension(b.browser, b.path, buildZipsPath);
          await bundleExtensionSrc();
        }
      },
    },
  ],
  test: {
    root: "src",
    setupFiles: ["./vitestSetupMocks.ts"],
  },
});

type BrowserType = "chrome" | "firefox";

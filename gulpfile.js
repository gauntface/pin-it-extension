import imagemin from "gulp-imagemin";
import fs from "fs-extra";
import path from "path";
import gulp from "gulp";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { setConfig } from "@hopin/wbt-config";
import tsBrowser from "@hopin/wbt-ts-browser";
import semver from "semver";
import archiver from "archiver";
import util from "util";
import { exec } from "child_process";
const execP = util.promisify(exec);

const devExtensionkey = "developmentkalohmonpfgdhimepifhl";

const src = path.join(path.resolve(), "src");
const dst = path.join(path.resolve(), "build");

setConfig(src, dst);

gulp.task("zip", async function () {
  const zipPath = path.join(path.resolve(), "gauntface-pin-it-extension.zip");
  await fs.remove(zipPath);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", {
    zlib: {
      // Sets the compression level
      level: 9,
    },
  });

  return new Promise((resolve, reject) => {
    output.on("close", function () {
      resolve();
    });

    output.on("end", function () {
      console.log("Output End event");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        console.warn(`Archiver warning: ${err.message}`);
      } else {
        reject(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a sub-directory and naming it `new-subdir` within the archive
    archive.directory(dst, "gauntface-pin-it-extension");

    // append files from a sub-directory, putting its contents at the root of archive
    // archive.directory('subdir/', false);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
});

gulp.task("bumpManifestVersion", async function () {
  const manifestPath = path.join(src, "manifest.json");
  const manifestContents = await fs.readJSON(manifestPath);
  const newVersion = semver.inc(manifestContents.version, "patch");
  if (!newVersion) {
    throw new Error(
      `Version could not be bumped by semver: ${manifestContents.version}`
    );
  }
  manifestContents.version = newVersion;
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task("dev-manifest", async function () {
  const manifestPath = path.join(dst, "manifest.json");
  const manifestContents = await fs.readJSON(manifestPath);
  manifestContents.key = devExtensionkey;
  manifestContents.name = `Dev: ${manifestContents.name}`;
  for (const k of Object.keys(manifestContents.icons)) {
    const parts = manifestContents.icons[k].split(".");
    manifestContents.icons[k] = `${parts[0]}-dev.${parts[1]}`;
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task("prod-manifest", async function () {
  const manifestPath = path.join(dst, "manifest.json");
  const manifestContents = await fs.readJSON(manifestPath);
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task("images", function () {
  const extensions = ["jpeg", "jpg", "png", "gif", "svg"];
  return (
    gulp
      .src(`${src}/**/*.{${extensions.join(",")}}`)
      // TODO: Dig into why this isn't working, possible related to
      // https://github.com/sindresorhus/gulp-imagemin/issues/365
      // .pipe(imagemin())
      .pipe(gulp.dest(dst))
  );
});

gulp.task("clean", function () {
  return fs.remove(dst);
});

gulp.task("copy", function () {
  const extensions = ["json", "html", "css"];

  return gulp.src(`${src}/**/*.{${extensions.join(",")}}`).pipe(gulp.dest(dst));
});

gulp.task("prettier", () => {
  return execP("npx prettier --write .");
});

gulp.task(
  "build-clean",
  gulp.series(
    "clean",
    "prettier",
    gulp.parallel(
      tsBrowser.gulpBuild("gauntface.pinit.extension", {
        rollupPlugins: [
          commonjs(),
          resolve({
            browser: true,
          }),
        ],
      }),
      "copy",
      "images"
    )
  )
);

gulp.task("build", gulp.series("build-clean", "dev-manifest"));

gulp.task("publish", function (done) {
  process.env.NODE_ENV = "production";

  return gulp.series([
    "bumpManifestVersion",
    "build-clean",
    "prod-manifest",
    "zip",
  ])(done);
});

gulp.task("watch", function () {
  gulp.watch("src/**/*", { ignoreInitial: false }, gulp.series("build"));
});

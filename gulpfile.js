import fs from 'fs-extra';
import path from 'path';
import gulp from 'gulp';
import semver from 'semver';
import archiver from 'archiver';
import esbuild from 'esbuild';
import {execSync} from 'node:child_process';

const devExtensionkey = 'developmentkalohmonpfgdhimepifhl';
const prodSentryDSN = 'https://0b9cdcee8d8040edb9cc9586ecb52a14@o1296550.ingest.sentry.io/6556279';

const src = path.join(path.resolve(), 'src');
const dst = path.join(path.resolve(), 'build');

gulp.task('zip', async () => {
  const zipPath = path.join(path.resolve(), 'gauntface-pin-it-extension.zip');
  await fs.remove(zipPath);

  const output = fs.createWriteStream(zipPath);
  const archive = new archiver('zip', {
    zlib: {
      // Sets the compression level
      level: 9,
    },
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve(null);
    });

    output.on('end', () => {
      console.log('Output End event');
    });

    // good practice to catch warnings (ie stat failures and other
    // non-blocking errors)
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`Archiver warning: ${err.message}`);
      } else {
        reject(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', (err) => {
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a sub-directory and naming it `new-subdir`
    // within the archive
    archive.directory(dst, 'gauntface-pin-it-extension');

    // finalize the archive (ie we are done appending files but streams have to
    // finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method
    // so register to them beforehand
    return archive.finalize();
  });
});

gulp.task('bumpManifestVersion', async () => {
  const manifestPath = path.join(src, 'manifest.json');
  const manifestContents = await fs.readJSON(manifestPath);
  const newVersion = semver.inc(manifestContents.version, 'patch');
  if (!newVersion) {
    throw new Error(
        `Version could not be bumped by semver: ${manifestContents.version}`);
  }
  manifestContents.version = newVersion;
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task('dev-manifest', async () => {
  const manifestPath = path.join(dst, 'manifest.json');
  const manifestContents = await fs.readJSON(manifestPath);
  manifestContents.key = devExtensionkey;
  manifestContents.name = `Dev: ${manifestContents.name}`;
  for (const k of Object.keys(manifestContents.icons)) {
    const parts = manifestContents.icons[k].split('.');
    manifestContents.icons[k] = `${parts[0]}-dev.${parts[1]}`;
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task('prod-manifest', async () => {
  const manifestPath = path.join(dst, 'manifest.json');
  const manifestContents = await fs.readJSON(manifestPath);
  await fs.writeFile(manifestPath, JSON.stringify(manifestContents, null, 2));
});

gulp.task('clean', () => fs.remove(dst));

gulp.task('copy', () => {
  const extensions = [
    'json',
    'html',
    'css',
    'jpeg',
    'jpg',
    'png',
    'gif',
    'svg'];

  return gulp.src(`${src}/**/*.{${extensions.join(',')}}`).pipe(gulp.dest(dst));
});

gulp.task('sentry-artifacts', async () => {
  execSync(
      `./node_modules/.bin/sentry-cli sourcemaps inject ${dst}`,
  );
});

gulp.task('build-clean', gulp.series(
    'clean',
    gulp.parallel(
        () => esbuild.build({
          entryPoints: [
            path.join(src, 'scripts', 'js-options.ts'),
            path.join(src, 'scripts', 'background', 'sw.ts'),
          ],
          outdir: path.join(dst, 'scripts'),
          bundle: true,
          sourcemap: true,
          define: {
            'process.env.SENTRY_DSN': process.env.NODE_ENV === 'production' ?
                `"${prodSentryDSN}"` : '""',
          },
        }),
        'copy',
    ),
    'sentry-artifacts',
));

gulp.task('build', gulp.series('build-clean', 'dev-manifest'));

gulp.task('publish', (done) => {
  process.env.NODE_ENV = 'production';

  return gulp.series([
    'bumpManifestVersion',
    'build-clean',
    'prod-manifest',
    'zip',
    'sentry-upload',
  ])(done);
});

gulp.task('sentry-upload', async () => {
  const manifestPath = path.join(dst, 'manifest.json');
  const manifestContents = await fs.readJSON(manifestPath);

  const releaseName = `pin-it-extension@${manifestContents.version}`;
  const releaseOut = execSync(`./node_modules/.bin/sentry-cli releases ` +
    `new ${releaseName}`);
  console.log(releaseOut.toString());

  const sourcemapOut = execSync(`./node_modules/.bin/sentry-cli sourcemaps ` +
    `upload --release=${releaseName} ${dst}`);
  console.log(sourcemapOut.toString());
});

gulp.task('watch', () => {
  gulp.watch('src/**/*', {ignoreInitial: false}, gulp.series('build'));
});

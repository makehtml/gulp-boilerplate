import {src, dest, watch, parallel, series} from 'gulp';
import del from 'del';
import sass from 'gulp-sass';
import csscomb from 'gulp-csscomb';
import csso from 'gulp-csso';
import pug from 'gulp-pug';
import rename from 'gulp-rename';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import fs from 'fs';
import data from 'gulp-data';
import webp from 'gulp-webp';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';

/**
 *  Основные директории
 */
const dirs = {
  src: 'src',
  dest: 'build'
};

/**
 * Пути к файлам
 */
const path = {
  styles: {
    root: `${dirs.src}/sass`,
    compile: `${dirs.src}/sass/style.scss`,
    save: `${dirs.dest}/css`
  },
  views: {
    root: `${dirs.src}/pug`,
    compile: `${dirs.src}/pug/pages`,
    data: `${dirs.src}/pug/data/data.json`,
    save: `${dirs.dest}`
  },
  scripts: {
    root: `${dirs.src}/js`,
  },
  images: {
    root: `${dirs.src}/images`,
    save: `${dirs.dest}/images`
  },
};

/**
 * Основные задачи
 */
export const styles = () => src(path.styles.compile)
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(dest(path.styles.save))
  .pipe(autoprefixer())
  .pipe(csso())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save));

export const csscorr = () => src(`${path.styles.root}/**/*.scss`)
  .pipe(csscomb())
  .pipe(dest(path.styles.root));

export const views = () => src(`${path.views.compile}/*.pug`)
  .pipe(data((file) => {
    return JSON.parse(
      fs.readFileSync(path.views.data)
    );
  }))
  .pipe(pug({
    pretty: true
  }))
  .pipe(pug())
  .pipe(dest(path.views.save));

export const scripts = () => src(`${path.scripts.root}/**/*.js`)
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(uglify())
  .pipe(dest(path.scripts.root));

export const images = () => src(`${path.images.root}/**/*`)
  .pipe(imagemin([
    pngquant({quality: [0.2, 0.8]}),
    mozjpeg({quality: 75})
  ]))
  .pipe(dest(path.images.root));

export const convertToWebp = () => src(`${path.images.root}/**/*`)
  .pipe(webp({quality: 75}))
  .pipe(dest(path.images.root));

export const clean = () => del([dirs.dest]);

export const devWatch = () => {
  const bs = browserSync.init({
    server: dirs.dest,
    notify: false
  });
  watch(`${path.styles.watch}/**/*.scss`, styles).on('change', bs.reload);
  watch(`${path.views.watch}/**/*.pug`, views).on('change', bs.reload);
  // watch(sources.scripts, scripts);
};

/**
 * Задачи для разработки
 */
// export const dev = series(clean, parallel(buildStyles, buildViews, buildScripts), devWatch);
export const dev = series(csscorr, parallel(styles, views), devWatch);

/**
 * Для билда
 */
export const build = series(clean, parallel(styles, views, images, scripts), convertToWebp);

export default dev;

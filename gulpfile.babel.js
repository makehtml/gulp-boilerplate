import {src, dest, watch, parallel, series} from 'gulp';
import del from 'del';
import sass from 'gulp-sass';
import csso from 'gulp-csso';
import pug from 'gulp-pug';
import rename from 'gulp-rename';
// import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import fs from 'fs';
import data from 'gulp-data';
import imagemin from 'gulp-imagemin';
import webp from 'imagemin-webp';
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
    watch: `${dirs.src}/sass/**/*.scss`,
    compile: `${dirs.src}/sass/style.scss`,
    save: `${dirs.dest}/css`
  },
  views: {
    data: `${dirs.src}/pug/data/data.json`,
    watch: `${dirs.src}/pug/**/*.pug`,
    compile: `${dirs.src}/pug/pages/*.pug`,
    save: `${dirs.dest}`
  },
  scripts: {
    watch: `${dirs.src}/js/**/*.js`,
    save: `${dirs.dest}/js`
  },
  images: {
    original: `${dirs.src}/images/**/*`,
    optimized: `${dirs.dest}/images/`
  },
};

/**
 * Основные задачи
 */
export const styles = () => src(path.styles.compile)
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(dest(path.styles.save))
  .pipe(autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false
  }))
  .pipe(csso())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save));

export const views = () => src(path.views.compile)
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

export const scripts = () => src(path.scripts.watch)
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(dest(path.scripts.save));

export const images = () => src(path.images.original)
  .pipe(imagemin([
    pngquant({quality: [0.2, 0.8]}),
    mozjpeg({quality: 75})
  ]))
  .pipe(dest(path.images.optimized));

export const convertToWebp = () => src(path.images.optimized + `/**/*`)
  .pipe(webp())
  .pipe(dest(path.images.optimized));

export const clean = () => del([dirs.dest]);

export const devWatch = () => {
  const bs = browserSync.init({
    server: dirs.dest,
    notify: false
  });
  watch(path.styles.watch, styles).on('change', bs.reload);
  watch(path.views.watch, views).on('change', bs.reload);
  // watch(sources.scripts, scripts);
};

/**
 * Задачи для разработки
 */
// export const dev = series(clean, parallel(buildStyles, buildViews, buildScripts), devWatch);
export const dev = series(clean, parallel(styles, views), devWatch);

/**
 * Для билда
 */
// export const build = series(clean, parallel(styles, views, scripts, images), convertToWebp);

export default dev;

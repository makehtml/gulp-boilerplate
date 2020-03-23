import {src, dest, watch, parallel, series} from 'gulp';
import del from 'del';
import sass from 'gulp-sass';
import cssSort from 'gulp-csscomb';
import csso from 'gulp-csso';
import jsonMerge from 'gulp-merge-json';
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
import svgstore from 'gulp-svgstore';
import concat from 'gulp-concat';

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
    root: `${dirs.src}/sass/`,
    compile: `${dirs.src}/sass/style.scss`,
    save: `${dirs.dest}/css/`
  },
  views: {
    root: `${dirs.src}/pug/`,
    compile: `${dirs.src}/pug/pages/`,
    save: `${dirs.dest}`
  },
  json: {
    root: `${dirs.src}/pug/data/**/*.json`,
    save: `${dirs.src}/pug/data/`,
    compiled: `${dirs.src}/pug/data/data.json`
  },
  scripts: {
    root: `${dirs.src}/js/`,
    save: `${dirs.dest}/js/`
  },
  images: {
    root: `${dirs.src}/images/`,
    save: `${dirs.dest}/images/`
  },
  libs: {
    swiper: `./node_modules/swiper/`,
    hamburgers: `./node_modules/hamburgers/_sass/hamburgers`
  }
};

/**
 * Основные задачи
 */
export const styles = () => src(path.styles.compile)
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(cssSort())
  .pipe(dest(path.styles.save))
  .pipe(autoprefixer())
  .pipe(csso())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save));

export const json = () => src(path.json.root)
  .pipe(jsonMerge({
    fileName: 'data.json',
  }))
  .pipe(dest(path.json.save));

export const views = () => src(`${path.views.compile}*.pug`)
  .pipe(data((file) => {
    return JSON.parse(
      fs.readFileSync(path.json.compiled)
    );
  }))
  .pipe(pug({
    pretty: true
  }))
  .pipe(dest(path.views.save));

export const scripts = () => src(`${path.scripts.root}*.js`)
  .pipe(concat('script.js'))
  .pipe(babel({
    presets: ['@babel/preset-env']
  }))
  .pipe(dest(path.scripts.save))
  .pipe(uglify())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(dest(path.scripts.save));

export const images = () => src(`${path.images.root}**/*`)
  .pipe(imagemin([
    pngquant({quality: [0.2, 0.8]}),
    mozjpeg({quality: 85})
  ]))
  .pipe(dest(path.images.save))
  .pipe(webp({quality: 85}))
  .pipe(dest(path.images.save));

export const convertToWebp = () => src(`${path.images.root}**/*`)
  .pipe(webp({quality: 85}))
  .pipe(dest(path.images.save));

export const clean = () => del([dirs.dest]);

export const devWatch = () => {
  const bs = browserSync.init({
    server: dirs.dest,
    notify: false
  });
  watch(`${path.styles.root}**/*.scss`, styles).on('change', bs.reload);
  watch(`${path.views.root}**/*.pug`, views).on('change', bs.reload);
  watch([`${path.json.save}blocks/*.json`, `${path.json.save}common/*.json` ], json).on('change', bs.reload);
  watch(`${path.scripts.root}**/*.js`, scripts).on('change', bs.reload);
  watch(`${path.images.root}**/*.pug`, images, convertToWebp).on('change', bs.reload);
};

export const sprite = () => {
  return src(`${path.images.root}**/*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(dest(`${path.views.root}common/`))
};

const fonts = () => {
  return src(`${dirs.src}/fonts/*.{woff,woff2}`)
    .pipe(dest(`${dirs.dest}/fonts/`))
};

/**
 * Библиотеки
 */
const swiperCSS = () => {
  return src(`${path.libs.swiper}css/swiper.min.css`)
    .pipe(dest(`${path.styles.save}`))
};

const swiperJS = () => {
  return src(`${path.libs.swiper}js/swiper.min.js`)
    .pipe(dest(`${path.scripts.save}`))
};

/**
 * Задачи для разработки
 */
// export const dev = series(clean, parallel(buildStyles, buildViews, buildScripts), devWatch);
export const dev = series(json, parallel(swiperCSS, swiperJS), parallel(styles, views, scripts, sprite, images), devWatch);

/**
 * Для билда
 */
export const build = series(clean, json, fonts, parallel(styles, views, images, scripts));

export default dev;

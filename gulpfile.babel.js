import {src, dest, watch, parallel, series} from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import cheerio from 'gulp-cheerio';
import cssSort from 'gulp-csscomb';
import csso from 'gulp-csso';
import data from 'gulp-data';
import del from 'del';
import fs from 'fs';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import pngquant from 'imagemin-pngquant';
import rename from 'gulp-rename';
import render from 'gulp-nunjucks-render';
import sass from 'gulp-dart-sass';
import svgmin from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import uglify from 'gulp-uglify';
import webp from 'gulp-webp';

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
    root: `${dirs.src}/views/`,
    pages: `${dirs.src}/views/pages/`,
    save: `${dirs.dest}`
  },
  json: `${dirs.src}/views/data.json`,
  scripts: {
    root: `${dirs.src}/js/`,
    save: `${dirs.dest}/js/`
  },
  img: {
    root: `${dirs.src}/img/`,
    save: `${dirs.dest}/img/`
  },
  images: {
    root: `${dirs.src}/images/`,
    save: `${dirs.dest}/images/`
  },
  vendor: {
    styles: `${dirs.src}/vendor/css/`,
    scripts: `${dirs.src}/vendor/js/`
  }
};

/**
 * Основные задачи
 */
export const sassSort = () => src(path.styles.all)
  .pipe(cssSort())
  .pipe(dest(path.styles.root));

export const styles = () => src(path.styles.compile)
  .pipe(sass.sync().on('error', sass.logError))
  // .pipe(cssSort())
  .pipe(dest(path.styles.save))
  .pipe(autoprefixer())
  .pipe(csso())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save));

export const views = () => src(`${path.views.pages}*.j2`)
  .pipe(data((file) => {
    return JSON.parse(
      fs.readFileSync(path.json)
    );
  }))
  .pipe(render({
    path: [`${path.views.root}`]
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

export const img = () => src(`${path.img.root}**/*`)
  .pipe(imagemin([
    pngquant({quality: [0.2, 0.8]}),
    mozjpeg({quality: 85})
  ]))
  .pipe(dest(path.img.save))
  .pipe(webp({quality: 85}))
  .pipe(dest(path.img.save));

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

export const dev = () => {
  const bs = browserSync.init({
    server: dirs.dest,
    notify: false
  });
  watch(`${path.styles.root}**/*.scss`, styles).on('change', bs.reload);
  watch(`${path.views.root}**/*.j2`, views).on('change', bs.reload);
  watch(`${path.json}`, views).on('change', bs.reload);
  watch(`${path.scripts.root}**/*.js`, scripts).on('change', bs.reload);
  watch(`${path.img.root}**/*`, img).on('change', bs.reload);
  watch(`${path.img.root}**/*.svg`, series(sprite, views)).on('change', bs.reload);
  watch(`${path.images.root}**/*`, images).on('change', bs.reload);
};

export const sprite = () => src(`${path.img.root}**/*.svg`)
  .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
  .pipe(svgmin({
    plugins: [{
      removeDoctype: true
    }, {
      removeXMLNS: true
    }, {
      removeXMLProcInst: true
    }, {
      removeComments: true
    }, {
      removeMetadata: true
    }, {
      removeEditorNSData: true
    }, {
      removeViewBox: false
    }]
  }))
  .pipe(cheerio({
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
    },
    parserOptions: {xmlMode: true}
  }))
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename('sprite.svg'))
  .pipe(dest(`${path.views.root}common/`))

const fonts = () => src(`${dirs.src}/fonts/*.{woff,woff2}`)
  .pipe(dest(`${dirs.dest}/fonts/`))

const vendorStyles = () => src(`${path.vendor.styles}*.min.css`)
  .pipe(dest(`${path.styles.save}`))

const vendorScripts = () => src(`${path.vendor.scripts}*.min.js`)
  .pipe(dest(`${path.scripts.save}`))

export const vendor = parallel(vendorStyles, vendorScripts);

const pixelGlass = () => src(`node_modules/pixel-glass/{styles.css,script.js}`)
  .pipe(dest(`${dirs.dest}/pp/`))

const pp = () => src(`${dirs.src}/pp/*`)
  .pipe(dest(`${dirs.dest}/pp/`))

/**
 * Задачи для разработки
 */
export const start = series(parallel(fonts, pixelGlass, pp), parallel(styles, views, scripts, vendorScripts, sprite, img, images), dev);

/**
 * Для билда
 */
export const build = series(clean, fonts, parallel(styles, views, scripts, vendorScripts, sprite, img, images));

export default start;

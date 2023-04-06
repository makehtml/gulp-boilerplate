import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import cheerio from 'gulp-cheerio';
import csso from 'postcss-csso';
import data from 'gulp-data';
import { deleteSync } from 'del';
import ifPlugin from 'gulp-if';
import fs from 'fs';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import render from 'gulp-nunjucks-render';
import sass from 'gulp-dart-sass';
import sharpOptimizeImages from 'gulp-sharp-optimize-images';
import sourcemaps from 'gulp-sourcemaps';
import svgmin from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import webpack from 'webpack-stream';
const { src, dest, watch, parallel, series } = gulp;

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
    save: `${dirs.dest}/static/css/`,
    css: `${dirs.src}/css/*.css`,
  },
  templates: {
    root: `${dirs.src}/templates/`,
    pages: `${dirs.src}/templates/pages/`,
    save: `${dirs.dest}`
  },
  json: `${dirs.src}/data.json`,
  scripts: {
    root: `${dirs.src}/static/js/`,
    compile: `${dirs.src}/static/js/main.js`,
    save: `${dirs.dest}/static/js/`
  },
  fonts: {
    root: `${dirs.src}/static/fonts/`,
    save: `${dirs.dest}/static/fonts/`
  },
  img: {
    root: `${dirs.src}/static/img/`,
    icons: `${dirs.src}/static/img/icons/`,
    save: `${dirs.dest}/static/img/`
  },
  images: {
    root: `${dirs.src}/static/images/`,
    save: `${dirs.dest}/static/images/`
  },
  vendor: {
    styles: `${dirs.src}/vendor/css/`,
    scripts: `${dirs.src}/vendor/js/`
  }
};

const imageOptimizeConfigs = {
  webp: {
    quality: 80,
    lossless: false,
  },
  png_to_png: {
    quality: 80,
    lossless: false,
  },
  jpg_to_jpg: {
    quality: 80,
    mozjpeg: true,
  }
}

const mode = {
  isBuild: process.argv.includes('--build'),
  isDev: !process.argv.includes('--build')
}

/**
 * Основные задачи
 */
export const css = () => src(path.styles.css)
  .pipe(dest(path.styles.save))

export const styles = () => src(path.styles.compile, { sourcemaps: true })
  .pipe(plumber())
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(postcss([
    autoprefixer(),
    csso()
  ]))
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save, { sourcemaps: '.' }));

export const templates = () => src(`${path.templates.pages}*.j2`)
  .pipe(plumber())
  .pipe(data((file) => {
    return JSON.parse(
      fs.readFileSync(path.json)
    );
  }))
  .pipe(render({
    path: [`${path.templates.root}`]
  }))
  .pipe(dest(path.templates.save));

export const scripts = () => src(`${path.scripts.root}**/*.js`)
  .pipe(sourcemaps.init())
  .pipe(webpack({
    mode: mode.isBuild ? 'production' : 'development',
    output: {
      filename: 'script.min.js',
    }
  }))
  .pipe(sourcemaps.write('./'))
  .pipe(dest(path.scripts.save));

export const clean = (done) => {
  deleteSync([dirs.dest]);
  done();
}

export const sprite = () => src(`${path.img.icons}**/*.svg`)
  .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
  .pipe(svgmin({
    plugins: [{
      name: 'removeDoctype',
      active: true
    }, {
      name: 'removeXMLNS',
      active : true
    }, {
      name: 'removeXMLProcInst',
      active: true
    }, {
      name: 'removeComments',
      active: true
    }, {
      name: 'removeMetadata',
      active: true
    }, {
      name: 'removeEditorNSData',
      active: true
    }, {
      name: 'removeViewBox',
      active: false
    }]
  }))
  .pipe(cheerio({
    run: function ($) {
      // $('[fill]').removeAttr('fill');
      // $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
    },
    parserOptions: {xmlMode: true}
  }))
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename('sprite.svg'))
  .pipe(dest(path.img.save))

export const img = ()  => src(`${path.img.root}/**/*.{png,jpg,jpeg}`)
  .pipe(plumber())
  .pipe(sharpOptimizeImages(imageOptimizeConfigs))
  .pipe(dest(path.img.save));

export const images = ()  => src(`${path.images.root}/**/*.{png,jpg,jpeg}`)
  .pipe(plumber())
  .pipe(sharpOptimizeImages(imageOptimizeConfigs))
  .pipe(dest(path.images.save));

const fonts = () => src(`${dirs.src}/fonts/*.{woff,woff2}`)
  .pipe(dest(`${dirs.dest}/static/fonts/`))

const vendorStyles = () => src(`${path.vendor.styles}*.min.css`)
  .pipe(dest(`${path.styles.save}`))

const vendorScripts = () => src(`${path.vendor.scripts}*.min.js`)
  .pipe(dest(`${path.scripts.save}`))

export const vendor = parallel(vendorStyles, vendorScripts);

const pixelGlass = () => src(`node_modules/pixel-glass/{styles.css,script.js}`)
  .pipe(dest(`${dirs.dest}/static/pp/`))

export const pp = () => src(`${dirs.src}/static/pp/*`)
  .pipe(dest(`${dirs.dest}/static/pp/`))

export const server = () => {
  const bs = browser.init({
    server: dirs.dest,
    cors: true,
    notify: false,
    ui: false,
    open: false
  });
  watch(path.styles.css, css).on('change', bs.reload);
  watch(`${path.styles.root}**/*.scss`, styles).on('change', bs.reload);
  watch(`${path.templates.root}**/*.j2`, templates).on('change', bs.reload);
  watch(`${path.json}`, templates).on('change', bs.reload);
  watch(`${path.scripts.root}**/*.js`, scripts).on('change', bs.reload);
};

/**
 * Задачи для разработки
 */
export const start = series(clean, parallel(fonts, pixelGlass, pp), parallel(img, images, css, styles, templates, scripts, vendor, sprite), server);

/**
 * Для билда
 */
export const build = series(clean, css, fonts, parallel(img, images, styles, templates, scripts, vendor, sprite));

export default start;

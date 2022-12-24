import gulp from 'gulp';
const { src, dest, watch, parallel, series } = gulp;
import autoprefixer from 'gulp-autoprefixer';
import browser from 'browser-sync';
import concat from 'gulp-concat';
import cheerio from 'gulp-cheerio';
// import csso from 'gulp-csso';
import data from 'gulp-data';
// import del from 'del';
import fs from 'fs';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import render from 'gulp-nunjucks-render';
import sass from 'gulp-dart-sass';
import svgmin from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
// import uglify from 'gulp-uglify';

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
  templates: {
    root: `${dirs.src}/templates/`,
    pages: `${dirs.src}/templates/pages/`,
    save: `${dirs.dest}`
  },
  json: `${dirs.src}/templates/data.json`,
  scripts: {
    root: `${dirs.src}/js/`,
    save: `${dirs.dest}/js/`
  },
  img: {
    root: `${dirs.src}/img/`,
    icons: `${dirs.src}/img/icons`,
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
export const styles = () => src(path.styles.compile)
  .pipe(sass.sync().on('error', sass.logError))
  .pipe(dest(path.styles.save))
  .pipe(autoprefixer())
  // .pipe(csso())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(dest(path.styles.save));

export const templates = () => src(`${path.templates.pages}*.j2`)
  .pipe(data((file) => {
    return JSON.parse(
      fs.readFileSync(path.json)
    );
  }))
  .pipe(render({
    path: [`${path.templates.root}`]
  }))
  .pipe(dest(path.templates.save));

export const scripts = () => src(`${path.scripts.root}*.js`)
  .pipe(concat('script.js'))
  .pipe(dest(path.scripts.save))
  // .pipe(uglify())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(dest(path.scripts.save));

// export const clean = () => del([dirs.dest]);

export const server = () => {
  const bs = browser.init({
    server: dirs.dest,
    cors: true,
    notify: false,
    ui: false,
  });
  watch(`${path.styles.root}**/*.scss`, styles).on('change', bs.reload);
  watch(`${path.templates.root}**/*.j2`, templates).on('change', bs.reload);
  watch(`${path.json}`, templates).on('change', bs.reload);
  watch(`${path.scripts.root}**/*.js`, scripts).on('change', bs.reload);
};

export const sprite = () => src(`${path.img.icons}**/*.svg`)
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
export const start = series(parallel(fonts, pixelGlass, pp), parallel(styles, templates, scripts, vendorScripts, sprite), server);

/**
 * Для билда
 */
// export const build = series(clean, fonts, parallel(styles, templates, scripts, vendorScripts, sprite));
export const build = series(fonts, parallel(styles, templates, scripts, vendorScripts, sprite));

export default start;

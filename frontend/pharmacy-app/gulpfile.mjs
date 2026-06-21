import gulp from "gulp";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import flatten from "gulp-flatten";
import concat from "gulp-concat";
import sassConfig from "./sass-config.js";

const sass = gulpSass(dartSass);

function styles() {
  return gulp
    .src("src/**/*.scss")
    .pipe(
      sass(sassConfig).on("error", sass.logError),
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: [
          "last 2 version",
          "safari 5",
          "ie 6",
          "ie 7",
          "ie 8",
          "ie 9",
          "opera 12.1",
          "ios 6",
          "android 4",
          ">0.2%",
          "not dead",
          "not op_mini all",
        ],
        cascade: false,
      }),
    )
    .pipe(flatten())
    .pipe(concat("styles.css"))
    .pipe(gulp.dest("public"));
}

function watchFiles() {
  gulp.watch("src/**/*.scss", styles);
}

const build = gulp.series(styles, watchFiles);

export { styles, watchFiles as watch, build as default };
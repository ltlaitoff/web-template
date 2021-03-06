"use strict";

const {src, dest, parallel, series, watch, task} = require('gulp'),
	browserSync = require('browser-sync'),
	sass = require('gulp-sass'),
	cleanCSS = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	rename = require("gulp-rename"),
	imagemin = require("gulp-imagemin"),
	htmlmin = require("gulp-htmlmin"),
	panini = require("panini"),
	removeComments = require('gulp-strip-css-comments'),
	webpack = require('webpack'),
	webpackStream = require('webpack-stream'),
	del = require("del"),
	concat = require("gulp-concat"),

	srcPath = 'src/',
	distPath = 'dist/',

	path = {
		build: {
			html: distPath,
			js: distPath + "js/",
			css: distPath + "css/",
			images: distPath + "images/",
			icons: distPath + "icons/",
			fonts: distPath + "fonts/"
		},
		src: {
			html: srcPath + "*.html",
			js: srcPath + "js/**/*.js",
			css: srcPath + "sass/style.sass",
			jsLibs: srcPath + "js",
			images: srcPath + "images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
			icons: distPath + "icons/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
			fonts: srcPath + "fonts/**/*.{eot,woff,woff2,ttf,svg}"
		},
		watch: {
			html: srcPath + "**/*.html",
			js: srcPath + "js/**/*.js",
			css: srcPath + "sass/**/*.sass",
			images: srcPath + "images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
			icons: distPath + "icons/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
			fonts: srcPath + "fonts/**/*.{eot,woff,woff2,ttf,svg}"
		},
		clean: "./" + distPath
	};


task('server', () => {
	browserSync.init({
		server: {
			baseDir: "./" + distPath
		}
	});
});


task('html', () => {
	panini.refresh();
	return src(path.src.html)
		.pipe(panini({
			root: srcPath,
			layouts: srcPath + 'layouts/',
			partials: srcPath + 'templates/',
			helpers: srcPath + 'helpers/',
			data: srcPath + 'data/'
		}))
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(dest(path.build.html))
		.pipe(browserSync.reload({ stream: true }));
});


task('css', () => {
	return src(path.src.css)
		.pipe(sass({ 
			outputStyle: 'compressed', 
			includePaths: './node_modules/'
	 	}).on('error', sass.logError))
		.pipe(rename({ suffix: '.min', prefix: '' }))
		.pipe(autoprefixer())
		.pipe(removeComments())
		.pipe(cleanCSS({ compatibility: 'ie8' }))
		.pipe(dest(path.build.css))
		.pipe(browserSync.reload({ stream: true }));
});

task('js', () => {
	return src(path.src.js)
		.pipe(webpackStream({
			mode: "production",
			output: {
				filename: 'app.js',
			}
		}))
		.pipe(dest(path.build.js))
		.pipe(browserSync.reload({ stream: true }));
});

task('jsLibs', () => {
	return src([
		'node_modules/jquery/dist/jquery.js',
		'node_modules/slick-carousel/slick/slick.js'
	])
	.pipe(concat("libs.js"))
	.pipe(dest(path.src.jsLibs));
});

task('images', () => {
	return src(path.src.images)
		.pipe(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.mozjpeg({ quality: 95, progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			})
		]))
		.pipe(dest(path.build.images))
		.pipe(browserSync.reload({ stream: true }));
});


task('icons', () => {
	return src(path.src.icons)
		.pipe(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.mozjpeg({ quality: 95, progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			})
		]))
		.pipe(dest(path.build.icons))
		.pipe(browserSync.reload({ stream: true }));
});

task('fonts', () => {
	return src(path.src.fonts)
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.reload({ stream: true }));
});

task('clean', () => {
	return del(path.clean);
});

task('watch', () => {
	watch([path.watch.html], series('html'));
	watch([path.watch.css], series('css'));
	watch([path.watch.js], series('js'));
	watch([path.watch.images], series('images'));
	watch([path.watch.fonts], series('fonts'));
	watch([path.watch.icons], series('icons'));
});

const 
	libs = series('jsLibs'),
	build = series('clean', libs, parallel('html', 'css', 'js', 'images', 'icons', 'fonts')),
	watchTask = parallel(build, 'watch', 'server');

exports.default = watchTask;
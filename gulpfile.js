'use strict';

const $           = require('gulp-load-plugins')();
const gulp		  = require('gulp');
const del 		  = require('del');
const browserSync = require('browser-sync').create();
const browserify  = require('browserify');

const site_name = param('site','base');
const src_path  = 'src';
const dist_path = 'dist';

let debug = true;
let proxy = 'base.dev';
let staticSrc = src_path+'/**/*.{webm,svg,eot,ttf,woff,woff2,otf,mp4,json,pdf,ico}';


function param(param_name, default_result){
	const args = process.argv.slice(2)
	let param  = default_result;

	args.forEach((val, index) => {
		if(val.includes(param_name)){
			const p = val.split("=");
			if(p.length>0) {
				param = p[1];
			}
		}
	});
	
	console.log(`Set --${param_name} to: ${param}`);
	
	return param;
}

/*  
 * Clean
 */
gulp.task('clean', function() {
	return del([dist_path+'/**/*',]);
});

/*  
 * Copy static files
 */
gulp.task('copy', function() {
	
	return gulp.src(staticSrc)
	.pipe(gulp.dest(dist_path+'/'))
})

/*  
 * SASS
 */
gulp.task("sass", function() {

	let out = gulp.src(src_path+'/scss/'+site_name+'.scss')
		.pipe( $.cssGlobbing({
			extensions: ['.scss']
		})); 

	// Create Sourmaps for develop
	if (debug) {

		return out.pipe($.sourcemaps.init())
			.pipe($.sass({ style: 'compressed', sourcemap: true}))
			.on('error', $.sass.logError)
			.on('error', (err) => {
				$.notify().write(err);
			})
			.pipe( $.autoprefixer({
				browsers: ['last 2 versions','ie >= 9'],
				cascade: false
			}))
			.pipe($.rename(site_name+'.min.css'))
			.pipe($.sourcemaps.write('./'))
			.pipe(gulp.dest('./'+dist_path+'/css'))
			.pipe(browserSync.stream({match: '**/*.css'}));

		}

	// Remove sourcemaps and minify for production
	else {
		return out.pipe($.sass({ style: 'compressed'}))
			.on('error', $.sass.logError)
			.on('error', (err) => {
				$.notify().write(err);
			})
			.pipe( $.autoprefixer({
				browsers: ['last 2 versions','ie >= 9'],
				cascade: false
			}))
			.pipe($.rename(site_name+'.min.css'))
			.pipe(gulp.dest('./'+dist_path+'/css'));
	}

});

/*  
 * Javascript
 */
gulp.task('js', function() {
	
	// Development 
	if (debug) {
		return gulp.src(src_path+'/js/'+site_name+'.js')
			.pipe($.sourcemaps.init())
			.pipe($.browserify({
				insertGlobals : true,
				debug : debug
			}))
			.on('error', (err) => {
				$.notify().write(err);
			})
			.pipe($.babel({
				presets: ['@babel/env']
			}))
			.pipe($.sourcemaps.write('./'))
			.pipe(gulp.dest(dist_path+'/js'))
	}
	// Production 
	else {
		return gulp.src(src_path+'/js/'+site_name+'.js')
			.pipe($.browserify({
				insertGlobals : true,
				debug : debug
			}))
			.on('error', (err) => {
				$.notify().write(err);
			})
			.pipe($.babel({
				presets: ['@babel/env']
			}))
			.pipe(gulp.dest(dist_path+'/js'))
	}

});

/*  
 * Javascript watch
 */
gulp.task('js-watch', gulp.series('js', function(done) {
	
	browserSync.reload();
	done();
}));

/*  
 * Image optimisation
 */
gulp.task('images', function() {
  
	return gulp.src(['./'+src_path+'/img/**/*.jpg', './'+src_path+'/img/**/*.png', './'+src_path+'/img/**/*.jpeg'])
		.pipe($.image())
		.pipe(gulp.dest('./'+dist_path+'/img/'));
});

/*  
 * Serve and watch for changes
 */
gulp.task( "dev", gulp.series(['copy', 'sass', 'js'], function() {

	// Serve
	browserSync.init({
		proxy: proxy,
		ghostMode: false
	});

	// Watch
	gulp.watch(src_path+'/img/**/*', gulp.series(['images']));
	gulp.watch(src_path+'/scss/**/*.scss', gulp.series(['sass']));
	gulp.watch(src_path+'/js/**/*.js', gulp.series(['js-watch']));
	gulp.watch(['./**/*.html']).on('change', browserSync.reload);
	gulp.watch(staticSrc, gulp.series(['copy']));

	gulp.watch([
		dist_path+'/**/*.js',
		dist_path+'/**/*.css'
	]);
}));

/*  
 * Set debug mode to false
 */
gulp.task('production', function(done) {

	debug = false;
	console.log(`Set debug to: ${debug}`);
	done();
})

gulp.task('build', gulp.series(['production', 'clean', 'images', 'copy', 'sass', 'js']));

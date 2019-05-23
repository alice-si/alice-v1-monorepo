const gulp = require("gulp");
const plugins = require("gulp-load-plugins")();
const del = require("del");
const es = require("event-stream");
const bowerFiles = require("main-bower-files");
const request = require('request-promise');
const awspublish = require("gulp-awspublish");
const cloudfront = require('gulp-cloudfront-invalidate-aws-publish');
const exec = require("child_process").exec;
const utils = require("./devServer/service/utils");
const project = utils.loadModel("project");
const mongoose = require("mongoose");
const config = require("./config");
const h2p = require("html2plaintext");
const setMangoHooks = require("./tools/set-mango-hooks");
const defaultHtmlhintOptions = {
  "attr-lowercase": false,
  "doctype-first": false
};

let paths = {
  scripts: ["app/components/**/*.js", "app/app.js"],
  styles: ["./app/styles/**/*.css", "./app/styles/**/*.scss"],
  fonts: "bower_components/bootstrap/dist/fonts/*",
  index: "./app/index.html",
  projectRedirectTemplate: "./app/projectRedirectTemplate.mustache",
  partials: ["app/**/*.html", "!app/index.html"],
  scriptsDevServer: "devServer/**/*.js",
  env: "local",
  getDistPath: function () {
    return "./dist." + this.env;
  },
  getEnvConfPath: function () {
    return "app/env/" + this.env + "-config.js";
  }
};
let lastCommitId, projects;

pipes = initPipesFunctions();

///////////////////////////////////// TASKS /////////////////////////////////////

// MAIN TASKS //

// Used to deploy api on prod and stage servers
gulp.task("deploy", ["set-mango-hooks", "validate-devserver-scripts"], function() {
  runNodaemonServer();
});

// Used to deploy api and front end serving on dev server
gulp.task("deploy-dev", ["set-dev-env", "clean-build-frontend-app", "validate-devserver-scripts"], function () {
  runNodaemonServer({
    env: {
      DIST_PATH : paths.getDistPath()
    }
  });
})

// Used to publish frontend to stage s3 bucket - needs invalidation in Cloudfront
gulp.task("publish-stage", ["set-stage-env", "clean-build-frontend-app"], function() {
  return publishFrontend("aws-stage");
});

// Used to publish frontend to prod s3 bucket - needs invalidation in Cloudfront
gulp.task("publish-prod", ["set-prod-env", "clean-build-frontend-app"], function() {
  return publishFrontend("aws-prod");
});

// Used to run application locally
gulp.task("watch-local", ["set-local-env", "clean-build-frontend-app", "validate-devserver-scripts"], function () {
  runNodaemonServer({
    watch: ["devServer/"],
    nodeArgs: ["--inspect", "--no-deprecation"],
    env: {
      DIST_PATH : paths.getDistPath()
    }
  }).on("change", ["validate-devserver-scripts"]);

  // start live-reload server
  plugins.livereload.listen({ start: true });

  // watch index
  gulp.watch(paths.index, function() {
    return pipes.builtIndexForDevelopment()
      .pipe(plugins.livereload());
  });

  // watch app scripts
  gulp.watch(paths.scripts, function() {
    return pipes.builtAppScriptsForDevelopment()
      .pipe(plugins.livereload());
  });

  // watch html partials
  gulp.watch(paths.partials, function() {
    return pipes.builtPartials()
      .pipe(plugins.livereload());
  });

  // watch styles
  gulp.watch(paths.styles, function() {
    return pipes.builtStylesForDevelopment()
      .pipe(plugins.livereload());
  });
});

// HELP TASKS (used in main tasks) //

// set env
gulp.task("set-prod-env", setEnv("prod"));
gulp.task("set-stage-env", setEnv("stage"));
gulp.task("set-dev-env", setEnv("dev"));
gulp.task("set-local-env", setEnv("local"));

// runs jshint on the dev server scripts
gulp.task("validate-devserver-scripts", pipes.validatedDevServerScripts);

// build all statics to dist.<env> folder
gulp.task("clean-build-frontend-app", ["get-last-commit", "get-projects", "clean-dist"], function () {
  if (paths.env == "local" || paths.env == "dev") {
    return pipes.builtFrontendForDevelopment();
  } else {
    return pipes.builtFrontendForProduction();
  }
});

gulp.task("clean-dist", function(cb) {
  del(paths.getDistPath(), function() {
      cb();
  });
});

gulp.task("get-last-commit", function(cb) {
  exec("git log --format=\"%H\" -n 1", function (err, stdout, stderr) {
      lastCommitId = stdout.replace(/\r?\n|\r/, "");
      console.log("Last commit id: " + lastCommitId);
      cb(err);
    });
});

gulp.task("get-projects", function(cb) {
  if (paths.env == "local" || paths.env == "dev") {
    const db = config.db;
    console.log("Using db with url to generate prject static pages: " + db);
    mongoose.connect(db, {useNewUrlParser: true});
    project.find({}).then(function(res) {
        projects = res;
        console.log("Fetched projects with codes: " + projects.map(prj => prj.code));
        cb();
    }, function(err) {
        cb(err);
    });
  } else { // for stage and prod fron-end publishing
    const epUrl = config.apiHostnames[paths.env] + "/api/getAllProjects";
    console.log("Using ep to generate prject static pages: " + epUrl);
    request.get(epUrl).then(function (res) {
      projects = JSON.parse(res);
      console.log("Fetched projects with codes: " + projects.map(prj => prj.code));
      cb();
    }, function (err) {
      cb(err);
    });
  }
});

gulp.task("set-mango-hooks", function(cb) {
  const allowedModes = ["stage", "prod"];
  // to block hooks updating for local or dev or exp
  if (allowedModes.includes(config.mode)) {
    console.log('Mango hooks checking started');
    setMangoHooks().then(function () {
      console.log('Mango hooks checking finished');
      cb();
    }, function (err) {
      console.log('Error occured ' + JSON.stringify(err));
      cb(err);
    });
  } else {
    console.log('Setting mango hook for this mode is blocked: ' + config.mode);
    cb();
  }
});

///////////////////////////////////// HELP FUNCTIONS /////////////////////////////////////

function setEnv(name) {
  return function() {
    paths.env = name;
    paths = Object.freeze(paths); // to allow only one env set
  };
}

function publishFrontend(awsConfName) {
  let awsConf = getAwsConf(awsConfName);
  let publisher = awspublish.create(awsConf.keys);
  return gulp.src(paths.getDistPath() + "/**/*")
    .pipe(awspublish.gzip({ ext: "" }))
    .pipe(publisher.publish(awsConf.headers))
    .pipe(cloudfront(awsConf.cf))
    .pipe(publisher.sync())
    .pipe(awspublish.reporter());
}

function getHost() {
  return config.hostnames[paths.env];
}

function prefixJs(filepath) {
  return '<script src="/' + filepath + '"></script>';
}

function prefixCss(filepath) {
  return '<link rel="stylesheet" href="/' + filepath + '">';
}

function getAwsConf(environment) {
  let conf = require("./secrets/aws/" + environment);
  return {
    keys: conf,
    cf: conf.cfSettings
  };
}

function runNodaemonServer(options = {}) {
  const conf = Object.assign({
    script: "server.js",
    ext: "js"
  }, options);
  return plugins.nodemon(conf).on("restart", function () {
      console.log("[nodemon] restarted dev server");
  });
}

///////////////////////////////////// PIPES /////////////////////////////////////

function initPipesFunctions() {
  let pipes = {};

  pipes.validatedDevServerScripts = function () {
    return gulp.src(paths.scriptsDevServer)
      .pipe(plugins.jshint('.jshintrc'))
      .pipe(plugins.jshint.reporter("jshint-stylish"));
  };

  pipes.validatedPartials = function () {
    return gulp.src(paths.partials)
      .pipe(plugins.htmlhint(defaultHtmlhintOptions))
      .pipe(plugins.htmlhint.reporter());
  }

  pipes.builtPartials = function () {
    const distPath = paths.getDistPath();
    return pipes.validatedPartials()
      .pipe(gulp.dest(distPath));
  };

  pipes.processedFonts = function () {
    return gulp.src(paths.fonts)
      .pipe(gulp.dest(paths.getDistPath() + "/bower_components/bootstrap/dist/fonts/"));
  };

  pipes.builtProjectsStatics = function () {
    let pipesToMerge = [];
    if (projects) {
      for (let i = 0; i < projects.length; i++) {
        let project = projects[i];
        project.host = getHost();
        project.description = h2p(project.summary);
        let stream = gulp.src(paths.projectRedirectTemplate)
          .pipe(plugins.mustache(project))
          .pipe(plugins.rename("project-" + project.code + ".html"))
          .pipe(gulp.dest(paths.getDistPath() + '/redirection'));
        pipesToMerge.push(stream);
      }
    }
    return es.merge(pipesToMerge);
  };

  pipes.validatedIndex = function() {
    return gulp.src(paths.index)
      .pipe(plugins.htmlhint(defaultHtmlhintOptions))
      .pipe(plugins.htmlhint.reporter());
  };

  pipes.builtFrontendWithoutIndex = function () {
    return es.merge([
      pipes.builtPartials(),
      pipes.processedFonts(),
      pipes.builtProjectsStatics()
    ]);
  };

  pipes.builtVendorScriptsForDevelopment = function () {
    return gulp.src(bowerFiles())
      .pipe(gulp.dest(paths.getDistPath() + "/bower_components"));
  };

  pipes.orderedVendorScripts = function() {
    return plugins.order(["jquery.js", "angular.js"]);
  };

  pipes.validatedAppScripts = function() {
    let conf = gulp.src(paths.getEnvConfPath())
      .pipe(plugins.rename("envConfig.js"));

    return es.merge(gulp.src(paths.scripts), conf)
      .pipe(plugins.jshint('.jshintrc'))
      .pipe(plugins.jshint.reporter("jshint-stylish"));
  };

  pipes.builtAppScriptsForDevelopment = function() {
    return pipes.validatedAppScripts()
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.orderedAppScripts = function() {
    return plugins.angularFilesort();
  };

  pipes.builtStylesForDevelopment = function() {
    return gulp.src(paths.styles)
      .pipe(plugins.sass())
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.builtVendorScriptsForProduction = function() {
    return gulp.src(bowerFiles("**/*.js"))
      .pipe(pipes.orderedVendorScripts())
      .pipe(plugins.concat("vendor.min.js"))
      .pipe(plugins.uglifyEs.default())
      .pipe(gulp.dest(paths.getDistPath() + "/scripts"));
  };

  pipes.minifiedFileName = function() {
    return plugins.rename(function (path) {
      path.extname = '.min' + path.extname;
    });
  };

  pipes.builtVendorStylesForProduction = function() {
    return gulp.src(bowerFiles("**/*.css"))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.cleanCss())
      .pipe(plugins.sourcemaps.write())
      .pipe(pipes.minifiedFileName())
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.validatedPartials = function() {
    return gulp.src(paths.partials)
      .pipe(plugins.htmlhint(defaultHtmlhintOptions))
      .pipe(plugins.htmlhint.reporter());
  };

  pipes.scriptedPartials = function() {
    return pipes.validatedPartials()
      .pipe(plugins.htmlhint.failReporter())
      .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
      .pipe(plugins.ngHtml2js({
          moduleName: "nApp"
      }));
  };

  pipes.builtAppScriptsForProduction = function() {
    let scriptedPartials = pipes.scriptedPartials();
    let validatedAppScripts = pipes.validatedAppScripts();

    return es.merge(scriptedPartials, validatedAppScripts)
      .pipe(pipes.orderedAppScripts())
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.concat('app.min.js'))
      .pipe(plugins.uglifyEs.default())
      .pipe(plugins.sourcemaps.write())
      .pipe(gulp.dest(paths.getDistPath() + "/scripts"));
  };

  pipes.builtStylesForProduction = function() {
    return gulp.src(paths.styles)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass())
      .pipe(plugins.cleanCss())
      .pipe(plugins.sourcemaps.write())
      .pipe(pipes.minifiedFileName())
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.builtIndexForDevelopment = function () {
    let orderedVendorScripts = pipes.builtVendorScriptsForDevelopment()
      .pipe(pipes.orderedVendorScripts());

    let orderedAppScripts = pipes.builtAppScriptsForDevelopment()
      .pipe(pipes.orderedAppScripts());

    let appStyles = pipes.builtStylesForDevelopment();

    return pipes.validatedIndex()
      .pipe(plugins.replace("__LAST_COMMIT_ID__", lastCommitId))
      .pipe(gulp.dest(paths.getDistPath())) // write first to get relative path for inject
      .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: "bower", transform: prefixJs}))
      .pipe(plugins.inject(orderedAppScripts, {relative: true, name: "app", transform: prefixJs}))
      .pipe(plugins.inject(appStyles, {relative: true, name: "app", transform: prefixCss}))
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.builtIndexForProduction = function () {
    let vendorScripts = pipes.builtVendorScriptsForProduction();
    let vendorStyles = pipes.builtVendorStylesForProduction();
    let appScripts = pipes.builtAppScriptsForProduction();
    let appStyles = pipes.builtStylesForProduction();

    return pipes.validatedIndex()
      .pipe(plugins.replace("__LAST_COMMIT_ID__", lastCommitId))
      .pipe(gulp.dest(paths.getDistPath())) // write first to get relative path for inject
      .pipe(plugins.inject(vendorScripts, {relative: true, name: "bower", transform: prefixJs}))
      .pipe(plugins.inject(vendorStyles, {relative: true, name: "bower", transform: prefixCss}))
      .pipe(plugins.inject(appScripts, {relative: true, name: "app", transform: prefixJs}))
      .pipe(plugins.inject(appStyles, {relative: true, name: "app", transform: prefixCss}))
      .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
      .pipe(gulp.dest(paths.getDistPath()));
  };

  pipes.builtFrontendForDevelopment = function () {
    return es.merge(pipes.builtIndexForDevelopment(), pipes.builtFrontendWithoutIndex());
  };

  pipes.builtFrontendForProduction = function () {
    return es.merge(pipes.builtIndexForProduction(), pipes.builtFrontendWithoutIndex());
  };

  return pipes;
}

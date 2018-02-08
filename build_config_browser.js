#!/usr/bin/env node

var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var xml2js = require("xml2js");
var path = require('path');
var exec = require('child_process').exec;
process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdout.pipe(process.stdout);
process.setMaxListeners(0);


//node build_config.browser prepare;
var version = process.argv[2];
var prepare = process.argv[3];

if (!version) {
  version = "0.0.0";
}

var editConfigXml = function (callback) {

  var parser = new xml2js.Parser();

  fs.readFile(__dirname + '/config.xml', function (err, data) {
    console.log();
    parser.parseString(data, function (err, result) {
      result.widget.$.version = version;

      var builder = new xml2js.Builder();
      var xml = builder.buildObject(result);

      fs.writeFileSync(__dirname + '/config.xml', xml);

      console.log("config.xml edited for version ", version);
      callback();
    });
  });

};

if (prepare === "prepare") {

  console.log("Preparing for building and uploading!");

  async.waterfall([
    function (cl) {
      editConfigXml(cl);
    },
    function (cl) {

      exec("ionic config set integrations.cordova.enabled true; cordova platform remove ios --save; cordova platform remove android --save; cordova platform remove browser --save;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error removing platforms for browser', error);
        } else {
          console.log("removing platforms for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      exec("node hooks/scripts/removeAllPlugins.js; rm -r -f platforms; rm -r -f plugins; node hooks/scripts/remove_add_browser_plugins.js;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error remove_add_browser_plugins for browser', error);
        } else {
          console.log("remove_add_browser_plugins for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      //ionic cordova here as it is used by the new ionic cli.
      exec("ionic cordova platform add browser --save; cordova plugins; ionic cordova build browser -- --browserify;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error build browser for browser', error);
        } else {
          console.log("build browser for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      //syncs the files in the platforms/browser/www
      exec("node hooks/scripts/sync_s3_bucket.js;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error hooks/scripts/sync_s3_bucket.js for browser', error);
        } else {
          console.log("hooks/scripts/sync_s3_bucket.js for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      //syncs the files in the platforms/browser/www
      exec("node hooks/scripts/ionic_upload.js;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error ionic_upload.js for browser', error);
        } else {
          console.log("ionic_upload.js for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);

    }], function (err, res) {

    console.log("process completed!");
    process.exit();

  });

} else {

  console.log("Just building and uploading!");

  async.waterfall([
    function (cl) {
      editConfigXml(cl);
    },
    function (cl) {

      //cordova here as it is used by the LEGACY ionic cli.

      exec("cordova build browser --browserify;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error build browser for browser', error);
        } else {
          console.log("build browser for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      //syncs the files in the platforms/browser/www
      exec("node hooks/scripts/sync_s3_bucket.js;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error hooks/scripts/sync_s3_bucket.js for browser', error);
        } else {
          console.log("hooks/scripts/sync_s3_bucket.js for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    },
    function (cl) {

      //syncs the files in the platforms/browser/www
      exec("node hooks/scripts/ionic_upload.js;", {maxBuffer: 2048 * 500000}, function (error, stdout, stderr) {

        if (error) {
          console.error('error ionic_upload.js for browser', error);
        } else {
          console.log("ionic_upload.js for browser");
        }

        return cl(error);

      }).stdout.pipe(process.stdout);
    }], function (err, res) {

    console.log("process completed!");
    process.exit();

  });
}




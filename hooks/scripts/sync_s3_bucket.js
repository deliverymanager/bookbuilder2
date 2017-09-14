#!/usr/bin/env node

/**
 * Remove specified plugins from specific platform
 */
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;


console.log("Now syncing platforms/browser/www with S3");

var xml2js = require('xml2js');
var parser = new xml2js.Parser();

fs.readFile(process.cwd() + '/config.xml', function (err, data) {

  parser.parseString(data, function (err, result) {

    console.log("The current version is ", result.widget.$.version);

    if (result.widget.$.version === "0.0.0") {

      console.log("We are in DEVELOPER mode, uploading to bookbuilder2");

      exec('aws s3 sync . s3://bookbuilder2', {cwd: process.cwd() + "/platforms/browser/www"}, function (error, stdout, stderr) {
        // if you also want to change current process working directory:
        if (error) {
          console.log(error);
        }
      });

    }
  });
});





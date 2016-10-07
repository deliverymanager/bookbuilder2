#!/usr/bin/env node

/**
 * Remove specified plugins from specific platform
 */
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;

console.log("Now I am uploading the app to ionic developer channel!");

var xml2js = require('xml2js');
var parser = new xml2js.Parser();

fs.readFile(process.cwd() + '/config.xml', function (err, data) {

  parser.parseString(data, function (err, result) {

    console.log("The current version is ", result.widget.$.version);

    if (result.widget.$.version === "0.0.0") {

      console.log("We are in DEVELOPER mode, uploading to dev channel");

      exec('ionic upload --deploy=dev', {cwd: process.cwd()}, function (error, stdout, stderr) {
        // if you also want to change current process working directory:
        if (error) {
          console.log(error);
        }
        console.log(stdout);
      });

    } else {

      console.log("We are in PRODUCTION mode, uploading to channel " + result.widget.$.version);

      exec('ionic upload --note=' + result.widget.$.version, {cwd: process.cwd()}, function (error, stdout, stderr) {
        // if you also want to change current process working directory:
        if (error) {
          console.log(error);
        }
        console.log(stdout);
        console.log("NOW GO TO IONIC CLOUD SERVICES AND DEPLOY IT!");

        console.log("We are in PRODUCTION but I am uploading to dev channel too!");
        exec('ionic upload --deploy=dev', {cwd: process.cwd()}, function (error, stdout, stderr) {
          // if you also want to change current process working directory:
          if (error) {
            console.log(error);
          }
          console.log(stdout);
        });
      });

    }
  });

});




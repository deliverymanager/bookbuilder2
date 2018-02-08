#!/usr/bin/env node
console.log("Started removing unwanted plugins ...");

/**
 * Remove specified plugins from specific platform
 */
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;

var waterfallFunctions = [];

var mustPlugins = ["cordova-plugin-device", "cordova-plugin-statusbar", "cordova-plugin-whitelist", "cordova-plugin-x-toast", "ionic-plugin-keyboard"];
_.each(mustPlugins, function (pluginToAdd, key, list) {

  waterfallFunctions.push(function (callback) {

    exec("cordova plugin add " + pluginToAdd + " --browserify --save", function (error, stdout, stderr) {
      console.log("Plugin added ", pluginToAdd);

      setTimeout(function () {
        callback();
      }, 100);

    });
  });


});

console.log("Total plugins to remove/add ", waterfallFunctions.length);

async.waterfall(waterfallFunctions, function (err, response) {

  if (err) {
    console.log(err);
  }

  console.log("Removing Plugin Finished!");
});




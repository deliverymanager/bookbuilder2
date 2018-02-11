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

var removePlugins = ["cordova-plugin-media", "cordova-plugin-ionic", "cordova-plugin-proguard", "cordova-custom-config", "cordova-plugin-console", "cordova-plugin-crosswalk-webview", "cordova-plugin-device", "ionic-plugin-keyboard", "cordova-plugin-statusbar", "cordova-plugin-x-toast", "cordova-plugin-whitelist", "cordova-plugin-google-analytics", "cordova-plugin-webserver", "cordova-plugin-inappbrowser", "com.telerik.plugins.nativepagetransitions", "ionic-plugin-deploy", "cordova-plugin-insomnia", "cordova-plugin-splashscreen", "cordova-plugin-app-version", "ionic-plugin-deploy", "cordova-plugin-insomnia", "onesignal-cordova-plugin", "cordova-plugin-file-transfer", "cordova-plugin-file", "com.paypal.cordova.mobilesdk", "cordova-ios-requires-fullscreen", "card.io.cordova.mobilesdk", "cordova-plugin-transport-security"];

var waterfallFunctions = [];

_.each(removePlugins, function (pluginToRemove, key, list) {

  waterfallFunctions.push(function (callback) {

    console.log("Removing plugin: " + pluginToRemove);
    exec("cordova plugin remove " + pluginToRemove + " --save", function (error, stdout, stderr) {
      console.log("Plugin removed!");
      if (error) {
        console.log(error);
      }
      console.log(stdout);

      setTimeout(function () {
        callback();
      }, 2000);

    });
  });

});

console.log("Total plugins to remove ", waterfallFunctions.length);

async.waterfall(waterfallFunctions, function (err, response) {

  if (err) {
    console.log(err);
  }

  console.log("Removing Plugin Finished!");
});




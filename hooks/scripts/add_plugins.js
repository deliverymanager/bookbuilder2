#!/usr/bin/env node
console.log("Started adding plugins ...");

/**
 * Remove specified plugins from specific platform
 */
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var xml2js = require("xml2js");

var parser = new xml2js.Parser();

fs.readFile(__dirname + '/../../config.xml', function (err, data) {

  if (err) {
    console.log("err", err);
    return;
  }
  parser.parseString(data, function (err, result) {

    if (err) {
      console.log("err", err);
      return;
    }
    var preferences = [];
    _.each(result.widget['preference'], function (pref, key, list) {
      preferences.push(pref.$);
    });

    var indexPreference = _.findIndex(preferences, {
      name: "android-minSdkVersion"
    });

    var minSdkVersion = result.widget['preference'][indexPreference]['$'].value;
    console.log("\n\nminSdkVersion", minSdkVersion);
    //"cordova-custom-config", "cordova-ios-requires-fullscreen",
    var removedPlugins = ["cordova-plugin-console", "cordova-plugin-device", "ionic-plugin-keyboard", "cordova-plugin-statusbar", "cordova-plugin-x-toast", "cordova-plugin-whitelist", "cordova-plugin-proguard", "cordova-plugin-ionic", "cordova-plugin-insomnia", "cordova-plugin-app-version", "cordova-plugin-webserver", "cordova-plugin-file", "cordova-plugin-file-transfer"];

    if (minSdkVersion === "14") {
      removedPlugins.push("cordova-plugin-crosswalk-webview@1.8.0");
      removedPlugins.push("cordova-plugin-media@2.4.1");
    } else if (minSdkVersion === "16") {
      removedPlugins.push("cordova-plugin-crosswalk-webview");
      removedPlugins.push("cordova-plugin-media");

    } else if (minSdkVersion === "24") {
      removedPlugins.push("cordova-plugin-media");
      //here we do not have the crosswalk plugin
    }

    var waterfallFunctions = [];

    _.each(removedPlugins, function (pluginToRemove, key, list) {

      waterfallFunctions.push(function (callback) {

        console.log("Adding plugin: " + pluginToRemove);

        if (pluginToRemove === "cordova-plugin-proguard") {
          pluginToRemove = "https://github.com/dmngr/cordova-plugin-proguard.git";
        }

        if (pluginToRemove === "cordova-plugin-ionic") {
          pluginToRemove = "https://github.com/deliverymanager/cordova-plugin-ionic.git --variable APP_ID='-' --variable UPDATE_METHOD='none' --variable CHANNEL_NAME='-'";
        }

        exec("cordova plugin add " + pluginToRemove + " --browserify --save", function (error, stdout, stderr) {
          console.log("Plugin added!");
          if (error) {
            console.log(error);
          }
          console.log(stdout);

          callback();
        });
      });

    });

    console.log("Total plugins to add ", waterfallFunctions.length);

    async.waterfall(waterfallFunctions, function (err, response) {

      if (err) {
        console.log(err);
      }
    });


  });
});



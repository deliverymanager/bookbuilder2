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
    var pluginsToAdd = ["cordova-plugin-device", "ionic-plugin-keyboard", "cordova-plugin-statusbar", "cordova-plugin-x-toast", "cordova-plugin-whitelist", "cordova-plugin-ionic", "cordova-plugin-insomnia", "cordova-plugin-webserver"];

    if (minSdkVersion === "14") {
      pluginsToAdd.push("cordova-plugin-crosswalk-webview@1.8.0");
      pluginsToAdd.push("cordova-plugin-file@4.3.3");
      pluginsToAdd.push("cordova-plugin-file-transfer@1.6.3");
      pluginsToAdd.push("cordova-plugin-media@2.4.1");
    } else if (minSdkVersion === "16") {
      pluginsToAdd.push("cordova-plugin-crosswalk-webview");
      pluginsToAdd.push("cordova-plugin-file@4.3.3");
      pluginsToAdd.push("cordova-plugin-file-transfer@1.6.3");
      pluginsToAdd.push("cordova-plugin-media@3.0.1");
    } else if (minSdkVersion === "19") {
      pluginsToAdd.push("cordova-plugin-crosswalk-webview");  //latest version
      pluginsToAdd.push("cordova-plugin-file-transfer");      //latest version
      pluginsToAdd.push("cordova-plugin-media");              //latest version
    } else if (minSdkVersion === "24") {
      pluginsToAdd.push("cordova-plugin-file");
      pluginsToAdd.push("cordova-plugin-file-transfer");
      pluginsToAdd.push("cordova-plugin-media");
      //here we do not have the crosswalk plugin
    }

    var waterfallFunctions = [];

    _.each(pluginsToAdd, function (pluginToRemove, key, list) {

      waterfallFunctions.push(function (callback) {

        console.log("Adding plugin: " + pluginToRemove);

        if (pluginToRemove === "cordova-plugin-ionic") {
          pluginToRemove = "https://github.com/deliverymanager/cordova-plugin-ionic.git --variable APP_ID='-' --variable UPDATE_METHOD='none' --variable CHANNEL_NAME='-' --variable WARN_DEBUG='false'";
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



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

var pluginsJSON = require(process.cwd() + '/platforms/android/android.json');
pluginsJSON.installed_plugins = pluginsJSON.installed_plugins || [];


var removedPlugins = ["cordova-plugin-media", "cordova-custom-config", "cordova-plugin-console", "cordova-plugin-crosswalk-webview", "cordova-plugin-device", "ionic-plugin-keyboard", "cordova-plugin-statusbar", "cordova-plugin-x-toast", "cordova-plugin-whitelist", "ionic-plugin-deploy", "cordova-plugin-insomnia", "cordova-plugin-app-version", "cordova-plugin-webserver", "cordova-plugin-splashscreen", "cordova-plugin-file", "cordova-plugin-file-transfer", "cordova-ios-requires-fullscreen", "cordova-plugin-transport-security"];

var waterfallFunctions = [];

_.each(removedPlugins, function (pluginToRemove, key, list) {

    if (!pluginsJSON.installed_plugins[pluginToRemove]) {

        waterfallFunctions.push(function (callback) {

            console.log("Adding plugin: " + pluginToRemove);
            exec("ionic plugin add " + pluginToRemove, function (error, stdout, stderr) {
                console.log("Plugin added!");
                if (error) {
                    console.log(error);
                }
                console.log(stdout);

                callback();
            });
        });

    }
});

console.log("Total plugins to add ", waterfallFunctions.length);

async.waterfall(waterfallFunctions, function (err, response) {

    if (err) {
        console.log(err);
    }
});




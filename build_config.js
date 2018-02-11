#!/usr/bin/env node
var fs = require('fs-extra');
var _ = require('underscore');
var async = require('async');
var request = require('request');
var path = require('path');
var http = require('http');
var exec = require('child_process').exec;
process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdout.pipe(process.stdout);
var xml2js = require("xml2js");
var AWS = require("aws-sdk");
var jf = require('jsonfile');
var s3 = new AWS.S3();


var group = process.argv[2];
var version = process.argv[3];

var iosVersion = "4.5.4";
var androidBuildVersion = "26.0.2";
var groupDirectory = __dirname;
var projectFolder = path.basename(__dirname);
var buildsDirectory = process.env.HOME + "/builds/" + group + "/" + projectFolder;
var platformAndroidPath = "/platforms/android/build/outputs/apk/";
var appcerts = process.env.HOME + "/appcerts";
if (!fs.existsSync(appcerts)) {
  appcerts = process.env.HOME + "/Dropbox/Applications/Certificates";
}
var bundle_id = "gr.dwhite." + group;
var zipalign = process.env.ANDROID_HOME + "/build-tools/" + androidBuildVersion + "/";
console.log("zipalign", zipalign);

var keyPath = appcerts + "/ANDROID KEYSTORES/DWHITE/anestis/";

if (!version) {
  console.log("Δεν έχετε συμπληρώσει τη version!");
  return;
}

var appsJson = jf.readFileSync(__dirname + '/apps.json');
console.log(appsJson);

if (!group || !version) {
  console.log("Δεν έχετε συμπληρώσει το bundle_id ή τη version!");
  return;
}

console.log("bundle_id", bundle_id);

var index = _.findIndex(appsJson, {
  bundle_id: bundle_id
});

console.log("Index", index);
if (index === -1) {
  console.log("The bundle id you entered does not exist!");
  return;
}

console.log(appsJson[index]);

var splitVersion = version.split(".");
var versionCode = "";
_.each(splitVersion, function (part) {
  if (part.toString().length === 1) {
    versionCode += part.toString() + "0";
  } else {
    versionCode += part.toString();
  }
});

console.log("versionCode", versionCode);

var prepareConfigXML = function (minSdkVersion, callback) {
  var versionForVersionCode = "";
  //var versionForVersionCode = minSdkVersion + versionCode.substr(2,5);
  if (minSdkVersion === "14" || minSdkVersion === "16") {
    versionForVersionCode = minSdkVersion + versionCode;
  } else {
    versionForVersionCode = minSdkVersion + versionCode + "0";
  }

  console.log("versionForVersionCode", versionForVersionCode);

  async.waterfall([function (waterfallCallback) {

    console.log("\n\n\nremoveAllPlugins.js");

    exec("ionic config set integrations.cordova.enabled true; node hooks/scripts/removeAllPlugins.js;", {maxBuffer: 2000000000000}, function (error, stdout, stderr) {

      if (error) {
        console.log("error", error);
      }

      waterfallCallback();

    }).stdout.pipe(process.stdout);

  }, function (waterfallCallback) {


    exec("cordova platform remove browser --save; cordova platform remove android --save; cordova platform remove ios --save; rm -r -f " + __dirname + "/platforms; rm -r -f " + __dirname + "/plugins; ", {maxBuffer: 2000000000000}, function (error, stdout, stderr) {

      console.log("\n\nRemoving All Platfrom and Plugins!!!\n\n");

      waterfallCallback();

    }).stdout.pipe(process.stdout);

  }, function (waterfallCallback) {

    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/config.xml', function (err, data) {
      parser.parseString(data, function (err, result) {

        result.widget.$.id = bundle_id;
        result.widget.$.version = version;
        result.widget.$['android-versionCode'] = versionForVersionCode;
        result.widget['name'] = [appsJson[index].name];
        result.widget['description'] = [appsJson[index].description];

        var preferences = [];
        _.each(result.widget['preference'], function (pref, key, list) {
          preferences.push(pref.$);
        });

        var indexPreference = _.findIndex(preferences, {
          name: "android-minSdkVersion"
        });

        result.widget['preference'][indexPreference]['$'].value = minSdkVersion;

        var builder = new xml2js.Builder();
        var xml = builder.buildObject(result);
        fs.writeFileSync(__dirname + '/config.xml', xml);
        console.log("config.xml edited!");

        fs.createReadStream(group + '/icon.png').pipe(fs.createWriteStream(__dirname + '/resources/icon.png'));

        setTimeout(function () {
          waterfallCallback();
        }, 1000);

      });
    });


  }], function (err, result) {

    if (err) {
      console.log("err", err);
      return
    }


    buildAndroid(versionForVersionCode, minSdkVersion, function (error) {

      if (error) {
        console.log("err", error);
        return process.exit();
      }

      content += "<br>Android Version Code: " + versionForVersionCode + "&nbsp;</br>";
      content += "https://s3-eu-west-1.amazonaws.com/allgroups/supercourse/android/" + group + "_" + versionForVersionCode + ".apk<br><br>";

      if (minSdkVersion !== "24") {
        content += "https://s3-eu-west-1.amazonaws.com/allgroups/supercourse/android/" + group + "_86_" + versionForVersionCode + ".apk<br><br>";
      }
      callback();

    });


  });


};


var buildAndroid = function (versionForVersionCode, minSdkVersion, generalCallback) {

  var androidVersion = "6.4.0";

  if (minSdkVersion === "14") {
    androidVersion = "5.2.2";
  }

  if (version === "0.0.0") {

    async.waterfall([
      function (callback) {

        exec("cd " + groupDirectory + "; ionic doctor check; ionic cordova platform add android@" + androidVersion + " --save;  ionic cordova resources android --icon --force; ionic cordova resources android --splash --force;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        androidIconsWithCurves(callback);

      },
      function (callback) {

        exec("cd " + groupDirectory + "; node hooks/scripts/add_plugins.js; ionic cordova prepare android -- --browserify; cordova plugins; ionic cordova build android -- --browserify;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        console.log("\n\nStarted Uploading", group + "_" + versionForVersionCode + ".apk");

        s3.upload({
            Bucket: "allgroups",
            Key: "supercourse/android/" + group + "_" + versionForVersionCode + ".apk",
            ACL: 'public-read',
            Body: (minSdkVersion !== "24" ? fs.createReadStream(groupDirectory + platformAndroidPath + "release/" + "android-armv7-debug.apk") : fs.createReadStream(groupDirectory + platformAndroidPath + "release/" + "android-debug.apk"))
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            console.log(group + "_" + versionForVersionCode + ".apk was uploaded!");

            callback();

          });

      }], function (err, result) {

      if (err) {
        console.log("\n\n\n\nANDROID BUILD ERROR ", err);
        return generalCallback(err);
      }

      return generalCallback();

    });


  } else {

    async.waterfall([
      function (callback) {
        exec("cd " + groupDirectory + "; ionic doctor check; ionic cordova platform add android@" + androidVersion + " --save;  ionic cordova resources android --icon --force; ionic cordova resources android --splash --force;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        androidIconsWithCurves(callback);

      },
      function (callback) {

        exec("cd " + groupDirectory + "; node hooks/scripts/add_plugins.js; ionic cordova prepare android -- --browserify; cordova plugins; ionic cordova build android --release -- --browserify;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        fs.createReadStream(keyPath + "my-release-key.keystore").pipe(fs.createWriteStream(groupDirectory + platformAndroidPath + "release/" + "my-release-key.keystore"));

        s3.upload({
            Bucket: "allgroups",
            Key: "supercourse/android/my-release-key.keystore",
            ACL: 'public-read',
            Body: fs.createReadStream(keyPath + "my-release-key.keystore")
          },
          function (err, dataS3) {
            if (err) {
              console.log("error uploading keystore", err);
              return callback(err);
            }

            if (minSdkVersion !== "24") {
              exec("cd " + groupDirectory + platformAndroidPath + "release; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-armv7-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

                if (error) {
                  console.log(error);
                  return callback(error);
                }
                callback();
              }).stdout.pipe(process.stdout);

            } else {
              exec("cd " + groupDirectory + platformAndroidPath + "release; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

                if (error) {
                  console.log(error);
                  return callback(error);
                }
                callback();
              }).stdout.pipe(process.stdout);
            }
          });
      },
      function (callback) {

        if (minSdkVersion !== "24") {
          exec("cd " + groupDirectory + platformAndroidPath + "release; rm " + group + "_" + versionForVersionCode.replace(/\./g, '_') + ".apk; " + zipalign + "zipalign -v 4 android-armv7-release-unsigned.apk " + group + "_" + versionForVersionCode.replace(/\./g, '_') + ".apk", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        } else {

          exec("cd " + groupDirectory + platformAndroidPath + "release; rm " + group + "_" + versionForVersionCode.replace(/\./g, '_') + ".apk;" + zipalign + "zipalign -v 4 android-release-unsigned.apk " + group + "_" + versionForVersionCode.replace(/\./g, '_') + ".apk", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        }

      }, function (callback) {

        if (minSdkVersion !== "24") {

          exec("cd " + groupDirectory + platformAndroidPath + "release; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-x86-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        } else {
          callback();
        }

      }, function (callback) {

        if (minSdkVersion !== "24") {
          exec("cd " + groupDirectory + platformAndroidPath + "release; rm " + group + "_86_" + versionForVersionCode.replace(/\./g, '_') + ".apk;" + zipalign + "zipalign -v 4 android-x86-release-unsigned.apk " + group + "_86_" + versionForVersionCode.replace(/\./g, '_') + ".apk", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        } else {
          callback();
        }
      }, function (callback) {

        console.log("\n\nStarted Uploading", group + "_" + versionForVersionCode + ".apk");

        s3.upload({
            Bucket: "allgroups",
            Key: "supercourse/android/" + group + "_" + versionForVersionCode + ".apk",
            ACL: 'public-read',
            Body: fs.createReadStream(groupDirectory + platformAndroidPath + "release/" + group + "_" + versionForVersionCode + ".apk")
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            console.log(group + "_" + versionForVersionCode + ".apk was uploaded!");

            callback();

          });

      }, function (callback) {


        if (minSdkVersion !== "24") {

          console.log("\n\nStarted Uploading", group + "_86_" + versionForVersionCode + ".apk");

          s3.upload({
              Bucket: "allgroups",
              Key: "supercourse/android/" + group + "_86_" + versionForVersionCode + ".apk",
              ACL: 'public-read',
              Body: fs.createReadStream(groupDirectory + platformAndroidPath + "release/" + group + "_86_" + versionForVersionCode + ".apk")
            },
            function (err, dataS3) {
              if (err) {
                console.log(err);
                return callback(err);
              }

              console.log(group + "_86_" + versionForVersionCode + ".apk was uploaded!");

              callback();

            });
        } else {
          callback();
        }

      }], function (err, result) {

      if (err) {
        console.log("\n\n\n\nANDROID BUILD ERROR ", err);
        return generalCallback(err);
      }

      return generalCallback();

    });
  }


};


var buildiOS = function (generalCallback) {

  async.waterfall([

    function (callback) {

      fs.createReadStream(group + '/icon.png').pipe(fs.createWriteStream(__dirname + '/resources/icon.png'));

      setTimeout(function () {
        exec("convert " + groupDirectory + "/resources/icon.png -set colorspace sRGB -flatten -background 'white' " + groupDirectory + "/resources/icon.png;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

          return callback(error);

        }).stdout.pipe(process.stdout);

      }, 2000);

    },

    function (callback) {

      console.log("deleting platforms to build for ios");
      exec("cd " + groupDirectory + "; ionic doctor check; cordova platform remove browser --save; cordova platform remove android --save; cordova platform remove ios --save; cordova plugins; cordova platforms; ionic cordova platform add ios@" + iosVersion + " --save; ionic cordova resources ios --icon --force; ionic cordova resources ios --splash --force;", {maxBuffer: 20000000000}, function (error, stdout, stderr) {

        if (error) {
          console.log(error);
          return callback(error);
        }

        callback();
      }).stdout.pipe(process.stdout);


    }, function (callback) {
      console.log("adding plugins for ios");

      exec("cd " + groupDirectory + "; node hooks/scripts/add_plugins.js;", {maxBuffer: 20480 * 500}, function (error, stdout, stderr) {

        if (error) {
          console.log(error);
          return callback(error);
        }

        callback();
      }).stdout.pipe(process.stdout);

    }, function (callback) {
      console.log("building app for ios");

      exec("cd " + groupDirectory + "; ionic cordova prepare ios -- --browserify; cordova plugins; ionic cordova build ios --release -- --browserify;", {maxBuffer: 20480 * 500}, function (error, stdout, stderr) {

        if (error) {
          console.log(error);
          return callback(error);
        }

        callback();
      }).stdout.pipe(process.stdout);

    }], function (err, result) {

    return generalCallback();

  });

};


var androidIconsWithCurves = function (callback) {

  var parallelFunctions = [];
  var androidIcons = [
    {
      "file": "drawable-hdpi-icon.png",
      "size": "72x72",
      "curves": "7,7"
    },
    {
      "file": "drawable-ldpi-icon.png",
      "size": "36x36",
      "curves": "3,3"
    },
    {
      "file": "drawable-mdpi-icon.png",
      "size": "48x48",
      "curves": "5,5"
    },
    {
      "file": "drawable-xhdpi-icon.png",
      "size": "96x96",
      "curves": "9,9"
    },
    {
      "file": "drawable-xxhdpi-icon.png",
      "size": "144x144",
      "curves": "14,14"
    },
    {
      "file": "drawable-xxxhdpi-icon.png",
      "size": "192x192",
      "curves": "19,19"
    }];

  _.each(androidIcons, function (icon, key, list) {

    parallelFunctions.push(function (parallelCallback) {

      exec("convert -size " + icon.size + " xc:none -fill white -draw 'roundRectangle 0,0 " + icon.size.replace("x", ",") + " " + icon.curves + "' " + groupDirectory + "/resources/android/icon/" + icon.file + " -compose SrcIn -composite " + groupDirectory + "/resources/android/icon/" + icon.file, {maxBuffer: 20000000000}, function (error, stdout, stderr) {
        if (error) {
          console.log('error', error);
          parallelCallback(error);
        }
        console.log("androidIconsWithCurves");
        parallelCallback();
      });

    });

  });

  async.parallel(parallelFunctions, function (err, result) {
    if (err) {
      console.log('error', error);
      callback(error);
    }

    callback();

  });


};


var sendEmailNotification = function (content, callback) {
  var item = {};
  item.credentialUsername = "domvris";
  item.credentialPassword = "a948942";
  //item.email = "dimseirinopoulos@gmail.com";
  item.email = "adomvris@gmail.com";
  item.from = "info@deliverymanager.gr";
  item.contents = content;
  item.headings = "Supercourse εφαρμογή!";
  item.reason = "newSupercourseBuild";
  item.reasonLabel = "Ενημέρωση για δημιουργία νέας εφαρμογής!";
  item.group = "marketingapp";
  item.store_id = "all";

  //Send the SMS
  request({
    uri: "https://api.deliverymanager.gr/marketing/sendemailnotification",
    method: "POST",
    timeout: 7000,
    followRedirect: true,
    maxRedirects: 10,
    gzip: true,
    json: true,
    body: item
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {

      console.log(body);
      callback();

    } else {
      console.log(error);
      callback(error);
    }
  });
};


var content = "Group: " + group + "<br>Bundle id: " + bundle_id + "<br>App Name: " + appsJson[index].name + "<br>App Description: " + appsJson[index].description;

async.waterfall([
  function (waterfallCallback) {

    return waterfallCallback();

    prepareConfigXML("14", waterfallCallback);

  }, function (waterfallCallback) {

    return waterfallCallback();

    prepareConfigXML("24", waterfallCallback);

  }, function (waterfallCallback) {

    //return waterfallCallback();

    prepareConfigXML("16", waterfallCallback);

  }, function (waterfallCallback) {

    buildiOS(function (error) {

      if (error) {
        console.log("err", error);
        return process.exit();
      }

      waterfallCallback();

    });
  }], function (err, result) {

  sendEmailNotification(content, function () {
    console.log("Process finished succesfully! You will get an email soon!");
    console.log("You may exit and go and sign the ios app and upload it!");
    return process.exit();
  });


});

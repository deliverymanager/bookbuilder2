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
process.stdin.write("STARTING BUILD THE APP\n");
var xml2js = require("xml2js");
var AWS = require("aws-sdk");
var jf = require('jsonfile');
var s3 = new AWS.S3();

//READING THE GROUP FROM THE CMD e.g: node build_config.js enGrSuperJuniorAtoB 4.0.0 or 0.0.0

var group = process.argv[2];
var version = process.argv[3];

var iosVersion = "4.4.0";
var appsJson = jf.readFileSync(__dirname + '/apps.json');
console.log(appsJson);

if (!group || !version) {
  console.log("Δεν έχετε συμπληρώσει το bundle_id ή τη version!");
  return;
}
var bundle_id = "gr.dwhite." + group;

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

    exec("node hooks/scripts/removeAllPlugins.js;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

      if (error) {
        console.log("error", error);
      }

      waterfallCallback();

    }).stdout.pipe(process.stdout);

  }, function (waterfallCallback) {


    exec("rm -r " + __dirname + "/platforms; rm -r " + __dirname + "/plugins; ", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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

        fs.createReadStream('../' + group + '/icon.png').pipe(fs.createWriteStream(__dirname + '/resources/icon.png'));

        setTimeout(function () {
          waterfallCallback();
        }, 1000);

      });
    });


  }, function (waterfallCallback) {
    exec("node hooks/scripts/add_plugins.js;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

      if (error) {
        console.log("error", error);
      }

      waterfallCallback();

    }).stdout.pipe(process.stdout);
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

  var androidVersion = "6.2.3";

  if (minSdkVersion === "14") {
    androidVersion = "5.2.2";
  }

  if (version === "0.0.0") {

    async.waterfall([
      function (callback) {

        exec("ionic platform add android@" + androidVersion + "; ionic resources --icon;  ionic prepare android; ionic build android;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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
            Body: (minSdkVersion !== "24" ? fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/android-armv7-debug.apk") : fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/android-debug.apk"))
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

        exec("ionic platform add android@" + androidVersion + "; ionic resources --icon;  ionic prepare android; ionic build android --release;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }

          console.log("\n\nAndroid Build finished!");
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        fs.createReadStream("/Users/anestis/Dropbox/Applications/Certificates/ANDROID KEYSTORES/DWHITE/anestis/my-release-key.keystore").pipe(fs.createWriteStream(__dirname + "/platforms/android/build/outputs/apk/my-release-key.keystore"));

        s3.upload({
            Bucket: "allgroups",
            Key: "supercourse/android/my-release-key.keystore",
            ACL: 'public-read',
            Body: fs.createReadStream("/Users/anestis/Dropbox/Applications/Certificates/ANDROID KEYSTORES/DWHITE/anestis/my-release-key.keystore")
          },
          function (err, dataS3) {
            if (err) {
              console.log("error uploading keystore", err);
              return callback(err);
            }

            if (minSdkVersion !== "24") {
              exec("cd platforms/android/build/outputs/apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-armv7-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

                if (error) {
                  console.log(error);
                  return callback(error);
                }
                callback();
              }).stdout.pipe(process.stdout);

            } else {

              exec("cd platforms/android/build/outputs/apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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
          exec("cd platforms/android/build/outputs/apk; rm " + group + "_" + versionForVersionCode + ".apk; /Users/anestis/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 android-armv7-release-unsigned.apk " + group + "_" + versionForVersionCode + ".apk", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        } else {

          exec("cd platforms/android/build/outputs/apk; rm " + group + "_" + versionForVersionCode + ".apk; /Users/anestis/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 android-release-unsigned.apk " + group + "_" + versionForVersionCode + ".apk", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

            if (error) {
              console.log(error);
              return callback(error);
            }
            callback();
          }).stdout.pipe(process.stdout);
        }

      }, function (callback) {

        if (minSdkVersion !== "24") {
          exec("cd platforms/android/build/outputs/apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-x86-release-unsigned.apk alias_name -storepass anestis;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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

          exec("cd platforms/android/build/outputs/apk; rm " + group + "_86_" + versionForVersionCode + ".apk; /Users/anestis/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 android-x86-release-unsigned.apk " + group + "_86_" + versionForVersionCode + ".apk", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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
            Body: fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/" + group + "_" + versionForVersionCode + ".apk")
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
              Body: fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/" + group + "_86_" + versionForVersionCode + ".apk")
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

  exec("ionic platform add ios@" + iosVersion + "; ionic resources --icon;  ionic build ios;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

    if (error) {
      console.log("ios build error", error);
      return generalCallback(error);
    }

    generalCallback();
  }).stdout.pipe(process.stdout);


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

    if (!error && response.statusCode == 200) {

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

    prepareConfigXML("24", waterfallCallback);

  }, function (waterfallCallback) {

    return waterfallCallback();

    prepareConfigXML("16", waterfallCallback);

  }, function (waterfallCallback) {

    buildiOS(function (error) {

      if (error) {
        console.log("err", error);
        return process.exit();
      }

      exec("node hooks/scripts/ionic_upload.js;", {maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

        if (error) {
          console.log(error);
          return process.exit();
        }
        waterfallCallback();
      }).stdout.pipe(process.stdout);


    });
  }], function (err, result) {

  sendEmailNotification(content, function () {
    console.log("Process finished succesfully! You will get an email soon!");
    console.log("You may exit and go and sign the ios app and upload it!");
    return process.exit();
  });


});

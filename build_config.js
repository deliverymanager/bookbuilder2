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

var parser = new xml2js.Parser();
fs.readFile(__dirname + '/config.xml', function (err, data) {
  parser.parseString(data, function (err, result) {
    result.widget.$.id = bundle_id;
    result.widget.$.version = version;
    result.widget['name'] = [appsJson[index].name];
    result.widget['description'] = [appsJson[index].description];
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(result);
    fs.writeFileSync(__dirname + '/config.xml', xml);
    console.log("config.xml edited!");


    fs.createReadStream('../' + group + '/icon.png').pipe(fs.createWriteStream(__dirname + '/resources/icon.png'));

    setTimeout(function () {

      buildAndroid(function (error) {

        if (error) {
          console.log("err", error);
          return process.exit();
        }

        buildiOS(function (error) {

          if (error) {
            console.log("err", error);
            return process.exit();
          }

          var content = "Group: " + group + "<br>Bundle id: " + bundle_id + "<br>App Name: " + appsJson[index].name + "<br>App Description: " + appsJson[index].description;
          content += "<br>Android .apk file to be uploaded on Google Play Console: <br>";
          content += "https://s3-eu-west-1.amazonaws.com/allgroups/supercourse/android/" + group + "_" + version.replace(/\./g, '_') + ".apk<br><br>";
          content += "<br>For IOS go to Xcode build the app .ipa and upload it! <br>";
          content += "<br> First select the Developer Team and press play to run the app the emulator, so that you can correct the recommended settings by Xcode.Finally do a Clean Build and Archive! <br>";

          sendEmailNotification(content, function () {
            console.log("Process finished succesfully! You will get an email soon!");
            console.log("You may exit and go and sign the ios app and upload it!");
            return process.exit();
          });

        });
      });
    }, 1000);

  });
});


var buildAndroid = function (generalCallback) {


  if (version === "0.0.0") {

    async.waterfall([
      function (callback) {

        exec("ionic resources --icon; ionic prepare android; ionic build android;",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        console.log("\n\nStarted Uploading", group + "_" + version.replace(/\./g, '_') + ".apk");

        s3.putObject({
            Bucket: "allgroups",
            Key: "supercourse/android/" + group + "_" + version.replace(/\./g, '_') + ".apk",
            ACL: 'public-read',
            Body: fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/android-armv7-debug.apk")
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            console.log(group + "_" + version.replace(/\./g, '_') + ".apk was uploaded!");

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

        exec("ionic platform remove android; ionic platforms add android; ionic resources --icon; ionic prepare android; ionic build --release android;",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      },
      function (callback) {

        fs.createReadStream("/Users/anestis/Dropbox/Applications/Certificates/ANDROID KEYSTORES/DWHITE/anestis/my-release-key.keystore").pipe(fs.createWriteStream(__dirname + "/platforms/android/build/outputs/apk/my-release-key.keystore"));

        s3.putObject({
            Bucket: "allgroups",
            Key: "supercourse/android/my-release-key.keystore",
            ACL: 'public-read',
            Body: fs.createReadStream("/Users/anestis/Dropbox/Applications/Certificates/ANDROID KEYSTORES/DWHITE/anestis/my-release-key.keystore")
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            exec("cd platforms/android/build/outputs/apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-armv7-release-unsigned.apk alias_name -storepass anestis;",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

              if (error) {
                console.log(error);
                return callback(error);
              }
              callback();
            }).stdout.pipe(process.stdout);

          });

      },
      function (callback) {

        exec("cd platforms/android/build/outputs/apk; rm " + group + "_" + version.replace(/\./g, '_') + ".apk; /Users/anestis/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 android-armv7-release-unsigned.apk " + group + "_" + version.replace(/\./g, '_') + ".apk",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      }, function (callback) {

        exec("cd platforms/android/build/outputs/apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-x86-release-unsigned.apk alias_name -storepass anestis;",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      }, function (callback) {

        exec("cd platforms/android/build/outputs/apk; rm " + group + "_86_" + version.replace(/\./g, '_') + ".apk; /Users/anestis/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 android-x86-release-unsigned.apk " + group + "_86_" + version.replace(/\./g, '_') + ".apk",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

          if (error) {
            console.log(error);
            return callback(error);
          }
          callback();
        }).stdout.pipe(process.stdout);

      }, function (callback) {

        console.log("\n\nStarted Uploading", group + "_" + version.replace(/\./g, '_') + ".apk");

        s3.putObject({
            Bucket: "allgroups",
            Key: "supercourse/android/" + group + "_" + version.replace(/\./g, '_') + ".apk",
            ACL: 'public-read',
            Body: fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/" + group + "_" + version.replace(/\./g, '_') + ".apk")
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            console.log(group + "_" + version.replace(/\./g, '_') + ".apk was uploaded!");

            callback();

          });

      }, function (callback) {

        console.log("\n\nStarted Uploading", group + "_86_" + version.replace(/\./g, '_') + ".apk");


        s3.putObject({
            Bucket: "allgroups",
            Key: "supercourse/android/" + group + "_86_" + version.replace(/\./g, '_') + ".apk",
            ACL: 'public-read',
            Body: fs.createReadStream(__dirname + "/platforms/android/build/outputs/apk/" + group + "_86_" + version.replace(/\./g, '_') + ".apk")
          },
          function (err, dataS3) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            console.log(group + "_86_" + version.replace(/\./g, '_') + ".apk was uploaded!");

            callback();

          });

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

  exec("ionic platform remove ios; ionic platforms add ios; ionic prepare ios; ionic build ios;",{maxBuffer: 2048 * 500}, function (error, stdout, stderr) {

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

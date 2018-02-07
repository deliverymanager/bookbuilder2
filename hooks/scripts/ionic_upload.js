#!/usr/bin/env node
console.log("***************************  ionic_upload.js started...");

var async = require('async')
var fs = require('fs-extra');
var exec = require('child_process').exec;
process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdout.pipe(process.stdout);
process.setMaxListeners(0);
var jf = require('jsonfile');

var ionicProjects = jf.readFileSync(process.cwd() + '/ionicProjects.json');
console.log("all ionicProjects", ionicProjects);

var platformToCopyFrom = "android";
var currentGitRepositoryAndIonicProApp = "book2builderbuild";
//I also need to change the app_id IonicCordova.deploy.init inside preloading.js

console.log("***************  UPLOADING TO IONIC PRO APP: ", currentGitRepositoryAndIonicProApp);

async.waterfall([
  function (wcall) {

    exec('git clone https://github.com/dmngr/' + currentGitRepositoryAndIonicProApp + '.git; git status;', {
      cwd: process.cwd(),
      maxBuffer: 2048 * 500
    }, function (error, stdout, stderr) {

      if (error) {
        console.log(error);
      }
      console.log(stdout);

      console.log("cloned ", currentGitRepositoryAndIonicProApp);
      wcall();
    }).stdout.pipe(process.stdout);
  }, function (wcall) {

    exec('cd ' + currentGitRepositoryAndIonicProApp + '; npm install; ionic git remote; rm -Rf www;', {
      cwd: process.cwd(),
      maxBuffer: 2048 * 500
    }, function (error, stdout, stderr) {

      if (error) {
        console.log(error);
      }
      console.log(stdout);
      console.log("npm install and removed www inside ", currentGitRepositoryAndIonicProApp);

      wcall();
    }).stdout.pipe(process.stdout);
  }, function (wcall) {

    fs.copy(process.cwd() + "/platforms/" + platformToCopyFrom + "/www", process.cwd() + "/" + currentGitRepositoryAndIonicProApp + "/www", function (err) {

      if (err) {
        console.log("err", err);
        return process.exit();
      }
      console.log("www copied!");
      wcall();
    });
  }, function (wcall) {

    exec('cd ' + currentGitRepositoryAndIonicProApp + '; ls; git add .; git commit -m"created new build"; git push; git push ionic master', {
      cwd: process.cwd(),
      maxBuffer: 2048 * 500
    }, function (error, stdout, stderr) {
      // if you also want to change current process working directory:
      if (error) {
        console.log(error);
      }
      console.log(stdout);

      wcall();

    }).stdout.pipe(process.stdout);
  }, function (wcall) {

    exec('rm -Rf ' + currentGitRepositoryAndIonicProApp + '; git checkout config.xml;', {
      cwd: process.cwd(),
      maxBuffer: 2048 * 500
    }, function (error, stdout, stderr) {
      // if you also want to change current process working directory:
      if (error) {
        console.log(error);
      }
      console.log(stdout);

      wcall();

    }).stdout.pipe(process.stdout);
  }], function (err, res) {

  console.log("ionic_upload completed!");
  process.exit();

});

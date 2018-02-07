angular.module("bookbuilder2")
  .controller("PreloadingController", function (_, $cordovaFileTransfer, $scope, $timeout, $interval, $ionicHistory, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading, $cordovaFile) {

    console.log("PreloadingController loaded!");


    $rootScope.showPopup = function () {
      $ionicLoading.hide();
      var errorPopUp = $ionicPopup.alert({
        template: 'Please make sure your have a stable connection to the internet!',
        title: 'Connectivity Error!',
        okType: 'button-dark'
      });
      errorPopUp.then(function () {
        $rootScope.navigate("groups");
      });
    };


    $rootScope.navigate = function (state) {
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache().then(function (response) {
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true,
          historyRoot: true
        });
        $state.go(state);
      });
    };

    $rootScope.nextActivity = function (selectedLesson, activityFolder) {
      var index = _.findIndex(selectedLesson.activitiesMenu, {
        "activityFolder": activityFolder
      });

      console.log("index", index);
      console.log("selectedLesson", selectedLesson);

      if (index < selectedLesson.activitiesMenu.length - 1) {
        window.localStorage.setItem("activityFolder", selectedLesson.activitiesMenu[index + 1].activityFolder);
        window.localStorage.setItem("activityName", selectedLesson.activitiesMenu[index + 1].name);

        if (selectedLesson.activitiesMenu[index].activityTemplate === selectedLesson.activitiesMenu[index + 1].activityTemplate) {
          $state.go($state.current, {}, {reload: true});
        } else {
          $rootScope.navigate(selectedLesson.activitiesMenu[index + 1].activityTemplate);
        }
      } else {
        $rootScope.navigate("results");
      }
    };


    var installIonicUpdate = function () {//This is asynchronous so they should no be inside the destroy event!!!

      $ionicLoading.show({
        template: "DOWNLOADING APP UPDATE 0%"
      });

      IonicCordova.deploy.download(function (res) {

        console.log("IonicCordova.deploy.download res", res);

        if (res === 'true' || res === 'false') {

          $ionicLoading.show({
            template: "INSTALLING APP UPDATE 0%"
          });

          // We can unzip the latest version
          IonicCordova.deploy.extract(function (result) {

            console.log("IonicCordova.deploy.extract result", result);

            if (result === 'done') {

              $ionicLoading.show({
                template: "RESTARTING APP ..."
              });
              // we're ready to load the new version
              IonicCordova.deploy.redirect(function (done) {

                console.log("IonicCordova.deploy.redirect success", done);

              }, function (err) {
                console.log("IonicCordova.deploy.redirect err", err);
              });

            } else {
              $ionicLoading.show({
                template: "INSTALLING APP UPDATE " + result + "%"
              });
            }

          }, function (err) {
            console.log("IonicCordova.deploy.extract err", err);

          });
        } else {
          $ionicLoading.show({
            template: "DOWNLOADING APP UPDATE " + res + "%"
          });
        }
      }, function (err) {
        console.log("IonicCordova.deploy.download err", err);
      });
    };

    $rootScope.checkDeployUpdates = function (callback) {

      if (!IonicCordova) {
        console.log("The plugin IonicCordova does not exist!");
        $scope.TempGroup = "demo";
        $rootScope.developerMode = true;
        return callback();
      }

      async.waterfall([
          //Getting package name
          function (preloadingCallback) {

            IonicCordova.getAppInfo(function (data) {
              console.log("IonicCordova getAppInfo", data);

              if (data.bundleName.indexOf("gr.dwhite") === -1) {

                if (data.bundleName === "io.ionic.devapp") {
                  console.warn("we are inside the ionic dev app");
                  $scope.TempGroup = "demo";
                  $rootScope.packageName = data.bundleName;
                  $rootScope.developerMode = true;
                  return callback();
                } else {

                }

              } else {
                $scope.TempGroup = data.bundleName.split(".")[2];
              }

              console.log("TempGroup", $scope.TempGroup);
              $rootScope.versionNumber = data.bundleVersion;

              if ($scope.TempGroup === "enGrLikeEnglishB1") {
                $scope.cdnUrl = "http://engrlikeenglishb1-3-0.s3-website-eu-west-1.amazonaws.com/";
              } else {
                $scope.cdnUrl = "http://" + $scope.TempGroup + ".s3-website-eu-west-1.amazonaws.com/";
              }
              window.localStorage.setItem("cdnUrl", $scope.cdnUrl);

              if ($rootScope.cookieEnabled) {
                window.localStorage.setItem("versionNumber", $rootScope.versionNumber);
              }

              console.log("$rootScope.versionNumber", $rootScope.versionNumber);

              if ($rootScope.versionNumber === "0.0.0") {
                $rootScope.developerMode = true;
              } else {
                $rootScope.developerMode = false;
              }

              console.log("Developer Mode: ", $rootScope.developerMode);

              preloadingCallback(null);

            }, function (err) {

              console.error("There was an error on getting package name(The preloading continues!).  Error: ", err);
              preloadingCallback(null);
            });
          },
          function (preloadingCallback) {

            IonicCordova.deploy.init({
              appId: "5694d278", //This should only change if I have a new binary that uses a new app_id in ionic pro
              channel: $rootScope.developerMode ? "Master" : "Production"
            }, function (res) {
              console.log("IonicCordova.deploy.iniτ success", res);

              preloadingCallback();
            }, function (err) {
              console.log("IonicCordova.deploy.init err", err);
              callback();
            });
          },
          function (preloadingCallback) {

            //Checking if the developerMode is enabled
            if ($rootScope.developerMode) {

              console.log("WE ARE IN DEVELOPER CHANNEL!!!");
              $timeout(function () {//TImeout so that it has time to load the plugins
                window.plugins.insomnia.keepAwake();
              }, 3000);

              preloadingCallback(null);

            } else {

              console.warn("WE ARE IN PRODUCTION CHANNEL!!!");
              preloadingCallback(null);

            }
          },
          function (preloadingCallback) {

            //Here I will emit the IonicCordova app info to an api in order to see if there is a new bundle in the store

            if ($rootScope.developerMode) {
              console.warn("WE ARE IN DEVELOPER BUNDLE SO I DO NOT SEARCH FOR NEW BUNDLE IN THE STORE!!!");


              preloadingCallback(null);

            } else {

              console.log("WE ARE IN PRODUCTION BUNDLE!!! I AM SEARCHING FOR A NEW BUNDLE IN THE STORE!");

              preloadingCallback(null);

            }
          },

          function (preloadingCallback) {

            //Here I will emit the IonicCordova app info to an api in order to see if there is a new bundle in the store


            if ($rootScope.developerMode) {

              console.warn("WE ARE IN DEVELOPER BUNDLE !!!");

              $scope.checkDeployInterval = $interval(function () {

                IonicCordova.deploy.check(function (hasUpdate) {

                  console.log("IonicCordova.deploy.check hasUpdate", hasUpdate);
                  if (hasUpdate === 'true') {

                    $interval.cancel($scope.checkDeployInterval);

                    $ionicLoading.show({
                      template: "DEVELOPER UPDATE ..."
                    });

                    installIonicUpdate();
                  }
                }, function (err) {
                  console.log("IonicCordova.deploy.check err", err);
                });
              }, 8000, 0, true);

              preloadingCallback(null);

            } else {
              console.log("WE ARE IN PRODUCTION BUNDLE!!!");

              IonicCordova.deploy.check(function (hasUpdate) {

                console.log("IonicCordova.deploy.check hasUpdate", hasUpdate);

                if (hasUpdate === 'true') {

                  $ionicLoading.show({
                    template: "APP UPDATE ..."
                  });

                  if ($rootScope.cookieEnabled) {
                    window.localStorage.removeItem("currentView");
                  }

                  installIonicUpdate();

                } else {
                  console.log("There is no update available right now!");
                  preloadingCallback(null);
                }
              }, function (err) {
                console.log("IonicCordova.deploy.check err", err);
                preloadingCallback();
              });
            }
          }
        ],

        //General Callback
        function (error, result) {
          if (error) {
            console.error(error);
          } else {
            console.log("Update check done!");
          }

          callback();
        });
    };


    $ionicPlatform.ready(function () {
      console.log("bookbuilder2 ready!");

      if (window.cordova && window.cordova.platformId !== "browser") {

        window.plugins.insomnia.keepAwake();

        console.log("window.cordova.file.externalDataDirectory", window.cordova.file.externalDataDirectory);
        if (window.cordova.file.externalDataDirectory) {
          $scope.rootDir = window.cordova.file.externalDataDirectory
        } else {
          $scope.rootDir = window.cordova.file.dataDirectory;
        }

        window.localStorage.setItem("rootDir", $scope.rootDir);
        console.log("$scope.rootDir", $scope.rootDir);

        $timeout(function () {
          $scope.totalFiles = 100;
          $rootScope.downloading = 0;

          $rootScope.checkDeployUpdates(function () {

            $rootScope.checkDirOrCreate($scope.rootDir, "data", function (error) {

              if (error) {
                console.log("Error checkDirOrCreate data directory");
              }

              $rootScope.checkDirOrCreate($scope.rootDir + "data", "book", function (error) {

                if (error) {
                  console.log("Error checkDirOrCreate json directory");
                }


                $rootScope.assets(["assets.json", "groups.json"], $scope.rootDir, $scope.cdnUrl, "data", "book", function (response) {
                  console.log("response assets.json groups.json", response);
                  if (response) {

                    $http.get($scope.rootDir + "data/book/groups.json").success(function (book) {

                      $scope.book = book;
                      window.localStorage.setItem("book", JSON.stringify($scope.book));

                      $http.get($scope.rootDir + "data/book/assets.json").success(function (assets) {

                        $scope.totalFiles = 2 + assets.length;
                        $rootScope.downloading = 2;

                        $rootScope.assets(assets, $scope.rootDir, $scope.cdnUrl, "data", "assets", function (response) {

                          if (!response) {
                            $rootScope.showPopup();
                          }
                        });
                      });
                    });
                  } else {
                    $rootScope.showPopup();
                  }
                });
              });
            });
          });
        }, 2000);


      } else {
        //engrlikeenglishb1-3-0
        //engrenglish3
        //RUN ON BROWSER FOR DEVELOPING https://s3-eu-west-1.amazonaws.com/bookbuilder2/index.html
        //$scope.rootDir = "https://s3-eu-west-1.amazonaws.com/engrlikeenglishb1-3-0/";
        $scope.rootDir = "";
        $rootScope.developerMode = true;
        window.localStorage.setItem("rootDir", $scope.rootDir);
        $rootScope.navigate("groups");
      }

    });


    $rootScope.assets = function (assetsArray, rootDir, cdnUrl, prefolder, folder, callback) {

      var checkFileAndDownload = function (prefolder, folder, file, cdnUrl, callback) {

        $cordovaFile.checkFile(rootDir + prefolder + "/" + folder + "/", file)
          .then(function (success) {
            console.log("asset success", cdnUrl + prefolder + "/" + folder + "/" + file, rootDir + prefolder + "/" + folder + "/" + file);
            callback(true);
          }, function (error) {
            $cordovaFileTransfer.download(cdnUrl + prefolder + "/" + folder + "/" + file, rootDir + prefolder + "/" + folder + "/" + file, {}, true)
              .then(function (result) {
                console.log("asset error", cdnUrl + prefolder + "/" + folder + "/" + file, rootDir + prefolder + "/" + folder + "/" + file);
                console.log("Sucessufully downloaded!");
                callback(true);
              }, function (error) {
                console.log("asset error", cdnUrl + prefolder + "/" + folder + "/" + file, rootDir + prefolder + "/" + folder + "/" + file);
                console.log(error);
                callback(false);
              }, function (progress) {
                //console.log(progress);
              });
          });
      };


      if (window.cordova && window.cordova.platformId !== "browser") {

        var seriesFunctions = [];

        _.each(assetsArray, function (fileName, key, list) {

          seriesFunctions.push(function (seriesCallback) {

            checkFileAndDownload(prefolder, folder, fileName, cdnUrl, function (callbackResponse) {

              console.log(fileName);
              $rootScope.downloading++;

              if (callbackResponse) {
                seriesCallback(null);
              } else {
                seriesCallback(true);
              }
            });
          });
        });

        async.parallelLimit(seriesFunctions, 5, function (err, response) {
          console.log("Downloading FINISHED!!!");
          if (err) {
            console.warn(err);
            return callback(false);
          } else {
            return callback(true);
          }
        });
      } else {
        return callback(true);
      }
    };

    $rootScope.checkDirOrCreate = function (path, directory, callback) {

      $cordovaFile.checkDir(path, directory)
        .then(function (success) {
          console.log("Directory exists!");

          callback(null);
        }, function (error) {
          console.log(error);

          $cordovaFile.createDir(path, directory, true)
            .then(function (success) {
              callback(null);
            }, function (error) {
              console.log(error);
              callback(false);
            });
        });
    };
  });

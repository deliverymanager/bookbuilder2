angular.module("bookbuilder2")
  .controller("PreloadingController", function (_, $ionicDeploy, $cordovaFileTransfer, $scope, $timeout, $interval, $ionicHistory, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading, $cordovaFile) {

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


    $ionicPlatform.ready(function () {
      console.log("bookbuilder2 ready!");

      if (window.cordova && window.cordova.platformId !== "browser") {

        window.plugins.insomnia.keepAwake();
        console.log("hide SplashScreen");
        navigator.splashscreen.hide();

        console.log("window.cordova.file.externalDataDirectory", window.cordova.file.externalDataDirectory);
        if (window.cordova.file.externalDataDirectory) {
          $scope.rootDir = window.cordova.file.externalDataDirectory
        } else {
          $scope.rootDir = window.cordova.file.dataDirectory;
        }

        window.localStorage.setItem("rootDir", $scope.rootDir);
        console.log("$scope.rootDir", $scope.rootDir);

        $timeout(function () {
          window.cordova.getAppVersion.getPackageName(function (name) {
            console.log(name);
            var TempGroup = name.split(".");

            window.cordova.getAppVersion.getVersionNumber(function (versionNumber) {
              console.log("config.xml", versionNumber);
              var savedVersionNumber = window.localStorage.getItem("versionNumber");
              if (savedVersionNumber && (savedVersionNumber.split(".")[0] + "_" + savedVersionNumber.split(".")[1] ) === (versionNumber.split(".")[0] + "_" + versionNumber.split(".")[1])) {
                console.log("savedVersionNumber", savedVersionNumber);
                $rootScope.versionNumber = window.localStorage.getItem("versionNumber");
              } else {
                window.localStorage.setItem("versionNumber", versionNumber);
                $rootScope.versionNumber = versionNumber;
              }

              if (TempGroup[2] === "enGrLikeEnglishB1") {
                $scope.cdnUrl = "http://engrlikeenglishb1-3-0.s3-website-eu-west-1.amazonaws.com/";
              } else {
                $scope.cdnUrl = "http://" + TempGroup[2] + ".s3-website-eu-west-1.amazonaws.com/";
              }
              window.localStorage.setItem("cdnUrl", $scope.cdnUrl);
              $scope.totalFiles = 100;
              $rootScope.downloading = 0;


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

                            if (response) {

                              checkDeployAndUpdate();

                            } else {
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
          }, function (error) {
            console.log(error);
          });
        }, 2000);


      } else {
        //engrlikeenglishb1-3-0
        //engrenglish3
        //RUN ON BROWSER FOR DEVELOPING https://s3-eu-west-1.amazonaws.com/bookbuilder2/index.html
        //$scope.rootDir = "https://s3-eu-west-1.amazonaws.com/engrlikeenglishb1-3-0/";
        $scope.rootDir = "";
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


    var checkDeployAndUpdate = function () {

      var deployChannel = "v" + $rootScope.versionNumber.split(".")[0] + "_" + $rootScope.versionNumber.split(".")[1] + "_0";
      if (deployChannel === "v0_0_0") {
        $rootScope.developerMode = true;
      } else {
        $rootScope.developerMode = false;
      }

      checkDownloadedSnapshotsAndDeleteUnused();

      if ($rootScope.developerMode) {
        $ionicDeploy.channel = "dev";

        $scope.checkDeployInterval = $interval(function () {
          $ionicDeploy.check().then(function (hasUpdate) {
            if (hasUpdate) {
              $interval.cancel($scope.checkDeployInterval);

              $ionicLoading.show({
                template: "DEVELOPER UPDATE ..."
              });

              $cordovaFile.removeRecursively($scope.rootDir, "data")
                .then(function (success) {

                  installIonicUpdate();

                }, function (error) {
                  console.log(error);
                  $rootScope.navigate("groups");
                });
            }
          });
        }, 8000, 0, true);

        $rootScope.navigate("groups");

      } else {

        $ionicDeploy.channel = deployChannel;
        $ionicDeploy.check().then(function (hasUpdate) {

          if (hasUpdate) {

            $ionicDeploy.getMetadata().then(function (metadata) {
              if (!metadata || !metadata.version) {
                metadata = {
                  version: ""
                }
              }

              $scope.popupRegisterVar = $ionicPopup.show({
                "template": 'Download and install the new version ' + metadata.version + '?',
                'title': 'Update Available',
                "scope": $scope,
                "buttons": [
                  {
                    "text": 'NO',
                    "type": "button-dark button-outline",
                    "onTap": function (e) {
                      $rootScope.navigate("groups");
                    }
                  },
                  {
                    "text": 'YES',
                    "type": "button-dark",
                    "onTap": function (e) {

                      window.localStorage.setItem("versionNumber", metadata.version);
                      if (window.localStorage.getItem("versionNumber")) {
                        $rootScope.versionNumber = window.localStorage.getItem("versionNumber");
                      }

                      $cordovaFile.removeRecursively($scope.rootDir, "data")
                        .then(function (success) {

                          $ionicLoading.show({
                            template: "APP UPDATE ..."
                          });

                          installIonicUpdate();

                        }, function (error) {
                          console.log(error);
                          $rootScope.navigate("groups");
                        });
                    }
                  }
                ]
              });
            }, function (response) {
              console.log("callback meta 1 ", response);
              $rootScope.navigate("groups");
            }, function (response) {
              console.log("callback meta 2", response);
              $rootScope.navigate("groups");
            });

          } else {
            $rootScope.navigate("groups");
          }
        });
      }
    };

    var checkDownloadedSnapshotsAndDeleteUnused = function () {

      var snapshotsDownloaded = window.localStorage.getItem("snapshots");
      if (snapshotsDownloaded) {
        snapshotsDownloaded = JSON.parse(snapshotsDownloaded);
      }

      console.log("LocalStorage snapshots", snapshotsDownloaded);

      if (snapshotsDownloaded && !_.isEmpty(snapshotsDownloaded)) {

        $ionicDeploy.getSnapshots().then(function (snapshots) {
          // snapshots will be an array of snapshot uuids
          var newSnapshotsDownloaded = _.difference(snapshots, snapshotsDownloaded);
          console.log("newSnapshotsDownloaded", newSnapshotsDownloaded);

          if (newSnapshotsDownloaded && !_.isEmpty(newSnapshotsDownloaded)) {

            _.each(_.difference(snapshots, newSnapshotsDownloaded), function (snapshot) {
              console.log("deleting snapshots", snapshot);
              $ionicDeploy.deleteSnapshot(snapshot);
            });

          }

          $timeout(function () {
            $ionicDeploy.getSnapshots().then(function (snapshots) {
              console.log("snapshots", snapshots);
              if (snapshots && !_.isEmpty(snapshots)) {
                //Saving the already downloaded snapshots
                window.localStorage.setItem("snapshots", JSON.stringify(snapshots));
              }
            });
          }, 2000);

        });

      }
    };


    var installIonicUpdate = function () {

      $ionicDeploy.getSnapshots().then(function (snapshots) {

        // snapshots will be an array of snapshot uuids
        console.warn("snapshots", snapshots);
        if (snapshots && !_.isEmpty(snapshots)) {
          //Saving the already downloaded snapshots
          window.localStorage.setItem("snapshots", JSON.stringify(snapshots));
        }

        $ionicDeploy.download().then(function () {

          $ionicLoading.show({
            template: "INSTALLING APP UPDATE ..."
          });

          $ionicDeploy.extract().then(function () {
            $ionicLoading.show({
              template: "RESTARTING APP ..."
            });

            $ionicDeploy.load();
          });
        });
      });

    };
  });

angular.module("bookbuilder2")
  .controller("PreloadingController", function (_, $scope, $timeout, TypicalFunctions, Download, $interval, $ionicHistory, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading, $cordovaFile) {

    console.log("PreloadingController loaded!");

    $ionicPlatform.ready(function () {
      console.log("bookbuilder2 ready!");

      $scope.$on('$destroy', function () {
        $timeout.cancel(timeout);
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
      });

      if (window.cordova && window.cordova.platformId !== "browser") {

        window.plugins.insomnia.keepAwake();
        console.log("hide SplashScreen");
        navigator.splashscreen.hide();

        $scope.rootDir = window.cordova.file.dataDirectory;
        window.localStorage.setItem("rootDir", $scope.rootDir);
        console.log($scope.rootDir);

        var timeout = $timeout(function () {
          window.cordova.getAppVersion.getPackageName(function (name) {
            console.log(name);
            var TempGroup = name.split(".");

            window.cordova.getAppVersion.getVersionNumber(function (versionNumber) {
              console.log("config.xml", versionNumber);
              var savedVersionNumber = window.localStorage.getItem("versionNumber");
              if (savedVersionNumber && (savedVersionNumber.split(".")[0] + "_" + savedVersionNumber.split(".")[1] ) === (versionNumber.split(".")[0] + "_" + versionNumber.split(".")[1])) {
                console.log("savedVersionNumber", savedVersionNumber);
                $scope.versionNumber = window.localStorage.getItem("versionNumber");
              } else {
                window.localStorage.setItem("versionNumber", versionNumber);
                $scope.versionNumber = versionNumber;
              }

              if (TempGroup[2] === "enGrLikeEnglishB1") {
                $scope.cdnUrl = "http://" + TempGroup[2] + "-" + (versionNumber.split(".")[0] + "-" + versionNumber.split(".")[1]) + ".s3-website-eu-west-1.amazonaws.com/";
              } else {
                $scope.cdnUrl = "http://" + TempGroup[2] + ".s3-website-eu-west-1.amazonaws.com/";
              }
              window.localStorage.setItem("cdnUrl", $scope.cdnUrl);
              $scope.totalFiles = 100;
              $rootScope.downloading = 0;


              Download.checkDirOrCreate($scope.rootDir, "data", function (error) {

                if (error) {
                  console.log("Error checkDirOrCreate data directory");
                }

                Download.checkDirOrCreate($scope.rootDir + "data", "book", function (error) {

                  if (error) {
                    console.log("Error checkDirOrCreate json directory");
                  }


                  Download.assets(["assets.json", "groups.json"], $scope.rootDir, $scope.cdnUrl, "data", "book", function (response) {
                    console.log("response assets.json groups.json", response);
                    if (response) {

                      $http.get($scope.rootDir + "data/book/groups.json").success(function (book) {

                        $scope.book = book;
                        window.localStorage.setItem("book", JSON.stringify($scope.book));

                        $http.get($scope.rootDir + "data/book/assets.json").success(function (assets) {

                          $scope.totalFiles = 2 + assets.length;
                          $rootScope.downloading = 2;

                          Download.assets(assets, $scope.rootDir, $scope.cdnUrl, "data", "assets", function (response) {
                            console.log("response", response);
                            if (response) {

                              if (window.cordova && window.cordova.platformId !== "browser") {
                                $scope.deploy = new Ionic.Deploy();
                                var deployChannel = "v" + versionNumber.split(".")[0] + "_" + versionNumber.split(".")[1] + "_0";
                                console.log("deploy Channel", deployChannel);
                                var settings = new Ionic.IO.Settings();
                                $scope.developerMode = settings.get('dev_push');

                                console.log("DEVELOPER MODE ", $scope.developerMode);
                                if ($scope.developerMode) {

                                  console.warn("WE ARE IN DEVELOPER CHANNEL!!!");

                                  $scope.deploy.setChannel("dev");

                                  $scope.checkDeployInterval = $interval(function () {
                                    $scope.deploy.check().then(function (hasUpdate) {
                                      if (hasUpdate) {
                                        $interval.cancel($scope.checkDeployInterval);

                                        $ionicLoading.show({
                                          template: "DEVELOPER UPDATE ..."
                                        });

                                        $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "data")
                                          .then(function (success) {

                                            console.log("assets directory deleted!", success);
                                            $scope.deploy.update().then(function (res) {
                                              console.log('Ionic Deploy: Update Success! ', res);

                                            }, function (err) {
                                              console.log('Ionic Deploy: Update error! ', err);
                                              $ionicLoading.hide();
                                              $ionicHistory.nextViewOptions({
                                                historyRoot: true,
                                                disableBack: true
                                              });
                                              $state.go("groups", {}, {reload: true});
                                            }, function (prog) {
                                              console.log('Ionic Deploy: Progress... ', prog);
                                              $ionicLoading.show({
                                                template: "DEVELOPER UPDATE " + parseInt(prog) + "%"
                                              });
                                            });
                                          }, function (error) {
                                            console.log(error);
                                            $ionicHistory.nextViewOptions({
                                              historyRoot: true,
                                              disableBack: true
                                            });
                                            $state.go("groups", {}, {reload: true});
                                          });

                                      }
                                    });
                                  }, 8000, 0, true);

                                  $ionicHistory.nextViewOptions({
                                    historyRoot: true,
                                    disableBack: true
                                  });

                                  $state.go("groups", {}, {reload: true});

                                } else {
                                  console.warn("WE ARE IN PRODUCTION CHANNEL!!!", deployChannel);

                                  $scope.deploy.setChannel(deployChannel);

                                  $scope.deploy.check().then(function (hasUpdate) {
                                    if (hasUpdate) {


                                      $scope.deploy.getMetadata().then(function (metadata) {
                                        // metadata will be a JSON object
                                        console.log(metadata);
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
                                                $ionicHistory.nextViewOptions({
                                                  historyRoot: true,
                                                  disableBack: true
                                                });
                                                $state.go("groups", {}, {reload: true});
                                              }
                                            },
                                            {
                                              "text": 'YES',
                                              "type": "button-dark",
                                              "onTap": function (e) {

                                                window.localStorage.setItem("versionNumber", metadata.version);
                                                if (window.localStorage.getItem("versionNumber")) {
                                                  $scope.versionNumber = window.localStorage.getItem("versionNumber");
                                                }

                                                $ionicLoading.show({
                                                  template: "APP UPDATE ..."
                                                });

                                                $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "data")
                                                  .then(function (success) {

                                                    console.log("assets directory deleted!", success);
                                                    $scope.deploy.update().then(function (res) {
                                                      console.log('Ionic Deploy: Update Success! ', res);

                                                    }, function (err) {
                                                      console.log('Ionic Deploy: Update error! ', err);
                                                      $ionicLoading.hide();
                                                      $ionicHistory.nextViewOptions({
                                                        historyRoot: true,
                                                        disableBack: true
                                                      });
                                                      $state.go("groups", {}, {reload: true});
                                                    }, function (prog) {
                                                      console.log('Ionic Deploy: Progress... ', prog);
                                                      $ionicLoading.show({
                                                        template: "APP UPDATE " + parseInt(prog) + "%"
                                                      });
                                                    });
                                                  }, function (error) {
                                                    console.log(error);
                                                    $ionicHistory.nextViewOptions({
                                                      historyRoot: true,
                                                      disableBack: true
                                                    });
                                                    $state.go("groups", {}, {reload: true});
                                                  });
                                              }
                                            }
                                          ]
                                        });
                                      }, function (response) {
                                        console.log("callback meta 1 ", response);
                                        $ionicHistory.nextViewOptions({
                                          historyRoot: true,
                                          disableBack: true
                                        });
                                        $state.go("groups", {}, {reload: true});
                                      }, function (response) {
                                        console.log("callback meta 2", response);
                                        $ionicHistory.nextViewOptions({
                                          historyRoot: true,
                                          disableBack: true
                                        });
                                        $state.go("groups", {}, {reload: true});
                                      });

                                    } else {
                                      $ionicHistory.nextViewOptions({
                                        historyRoot: true,
                                        disableBack: true
                                      });
                                      $state.go("groups", {}, {reload: true});
                                    }
                                  });
                                }
                              } else {
                                $ionicHistory.nextViewOptions({
                                  historyRoot: true,
                                  disableBack: true
                                });
                                $state.go("groups", {}, {reload: true});
                              }

                            } else {
                              TypicalFunctions.showPopup();
                            }
                          });
                        });
                      });
                    } else {
                      TypicalFunctions.showPopup();
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

        $scope.rootDir = "https://s3-eu-west-1.amazonaws.com/engrenglish2/";
        window.localStorage.setItem("rootDir", $scope.rootDir);
        /*$state.go("groups");*/
        $ionicHistory.nextViewOptions({
          historyRoot: true,
          disableBack: true
        });
        $state.go("groups", {}, {reload: true});
      }
    });

  });

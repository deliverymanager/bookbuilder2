angular.module("bookbuilder2")
  .controller("PreloadingController", function (_, $scope, Download, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading, $cordovaFile) {

    console.log("PreloadingController loaded!");

    $rootScope.showPopup = function () {
      $ionicLoading.hide();
      var errorPopUp = $ionicPopup.alert({
        template: 'Please make sure your have a stable connection to the internet!',
        title: 'Connectivity Error!',
        okType: 'button-dark'
      });
      errorPopUp.then(function () {
        $state.go("groups");
      });
    };

    $ionicPlatform.ready(function () {
      console.log("bookbuilder2 ready!");

      if (window.cordova && window.cordova.platformId !== "browser") {

        window.plugins.insomnia.keepAwake();
        console.log("hide SplashScreen");
        navigator.splashscreen.hide();

        $rootScope.rootDir = window.cordova.file.dataDirectory;
        console.log($rootScope.rootDir);

        window.cordova.getAppVersion.getPackageName(function (name) {
          console.log(name);
          var TempGroup = name.split(".");

          window.cordova.getAppVersion.getVersionNumber(function (versionNumber) {
            if (window.localStorage.getItem("versionNumber")) {
              $rootScope.versionNumber = window.localStorage.getItem("versionNumber");
            } else {
              window.localStorage.setItem("versionNumber", versionNumber);
              $rootScope.versionNumber = versionNumber;
            }


            $http.get(window.cordova.file.applicationDirectory + "www/data/groups.json").success(function (book) {

              $rootScope.book = book;

              $http.get(window.cordova.file.applicationDirectory + "www/data/assets.json").success(function (assets) {

                //FIRST I NEED TO DOWNLOAD THE lesson.json and lessonassets.json for all the active lessons
                var waterfallFunctions = [];

                _.each($rootScope.book.lessonGroups, function (group, key, list) {

                  _.each(group.lessons, function (lesson, key, list) {

                    if (lesson.active) {
                      waterfallFunctions.push(function (waterfallCallback) {

                        Download.assets(["lesson.json", "lessonassets.json"], $rootScope.book.cdnUrl, "data/lessons", lesson.id, function (response) {
                          console.log(lesson.id + " downloaded basic lesson file lesson.json and lessonassets.json ", response);
                          waterfallCallback();
                        });
                      });
                    }
                  });
                });

                $rootScope.totalFiles = waterfallFunctions.length + assets.length;
                $rootScope.downloading = 0;

                async.waterfall(waterfallFunctions, function (err, response) {

                  Download.assets(assets, $rootScope.book.cdnUrl, "data", "assets", function (response) {
                    console.log("response", response);
                    if (response) {


                      $scope.deploy = new Ionic.Deploy();
                      //deploy.setChannel("dev");

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
                              "template": $rootScope.selectedLanguage === 'el' ? 'Να κατεβεί και να ενημερωθεί η συσκευή σας με τη νέα έκδοση της εφαρμογής μας;' : 'Download and install the new version ' + metadata.version + '?',
                              'title': $rootScope.selectedLanguage === 'el' ? 'Διαθέσιμη Ενημέρωση' : 'Update Available',
                              "scope": $scope,
                              "buttons": [
                                {
                                  "text": $rootScope.selectedLanguage === 'el' ? 'ΟΧΙ' : 'NO',
                                  "type": "button-dark button-outline",
                                  "onTap": function (e) {
                                    $state.go("groups");
                                  }
                                },
                                {
                                  "text": $rootScope.selectedLanguage === 'el' ? 'ΝΑΙ' : 'YES',
                                  "type": "button-dark",
                                  "onTap": function (e) {


                                    window.localStorage.setItem("versionNumber", metadata.version);
                                    if (window.localStorage.getItem("versionNumber")) {
                                      $rootScope.versionNumber = window.localStorage.getItem("versionNumber");
                                    }

                                    $ionicLoading.show({
                                      template: "Downloading ..."
                                    });

                                    $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "data")
                                      .then(function (success) {
                                        console.log("assets directory deleted!");
                                        $scope.deploy.update().then(function (res) {
                                          console.log('Ionic Deploy: Update Success! ', res);

                                        }, function (err) {
                                          console.log('Ionic Deploy: Update error! ', err);
                                          $ionicLoading.hide();
                                          $state.go("groups");
                                        }, function (prog) {
                                          console.log('Ionic Deploy: Progress... ', prog);
                                          $ionicLoading.show({
                                            template: "Downloading " + parseInt(prog) + "%"
                                          });
                                        });
                                      }, function (error) {
                                        console.log(error);
                                        $state.go("groups");
                                      });
                                  }
                                }
                              ]
                            });
                          }, function (response) {
                            console.log("callback meta 1 ", response);
                            $state.go("groups");
                          }, function (response) {
                            console.log("callback meta 2", response);
                            $state.go("groups");
                          });
                        } else {
                          $state.go("groups");
                        }
                      }, function (error) {
                        console.log(error);
                        $state.go("groups");
                      });
                    } else {
                      $rootScope.showPopup();
                    }
                  });
                });
              });
            });
          });
        }, function (error) {
          console.log(error);
        });
      } else {
        $rootScope.rootDir = "";
        $state.go("groups");
      }
    });

  });

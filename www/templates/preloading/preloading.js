angular.module("bookbuilder2")
  .controller("PreloadingController", function ($scope, Download, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading) {

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

        window.cordova.getAppVersion.getPackageName(function (name) {
          console.log(name);
          var TempGroup = name.split(".");

          window.cordova.getAppVersion.getVersionNumber(function (versionNumber) {
            $rootScope.versionNumber = versionNumber;

            $http.get(window.cordova.file.applicationDirectory + "www/data/groups.json").success(function (book) {
              $http.get(window.cordova.file.applicationDirectory + "www/data/assets.json").success(function (assets) {


                Download.assets(assets, book.cdnUrl, function (response) {
                  console.log("response", response);
                  if (response) {


                    $scope.deploy = new Ionic.Deploy();
                    //deploy.setChannel("dev");

                    $scope.deploy.info().then(function (deployInfo) {
                      // deployInfo will be a JSON object that contains
                      // information relating to the latest update deployed
                      // on the device

                      console.log(deployInfo);
                    }, function (response) {
                      console.log("callback 1 ", response);
                    }, function (response) {
                      console.log("callback 2", response);
                    });

                    $scope.deploy.check().then(function (hasUpdate) {

                      if (hasUpdate) {

                        $scope.popupRegisterVar = $ionicPopup.show({
                          "template": $rootScope.selectedLanguage === 'el' ? 'Να κατεβεί και να ενημερωθεί η συσκευή σας με τη νέα έκδοση της εφαρμογής μας;' : 'Download and install the new version?',
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

                                $ionicLoading.show({
                                  template: "Downloading ..."
                                });

                                $scope.deploy.update().then(function (res) {
                                  console.log('Ionic Deploy: Update Success! ', res);

                                  $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "assets")
                                    .then(function (success) {
                                      console.log("assets directory deleted!");
                                    }, function (error) {
                                      console.log(error);
                                    });

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
                              }
                            }
                          ]
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
        }, function (error) {
          console.log(error);
        });

      } else {
        $state.go("groups");
      }

    });

  });

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
        $state.go($rootScope.book.bookTemplate);
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

            $rootScope.cdnUrl = "http://" + TempGroup[2] + ".s3-website-eu-west-1.amazonaws.com/";
            console.log(cdnUrl);
            $rootScope.totalFiles = 100;
            $rootScope.downloading = 0;

            Download.assets(["assets.json", "groups.json"], $rootScope.cdnUrl, "data", "book", function (response) {
              console.log("response assets.json groups.json", response);
              if (response) {

                $http.get($rootScope.rootDir + "data/book/groups.json").success(function (book) {

                  $rootScope.book = book;

                  $http.get($rootScope.rootDir + "data/book/assets.json").success(function (assets) {

                    $rootScope.totalFiles = 2 + assets.length;
                    $rootScope.downloading = 2;

                    Download.assets(assets, $rootScope.cdnUrl, "data", "assets", function (response) {
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
                                "template": 'Download and install the new version ' + metadata.version + '?',
                                'title': 'Update Available',
                                "scope": $scope,
                                "buttons": [
                                  {
                                    "text": 'NO',
                                    "type": "button-dark button-outline",
                                    "onTap": function (e) {
                                      $state.go($rootScope.book.bookTemplate);
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
                                            $state.go($rootScope.book.bookTemplate);
                                          }, function (prog) {
                                            console.log('Ionic Deploy: Progress... ', prog);
                                            $ionicLoading.show({
                                              template: "Downloading " + parseInt(prog) + "%"
                                            });
                                          });
                                        }, function (error) {
                                          console.log(error);
                                          $state.go($rootScope.book.bookTemplate);
                                        });
                                    }
                                  }
                                ]
                              });
                            }, function (response) {
                              console.log("callback meta 1 ", response);
                              $state.go($rootScope.book.bookTemplate);
                            }, function (response) {
                              console.log("callback meta 2", response);
                              $state.go($rootScope.book.bookTemplate);
                            });
                          } else {
                            $state.go($rootScope.book.bookTemplate);
                          }
                        }, function (error) {
                          console.log(error);
                          $state.go($rootScope.book.bookTemplate);
                        });
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
        }, function (error) {
          console.log(error);
        });
      } else {
        $rootScope.rootDir = "";
        /*$state.go($rootScope.book.bookTemplate);*/
        $state.go("groups");
      }
    });

  });

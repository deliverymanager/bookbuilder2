angular.module("bookbuilder2")
  .controller("PreloadingController", function ($scope, Download, $ionicPlatform, $ionicPopup, $rootScope, $http, $state, $ionicLoading) {

    console.log("PreloadingController loaded!");

    $rootScope.showPopup = function () {
      $ionicLoading.hide();
      $ionicPopup.alert({
        template: 'Please make sure your have a stable connection to the internet!',
        title: 'Connectivity Error!',
        okType: 'button-dark'
      });
    };

    $ionicPlatform.ready(function () {


      console.log("bookbuilder2 ready!");

      if (window.cordova && window.cordova.platformId !== "browser") {

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
                    $state.go("groups");
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

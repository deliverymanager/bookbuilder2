angular.module("bookbuilder2")
  .factory("Email",
    function EmailFactory($http, $httpParamSerializer) {
      return {
        send: function (data) {
          var params = $httpParamSerializer(data);

          return $http({
            method: 'POST',
            timeout: 20000,
            url: 'http://www.supercourse.gr/ibook_mail/email.php',
            data: params,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        }
      };
    }
  )
  .factory("Download",
    function DownloadFactory(_, $cordovaFile, $rootScope, $cordovaFileTransfer) {
      return {
        assets: function (assetsArray, cdnUrl, callback) {

          var checkFileAndDownload = function (prefolder, folder, file, cdnUrl, callback) {

            $cordovaFile.checkFile(window.cordova.file.dataDirectory + prefolder + "/" + folder + "/", file)
              .then(function (success) {
                callback(true);
              }, function (error) {
                $cordovaFileTransfer.download(cdnUrl + prefolder + "/" + folder + "/" + file, window.cordova.file.dataDirectory + prefolder + "/" + folder + "/" + file, {}, true)
                  .then(function (result) {
                    callback(true);
                  }, function (error) {
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

                checkFileAndDownload("data", "assets", fileName, cdnUrl, function (callbackResponse) {

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

            $rootScope.totalFiles = seriesFunctions.length;
            console.log("$rootScope.totalFiles", $rootScope.totalFiles);
            $rootScope.downloading = 0;

            async.parallelLimit(seriesFunctions, 5, function (err, response) {
              console.log("Downloading FINISHED!!!");
              if (err) {
                return callback(false);
              } else {
                return callback(true);
              }
            });
          } else {
            return callback(true);
          }
        }
      };
    }
  )
  .factory('Toast', function ($rootScope, $timeout, $ionicLoading) {
    return {
      show: function (message, duration, position) {
        message = message || "There was a problem...";
        duration = duration || 'short';
        position = position || 'center';

        if (window.cordova && window.cordova.platformId == "browser") {
          // Use the Cordova Toast plugin

          if (duration == 'short') {
            duration = 1500;
          } else {
            duration = 3000;
          }

          $ionicLoading.show({
            template: message,
            duration: duration
          });

        } else if (window.cordova) {
          window.plugins.toast.show(message, duration, position);
        }
      }
    };
  })
  .factory("_",
    function uFactory() {
      return window._;
    });


angular.module('bookbuilder2')
  .controller("VideoWithSubsController", function ($scope, $ionicLoading, $rootScope, $timeout, $interval, _, $sce, $http, $ionicPlatform, $cordovaFile) {

      $scope.book = JSON.parse(window.localStorage.getItem("book"));
      $scope.rootDir = window.localStorage.getItem("rootDir");
      $scope.scale = window.localStorage.getItem("scale");
      $scope.ratio = window.localStorage.getItem("ratio");
      $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
      $scope.activityFolder = window.localStorage.getItem("activityFolder");

      $scope.data = {
        "showBackButton": true,
        "gameCompleted": false
      };

      console.log("$scope.rootDir", $scope.rootDir);
      console.log("$scope.scale", $scope.scale);
      console.log("$scope.selectedLesson", $scope.selectedLesson);
      console.log("$scope.activityFolder", $scope.activityFolder);

      $scope.backgroundView = {
        "background": "url(" + $scope.rootDir + "data/assets/lesson_background_image.png) no-repeat center top",
        "-webkit-background-size": "cover",
        "-moz-background-size": "cover",
        "background-size": "cover"
      };

      $scope.color = 'lightgrey';

      $scope.interface = {
        showDialogs: true,
        showFooter: false
      };

      if (ionic.Platform.isAndroid()) {
        $scope.interface.showFooter = true;
      }

      Number.prototype.toHHMMSS = function () {
        //var hours = Math.floor(this / 3600) < 10 ? ("00" + Math.floor(this / 3600)).slice(-2) : Math.floor(this / 3600);
        var minutes = ("00" + Math.floor((this % 3600) / 60)).slice(-2);
        var seconds = ("00" + (this % 3600) % 60).slice(-2);
        return minutes + ":" + seconds + ".000";
      };

      var activityNameInLocalStorage = $scope.selectedLesson.id + "_" + $scope.activityFolder;

      if (window.localStorage.getItem(activityNameInLocalStorage)) {
        $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
      } else {
        $scope.activityData = {
          attempts: 0
        };
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      }

      $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/' + $scope.activityFolder + '.json')
        .success(function (response) {

          $scope.videoData = response;

          $timeout(function () {
            $ionicLoading.hide();
            if (ionic.Platform.isAndroid()) {

              $scope.config = {
                sources: [{
                  src: $sce.trustAsResourceUrl($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/' + $scope.activityFolder + '.mp4'),
                  type: "video/mp4"
                }],
                autohide: true,
                vgAutohideTime: 2000,
                theme: "lib/videogular-themes-default/videogular.css",
                plugins: {
                  poster: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/background_image_icon.png"
                }
              };
            } else {

              var data = "WEBVTT\n\n";
              _.each($scope.videoData.CuePoint, function (cue, key, list) {
                data += parseInt(parseInt(cue.Time) / 1000).toHHMMSS() + " --> " + parseInt((parseInt(cue.Parameters.Parameter[1].Value) + parseInt(cue.Time)) / 1000).toHHMMSS() + "\n" + cue.Name + "\n\n";
              });

              console.log(data);

              $cordovaFile.writeFile($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/', "video.vtt", data, true);

              $scope.config = {
                sources: [{
                  src: $sce.trustAsResourceUrl($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/' + $scope.activityFolder + '.mp4'),
                  type: "video/mp4"
                }],
                tracks: [{
                  src: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/video.vtt',
                  kind: "subtitles",
                  srclang: "en",
                  label: "English",
                  default: true
                }],
                theme: "lib/videogular-themes-default/videogular.css",
                plugins: {
                  poster: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/background_image_icon.png"
                }
              };
            }
          }, 500);
        });

      var playSoundIntervalPromise;
      $scope.$on('$destroy', function () {
        console.log("destroy called");
        if (playSoundIntervalPromise) {
          $interval.cancel(playSoundIntervalPromise);
        }
      });

      $scope.updatedVideoState = function () {

        if ($scope.data.gameCompleted) {
          $scope.data.gameCompleted = false;

          $timeout(function () {
            $scope.data.showBackButton = true;
          });
        } else {
          $timeout(function () {
            $scope.data.showBackButton = !$scope.data.showBackButton;
          });

        }
        console.log("gameCompleted", $scope.data.gameCompleted);
        console.log("showBackButton", $scope.data.showBackButton);

      };


      $scope.completedActivity = function () {
        $scope.data.gameCompleted = true;
        console.log("Completed Activity!");
        $scope.activityData.completed = true;
        $scope.activityData.attempts += 1;
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      };

      $ionicPlatform.on('pause', function () {
        ionic.Platform.exitApp();
      });

      $scope.backButton = function () {

        if ($scope.book.bookTemplate === "groups") {
          $rootScope.navigate("lesson");
        } else {
          $rootScope.navigate("lessonNew");
        }
      };


      $scope.startVideoCheck = function (API) {

        $scope.API = API;
        console.log($scope.API);

        console.log("Video is Ready!");
        if (ionic.Platform.isAndroid()) {

          playSoundIntervalPromise = $interval(function () {
            console.log($scope.API.currentTime);
            var index = _.find($scope.videoData.CuePoint, function (cue) {
              return parseInt(cue.Time) < $scope.API.currentTime && (parseInt(cue.Time) + parseInt(cue.Parameters.Parameter[1].Value)) > $scope.API.currentTime;
            });
            if (index) {
              $timeout(function () {
                $scope.interface.subtitle = index.Name;
              });
            } else {
              $timeout(function () {
                $scope.interface.subtitle = "";
              });
            }
          }, 300, 0, true);
        }

      };


      $scope.toggleShowDialogs = function () {
        $timeout(function () {
          if ($scope.interface.showDialogs) {
            $scope.interface.showDialogs = false;
            $scope.color = '';
          } else {
            $scope.interface.showDialogs = true;
            $scope.color = 'lightgrey';
          }
        });
      };


    }
  );

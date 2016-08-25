angular.module('bookbuilder2')
  .controller("VideoController", function ($scope, $ionicLoading, $state, $timeout, $interval, _, $sce, $ionicPlatform, $http, $ionicHistory) {


      window.localStorage.setItem("currentView", $ionicHistory.currentView().stateName);
      $scope.rootDir = window.localStorage.getItem("rootDir");
      $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
      $scope.activityFolder = window.localStorage.getItem("activityFolder");

      $scope.backgroundView = {
        "background": "url(" + $scope.rootDir + "data/assets/lesson_background_image.png) no-repeat center top",
        "-webkit-background-size": "cover",
        "-moz-background-size": "cover",
        "background-size": "cover"
      };

      $scope.$on('$destroy', function () {
        $timeout.cancel(timeout);
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $scope.stage.removeAllEventListeners();
        $scope.stage.removeAllChildren();
        $scope.stage = null;
      });

      var activityNameInLocalStorage = $scope.selectedLesson.id + "_" + $scope.activityFolder;

      if (window.localStorage.getItem(activityNameInLocalStorage)) {
        $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
        $scope.activityData.attempts += 1;
      } else {
        $scope.activityData = {
          attempts: 1
        };
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      }

      var timeout = $timeout(function () {
        $scope.config = {
          sources: [{
            src: $sce.trustAsResourceUrl($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + '/' + $scope.activityFolder + '/' + $scope.activityFolder + '.mp4'),
            type: "video/mp4"
          }],
          theme: "lib/videogular-themes-default/videogular.css",
          plugins: {
            poster: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/background_image_icon.png"
          }
        };
      }, 1000);


      $scope.completedActivity = function () {
        console.log("Completed Activity!");
        $scope.activityData.completed = true;
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      };

      $ionicPlatform.on('pause', function () {
        ionic.Platform.exitApp();
      });

      $scope.backButton = function () {
        $ionicHistory.nextViewOptions({
          historyRoot: true,
          disableBack: true
        });
        $state.go("lessonNew", {}, {reload: true});
      }

    }
  );

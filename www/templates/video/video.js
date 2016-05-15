angular.module('bookbuilder2')
  .controller("VideoController", function (TypicalFunctions, $scope, $ionicLoading, $state, $timeout, $rootScope, $interval, _, $sce, $ionicPlatform, $http, $ionicHistory) {


      TypicalFunctions.loadVariablesFromLocalStorage();

      var activityNameInLocalStorage = $rootScope.selectedLesson.id + "_" + $rootScope.activityFolder;

      if (window.localStorage.getItem(activityNameInLocalStorage)) {
        $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
        $scope.activityData.attempts += 1;
      } else {
        $scope.activityData = {
          attempts: 1
        };
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      }

      $timeout(function () {
        $scope.config = {
          sources: [{
            src: $sce.trustAsResourceUrl($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + '/' + $rootScope.activityFolder + '/' + $rootScope.activityFolder + '.mp4'),
            type: "video/mp4"
          }],
          theme: "lib/videogular-themes-default/videogular.css",
          plugins: {
            poster: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/background_image_icon.png"
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
        $ionicHistory.clearCache();
        $state.go("lessonNew", {}, {reload: true});
      }

    }
  );

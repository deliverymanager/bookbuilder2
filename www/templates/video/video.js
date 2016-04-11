angular.module('bookbuilder2')
  .controller("VideoController", function ($scope, $ionicLoading, $state, $timeout, $rootScope, $interval, _, $sce) {

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
            src: $sce.trustAsResourceUrl($rootScope.rootDir + $rootScope.selectedLesson.id + '/' + $rootScope.activityFolder + '/' + $rootScope.activityFolder + '.mp4'),
            type: "video/mp4"
          }],
          theme: "lib/videogular-themes-default/videogular.css",
          plugins: {
            poster: $rootScope.rootDir + $rootScope.selectedLesson.id + "background_image_icon.png"
          }
        };
      }, 1000);


      function completedActivity() {
        console.log("Completed Activity!");
        $scope.nextButton.alpha = 1;
        $scope.checkButton.alpha = 0.5;
        $scope.activityData.completed = true;
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      };


      $ionicPlatform.on('pause', function () {
        ionic.Platform.exitApp();
      });

    }
  );

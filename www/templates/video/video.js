angular.module('bookbuilder2')
  .controller("VideoController", function ($scope, $ionicLoading, $rootScope, $timeout, $interval, _, $sce, $ionicPlatform) {

      $scope.book = JSON.parse(window.localStorage.getItem("book"));
      $scope.rootDir = window.localStorage.getItem("rootDir");
      $scope.scale = window.localStorage.getItem("scale");
      $scope.ratio = window.localStorage.getItem("ratio");
      $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
      $scope.activityFolder = window.localStorage.getItem("activityFolder");

      $scope.showBackButton = true;
      $scope.gameCompleted = false;

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

      var activityNameInLocalStorage = $scope.selectedLesson.id + "_" + $scope.activityFolder;

      if (window.localStorage.getItem(activityNameInLocalStorage)) {
        $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
      } else {
        $scope.activityData = {
          attempts: 0
        };
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      }

      $timeout(function () {
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

      $scope.updatedVideoState = function () {

        if ($scope.gameCompleted) {

          $scope.showBackButton = true;
          $scope.gameCompleted = false;

        } else {

          $scope.showBackButton = !$scope.showBackButton;

        }

        console.log("gameCompleted", $scope.gameCompleted);
        console.log("showBackButton", $scope.showBackButton);

      };


      $scope.completedActivity = function () {
        $scope.gameCompleted = true;
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
      }

    }
  );

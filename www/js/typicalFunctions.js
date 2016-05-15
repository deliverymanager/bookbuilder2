angular.module("bookbuilder2")
  .factory("TypicalFunctions",
    function TypicalFunctions($rootScope, $cordovaFile, $ionicLoading, $ionicPopup, $state, Download, Toast, $timeout, $http, _, $ionicHistory) {
      return {
        showPopup: function () {
          var self = this;

          $ionicLoading.hide();
          var errorPopUp = $ionicPopup.alert({
            template: 'Please make sure your have a stable connection to the internet!',
            title: 'Connectivity Error!',
            okType: 'button-dark'
          });
          errorPopUp.then(function () {
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $ionicHistory.clearCache();
            createjs.Tween.removeAllTweens();
            $scope.stage.removeAllEventListeners();
            $scope.stage.removeAllChildren();

            $state.go("groups", {}, {reload: true});
          });
        },
        loadVariablesFromLocalStorage: function () {
          var self = this;

          window.localStorage.setItem("currentView", $ionicHistory.currentView().stateName);
          console.warn($ionicHistory.currentView().stateName);

          if (window.cordova && window.cordova.platformId !== "browser") {
            $rootScope.rootDir = window.cordova.file.dataDirectory;
          } else {
            $rootScope.rootDir = "";
          }
          $rootScope.book = JSON.parse(window.localStorage.getItem("book"));
          $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
          $rootScope.selectedLessonId = window.localStorage.getItem("selectedLessonId");
          $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
          $rootScope.activityName = window.localStorage.getItem("activityName");

          $rootScope.scale = window.localStorage.getItem("scale");
          $rootScope.book = JSON.parse(window.localStorage.getItem("book"));
          $rootScope.ratio = window.localStorage.getItem("ratio");

          if (window.cordova && window.cordova.platformId !== "browser") {
            $rootScope.rootDir = window.cordova.file.dataDirectory;
          } else {
            $rootScope.rootDir = "";
          }

          $rootScope.backgroundView = {
            "background": "url(" + $rootScope.rootDir + "data/assets/lesson_background_image.png) no-repeat center top",
            "-webkit-background-size": "cover",
            "-moz-background-size": "cover",
            "background-size": "cover"
          };

          $ionicLoading.hide();
        },
        nextActivity: function () {
          var self = this;
          var index = _.findIndex($rootScope.selectedLesson.activitiesMenu, {
            "activityFolder": $rootScope.activityFolder
          });

          if (index < $rootScope.selectedLesson.activitiesMenu.length - 1) {
            $rootScope.activityFolder = $rootScope.selectedLesson.activitiesMenu[index + 1].activityFolder;
            $rootScope.activityName = $rootScope.selectedLesson.activitiesMenu[index + 1].name;
            window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
            window.localStorage.setItem("activityName", $rootScope.activityName);
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $ionicHistory.clearCache();
            $state.go($rootScope.selectedLesson.activitiesMenu[index + 1].activityTemplate, {}, {reload: true});
          } else {
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $ionicHistory.clearCache();
            $state.go("results", {}, {reload: true});
          }
        }

      };
    }
  );


angular.module("bookbuilder2")
  .factory("TypicalFunctions",
    function TypicalFunctions($rootScope, $cordovaFile, $ionicLoading, $ionicPopup, $state, Download, Toast, $timeout, $http, _, $ionicHistory) {
      return {
        showPopup: function () {
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
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $state.go("groups", {}, {reload: true});
          });
        },
        nextActivity: function (selectedLesson, activityFolder) {
          var index = _.findIndex(selectedLesson.activitiesMenu, {
            "activityFolder": activityFolder
          });

          if (index < selectedLesson.activitiesMenu.length - 1) {
            window.localStorage.setItem("activityFolder", selectedLesson.activitiesMenu[index + 1].activityFolder);
            window.localStorage.setItem("activityName", selectedLesson.activitiesMenu[index + 1].name);
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go(selectedLesson.activitiesMenu[index + 1].activityTemplate, {}, {reload: true});
          } else {
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go("results", {}, {reload: true});
          }
        }

      };
    }
  );


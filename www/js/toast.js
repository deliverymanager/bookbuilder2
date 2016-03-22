angular.module("bookbuilder2")
  .factory("Toast", function ToastFactory($timeout, $ionicLoading) {
      return {
        show: function (message, position, duration) {

          //position: 'top', 'center', 'bottom' , duration: 'short', 'long'
          if (!duration) {
            duration = "short";
          }

          if (position) {
            if (window.cordova && window.cordova.platformId === "browser") {
              $ionicLoading.hide();
              window.plugins.toast.showWithOptions({
                message: message,
                duration: duration,
                position: position
              });
            } else {
              $ionicLoading.show({
                template: message
              });

              $timeout(function () {
                $ionicLoading.hide();
              }, 1500);
            }
          } else {

            $ionicLoading.show({
              template: message
            });

            $timeout(function () {
              $ionicLoading.hide();
            }, 2000);
          }
        }
      };
    }
  );

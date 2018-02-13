angular.module("bookbuilder2")
  .factory("Email",
    function EmailFactory($http, $httpParamSerializer) {
      return {
        send: function (data) {
          var params = $httpParamSerializer(data);

          return $http({
            method: 'POST',
            timeout: 20000,
            url: 'http://www.supercourse.gr/ibook_mail/email1.php',
            data: params,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        }
      };
    }
  )
  .factory('Toast', function ($ionicLoading) {
    return {
      show: function (message, duration, position) {
        message = message || "There was a problem...";
        duration = duration || 'short';
        position = position || 'center';

        if (window.cordova && window.cordova.platformId === "browser") {
          // Use the Cordova Toast plugin

          if (duration === 'short') {
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



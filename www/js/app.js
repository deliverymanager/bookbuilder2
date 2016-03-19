// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('bookbuilder2', ['ionic', 'ionic.service.core', 'ionic-native-transitions', 'ngCordova'])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {

    /*Disabling transition animation*/
    $ionicConfigProvider.views.transition('none');

    $ionicNativeTransitionsProvider.setDefaultTransition({
      type: 'fade'
    });

    $ionicNativeTransitionsProvider.setDefaultBackTransition({
      type: 'fade'
    });

    $ionicConfigProvider.views.swipeBackEnabled(false);

    $stateProvider
      .state('preloading', {
        cache: false,
        url: "/preloading",
        templateUrl: "templates/preloading/preloading.html",
        controller: "PreloadingController"
      })
      .state('groups', {
        cache: false,
        url: "/groups",
        templateUrl: "templates/groups/groups.html",
        controller: "GroupsController"
      })
      .state('lesson', {
        cache: false,
        url: "/lesson",
        templateUrl: "templates/lesson/lesson.html",
        controller: "LessonController"
      })
      .state('results', {
        cache: false,
        url: "/results",
        templateUrl: "templates/results/results.html",
        controller: "ResultsController"
      });

    $urlRouterProvider.otherwise('/preloading');

  });

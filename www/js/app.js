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
      .state('groupsNew', {
        cache: false,
        url: "/groupsNew",
        templateUrl: "templates/groupsNew/groupsNew.html",
        controller: "GroupsNewController"
      })
      .state('lesson', {
        cache: false,
        url: "/lesson",
        templateUrl: "templates/lesson/lesson.html",
        controller: "LessonController"
      })
      .state('lessonNew', {
        cache: false,
        url: "/lessonNew",
        templateUrl: "templates/lessonNew/lessonNew.html",
        controller: "LessonNewController"
      })
      .state('vocabulary', {
        cache: false,
        url: "/vocabulary",
        templateUrl: "templates/vocabulary/vocabulary.html",
        controller: "VocabularyController"
      })
      .state('vocabularyNew', {
        cache: false,
        url: "/vocabularyNew",
        templateUrl: "templates/vocabularyNew/vocabularyNew.html",
        controller: "VocabularyNewController"
      })
      .state('reading', {
        cache: false,
        url: "/reading",
        templateUrl: "templates/reading/reading.html",
        controller: "ReadingController"
      }).state('readingNew', {
        cache: false,
        url: "/readingNew",
        templateUrl: "templates/readingNew/readingNew.html",
        controller: "ReadingNewController"
      })
      .state('multiple', {
        cache: false,
        url: "/multiple",
        templateUrl: "templates/multiple/multiple.html",
        controller: "MultipleController"
      })
      .state('draganddrop', {
        cache: false,
        url: "/draganddrop",
        templateUrl: "templates/draganddrop/draganddrop.html",
        controller: "DraganddropController"
      })
      .state('draganddropWall', {
        cache: false,
        url: "/draganddropWall",
        templateUrl: "templates/draganddrop/draganddropWall.html",
        controller: "DraganddropWallController"
      })

      .state('draganddropPark', {
        cache: false,
        url: "/draganddropPark",
        templateUrl: "templates/draganddrop/draganddropPark.html",
        controller: "DraganddropParkController"
      })
      .state('results', {
        cache: false,
        url: "/results",
        templateUrl: "templates/results/results.html",
        controller: "ResultsController"
      });

    $urlRouterProvider.otherwise('/preloading');

  });

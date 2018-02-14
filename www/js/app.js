// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('bookbuilder2', ['ionic', 'ngCordova', 'ngSanitize', 'com.2fdevs.videogular', 'com.2fdevs.videogular.plugins.controls', 'com.2fdevs.videogular.plugins.overlayplay', 'com.2fdevs.videogular.plugins.poster'])

  .run(function ($ionicPlatform, $timeout) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      $timeout(function () {
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.hide();
          console.warn("Status bar is visible", StatusBar.isVisible);
        }
      });

      Pro.init('73f4139a', {
        appVersion: '5.0.0'
      });
    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    /*Disabling transition animation*/
    $ionicConfigProvider.views.transition('none');

    $ionicConfigProvider.views.swipeBackEnabled(false);

    $ionicConfigProvider.views.maxCache(0);

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
      .state('vocabularyNewNoImages', {
        cache: false,
        url: "/vocabularyNewNoImages",
        templateUrl: "templates/vocabularyNewNoImages/vocabularyNewNoImages.html",
        controller: "VocabularyNewNoImagesController"
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
      .state('multipleSoccer', {
        cache: false,
        url: "/multipleSoccer",
        templateUrl: "templates/multiple/multipleSoccer.html",
        controller: "MultipleSoccerController"
      })
      .state('multipleGolf', {
        cache: false,
        url: "/multipleGolf",
        templateUrl: "templates/multiple/multipleGolf.html",
        controller: "MultipleGolfController"
      })
      .state('multipleUfo', {
        cache: false,
        url: "/multipleUfo",
        templateUrl: "templates/multiple/multipleUfo.html",
        controller: "MultipleUfoController"
      })
      .state('multipleSpray', {
        cache: false,
        url: "/multipleSpray",
        templateUrl: "templates/multiple/multipleSpray.html",
        controller: "MultipleSprayController"
      })
      .state('multipleSprayLargeButtons', {
        cache: false,
        url: "/multipleSprayLargeButtons",
        templateUrl: "templates/multiple/multipleSprayLargeButtons.html",
        controller: "MultipleSprayLargeButtonsController"
      })
      .state('multipleDoubleQuestions', {
        cache: false,
        url: "/multipleDoubleQuestions",
        templateUrl: "templates/multiple/multipleDoubleQuestions.html",
        controller: "MultipleDoubleQuestionsController"
      })
      .state('multipleSprayWithImage', {
        cache: false,
        url: "/multipleSprayWithImage",
        templateUrl: "templates/multiple/multipleSprayWithImage.html",
        controller: "MultipleSprayWithImageController"
      })
      .state('multipleBirds', {
        cache: false,
        url: "/multipleBirds",
        templateUrl: "templates/multiple/multipleBirds.html",
        controller: "MultipleBirdsController"
      })
      .state('multipleAnimals', {
        cache: false,
        url: "/multipleAnimals",
        templateUrl: "templates/multiple/multipleAnimals.html",
        controller: "MultipleAnimalsController"
      })
      .state('multipleFisherman', {
        cache: false,
        url: "/multipleFisherman",
        templateUrl: "templates/multiple/multipleFisherman.html",
        controller: "MultipleFishermanController"
      })
      .state('cryptoDiver', {
        cache: false,
        url: "/cryptoDiver",
        templateUrl: "templates/cryptoDiver/cryptoDiver.html",
        controller: "cryptoDiverController"
      })
      .state('cryptoWithImages', {
        cache: false,
        url: "/cryptoWithImages",
        templateUrl: "templates/cryptoWithImages/cryptoWithImages.html",
        controller: "CryptoWithImagesController"
      })
      .state('wizard', {
        cache: false,
        url: "/wizard",
        templateUrl: "templates/wizard/wizard.html",
        controller: "wizardController"
      })
      .state('bombs', {
        cache: false,
        url: "/bombs",
        templateUrl: "templates/bombs/bombs.html",
        controller: "bombsController"
      })
      .state('jars', {
        cache: false,
        url: "/jars",
        templateUrl: "templates/jars/jars.html",
        controller: "jarsController"
      })
      .state('chooseDucks', {
        cache: false,
        url: "/chooseDucks",
        templateUrl: "templates/chooseDucks/chooseDucks.html",
        controller: "chooseDucksController"
      })
      .state('chooseDarts', {
        cache: false,
        url: "/chooseDarts",
        templateUrl: "templates/chooseDarts/chooseDarts.html",
        controller: "chooseDartsController"
      })
      .state('education', {
        cache: false,
        url: "/education",
        templateUrl: "templates/education/education.html",
        controller: "educationController"
      })
      .state('correctIncorrect', {
        cache: false,
        url: "/correctIncorrect",
        templateUrl: "templates/correctIncorrect/correctIncorrect.html",
        controller: "correctIncorrectController"
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
      .state('draganddropWithPositions', {
        cache: false,
        url: "/draganddropWithPositions",
        templateUrl: "templates/draganddrop/draganddropWithPositions.html",
        controller: "DraganddropWithPositionsController"
      })
      .state('video', {
        cache: false,
        url: "/video",
        templateUrl: "templates/video/video.html",
        controller: "VideoController"
      })
      .state('videoWithSubs', {
        cache: false,
        url: "/videoWithSubs",
        templateUrl: "templates/videoWithSubs/videoWithSubs.html",
        controller: "VideoWithSubsController"
      })
      .state('results', {
        cache: false,
        url: "/results",
        templateUrl: "templates/results/results.html",
        controller: "ResultsController"
      })
      .state('wordlist', {
        cache: false,
        url: "/wordlist",
        templateUrl: "templates/wordlist/wordlist.html",
        controller: "WordlistController"
      });

    $urlRouterProvider.otherwise('/preloading');

  });

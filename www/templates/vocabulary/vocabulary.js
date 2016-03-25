angular.module("bookbuilder2")
  .controller("VocabularyController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("VocabularyController loaded!");

    $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("vocabularyCanvas"));
      var ctx = document.getElementById("vocabularyCanvas").getContext("2d");
      stage.canvas.height = window.innerHeight;
      stage.canvas.width = window.innerWidth;
      stage.enableDOMEvents(false);
      ctx.mozImageSmoothingEnabled = true;
      ctx.webkitImageSmoothingEnabled = true;
      ctx.msImageSmoothingEnabled = true;
      ctx.imageSmoothingEnabled = true;
      stage.regX = stage.width / 2;
      stage.regY = stage.height / 2;
      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable(stage);
      stage.enableMouseOver(0);
      stage.mouseMoveOutside = false;

      createjs.Ticker.framerate = 20;
      var handleTick = function () {
        $scope.fps = createjs.Ticker.getMeasuredFPS().toFixed(2);
        $scope.$apply();
        stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      //EVENTS THAT SHOULD BE USED TO CONTROL THE APP
      $scope.$on('$destroy', function () {
        console.log('destroy');
        createjs.Ticker.framerate = 0;

        _.each($scope.sounds, function (sound, key, list) {
          $scope.sounds[key].stop();
          $scope.sounds[key].release();
        });

      });

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
      });

      $ionicPlatform.on('resume', function () {
        console.log('resume');
        $timeout(function () {
          createjs.Ticker.framerate = 20;
        }, 2000);
      });

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

        /**** CALCULATING SCALING ****/
        var scaleY = stage.canvas.height / background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = stage.canvas.width / background.image.width;
        scaleX = scaleX.toFixed(2);
        var scale = 1;
        if (scaleX >= scaleY) {
          scale = scaleY;
        } else {
          scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR", scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = stage.canvas.width / 2;
        background.y = stage.canvas.height / 2;
        stage.addChild(background);
        stage.update();
        var backgroundPosition = background.getTransformedBounds();

        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              menuButton.gotoAndPlay("onSelection");
              stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              menuButton.gotoAndPlay("normal");
              $ionicHistory.goBack();
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            stage.addChild(menuButton);
            stage.update();


            $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/vocabulary.json")
              .success(function (vocabularyJson) {

                $scope.sounds = {};
                var assetPath = $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/";
                console.log("vocabularyJson", vocabularyJson);

                var waterFallFunctions = [];
                _.each(vocabularyJson, function (tabWords, tab, list) {
                  _.each(tabWords, function (word, key, list) {

                    waterFallFunctions.push(function (waterfallCallback) {
                      console.log("Sound", word);
                      if (ionic.Platform.isIOS() && window.cordova) {
                        console.log("Else iOS");
                        resolveLocalFileSystemURL(assetPath + word + ".mp3", function (entry) {
                          console.log(entry);
                          $scope.sounds[word] = new Media(entry.toInternalURL(), function () {
                            console.log("Sound success");
                          }, function (err) {
                            console.log("Sound error", err);
                          }, function (status) {
                            console.log("Sound status", status);
                          });
                          $timeout(function () {
                            waterfallCallback();
                          }, 100);
                        });
                      } else {
                        console.log("Else Android");
                        $scope.sounds[word] = new Media(assetPath + word + ".mp3", function () {
                          console.log("Sound success");
                        }, function (err) {
                          console.log("Sound error", err);
                        }, function (status) {
                          console.log("Sound status", status);
                        });

                        $timeout(function () {
                          waterfallCallback();
                        }, 100);

                      }

                    });
                  });
                });

                console.log(waterFallFunctions.length);
                async.waterfall(waterFallFunctions, function (err, response) {
                  console.log($scope.sounds);
                });


              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
              });//end of get menu button

          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button
      });//end of image on complete
    }, 500);//end of timeout
  });

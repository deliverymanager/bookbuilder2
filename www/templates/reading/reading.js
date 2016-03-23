angular.module("bookbuilder2")
  .controller("ReadingController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("ReadingController loaded!");

    $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("readingCanvas"));
      var ctx = document.getElementById("readingCanvas").getContext("2d");
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

            //Reassigning animations
            response.animations = {
              normal: 0,
              pressed: 1,
              tap: {
                frames: [1],
                next: "normal"
              }
            };

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              menuButton.gotoAndPlay("pressed");
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


            var assetsPath = "./assets/";
            var sounds = [{
              src: "MyAudioSprite.ogg", data: {
                audioSprite: [
                  {id: "sound1", startTime: 0, duration: 500},
                  {id: "sound2", startTime: 1000, duration: 400},
                  {id: "sound3", startTime: 1700, duration: 1000}
                ]
              }
            }
            ];
            createjs.Sound.alternateExtensions = ["mp3"];
            createjs.Sound.on("fileload", loadSound);
            createjs.Sound.registerSounds(sounds, assetsPath);
            // after load is complete
            createjs.Sound.play("sound2");

          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


      });//end of image on complete
    }, 500);//end of timeout
  });

angular.module("bookbuilder2")
  .controller("ReadingNewController", function ($scope, $interval, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("ReadingNewController loaded!");

    //START OF DEVELOPMENT SNIPPET
    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }
    $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
    $rootScope.activityName = window.localStorage.getItem("activityName");
    //END OF DEVELOPMENT SNIPPET

    $timeout(function () {

      var PIXEL_RATIO = (function () {
        var ctx = document.getElementById("canvas").getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        return dpr / bsr;
      })();
      var createHiDPICanvas = function (w, h, ratio) {
        if (!ratio) {
          ratio = PIXEL_RATIO;
        }
        console.log("ratio", PIXEL_RATIO);
        var can = document.getElementById("canvas");
        can.width = w * ratio;
        can.height = h * ratio;
        can.style.width = w + "px";
        can.style.height = h + "px";
        can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
        return can;
      };
      $scope.stage = new createjs.Stage(createHiDPICanvas(window.innerWidth, window.innerHeight));
      $scope.stage.enableDOMEvents(false);
      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable($scope.stage);
      $scope.stage.enableMouseOver(0);
      $scope.stage.mouseMoveOutside = false;

      createjs.Ticker.framerate = 20;
      var handleTick = function () {
        $scope.stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
        ionic.Platform.exitApp();
      });
      $ionicPlatform.on('resume', function () {
        createjs.Ticker.framerate = 20;
      });

      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/reading_background_image_blue.png"
      }));
      imageLoader.load();

      $scope.currentPage = 1;
      var activityNameInLocalStorage = $rootScope.selectedLesson.id + "_reading";

      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/reading_background_image_blue.png");

        /**** CALCULATING SCALING ****/
        var scaleY = $scope.stage.canvas.height / background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / background.image.width;
        scaleX = scaleX.toFixed(2);
        $scope.scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR", $scope.scale);

        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();


        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              menuButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              menuButton.gotoAndPlay("normal");
              $scope.stage.update();

              $interval.cancel($scope.playSoundIntervalPromise);
              _.each($scope.sounds, function (sound, key, list) {
                $scope.sounds[key].release();
              });
              $scope.sounds = {};
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;
            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        var init = function () {

          $scope.currentSoundPlaying = $scope.activityData.slides[0].slide;

          $scope.mainContainer = new createjs.Container();
          $scope.mainContainer.width = background.image.width;
          $scope.mainContainer.height = background.image.height;
          $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
          $scope.mainContainer.x = backgroundPosition.x;
          $scope.mainContainer.y = backgroundPosition.y;
          $scope.stage.addChild($scope.mainContainer);


          $http.get($rootScope.rootDir + "data/assets/reading_play_button_sprite.json")
            .success(function (response) {

              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var buttonPlaySpriteSheet = new createjs.SpriteSheet(response);
              $scope.playButton = new createjs.Sprite(buttonPlaySpriteSheet, "normal");

              $scope.playButton.addEventListener("mousedown", function (event) {
                $scope.playButton.gotoAndPlay("selected");
                $scope.stage.update();
              });

              $scope.playButton.addEventListener("pressup", function (event) {

                $scope.playButton.gotoAndPlay("normal");
                $scope.playButton.visible = false;
                $scope.pauseButton.visible = true;
                $scope.stopButton.visible = true;
                $scope.stage.update();

                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].play();

                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].soundPlaying = true;

              });
              $scope.playButton.scaleX = $scope.playButton.scaleY = 1.5;
              $scope.playButton.x = $scope.mainContainer.width / 2;
              $scope.playButton.y = 765;
              $scope.mainContainer.addChild($scope.playButton);
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button


          $http.get($rootScope.rootDir + "data/assets/reading_stop_button_sprite.json")
            .success(function (response) {

              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var buttonPlaySpriteSheet = new createjs.SpriteSheet(response);
              $scope.stopButton = new createjs.Sprite(buttonPlaySpriteSheet, "normal");
              $scope.stopButton.visible = false;

              $scope.stopButton.addEventListener("mousedown", function (event) {
                $scope.stopButton.gotoAndPlay("selected");
                $scope.stage.update();
              });

              $scope.stopButton.addEventListener("pressup", function (event) {

                $scope.stopButton.gotoAndPlay("normal");
                $scope.playButton.visible = true;
                $scope.pauseButton.visible = false;
                $scope.stopButton.visible = false;


                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].soundPlaying = false;

                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].stop();

                $scope.currentSoundPlaying = $scope.activityData.slides[0].slide;
                $scope.sounds[$scope.activityData.slides[0].slide].soundPlaying = false;

                _.each($scope.activityData.slides, function (slide, key, list) {
                  $scope.slides[slide.slide].visible = false;
                });
                $scope.slides[$scope.activityData.slides[0].slide].visible = true;
                $scope.stage.update();


              });
              $scope.stopButton.scaleX = $scope.stopButton.scaleY = 1.5;
              $scope.stopButton.x = $scope.mainContainer.width / 2 + 40;
              $scope.stopButton.y = 765;
              $scope.mainContainer.addChild($scope.stopButton);
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button


          $http.get($rootScope.rootDir + "data/assets/reading_pause_button_sprite.json")
            .success(function (response) {

              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var buttonPlaySpriteSheet = new createjs.SpriteSheet(response);
              $scope.pauseButton = new createjs.Sprite(buttonPlaySpriteSheet, "normal");
              $scope.pauseButton.visible = false;

              $scope.pauseButton.addEventListener("mousedown", function (event) {
                $scope.pauseButton.gotoAndPlay("selected");
                $scope.stage.update();
              });

              $scope.pauseButton.addEventListener("pressup", function (event) {

                $scope.pauseButton.gotoAndPlay("normal");
                $scope.playButton.visible = true;
                $scope.pauseButton.visible = false;
                $scope.stopButton.visible = false;
                $scope.stage.update();

                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].soundPlaying = false;

                $scope.sounds[$scope.activityData.slides[_.findIndex($scope.activityData.slides, {
                  "slide": $scope.currentSoundPlaying
                })].slide].pause();
              });

              $scope.pauseButton.scaleX = $scope.pauseButton.scaleY = 1.5;
              $scope.pauseButton.x = $scope.mainContainer.width / 2 - 40;
              $scope.pauseButton.y = 765;
              $scope.mainContainer.addChild($scope.pauseButton);
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button


          var parallelFunctions = [];

          _.each($scope.activityData.slides, function (slide, key, list) {

            parallelFunctions.push(function (parallelCallback) {

              var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/" + slide.slide + ".png"
              }));
              imageLoader.load();
              imageLoader.on("complete", function (r) {
                parallelCallback();
              });
            });

          });

          $scope.sounds = {};
          _.each($scope.activityData.slides, function (slide, key, list) {

            parallelFunctions.push(function (parallelCallback) {

              if (ionic.Platform.isIOS() && window.cordova) {
                resolveLocalFileSystemURL($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/" + slide.slide + ".mp3", function (entry) {
                  console.log(entry);
                  $scope.sounds[slide.slide] = new Media(entry.toInternalURL(), function () {
                    console.log("Sound success");
                  }, function (err) {
                    console.log("Sound error", err);
                  }, function (status) {
                    console.log("Sound status", status);
                  });
                  parallelCallback();
                });
              } else if (window.cordova) {
                $scope.sounds[slide.slide] = new Media($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/" + slide.slide + ".mp3", function () {
                  console.log("Sound success");
                }, function (err) {
                  console.log("Sound error", err);
                }, function (status) {
                  console.log("Sound status", status);
                });
                parallelCallback();
              } else {
                parallelCallback();
              }

            });

          });

          async.parallel(parallelFunctions, function (err, response) {

            console.log("Title: ", $rootScope.selectedLesson.title);
            var title = new createjs.Text($rootScope.selectedLesson.title, "27px Arial", "white");
            title.textAlign = "center";
            title.x = $scope.mainContainer.width / 2;
            title.y = 35;
            $scope.mainContainer.addChild(title);
            $scope.slides = {};

            console.log("$scope.activityData", $scope.activityData);
            _.each($scope.activityData.slides, function (slide, key, list) {
              console.log($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/" + slide.slide + ".png");
              $scope.slides[slide.slide] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/" + slide.slide + ".png");
              $scope.slides[slide.slide].x = $scope.mainContainer.width / 2;
              $scope.slides[slide.slide].y = $scope.mainContainer.height / 2;
              $scope.slides[slide.slide].regX = $scope.slides[slide.slide].image.width / 2;
              $scope.slides[slide.slide].regY = $scope.slides[slide.slide].image.height / 2;

              if (key) {
                $scope.slides[slide.slide].visible = false;
              }

              $scope.mainContainer.addChild($scope.slides[slide.slide]);
            });


            $scope.playSoundIntervalPromise = $interval(function () {
              console.log("Checking current sound!");
              _.each($scope.sounds, function (sound, key, list) {
                if (sound.soundPlaying) {
                  $scope.sounds[key].getCurrentPosition(
                    function (position) {
                      if (position < 0 && $scope.currentSoundPlaying) {
                        soundIsFinishedPlaying(key);
                      }
                    },
                    function (e) {

                      console.log("Error getting pos=" + e);

                    }
                  );
                }
              });

            }, 500, 0, true);


          });

        };

        function soundIsFinishedPlaying(slide) {

          $scope.sounds[slide].soundPlaying = false;

          console.log("Name: ", slide);

          var soundIndex = _.findIndex($scope.activityData.slides, {
            "slide": slide
          });

          if (soundIndex < $scope.activityData.slides.length - 1) {
            $scope.sounds[$scope.activityData.slides[soundIndex + 1].slide].soundPlaying = true;
            $scope.sounds[$scope.activityData.slides[soundIndex + 1].slide].play();

            _.each($scope.activityData.slides, function (slide, key, list) {
              $scope.slides[slide.slide].visible = false;
            });
            $scope.slides[$scope.activityData.slides[soundIndex + 1].slide].visible = true;
            $scope.currentSoundPlaying = $scope.activityData.slides[soundIndex + 1].slide;
          } else {
            $scope.playButton.visible = true;
            $scope.pauseButton.visible = false;
            $scope.stopButton.visible = false;
            _.each($scope.activityData.slides, function (slide, key, list) {
              $scope.slides[slide.slide].visible = false;
            });
            $scope.slides[$scope.activityData.slides[0].slide].visible = true;
          }

          $scope.stage.update();

        }


        if (window.localStorage.getItem(activityNameInLocalStorage)) {
          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));

          $scope.activityData.attempts = $scope.activityData.attempts + 1;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          init();

        } else {

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/reading.json")
            .success(function (readingJson) {

              $scope.activityData = readingJson;
              $scope.activityData.attempts = 1;
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
              init();
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button

        }

        var completedActivity = function () {
          console.log("completed activity!");
          $scope.activityData.completed = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };

      });//end of image on complete
    }, 1500);//end of timeout
  });

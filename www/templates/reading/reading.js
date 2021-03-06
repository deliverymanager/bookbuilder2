angular.module("bookbuilder2")
  .controller("ReadingController", function ($scope, $interval, $ionicPlatform, $rootScope, $timeout, $http, _) {

    console.log("ReadingController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));

    $scope.backgroundView = {
      "background": "url(" + $scope.rootDir + "data/assets/lesson_background_image.png) no-repeat center top",
      "-webkit-background-size": "cover",
      "-moz-background-size": "cover",
      "background-size": "cover"
    };


    $ionicPlatform.on('pause', function () {
      console.log('pause');
      createjs.Ticker.framerate = 0;
      ionic.Platform.exitApp();
    });
    $ionicPlatform.on('resume', function () {
      createjs.Ticker.framerate = 10;
    });

    $scope.$on('$destroy', function () {
      createjs.Ticker.removeEventListener("tick", handleTick);
      createjs.Tween.removeAllTweens();
      $timeout.cancel(timeout);
      $scope.stage.removeAllEventListeners();
      $scope.stage.removeAllChildren();
      $scope.stage = null;
    });

    var handleTick = function () {
      if ($scope.stage) {
        $scope.stage.update();
      }
    };


    var timeout = $timeout(function () {

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
      createjs.Ticker.addEventListener("tick", handleTick);

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/reading_background_image_blue.png"
      }));
      imageLoader.load();

      $scope.currentPage = 1;
      var activityNameInLocalStorage = $scope.selectedLesson.id + "_reading";

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/reading_background_image_blue.png");

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
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();

        $http.get($scope.rootDir + "data/assets/reading_play_button_sprite.json")
          .success(function (response) {

            $scope.playing = false;

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
            var buttonPlaySpriteSheet = new createjs.SpriteSheet(response);
            $scope.playButton = new createjs.Sprite(buttonPlaySpriteSheet, "playNormal");

            $scope.playButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");

              if ($scope.playing) {
                $scope.playButton.gotoAndPlay("pauseOnSelection");
              } else {
                $scope.playButton.gotoAndPlay("playOnSelection");
              }
              $scope.stage.update();
            });

            $scope.playButton.addEventListener("pressup", function (event) {
              console.log("pressup event Play", $scope.playing);

              if ($scope.playing) {
                $scope.playButton.gotoAndPlay("playNormal");
                $scope.playing = false;
                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sound.pause();
                }
              } else {
                $scope.playButton.gotoAndPlay("pauseNormal");
                $timeout(function () {
                  $scope.playing = true;
                }, 500);

                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sound.play();
                }
              }
              $scope.stage.update();
            });

            $scope.playButton.scaleX = $scope.playButton.scaleY = $scope.scale;
            $scope.playButton.x = backgroundPosition.x + (backgroundPosition.width / 1.13);
            $scope.playButton.y = backgroundPosition.y + (backgroundPosition.height / 1.09);
            $scope.stage.addChild($scope.playButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

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
              $scope.sound.stop();
              $scope.sound.release();
              $interval.cancel($scope.playSoundIntervalPromise);
              $rootScope.navigate("lesson");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;
            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        var init = function () {
          console.log("Title: ", $scope.selectedLesson.title);
          var title = new createjs.Text($scope.selectedLesson.title, "27px Arial", "white");

          /*background.scaleX = background.scaleY = $scope.scale;*/
          title.scaleX = title.scaleY = $scope.scale;
          title.x = backgroundPosition.x + (backgroundPosition.width / 10);
          title.y = backgroundPosition.y + (backgroundPosition.height / 16);
          title.textBaseline = "alphabetic";
          $scope.stage.addChild(title);

          $scope.pageImageLoader = {};
          $scope.pages = {};

          _.each($scope.activityData.CuePoint, function (page, key, list) {

            $scope.activityData.CuePoint[key].Time = parseInt($scope.activityData.CuePoint[key].Time);

            $scope.pageImageLoader["reading_book_" + (key + 1)] = new createjs.ImageLoader(new createjs.LoadItem().set({
              src: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/reading/reading_book_" + (key + 1) + ".png"
            }));

            $scope.pageImageLoader["reading_book_" + (key + 1)].load();

            $scope.pageImageLoader["reading_book_" + (key + 1)].on("complete", function (r) {
              $scope.pages["reading_book_" + (key + 1)] = new createjs.Bitmap($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/reading/reading_book_" + (key + 1) + ".png");

              $scope.pages["reading_book_" + (key + 1)].scaleX = $scope.pages["reading_book_" + (key + 1)].scaleY = $scope.scale;
              $scope.pages["reading_book_" + (key + 1)].x = backgroundPosition.x + (backgroundPosition.width / 7);
              $scope.pages["reading_book_" + (key + 1)].y = backgroundPosition.y + (backgroundPosition.height / 6);

              if (key) {
                $scope.pages["reading_book_" + (key + 1)].visible = false;
              }

              $scope.stage.addChild($scope.pages["reading_book_" + (key + 1)]);

            });

          });


          var assetPath = $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/reading/";
          if (ionic.Platform.isIOS() && window.cordova) {
            resolveLocalFileSystemURL(assetPath + "reading.mp3", function (entry) {
              console.log(entry);
              $scope.sound = new Media(entry.toInternalURL(), function () {
                console.log("Sound success");
              }, function (err) {
                console.log("Sound error", err);
              }, function (status) {
                console.log("Sound status", status);
              });
            });
          } else {
            $scope.sound = new Media(assetPath + "reading.mp3", function () {
              console.log("Sound success");
            }, function (err) {
              console.log("Sound error", err);
            }, function (status) {
              console.log("Sound status", status);
            });
          }

          $scope.playSoundIntervalPromise = $interval(function () {

            if ($scope.playing) {
              $scope.sound.getCurrentPosition(
                // success callback
                function (position) {
                  console.log(position);
                  if (position >= 0) {
                    checkCurrentTimePage(position);
                  } else {
                    $scope.playing = false;
                    $scope.playButton.gotoAndPlay("playNormal");
                    $scope.sound.stop();
                    $scope.activityData.completed = true;
                    $scope.activityData.attempts = $scope.activityData.attempts + 1;
                    window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                    $scope.stage.update();
                    console.log("completed activity!");

                    _.each($scope.activityData.CuePoint, function (page, key, list) {
                      $scope.pages["reading_book_" + (key + 1)].visible = false;
                    });


                    $scope.pages["reading_book_1"].visible = true;
                    $scope.currentPage = 1;

                  }

                },
                // error callback
                function (e) {
                  console.log("Error getting pos=" + e);
                }
              );
            }

          }, 100, 0, true);
        };

        if (window.localStorage.getItem(activityNameInLocalStorage)) {
          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          init();

        } else {

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/reading/reading.json")
            .success(function (readingJson) {

              $scope.activityData = readingJson;
              $scope.activityData.attempts = 0;
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
              init();
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button

        }

        var checkCurrentTimePage = function (currentTime) {

          var cue = _.find(_.sortBy($scope.activityData.CuePoint, 'Time').reverse(), function (cue) {
            return parseInt(cue.Time) < currentTime * 1000;
          });

          if (cue) {

            _.each($scope.activityData.CuePoint, function (page, key, list) {
              $scope.pages["reading_book_" + (key + 1)].visible = false;
            });

            $scope.currentPage = parseInt(cue.Name);
            $scope.pages["reading_book_" + cue.Name].visible = true;
          }

        };
      });//end of image on complete
    }, 1500);//end of timeout
  });

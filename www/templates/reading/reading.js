angular.module("bookbuilder2")
  .controller("ReadingController", function ($scope, $interval, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("ReadingController loaded!");

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
        $scope.$apply();
        $scope.stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      //EVENTS THAT SHOULD BE USED TO CONTROL THE APP
      $scope.$on('$destroy', function () {
        console.log('destroy');
        createjs.Ticker.framerate = 0;
        $scope.sound.stop();
        $scope.sound.release();
        $interval.cancel($scope.playSoundIntervalPromise);
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
        src: $rootScope.rootDir + "data/assets/reading_background_image_blue.png"
      }));
      imageLoader.load();

      $scope.currentPage = 1;
      var activityNameInLocalStorage = $rootScope.selectedLesson.id + "_reading";

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/reading_background_image_blue.png");

        /**** CALCULATING SCALING ****/
        var scaleY = $scope.stage.canvas.height / background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / background.image.width;
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
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        $scope.stage.update();
        var backgroundPosition = background.getTransformedBounds();
        console.log("backgroundPosition", backgroundPosition);


        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($rootScope.rootDir + "data/assets/reading_play_button_sprite.json")
          .success(function (response) {

            $scope.playing = false;

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var buttonPlaySpriteSheet = new createjs.SpriteSheet(response);
            var playButton = new createjs.Sprite(buttonPlaySpriteSheet, "playNormal");

            playButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");

              if ($scope.playing) {
                playButton.gotoAndPlay("pauseOnSelection");
              } else {
                playButton.gotoAndPlay("playOnSelection");
              }
              $scope.stage.update();
            });

            playButton.addEventListener("pressup", function (event) {
              console.log("pressup event Play", $scope.playing);

              if ($scope.playing) {
                playButton.gotoAndPlay("playNormal");
                $scope.playing = false;
                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sound.pause();
                }
              } else {
                playButton.gotoAndPlay("pauseNormal");
                $scope.playing = true;
                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sound.play();
                }
              }
            });

            playButton.scaleX = playButton.scaleY = scale;
            playButton.x = backgroundPosition.x + (backgroundPosition.width / 1.13);
            playButton.y = backgroundPosition.y + (backgroundPosition.height / 1.09);

            $scope.stage.addChild(playButton);
            $scope.stage.update();
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


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
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lesson", {}, { reload: true });
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
            $scope.stage.update();
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        var init = function () {
          console.log("Title: ", $rootScope.selectedLesson.title);
          var title = new createjs.Text($rootScope.selectedLesson.title, "27px Arial", "white");

          /*background.scaleX = background.scaleY = scale;*/
          title.scaleX = title.scaleY = scale;
          title.x = backgroundPosition.x + (backgroundPosition.width / 10);
          title.y = backgroundPosition.y + (backgroundPosition.height / 17);
          title.textBaseline = "alphabetic";

          $scope.stage.addChild(title);
          $scope.stage.update();

          $scope.pageImageLoader = {};
          $scope.pages = {};

          _.each($scope.activityData.CuePoint, function (page, key, list) {

            $scope.pageImageLoader["reading_book_" + (key + 1)] = new createjs.ImageLoader(new createjs.LoadItem().set({
              src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/reading_book_" + (key + 1) + ".png"
            }));

            $scope.pageImageLoader["reading_book_" + (key + 1)].load();

            $scope.pageImageLoader["reading_book_" + (key + 1)].on("complete", function (r) {
              $scope.pages["reading_book_" + (key + 1)] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/reading_book_" + (key + 1) + ".png");

              $scope.pages["reading_book_" + (key + 1)].scaleX = $scope.pages["reading_book_" + (key + 1)].scaleY = scale;
              $scope.pages["reading_book_" + (key + 1)].x = backgroundPosition.x + (backgroundPosition.width / 7);
              $scope.pages["reading_book_" + (key + 1)].y = backgroundPosition.y + (backgroundPosition.height / 6.5);

              if (key) {
                $scope.pages["reading_book_" + (key + 1)].visible = false;
              }

              $scope.stage.addChild($scope.pages["reading_book_" + (key + 1)]);

            });
          });


          var assetPath = $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/reading/";
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

            $scope.sound.getCurrentPosition(
              // success callback
              function (position) {
                //console.log(position);
                if (position > 0) {
                  checkCurrentTimePage(position);
                }

              },
              // error callback
              function (e) {
                console.log("Error getting pos=" + e);
              }
            );
          }, 100, 0, true);
        };

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
          $scope.activityData.completed = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };


        var checkCurrentTimePage = function (currentTime) {
          var cue = _.find($scope.activityData.CuePoint, function (cue) {
            return parseInt(cue.Time) < currentTime * 1000 && $scope.currentPage + 1 === parseInt(cue.Name);
          });

          if (!cue || $scope.currentPage === parseInt(cue.Name)) {
            return;
          }

          console.log("cue", cue.Name);
          _.each($scope.activityData.CuePoint, function (page, key, list) {
            $scope.pages["reading_book_" + (key + 1)].visible = false;
          });

          if (!cue) {
            $scope.pages["reading_book_1"].visible = true;
            $scope.currentPage = 1;
          } else {
            $scope.currentPage = parseInt(cue.Name);
            $scope.pages["reading_book_" + cue.Name].visible = true;

            if (parseInt(cue.Name) === $scope.activityData.CuePoint.length) {
              completedActivity();
            }
          }
        };
      });//end of image on complete
    }, 500);//end of timeout
  });

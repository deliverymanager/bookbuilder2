angular.module("bookbuilder2")
  .controller("LessonController", function ($scope, $ionicPlatform, $timeout, $rootScope, $http, $state, $ionicHistory) {

    console.log("LessonController loaded!");

    $rootScope.backgroundView = {
      "background": "url(" + $rootScope.rootDir + "data/assets/background_image_1_purple.png) no-repeat center top",
      "-webkit-background-size": "cover",
      "-moz-background-size": "cover",
      "background-size": "cover"
    };

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

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
        ionic.Platform.exitApp();
      });
      $ionicPlatform.on('resume', function () {
        createjs.Ticker.framerate = 20;
      });

      var bitmapLoaders = {};

      async.waterfall([function (waterfallCallback) {

        if (bitmapLoaders["lesson_menu_background_image_2_blue"] && bitmapLoaders["lesson_menu_background_image_2_blue"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["lesson_menu_background_image_2_blue"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png"
          }));

          bitmapLoaders["lesson_menu_background_image_2_blue"].load();

          bitmapLoaders["lesson_menu_background_image_2_blue"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        $scope.background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");
        var scaleY = $scope.stage.canvas.height / $scope.background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / $scope.background.image.width;
        scaleX = scaleX.toFixed(2);
        $scope.scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        $scope.background.scaleX = $scope.scale;
        $scope.background.scaleY = $scope.scale;
        $scope.background.regX = $scope.background.image.width / 2;
        $scope.background.regY = $scope.background.image.height / 2;
        $scope.background.x = $scope.stage.canvas.width / 2;
        $scope.background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild($scope.background);
        $scope.backgroundPosition = $scope.background.getTransformedBounds();
        console.log("$scope.backgroundPosition", $scope.backgroundPosition);

        $scope.activitiesMenuContainer = new createjs.Container();
        $scope.activitiesMenuContainer.width = 240;
        $scope.activitiesMenuContainer.height = 450;
        $scope.activitiesMenuContainer.scaleX = $scope.activitiesMenuContainer.scaleY = $scope.scale;
        $scope.yPosition = 60;
        $scope.activitiesMenuContainer.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 24);
        $scope.activitiesMenuContainer.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 7);
        $scope.stage.addChild($scope.activitiesMenuContainer);

        waterfallCallback();

      }, function (waterfallCallback) {

        if (bitmapLoaders["head_menu_button_sprite"] && bitmapLoaders["head_menu_button_sprite"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["head_menu_button_sprite"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/head_menu_button_sprite.png"
          }));

          bitmapLoaders["head_menu_button_sprite"].load();

          bitmapLoaders["head_menu_button_sprite"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        if (bitmapLoaders["menu_reading_bubble_button_sprite"] && bitmapLoaders["menu_reading_bubble_button_sprite"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["menu_reading_bubble_button_sprite"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/menu_reading_bubble_button_sprite.png"
          }));

          bitmapLoaders["menu_reading_bubble_button_sprite"].load();

          bitmapLoaders["menu_reading_bubble_button_sprite"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        if (bitmapLoaders["menu_vocabulary_bubble_button_sprite"] && bitmapLoaders["menu_vocabulary_bubble_button_sprite"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["menu_vocabulary_bubble_button_sprite"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/menu_vocabulary_bubble_button_sprite.png"
          }));

          bitmapLoaders["menu_vocabulary_bubble_button_sprite"].load();

          bitmapLoaders["menu_vocabulary_bubble_button_sprite"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        if (bitmapLoaders["lesson_results_button_sprite"] && bitmapLoaders["lesson_results_button_sprite"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["lesson_results_button_sprite"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/lesson_results_button_sprite.png"
          }));

          bitmapLoaders["lesson_results_button_sprite"].load();

          bitmapLoaders["lesson_results_button_sprite"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        $http.get($rootScope.rootDir + 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json")
          .success(function (response) {
            $rootScope.selectedLesson = response;
            window.localStorage.setItem("selectedLesson", JSON.stringify($rootScope.selectedLesson));
            var lessonTitle = new createjs.Text(response.lessonTitle, "33px Arial", "white");
            lessonTitle.scaleX = lessonTitle.scaleY = $scope.scale;
            lessonTitle.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 10);
            lessonTitle.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 9.8);
            lessonTitle.rotation = -4;
            lessonTitle.textBaseline = "alphabetic";
            $scope.stage.addChild(lessonTitle);
            var title = new createjs.Text(response.title, "25px Arial", "white");
            title.scaleX = title.scaleY = $scope.scale;
            title.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 2.9);
            title.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 13);
            title.textBaseline = "alphabetic";
            $scope.stage.addChild(title);


            var waterfallFunctions = [];
            _.each($rootScope.selectedLesson.lessonMenu, function (activity, key, list) {

              waterfallFunctions.push(function (miniWaterfallCallback) {
                var spriteResourceUrlPng = activity.buttonFileName.split(".")[0];

                if (bitmapLoaders[spriteResourceUrlPng] && bitmapLoaders[spriteResourceUrlPng].loaded) {
                  miniWaterfallCallback();
                } else {
                  bitmapLoaders[spriteResourceUrlPng] = new createjs.ImageLoader(new createjs.LoadItem().set({
                    src: $rootScope.rootDir + "data/assets/" + spriteResourceUrlPng + ".png"
                  }));

                  bitmapLoaders[spriteResourceUrlPng].load();

                  bitmapLoaders[spriteResourceUrlPng].on("complete", function (r) {
                    $timeout(function () {
                      miniWaterfallCallback();
                    });
                  });
                }
              });
            });

            async.waterfall(waterfallFunctions, function (callback) {
              waterfallCallback();
            });

          })
          .error(function (error) {
            console.error("Error on getting json for the selected lesson...", error);
            waterfallCallback();
          });

      }, function (waterfallCallback) {

        var waterfallFunctions = [];
        _.each($rootScope.selectedLesson.lessonMenu, function (activity, key, list) {

          waterfallFunctions.push(function (miniWaterfallCallback) {

            $http.get($rootScope.rootDir + "data/assets/" + activity.buttonFileName)
              .success(function (response) {

                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                var activityButton = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                activityButton.activityFolder = activity.activityFolder;
                activityButton.activityName = activity.name;
                activityButton.activityTemplate = activity.activityTemplate;
                activityButton.y = $scope.yPosition;
                activityButton.x = -1500 * $scope.scale;

                createjs.Tween.get(activityButton, {loop: false}).wait($scope.yPosition)
                  .to({x: 20}, 500, createjs.Ease.getPowIn(2));
                $scope.yPosition += 75;

                activityButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a lesson button!");
                  activityButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                activityButton.addEventListener("pressup", function (event) {
                  console.log("pressup event on a lesson button !");
                  $rootScope.activityFolder = activityButton.activityFolder;
                  $rootScope.activityName = activityButton.activityName;

                  window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
                  window.localStorage.setItem("activityName", $rootScope.activityName);

                  console.log($rootScope.selectedLessonId);
                  console.log($rootScope.activityFolder);
                  $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                  });
                  $state.go(activityButton.activityTemplate, {}, {reload: true});
                });

                $scope.activitiesMenuContainer.addChild(activityButton);
                $timeout(function () {
                  miniWaterfallCallback();
                }, 100);

              }).error(function (error) {
              console.log("There was an error on getting lesson json");
              miniWaterfallCallback();
            })
          });
        });//end of _.each(selectedGroupLessons)

        async.waterfall(waterfallFunctions, function (callback) {
          console.log("Lessons Of a group are  Inserted!");
          waterfallCallback();
        });


      }], function (err, result) {
        /*Creating Bitmap Background for Canvas*/

        $http.get($rootScope.rootDir + "data/assets/menu_vocabulary_bubble_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var vocabularyButtonSpriteSheet = new createjs.SpriteSheet(response);
            var vocabularyButton = new createjs.Sprite(vocabularyButtonSpriteSheet, "normal");
            vocabularyButton.scaleX = vocabularyButton.scaleY = $scope.scale;
            vocabularyButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 2.8);
            vocabularyButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 5);
            vocabularyButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a lesson button!");
              vocabularyButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });
            vocabularyButton.addEventListener("pressup", function (event) {
              vocabularyButton.gotoAndPlay("normal");
              $scope.stage.update();
              console.log($rootScope.selectedLessonId);
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("vocabulary", {}, {reload: true});
            });
            $scope.stage.addChild(vocabularyButton);
          })
          .error(function (error) {
            console.error("Error on getting json for vocabulary button...", error);
          });

        /*-----------------------------------------READING BUTTON----------------------------------------*/
        $http.get($rootScope.rootDir + "data/assets/menu_reading_bubble_button_sprite.json")
          .success(function (response) {
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var readingButtonSpriteSheet = new createjs.SpriteSheet(response);
            var readingButton = new createjs.Sprite(readingButtonSpriteSheet, "normal");
            readingButton.scaleX = readingButton.scaleY = $scope.scale;
            readingButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 2.8);
            readingButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 2);

            readingButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a lesson button!");
              readingButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });
            readingButton.addEventListener("pressup", function (event) {
              readingButton.gotoAndPlay("normal");
              $scope.stage.update();
              console.log($rootScope.selectedLessonId);
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("reading");
            });
            $scope.stage.addChild(readingButton);
          })
          .error(function (error) {
            console.error("Error on getting json for reading button...", error);
          });


        /*-----------------------------------------RESULTS BUTTON----------------------------------------*/

        $http.get($rootScope.rootDir + "data/assets/lesson_results_button_sprite.json")
          .success(function (response) {
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
            var resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
            resultsButton.scaleX = resultsButton.scaleY = $scope.scale;
            resultsButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 6.5);
            resultsButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.1);
            $scope.stage.addChild(resultsButton);

            resultsButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              resultsButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });
            resultsButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              resultsButton.gotoAndPlay("normal");
              $scope.stage.update();
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("results", {}, {reload: true});
            });
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });


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
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              console.log("bitmapLoaders", bitmapLoaders);
              _.each(bitmapLoaders, function (image, key, list) {
                console.log(key);
                bitmapLoaders[key].destroy();
              });
              console.log("bitmapLoaders", bitmapLoaders);
              $state.go("groups");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;
            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button

      });

    }, 1500);
  })
;

angular.module("bookbuilder2")
  .controller("LessonNewController", function (_, $scope, $ionicPlatform, $timeout, $http, $rootScope, Toast) {

    console.log("LessonNewController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLessonId = window.localStorage.getItem("selectedLessonId");
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
      createjs.Ticker.framerate = 20;
    });

    $scope.$on('$destroy', function () {
      createjs.Ticker.removeEventListener("tick", handleTick);
      $timeout.cancel(timeout);
      createjs.Tween.removeAllTweens();
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
          window.localStorage.setItem("ratio", PIXEL_RATIO);
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
        src: $scope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();

      imageLoader.on("complete", function (r) {

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

        /*************** CALCULATING SCALING *********************/
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
        window.localStorage.setItem("scale", $scope.scale);
        console.log("GENERAL SCALING FACTOR", $scope.scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        background.alpha = 0;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();
        console.log("backgroundPosition", backgroundPosition);


        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        /*$scope.mainContainer.x = backgroundPosition.x + (backgroundPosition.width / 2);
         $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 2);*/
        $scope.stage.addChild($scope.mainContainer);

        //mainContainer Background
        /* var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
         var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
         mainContainerBackground.alpha = 0.5;

         $scope.mainContainer.addChild(mainContainerBackground);*/


        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

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
              $rootScope.navigate("groups");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
            $scope.stage.update();
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        /*-------------------------------------------ACTIVITIES MENU CONTAINER--------------------------------------*/
        $scope.activitiesMenuContainer = new createjs.Container();
        $scope.activitiesMenuContainer.width = 280;
        $scope.activitiesMenuContainer.height = 500;

        $scope.activitiesMenuContainer.x = 20;
        $scope.activitiesMenuContainer.y = 180;
        $scope.mainContainer.addChild($scope.activitiesMenuContainer);


        /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
        //Getting the right lesson json
        console.log($scope.selectedLessonId);

        $http.get($scope.rootDir + 'data/lessons/' + $scope.selectedLessonId + "/lesson.json")
          .success(function (response) {
            console.log("Success on getting json for the selected lesson! ---> ", response);

            //Assigning response to $scope.selectedLesson
            $scope.selectedLesson = response;
            console.log("Selected Lesson: ", $scope.selectedLesson);


            //FOR DEVELOPMENT
            window.localStorage.setItem("selectedLesson", JSON.stringify($scope.selectedLesson));


            var titleImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
              src: $scope.rootDir + "data/assets/lesson_background_image_2_blue.png"
            }));
            titleImageLoader.load();

            titleImageLoader.on("complete", function (r) {
              var titleImage = new createjs.Bitmap($scope.rootDir + "data/assets/lesson_background_image_2_blue.png");
              $scope.mainContainer.addChild(titleImage);

              var lessonTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "27px Arial", "white");
              lessonTitle.x = 490;
              lessonTitle.y = 105;
              lessonTitle.maxWidth = 450;
              $scope.mainContainer.addChild(lessonTitle);
            });


            var lessonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
              src: $scope.rootDir + "data/lessons/" + $scope.selectedLessonId + "/background_image_icon.png"
            }));
            lessonImageLoader.load();

            lessonImageLoader.on("complete", function (r) {

              var lessonImage = new createjs.Bitmap($scope.rootDir + "data/lessons/" + $scope.selectedLessonId + "/background_image_icon.png");
              lessonImage.scaleX = lessonImage.scaleY = 0.85;
              lessonImage.x = 320;
              lessonImage.y = 170;
              $scope.mainContainer.addChild(lessonImage);
            });


            /*-------------------------------- Populating Activities Menu -----------------------------------*/

            $scope.mainActivitiesButtons = {};

            var waterfallFunctions = [];
            _.each(response.lessonMenu, function (activity, key, list) {

              console.log("Creating a " + activity.activityTemplate + " button!");

              waterfallFunctions.push(
                function (waterfallCallback) {

                  $http.get($scope.rootDir + "data/assets/" + activity.buttonFileName)
                    .success(function (response) {

                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                      var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.mainActivitiesButtons[key] = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                      $scope.mainActivitiesButtons[key].activityFolder = activity.activityFolder;
                      $scope.mainActivitiesButtons[key].activityName = activity.name;
                      $scope.mainActivitiesButtons[key].activityTemplate = activity.activityTemplate;
                      $scope.mainActivitiesButtons[key].y = key * 60;
                      $scope.mainActivitiesButtons[key].x = -1500;

                      if (activity.activityTemplate !== "activities") {
                        $scope.mainActivitiesButtons[key].scaleX = $scope.mainActivitiesButtons[key].scaleY = 0.41;
                      }

                      /* -------------------------------- CLICK ON LESSON BUTTON -------------------------------- */
                      $scope.mainActivitiesButtons[key].addEventListener("mousedown", function (event) {
                        console.log("Mouse down event on a lesson button!");
                        $scope.mainActivitiesButtons[key].gotoAndPlay("onSelection");
                        $scope.stage.update();
                      });

                      //Creating navigation event for non activities button
                      if (activity.activityTemplate !== "activities") {
                        $scope.mainActivitiesButtons[key].addEventListener("pressup", function (event) {
                          console.log("Press up event on a lesson button !");
                          $scope.mainActivitiesButtons[key].gotoAndPlay("normal");
                          $scope.stage.update();

                          if (_.has(activity, 'active') && !activity.active) {
                            Toast.show("Coming soon...");
                            if (!$rootScope.developerMode) {
                              return;
                            }
                          }
                          $scope.activityFolder = $scope.mainActivitiesButtons[key].activityFolder;
                          $scope.activityName = $scope.mainActivitiesButtons[key].activityName;
                          $scope.activityTemplate = $scope.mainActivitiesButtons[key].activityTemplate;

                          window.localStorage.setItem("activityFolder", $scope.activityFolder);
                          window.localStorage.setItem("activityTemplate", $scope.activityTemplate);
                          window.localStorage.setItem("activityName", $scope.activityName);

                          $rootScope.navigate($scope.mainActivitiesButtons[key].activityTemplate);

                        });
                      }


                      //Checking if its activity button for adding a special event that creates the subMenu
                      if (activity.activityTemplate === "activities") {
                        $scope.mainActivitiesButtons[key].addEventListener("pressup", function (event) {
                          console.log("Press up event on Activities button !");
                          $scope.mainActivitiesButtons[key].gotoAndPlay("normal");
                          $scope.stage.update();
                          showingActivitiesSubMenu();
                        });
                      }

                      $scope.activitiesMenuContainer.addChild($scope.mainActivitiesButtons[key]);

                      createjs.Tween.get($scope.mainActivitiesButtons[key], {loop: false}).to({x: 20}, 100, createjs.Ease.getPowIn(2)).call(function () {
                        waterfallCallback();
                      });

                    }).error(function (error) {
                    console.log("There was an error on getting lesson json");
                  })
                });
            });//end of _.each(selectedGroupLessons)

            async.waterfall(waterfallFunctions, function (callback) {
              console.log("Buttons of activities are inserted...");
              $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                  resultsButton.x = ($scope.selectedLesson.activitiesMenu.length > 9 ? 450 : 100);
                  resultsButton.y = 620;
                  resultsButton.scaleX = resultsButton.scaleY = 0.6;
                  $scope.mainContainer.addChild(resultsButton);

                  var endText = new createjs.Text("RESULTS", "30px Arial", $scope.book.resultsColor ? $scope.book.resultsColor : 'white');
                  endText.x = ($scope.selectedLesson.activitiesMenu.length > 9 ? 490 : 140);
                  endText.y = 607;
                  $scope.mainContainer.addChild(endText);

                  resultsButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !");
                    resultsButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });
                  resultsButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");
                    resultsButton.gotoAndPlay("normal");
                    $scope.stage.update();
                    $rootScope.navigate("results");
                  });
                })
                .error(function (error) {
                  console.error("Error on getting json for results button...", error);
                });

              creatingActivitiesSubMenu();
            });

          })
          .error(function (error) {
            console.error("Error on getting json for the selected lesson...", error);
          });


        /*Function for creating and populating activities subMenu*/

        function creatingActivitiesSubMenu() {
          var waterfallSubMenuFunctions = [];
          console.log("Activities Menu: ", $scope.selectedLesson.activitiesMenu);

          $scope.subActivitiesButtons = {};

          /*Creating a variable that holds the Y for the back button and a second variable that holds the wait time for the animation*/
          var backButtonY = 0;

          //Creating activities subMenu
          _.each($scope.selectedLesson.activitiesMenu, function (activity, key, list) {

            waterfallSubMenuFunctions.push(
              function (waterfallSubMenuCallback) {

                $http.get($scope.rootDir + "data/assets/" + activity.buttonFileName)
                  .success(function (response) {

                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                    var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.subActivitiesButtons[key] = new createjs.Sprite(activityButtonSpriteSheet, "normal");

                    if (!activity.active) {
                      $scope.subActivitiesButtons[key].alpha = 0.5;
                    }

                    $scope.subActivitiesButtons[key].activityFolder = activity.activityFolder;
                    $scope.subActivitiesButtons[key].activityName = activity.name;
                    $scope.subActivitiesButtons[key].activityTemplate = activity.activityTemplate;
                    $scope.subActivitiesButtons[key].y = key * 42;
                    backButtonY = $scope.subActivitiesButtons[key].y;
                    $scope.subActivitiesButtons[key].scaleX = $scope.subActivitiesButtons[key].scaleY = 0.75;
                    $scope.subActivitiesButtons[key].x = -1500 * $scope.scale;

                    /* -------------------------------- CLICK ON sub activity button -------------------------------- */
                    $scope.subActivitiesButtons[key].addEventListener("mousedown", function (event) {
                      console.log("Mouse down event on a sub activity button!");
                      $scope.subActivitiesButtons[key].gotoAndPlay("onSelection");
                      $scope.stage.update();
                    });

                    $scope.subActivitiesButtons[key].addEventListener("pressup", function (event) {
                      console.log("Press up event on a sub activity button!");

                      $scope.subActivitiesButtons[key].gotoAndPlay("normal");
                      $scope.stage.update();

                      if (!activity.active) {
                        Toast.show("Coming soon...");
                        if (!$rootScope.developerMode) {
                          return;
                        }
                      }

                      $scope.activityFolder = $scope.subActivitiesButtons[key].activityFolder;
                      $scope.activityName = $scope.subActivitiesButtons[key].activityName;

                      window.localStorage.setItem("activityFolder", $scope.activityFolder);
                      window.localStorage.setItem("activityName", $scope.activityName);
                      $rootScope.navigate($scope.subActivitiesButtons[key].activityTemplate);
                    });

                    $scope.activitiesMenuContainer.addChild($scope.subActivitiesButtons[key]);

                    $timeout(function () {
                      waterfallSubMenuCallback();
                    });

                  }).error(function (error) {
                  console.log("There was an error on getting lesson json");
                })
              });

          });//end of _.each(selectedGroupLessons)

          async.waterfall(waterfallSubMenuFunctions, function (error, result) {

            $http.get($scope.rootDir + "data/assets/menu_activities_back_button_sprite.json")
              .success(function (response) {

                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                console.log(response);
                var backButtonSpriteSheet = new createjs.SpriteSheet(response);
                $scope.subActivitiesButtons["back"] = new createjs.Sprite(backButtonSpriteSheet, "normal");
                $scope.subActivitiesButtons["back"].y = backButtonY + 60;
                $scope.subActivitiesButtons["back"].label = "backButton";
                $scope.subActivitiesButtons["back"].scaleX = $scope.subActivitiesButtons["back"].scaleY = 0.75;
                $scope.subActivitiesButtons["back"].x = -1500 * $scope.scale;

                $scope.subActivitiesButtons["back"].addEventListener("mousedown", function (event) {
                  $scope.subActivitiesButtons["back"].gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                $scope.subActivitiesButtons["back"].addEventListener("pressup", function (event) {
                  showingActivitiesMenu();
                  $scope.subActivitiesButtons["back"].gotoAndPlay("normal");
                  $scope.stage.update();
                });

                $scope.activitiesMenuContainer.addChild($scope.subActivitiesButtons["back"]);

              }).error(function (error) {
              console.log("There was an error on getting lesson json");
            });
          });//end of waterfall
        }//end of populating activitiesSubMenu


        /*Function for showing activitiesMenu*/
        function showingActivitiesMenu() {
          showHidesubActivitiesButtons(-1500, 50, function () {
            showHideMainActivitiesButtons(20, 100, function () {
            });
          });
        }


        function showHidesubActivitiesButtons(xTarget, speed, callback) {

          var waterfallFunctions = [];

          _.each($scope.subActivitiesButtons, function (button, key, list) {
            waterfallFunctions.push(function (waterFallCallback) {
              createjs.Tween.get($scope.subActivitiesButtons[key], {loop: false}).to({x: xTarget}, speed, createjs.Ease.getPowIn(2)).call(function () {
                waterFallCallback();
              });
            });
          });

          waterfallFunctions.push(function (waterFallCallback) {
            createjs.Tween.get($scope.subActivitiesButtons["back"], {loop: false}).to({x: xTarget + 35}, speed, createjs.Ease.getPowIn(2)).call(function () {
              waterFallCallback();
            });
          });

          async.waterfall(waterfallFunctions, function (error, result) {
            callback();
          });

        };

        function showHideMainActivitiesButtons(xTarget, speed, callback) {

          var waterfallFunctions = [];

          _.each($scope.mainActivitiesButtons, function (button, key, list) {
            waterfallFunctions.push(function (waterFallCallback) {
              createjs.Tween.get($scope.mainActivitiesButtons[key], {loop: false}).to({x: xTarget}, speed, createjs.Ease.getPowIn(2)).call(function () {
                $timeout(function () {
                  waterFallCallback();
                }, speed);
              });
            });
          });

          async.waterfall(waterfallFunctions, function (err, response) {
            callback();
          });
        };

        function showingActivitiesSubMenu() {
          showHideMainActivitiesButtons(-1500, 50, function () {
            showHidesubActivitiesButtons(50, 100, function () {
            });
          });
        }


      });
    }, 1500);
  });

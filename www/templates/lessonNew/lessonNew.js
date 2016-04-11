angular.module("bookbuilder2")
  .controller("LessonNewController", function ($scope, $ionicPlatform, $timeout, $rootScope, $http, $state, $ionicHistory) {

    console.log("LessonNewController loaded!");

    //START OF DEVELOPMENT SNIPPET
    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }
    $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $rootScope.selectedLessonId = window.localStorage.getItem("selectedLessonId");
    $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
    $rootScope.book = JSON.parse(window.localStorage.getItem("book"));

    $rootScope.backgroundView = {
      "background": "url(" + $rootScope.rootDir + "data/assets/lesson_background_image_1_red.png) no-repeat center top",
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
        src: $rootScope.rootDir + "data/assets/background_image_2_blue.png"
      }));
      imageLoader.load();

      imageLoader.on("complete", function (r) {

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/background_image_2_blue.png");

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


        var titleImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: $rootScope.rootDir + "data/assets/lesson_background_image_2_blue.png"
        }));
        titleImageLoader.load();

        titleImageLoader.on("complete", function (r) {
          var titleImage = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_background_image_2_blue.png");
          $scope.mainContainer.addChild(titleImage);
        });


        var lessonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLessonId + "/background_image_icon.png"
        }));
        lessonImageLoader.load();

        lessonImageLoader.on("complete", function (r) {

          var lessonImage = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLessonId + "/background_image_icon.png");
          lessonImage.scaleX = lessonImage.scaleY = 0.85;
          lessonImage.x = 320;
          lessonImage.y = 170;
          $scope.mainContainer.addChild(lessonImage);
        });


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
              $scope.stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              menuButton.gotoAndPlay("normal");
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

        //mainContainer Background
        /*var activitiesMenuContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.activitiesMenuContainer.width, $scope.activitiesMenuContainer.height);
         var activitiesMenuContainerBackground = new createjs.Shape(activitiesMenuContainerGraphic);
         activitiesMenuContainerBackground.alpha = 0.5;

         $scope.activitiesMenuContainer.addChild(activitiesMenuContainerBackground);*/


        /* /!* -------------------------------- END BUTTON -------------------------------- *!/
         //Getting the element
         $http.get($rootScope.rootDir + "data/assets/lesson_end_button_sprite.json")
         .success(function (response) {
         response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
         var exitButtonSpriteSheet = new createjs.SpriteSheet(response);
         var exitButton = new createjs.Sprite(exitButtonSpriteSheet, "normal");

         exitButton.addEventListener("mousedown", function (event) {
         console.log("mousedown event on a button !");
         exitButton.gotoAndPlay("onSelection");
         $scope.stage.update();
         });

         exitButton.addEventListener("pressup", function (event) {
         console.log("pressup event!");
         exitButton.gotoAndPlay("normal");
         ionic.Platform.exitApp();
         });
         exitButton.x = 100;
         exitButton.y = 630;
         $scope.mainContainer.addChild(exitButton);
         })
         .error(function (error) {
         console.log("Error on getting json data for end button...");
         });
         */


        $http.get($rootScope.rootDir + "data/assets/lesson_end_button_sprite.json")
          .success(function (response) {
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
            var resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
            resultsButton.x = 100;
            resultsButton.y = 600;
            $scope.mainContainer.addChild(resultsButton);

            var endText = new createjs.Text("RESULTS", "30px Arial", "white");
            endText.x = 160;
            endText.y = 590;
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


        /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
          //Getting the right lesson json
        console.log($rootScope.selectedLessonId);
        var lessonResourceUrl = $rootScope.rootDir + 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json";
        console.log("URL for selected lesson's json: ", lessonResourceUrl);

        $http.get(lessonResourceUrl)
          .success(function (response) {
            console.log("Success on getting json for the selected lesson! ---> ", response);

            //Assigning response to $rootScope.selectedLesson
            $rootScope.selectedLesson = response;
            console.log("Selected Lesson: ", $rootScope.selectedLesson);


            //FOR DEVELOPMENT
            window.localStorage.setItem("selectedLesson", JSON.stringify($rootScope.selectedLesson));

            /*--------------------------------------- TITLE CREATION------------------------------------------*/

            console.log("Lesson Title: ", $rootScope.selectedLesson.lessonTitle);
            console.log("Title: ", $rootScope.selectedLesson.title);

            var lessonTitle = new createjs.Text($rootScope.selectedLesson.lessonTitle + " -", "33px Arial", "white");
            lessonTitle.x = 460;
            lessonTitle.y = 105;
            $scope.mainContainer.addChild(lessonTitle);

            var title = new createjs.Text($rootScope.selectedLesson.title, "33px Arial", "white");
            title.x = 630;
            title.y = 105;
            $scope.mainContainer.addChild(title);


            /*-------------------------------- Populating Activities Menu -----------------------------------*/

            $scope.mainActivitiesButtons = {};

            var waterfallFunctions = [];
            _.each(response.lessonMenu, function (activity, key, list) {

              console.log("Creating a " + activity.activityTemplate + " button!");

              waterfallFunctions.push(
                function (waterfallCallback) {

                  $http.get($rootScope.rootDir + "data/assets/" + activity.buttonFileName)
                    .success(function (response) {

                      response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                      var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.mainActivitiesButtons[key] = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                      $scope.mainActivitiesButtons[key].activityFolder = activity.activityFolder;
                      $scope.mainActivitiesButtons[key].activityName = activity.name;
                      $scope.mainActivitiesButtons[key].activityTemplate = activity.activityTemplate;
                      $scope.mainActivitiesButtons[key].y = key * 60;
                      $scope.mainActivitiesButtons[key].x = -1500;

                      if (activity.activityTemplate !== "activities") {
                        $scope.mainActivitiesButtons[key].scaleX = $scope.mainActivitiesButtons[key].scaleY = $scope.scale * 0.46;
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
                          $scope.stage.update();
                          $rootScope.activityFolder = $scope.mainActivitiesButtons[key].activityFolder;
                          $rootScope.activityName = $scope.mainActivitiesButtons[key].activityName;

                          window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
                          window.localStorage.setItem("activityName", $rootScope.activityName);

                          console.log($rootScope.selectedLessonId);
                          console.log($rootScope.activityFolder);
                          $ionicHistory.nextViewOptions({
                            historyRoot: true,
                            disableBack: true
                          });
                          $state.go($scope.mainActivitiesButtons[key].activityTemplate, {}, {reload: true});
                        });
                      }


                      //Checking if its activity button for adding a special event that creates the subMenu
                      if (activity.activityTemplate === "activities") {
                        $scope.mainActivitiesButtons[key].addEventListener("pressup", function (event) {
                          console.log("Press up event on Activities button !");

                          //Calling the function that shows the activities subMenu
                          showingActivitiesSubMenu();
                          $scope.mainActivitiesButtons[key].gotoAndPlay("normal");
                          $scope.stage.update();

                        });
                      }

                      $scope.activitiesMenuContainer.addChild($scope.mainActivitiesButtons[key]);

                      createjs.Tween.get($scope.mainActivitiesButtons[key], {loop: false}).wait(key * 50)
                        .to({x: 20}, 500, createjs.Ease.getPowIn(2)).call(function () {
                        waterfallCallback();
                      });

                    }).error(function (error) {
                    console.log("There was an error on getting lesson json");
                  })
                });
            });//end of _.each(selectedGroupLessons)

            async.waterfall(waterfallFunctions, function (callback) {
              console.log("Buttons of activities are inserted...");
              creatingActivitiesSubMenu();
            });

          })
          .error(function (error) {
            console.error("Error on getting json for the selected lesson...", error);
          });


        /*Function for creating and populating activities subMenu*/

        function creatingActivitiesSubMenu() {
          var waterfallSubMenuFunctions = [];
          console.log("Activities Menu: ", $rootScope.selectedLesson.activitiesMenu);

          $scope.subActivitiesButtons = {};

          /*Creating a variable that holds the Y for the back button and a second variable that holds the wait time for the animation*/
          var backButtonY = 0;
          $scope.backButtonWait = 0;

          //Creating activities subMenu
          _.each($rootScope.selectedLesson.activitiesMenu, function (activity, key, list) {

            waterfallSubMenuFunctions.push(
              function (waterfallSubMenuCallback) {

                $http.get($rootScope.rootDir + "data/assets/" + activity.buttonFileName)
                  .success(function (response) {

                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                    var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.subActivitiesButtons[key] = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                    $scope.subActivitiesButtons[key].activityFolder = activity.activityFolder;
                    $scope.subActivitiesButtons[key].activityName = activity.name;
                    $scope.subActivitiesButtons[key].activityTemplate = activity.activityTemplate;
                    $scope.subActivitiesButtons[key].y = key * 42;
                    backButtonY = $scope.subActivitiesButtons[key].y;
                    $scope.subActivitiesButtons[key].scaleX = $scope.subActivitiesButtons[key].scaleY = 0.75;
                    $scope.subActivitiesButtons[key].x = -1500 * $scope.scale;
                    $scope.backButtonWait = key * 50;


                    /* -------------------------------- CLICK ON sub activity button -------------------------------- */
                    $scope.subActivitiesButtons[key].addEventListener("mousedown", function (event) {
                      console.log("Mouse down event on a sub activity button!");
                      $scope.subActivitiesButtons[key].gotoAndPlay("onSelection");
                      $scope.stage.update();
                    });

                    $scope.subActivitiesButtons[key].addEventListener("pressup", function (event) {
                      console.log("Press up event on a sub activity button!");
                      $scope.stage.update();
                      $rootScope.activityFolder = $scope.subActivitiesButtons[key].activityFolder;
                      $rootScope.activityName = $scope.subActivitiesButtons[key].activityName;

                      window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
                      window.localStorage.setItem("activityName", $rootScope.activityName);

                      console.log($rootScope.selectedLessonId);
                      console.log($rootScope.activityFolder);
                      $ionicHistory.nextViewOptions({
                        historyRoot: true,
                        disableBack: true
                      });
                      $state.go($scope.subActivitiesButtons[key].activityTemplate, {}, {reload: true});
                    });

                    $scope.activitiesMenuContainer.addChild($scope.subActivitiesButtons[key]);

                    $timeout(function () {
                      waterfallSubMenuCallback();
                    }, 100);

                  }).error(function (error) {
                  console.log("There was an error on getting lesson json");
                })
              });

          });//end of _.each(selectedGroupLessons)

          async.waterfall(waterfallSubMenuFunctions, function (error, result) {
            console.log("Buttons of activities are inserted...");

            console.log("$scope.subActivitiesButtons: ", $scope.subActivitiesButtons);

            if (error) {
              console.error("There was an error on executing waterfall: ", error);
            } else {
              //!!!!! TEMPORARY Url definition
              var spriteResourceUrl = $rootScope.rootDir + "data/assets/menu_activities_back_button_sprite.json";

              console.log("Creating Back button...");
              /*At last the Back button gets inserted*/
              $http.get(spriteResourceUrl)
                .success(function (response) {

                  console.log("Back button created!");

                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  var backButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.subActivitiesButtons["back"] = new createjs.Sprite(backButtonSpriteSheet, "normal");

                  console.log("backButtonY: ", backButtonY);
                  $scope.subActivitiesButtons["back"].y = backButtonY + 60;
                  $scope.subActivitiesButtons["back"].label = "backButton";
                  $scope.subActivitiesButtons["back"].scaleX = $scope.subActivitiesButtons["back"].scaleY = 1;
                  $scope.subActivitiesButtons["back"].x = -1500 * $scope.scale;

                  console.log("Back Button: ", $scope.subActivitiesButtons["back"]);

                  /* -------------------------------- CLICK ON BACK BUTTON -------------------------------- */
                  $scope.subActivitiesButtons["back"].addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on activities subMenu Back button!");
                    $scope.subActivitiesButtons["back"].gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });

                  $scope.subActivitiesButtons["back"].addEventListener("pressup", function (event) {
                    console.log("Press up event on activities subMenu Back button !");
                    showingActivitiesMenu();
                    $scope.subActivitiesButtons["back"].gotoAndPlay("normal");
                    $scope.stage.update();
                  });

                  $scope.activitiesMenuContainer.addChild($scope.subActivitiesButtons["back"]);

                }).error(function (error) {
                console.log("There was an error on getting lesson json");
              });
            }

          });//end of waterfall
        }//end of populating activitiesSubMenu


        /*Function for showing activitiesMenu*/
        function showingActivitiesMenu() {

          async.waterfall([
            //Hiding subMenu buttons
            function (showingActivitiesMenuCallback) {
              _.each($scope.subActivitiesButtons, function (button, key, list) {
                createjs.Tween.get($scope.subActivitiesButtons[key], {loop: false}).wait(key * 50)
                  .to({x: -1500}, 500, createjs.Ease.getPowIn(2));
              });
              createjs.Tween.get($scope.subActivitiesButtons["back"], {loop: false}).wait($scope.backButtonWait + 50)
                .to({x: -1500}, 500, createjs.Ease.getPowIn(2));

              showingActivitiesMenuCallback();
            }
          ], function (error, result) {
            if (!error) {
              //Showing Menu buttons
              _.each($scope.mainActivitiesButtons, function (button, key, list) {
                createjs.Tween.get($scope.mainActivitiesButtons[key], {loop: false}).wait(key * 50)
                  .to({x: $scope.activitiesMenuContainer.width / 2}, 500, createjs.Ease.getPowIn(2));
              });
            }
          });
        }

        /*Function for showing activitiesSubMenu*/
        function showingActivitiesSubMenu() {

          async.waterfall([
            //Hiding subMenu buttons
            function (showingActivitiesSubMenuCallback) {

              //Showing Menu buttons
              _.each($scope.mainActivitiesButtons, function (button, key, list) {
                createjs.Tween.get($scope.mainActivitiesButtons[key], {loop: false}).wait(key * 50)
                  .to({x: -1500}, 500, createjs.Ease.getPowIn(2));
              });

              showingActivitiesSubMenuCallback();

            }
          ], function (error, result) {
            if (!error) {
              _.each($scope.subActivitiesButtons, function (button, key, list) {
                createjs.Tween.get($scope.subActivitiesButtons[key], {loop: false}).wait(key * 50)
                  .to({x: 50}, 500, createjs.Ease.getPowIn(2));
              });
              createjs.Tween.get($scope.subActivitiesButtons["back"], {loop: false}).wait($scope.backButtonWait + 50)
                .to({x: 50}, 500, createjs.Ease.getPowIn(2));
            }
          });
        }


      });
    }, 500);
  });

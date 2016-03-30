angular.module("bookbuilder2")
  .controller("LessonController", function ($scope, $ionicPlatform, $timeout, $rootScope, $http, $state, $ionicHistory) {

    console.log("LessonController loaded!");

    //Initialization of $rootScope.selectedLesson
    $rootScope.selectedLesson = {};

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

      imageLoader.on("complete", function (r) {

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

        /*************** CALCULATING SCALING *********************/
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

        /****** End of scaling calculation ******/

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
              $state.go("groups");
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


        /*-------------------------------------------ACTIVITIES MENU CONTAINER--------------------------------------*/
        var activitiesMenuContainer = new createjs.Container();
        /*It's important too define containers height before start calculating buttons*/
        activitiesMenuContainer.width = 240;
        activitiesMenuContainer.height = 450;

        activitiesMenuContainer.scaleX = activitiesMenuContainer.scaleY = scale;

        var yPosition = 60;
        activitiesMenuContainer.x = backgroundPosition.x + (backgroundPosition.width / 24);
        activitiesMenuContainer.y = backgroundPosition.y + (backgroundPosition.height / 7);
        $scope.stage.addChild(activitiesMenuContainer);
        $scope.stage.update();


        /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
          //Getting the right lesson json
        console.log($rootScope.selectedLessonId);
        var lessonResourceUrl = $rootScope.rootDir + 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json";
        console.log("URL for selected lesson's json: ", lessonResourceUrl);

        $http.get(lessonResourceUrl)
          .success(function (response) {
            console.log("Success on getting json for the selected lesson! ", response);

            //Assigning response to $rootScope.selectedLesson
            $rootScope.selectedLesson = response;
            console.log("Selected Lesson: ", $rootScope.selectedLesson);


            //FOR DEVELOPMENT
            window.localStorage.setItem("selectedLesson", JSON.stringify($rootScope.selectedLesson));

            /*---------------------------------------LESSON TITLE CREATION------------------------------------------*/

            console.log("Lesson Title: ", response.lessonTitle);
            var lessonTitle = new createjs.Text(response.lessonTitle, "33px Arial", "white");

            /*background.scaleX = background.scaleY = scale;*/
            lessonTitle.scaleX = lessonTitle.scaleY = scale;
            lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 10);
            lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 9.8);
            lessonTitle.rotation = -4;
            lessonTitle.textBaseline = "alphabetic";

            $scope.stage.addChild(lessonTitle);
            $scope.stage.update();


            /*-------------------------------------TITLE CREATION---------------------------------------*/

            console.log("Lesson Title: ", response.title);
            var title = new createjs.Text(response.title, "25px Arial", "white");

            /*background.scaleX = background.scaleY = scale;*/
            title.scaleX = title.scaleY = scale;
            title.x = backgroundPosition.x + (backgroundPosition.width / 2.9);
            title.y = backgroundPosition.y + (backgroundPosition.height / 13);
            title.textBaseline = "alphabetic";

            $scope.stage.addChild(title);
            $scope.stage.update();


            /*-----------------------------------------READING BUTTON----------------------------------------*/
            $http.get($rootScope.rootDir + "data/assets/menu_reading_bubble_button_sprite.json")
              .success(function (response) {
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var readingButtonSpriteSheet = new createjs.SpriteSheet(response);
                var readingButton = new createjs.Sprite(readingButtonSpriteSheet, "normal");
                readingButton.scaleX = readingButton.scaleY = scale;
                readingButton.x = backgroundPosition.x + (backgroundPosition.width / 2.8);
                readingButton.y = backgroundPosition.y + (backgroundPosition.height / 2);
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
                $scope.stage.update();
              })
              .error(function (error) {
                console.error("Error on getting json for reading button...", error);
              });

            /*-----------------------------------------VOCABULARY BUTTON----------------------------------------*/

            $http.get($rootScope.rootDir + "data/assets/menu_vocabulary_bubble_button_sprite.json")
              .success(function (response) {

                //Reassigning images with the rest of resource
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var vocabularyButtonSpriteSheet = new createjs.SpriteSheet(response);
                var vocabularyButton = new createjs.Sprite(vocabularyButtonSpriteSheet, "normal");
                vocabularyButton.scaleX = vocabularyButton.scaleY = scale;
                vocabularyButton.x = backgroundPosition.x + (backgroundPosition.width / 2.8);
                vocabularyButton.y = backgroundPosition.y + (backgroundPosition.height / 5);
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
                  $state.go("vocabulary");
                });
                $scope.stage.addChild(vocabularyButton);
                $scope.stage.update();
              })
              .error(function (error) {
                console.error("Error on getting json for vocabulary button...", error);
              });


            /*-----------------------------------------RESULTS BUTTON----------------------------------------*/

            $http.get($rootScope.rootDir + "data/assets/lesson_results_button_sprite.json")
              .success(function (response) {
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                var resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                resultsButton.scaleX = resultsButton.scaleY = scale;
                resultsButton.x = backgroundPosition.x + (backgroundPosition.width / 6.5);
                resultsButton.y = backgroundPosition.y + (backgroundPosition.height / 1.1);
                $scope.stage.addChild(resultsButton);
                $scope.stage.update();

                /* ------------------------ EVENT ------------------------ */
                resultsButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a button !");
                  resultsButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });
                resultsButton.addEventListener("pressup", function (event) {
                  console.log("pressup event!");
                  resultsButton.gotoAndPlay("normal");
                  $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                  });
                  $state.go("results");
                });
              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
              });

            /*-------------------------------- Populating Activities Menu -----------------------------------*/
            var waterfallFunctions = [];
            _.each(response.lessonMenu, function (activity, key, list) {

              waterfallFunctions.push(function (waterfallCallback) {
                var spriteResourceUrl = $rootScope.rootDir + "data/assets/" + activity.buttonFileName;

                $http.get(spriteResourceUrl)
                  .success(function (response) {

                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                    var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                    var activityButton = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                    activityButton.activityFolder = activity.activityFolder;
                    activityButton.activityName = activity.name;
                    activityButton.activityTemplate = activity.activityTemplate;
                    activityButton.y = yPosition;
                    activityButton.x = -1500 * scale;
                    createjs.Tween.get(activityButton, {loop: false}).wait(yPosition)
                      .to({x: 20}, 500, createjs.Ease.getPowIn(2));
                    yPosition += 75;

                    /* -------------------------------- CLICK ON LESSON BUTTON -------------------------------- */
                    activityButton.addEventListener("mousedown", function (event) {
                      console.log("mousedown event on a lesson button!");
                      activityButton.gotoAndPlay("onSelection");
                      $scope.stage.update();
                    });

                    activityButton.addEventListener("pressup", function (event) {
                      console.log("pressup event on a lesson button !");
                      $scope.stage.update();
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
                      $state.go(activityButton.activityTemplate);
                    });

                    activitiesMenuContainer.addChild(activityButton);
                    $scope.stage.update();

                    $timeout(function () {
                      waterfallCallback();
                    }, 100);

                  }).error(function (error) {
                  console.log("There was an error on getting lesson json");
                })
              });
            });//end of _.each(selectedGroupLessons)

            async.waterfall(waterfallFunctions, function (callback) {
              console.log("Lessons Of a group are  Inserted!");
            });

          })
          .error(function (error) {
            console.error("Error on getting json for the selected lesson...", error);
          });

      });
    }, 500);
  })
;

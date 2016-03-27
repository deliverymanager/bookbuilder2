angular.module("bookbuilder2")
  .controller("ResultsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("ResultsController loaded!");

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


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

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


        async.parallel([function (callback) {

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
                $ionicHistory.goBack();
              });

              menuButton.scaleX = menuButton.scaleY = scale;
              menuButton.x = 0;
              menuButton.y = -menuButton.getTransformedBounds().height / 5;

              $scope.stage.addChild(menuButton);
              $scope.stage.update();
              callback();
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
              callback();
            });//end of get menu button

        }, function (callback) {

          $http.get($rootScope.rootDir + "data/assets/lesson_restart_button_sprite.json")
            .success(function (response) {
              //Reassigning images with the rest of resource
              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
              var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");

              returnButton.addEventListener("mousedown", function (event) {
                console.log("mousedown event on a button !");
                returnButton.gotoAndPlay("onSelection");
                $scope.stage.update();
              });

              returnButton.addEventListener("pressup", function (event) {
                console.log("pressup event!");
                returnButton.gotoAndPlay("normal");


                var confirmPopup = $ionicPopup.confirm({
                  title: 'Restart all activities in ' + $rootScope.selectedLesson.title,
                  template: 'This will reset all your activity in ' + $rootScope.selectedLesson.title + "!"
                });
                confirmPopup.then(function (res) {
                  if (res) {
                    clearAllActivitiesLocalStorage();
                  }
                });

              });
              returnButton.scaleX = returnButton.scaleY = scale;
              returnButton.x = backgroundPosition.x + (backgroundPosition.width / 1.1);
              returnButton.y = backgroundPosition.y + (backgroundPosition.height / 10);
              $scope.stage.addChild(returnButton);
              $scope.stage.update();
              callback();
            })
            .error(function (error) {
              callback();
              console.log("Error on getting json data for return button...", error);

            });
        }, function (callback) {

          /* ------------------------------------------ vocabularyReading Shape ---------------------------------------------- */

          //Starting and making it transparent
          var vocabularyReadingGraphics = new createjs.Graphics().beginFill(null);
          //Setting Stroke
          vocabularyReadingGraphics.setStrokeStyle(3).beginStroke("white");

          //Drawing the shape !!!NOTE Every optimization before drawRoundRect
          vocabularyReadingGraphics.drawRoundRect(0, 0, 430, 110, 15);

          var vocabularyReadingShape = new createjs.Shape(vocabularyReadingGraphics);
          vocabularyReadingShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 20), backgroundPosition.y + (backgroundPosition.height / 7), scale, scale, 0, 0, 0, 0, 0);
          $scope.stage.addChild(vocabularyReadingShape);
          $scope.stage.update();


          /* ------------------------------------------ totalScore Shape ---------------------------------------------- */

          var totalScoreGraphics = new createjs.Graphics().beginFill("blue").drawRect(0, 0, 430, 100);
          var totalScoreShape = new createjs.Shape(totalScoreGraphics);
          totalScoreShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 2), backgroundPosition.y + (backgroundPosition.height / 6.5), scale, scale, 0, 0, 0, 0, 0);
          //Setting Shadow
          totalScoreShape.shadow = new createjs.Shadow("#000000", 5, 5, 10);
          $scope.stage.addChild(totalScoreShape);
          $scope.stage.update();

          //Text for the totalScore
          var totalScoreTitle = new createjs.Text("Total Score:", "25px Arial", "white");

          /*background.scaleX = background.scaleY = scale;*/
          totalScoreTitle.scaleX = totalScoreTitle.scaleY = scale;
          totalScoreTitle.x = backgroundPosition.x + (backgroundPosition.width / 3);
          totalScoreTitle.y = backgroundPosition.y + (backgroundPosition.height / 13);
          totalScoreTitle.textBaseline = "alphabetic";

          $scope.stage.addChild(totalScoreTitle);
          $scope.stage.update();


          /* ------------------------------------------ activitiesScore Shape ---------------------------------------------- */

          //Starting and making it transparent
          var activitiesScoreGraphics = new createjs.Graphics().beginFill(null);
          //Setting Stroke
          activitiesScoreGraphics.setStrokeStyle(3).beginStroke("white");

          //Drawing the shape !!!NOTE Every optimization before drawRoundRect
          activitiesScoreGraphics.drawRoundRect(0, 0, 900, 400, 15);

          var activitiesScoreShape = new createjs.Shape(activitiesScoreGraphics);

          activitiesScoreShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 20), backgroundPosition.y
            + (backgroundPosition.height / 3), scale, scale, 0, 0, 0, 0, 0);

          console.log("Shape transformed bounds: ", activitiesScoreShape.getTransformedBounds());

          $scope.stage.addChild(activitiesScoreShape);
          $scope.stage.update();

          callback();
        }], function (err, results) {

          /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
            //Getting the right lesson json
          console.log($rootScope.selectedLessonId);
          var lessonResourceUrl = $rootScope.rootDir + 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json";
          console.log("URL for selected lesson's json: ", lessonResourceUrl);

          $http.get(lessonResourceUrl)
            .success(function (response) {
              console.log("Success on getting json for the selected lesson! ", response);


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


              /*-------------------------------------TITLE CREATION--------------------------------------------*/

              console.log("Lesson Title: ", response.title);
              var title = new createjs.Text(response.title, "25px Arial", "white");

              /*background.scaleX = background.scaleY = scale;*/
              title.scaleX = title.scaleY = scale;
              title.x = backgroundPosition.x + (backgroundPosition.width / 3);
              title.y = backgroundPosition.y + (backgroundPosition.height / 13);
              title.textBaseline = "alphabetic";

              $scope.stage.addChild(title);
              $scope.stage.update();

              showResults();

            });//end of $http.get(lessonResourceUrl)

        });


        function showResults() {

          var calculatedActivityScores = {};

          _.each($rootScope.selectedLesson.lessonMenu, function (activity, key, list) {
            var activityData = window.localStorage.getItem($rootScope.selectedLesson.id + "_" + activity.activityFolder);

            if (activityData) {
              calculatedActivityScores[activity.activityFolder] = {
                "title": activity.name,
                "completed": activityData.completed,
                "attempts": activityData.attempts,
                "correct": calculateCorrectAnswers(activityData),
                "numberOfQuestions": activity.numberOfQuestions,
                "percentCorrectQuestions": calculatePercentCorrectQuestions(activityData)
              }
            } else {
              calculatedActivityScores[activity.activityFolder] = {
                "title": activity.name,
                "completed": activityData.completed,
                "attempts": activityData.attempts,
                "correct": calculateCorrectAnswers(activityData),
                "numberOfQuestions": activity.numberOfQuestions,
                "percentCorrectQuestions": calculatePercentCorrectQuestions(activityData)
              }
            }
          });

          var vocabularyActivityData = window.localStorage.getItem($rootScope.selectedLesson.id + "_vocabulary");

          calculatedActivityScores["vocabulary"] = {
            "title": "Vocabulary",
            "completed": vocabularyActivityData.completed,
            "attempts": vocabularyActivityData.attempts
          };

          var readingActivityData = window.localStorage.getItem($rootScope.selectedLesson.id + "_reading");

          calculatedActivityScores["reading"] = {
            "title": "Reading",
            "completed": readingActivityData.completed,
            "attempts": readingActivityData.attempts
          };

          _.each(calculatedActivityScores, function (activity, key, list) {

            //START SHOWING THE TEXT IN THE CANVAS

          });
        };

        function calculateCorrectAnswers(activityData) {
          return 3;
        };

        function calculatePercentCorrectQuestions(activityData) {
          return 30;
        };


        function clearAllActivitiesLocalStorage() {

          _.each($rootScope.selectedLesson.lessonMenu, function (activity, key, list) {
            window.localStorage.removeItem($rootScope.selectedLesson.id + "_" + activity.activityFolder);
          });

          Toast.show($rootScope.selectedLesson.title + " is cleared succesfully!");

          showResults();

        };


      });//end of image on complete
    }, 500);//end of timeout
  });

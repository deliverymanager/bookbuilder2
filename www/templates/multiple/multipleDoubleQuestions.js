angular.module("bookbuilder2")
  .controller("MultipleDoubleQuestionsController", function ($scope, $ionicPlatform, $timeout, $http, _, $rootScope, Toast) {

    console.log("MultipleDoubleQuestionsController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));
    $scope.activityFolder = window.localStorage.getItem("activityFolder");
    $scope.activityName = window.localStorage.getItem("activityName");

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


    /*Name of activity in localStorage*/
    var activityNameInLocalStorage = $scope.selectedLesson.id + "_" + $scope.activityFolder;
    console.log("Name of activity in localStorage: ", activityNameInLocalStorage);

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
        src: $scope.rootDir + "data/assets/spray_background_image.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/spray_background_image.png");

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

        $scope.activeQuestionIndex = 0;

        async.waterfall([function (callback) {

            $scope.firstGap = [];
            $scope.secondGap = [];

            console.log("Waterfall loading images");
            var loadingBitmaps = [];

            _.each(["spray_choice_text_bubble.png", "lesson_yellow_line.png", "spray_choice_button_sprite.png", "yellow_line_big_bubble.png"], function (file, key, list) {

              loadingBitmaps.push(function (seriesCallback) {
                var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/" + file
                }));

                imageLoader.load();

                imageLoader.on("complete", function (r) {
                  console.log("file", file);
                  $timeout(function () {
                    seriesCallback();
                  });
                });
              });
            });

            async.series(loadingBitmaps, function (err, response) {
              callback();
            });
          }, function (callback) {
            console.log("Waterfall loading activityData");

            if (window.localStorage.getItem(activityNameInLocalStorage)) {
              $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
              console.log("$scope.activityData from local Storage: ", $scope.activityData);
              callback();
            } else {
              $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/multiple.json")
                .success(function (response) {
                  /*Adding the userAnswer attribute to response object before assigning it to $scope.activityData*/
                  _.each(response.questions, function (question, key, value) {
                    question.userAnswer = "";
                  });
                  $scope.activityData = response;
                  $scope.activityData.attempts = 0;
                  $scope.activityData.newGame = true;
                  window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                  console.log("$scope.activityData from local file: ", $scope.activityData);
                  callback();
                })
                .error(function (error) {
                  console.log("Error on getting json for the url...:", error);
                  callback();
                });
            }
          }, function (callback) {

            $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length * 2, "27px Arial", "white");
            $scope.scoreText.scaleX = $scope.scoreText.scaleY = $scope.scale;
            $scope.scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
            $scope.scoreText.y = backgroundPosition.y + (backgroundPosition.height / 22.5);
            $scope.scoreText.textBaseline = "alphabetic";

            $scope.activityData.score = 0;
            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            $scope.stage.addChild($scope.scoreText);

            /*RESTART BUTTON*/
            $http.get($scope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
              .success(function (response) {
                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");
                returnButton.addEventListener("mousedown", function (event) {
                  console.log("Mousedown event on Restart button!");
                  returnButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                returnButton.addEventListener("pressup", function (event) {
                  console.log("Pressup event on Restart button!");
                  returnButton.gotoAndPlay("normal");
                  $scope.stage.update();
                  restart();
                });
                returnButton.scaleX = returnButton.scaleY = $scope.scale;
                returnButton.x = backgroundPosition.x + (backgroundPosition.width / 1.5);
                returnButton.y = backgroundPosition.y + (backgroundPosition.height / 1.070);
                $scope.stage.addChild(returnButton);
                callback();
              })
              .error(function (error) {
                console.log("Error on getting json data for return button...", error);
                callback();
              });
          }, function (callback) {

            console.log("Waterfall loading next button");

            $http.get($scope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
              .success(function (response) {
                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                $scope.nextButton.addEventListener("mousedown", function (event) {
                  if (!$scope.activityData.newGame) {
                    $scope.nextButton.gotoAndPlay("selected");
                  }
                  $scope.stage.update();
                });
                $scope.nextButton.addEventListener("pressup", function (event) {
                  if (!$scope.activityData.newGame) {
                    $scope.nextButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                    $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                  }
                });
                $scope.nextButton.scaleX = $scope.nextButton.scaleY = $scope.scale;
                $scope.nextButton.x = backgroundPosition.x + (backgroundPosition.width / 1.18);
                $scope.nextButton.y = backgroundPosition.y + (backgroundPosition.height / 1.05);
                $scope.stage.addChild($scope.nextButton);
                callback();
              })
              .error(function (error) {

                console.log("Error on getting json data for check button...", error);
                callback();
              });
          }, function (callback) {
            /*CHECK BUTTON*/
            console.log("Waterfall loading check button");

            $http.get($scope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
              .success(function (response) {
                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");
                if ($scope.activityData.newGame) {
                  $scope.checkButton.alpha = 1;
                } else {
                  $scope.checkButton.alpha = 0.5;
                }
                $scope.checkButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a button !");
                  if ($scope.activityData.newGame) {
                    $scope.checkButton.gotoAndPlay("onSelection");
                  }
                  $scope.stage.update();
                });
                $scope.checkButton.addEventListener("pressup", function (event) {
                  console.log("pressup event!");

                  if ($scope.activityData.newGame) {
                    $scope.checkButton.gotoAndPlay("normal");
                    $scope.stage.update();
                    score();
                  }
                });
                $scope.checkButton.scaleX = $scope.checkButton.scaleY = $scope.scale;
                $scope.checkButton.x = backgroundPosition.x + (backgroundPosition.width / 2.4);
                $scope.checkButton.y = backgroundPosition.y + (backgroundPosition.height / 1.095);
                $scope.stage.addChild($scope.checkButton);
                callback();
              })
              .error(function (error) {

                console.log("Error on getting json data for check button...", error);
                callback();
              });
          }, function (callback) {

            $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
              .success(function (response) {

                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
                var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

                menuButton.addEventListener("mousedown", function (event) {
                  menuButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                menuButton.addEventListener("pressup", function (event) {
                  menuButton.gotoAndPlay("normal");
                  $scope.stage.update();
                  $rootScope.navigate("lessonNew");
                });

                menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
                menuButton.x = 0;
                menuButton.y = -menuButton.getTransformedBounds().height / 5;

                $scope.stage.addChild(menuButton);
                callback();
              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
                callback();
              });

          },
            function (initWaterfallCallback) {

              $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                  $scope.resultsButton.x = backgroundPosition.x + (backgroundPosition.width / 1.25);
                  $scope.resultsButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                  $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6 * $scope.scale;
                  $scope.stage.addChild($scope.resultsButton);

                  $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                  $scope.endText.x = backgroundPosition.x + (backgroundPosition.width / 1.2);
                  $scope.endText.y = backgroundPosition.y + (backgroundPosition.height / 1.08);
                  $scope.endText.scaleX = $scope.endText.scaleY = $scope.scale;
                  $scope.stage.addChild($scope.endText);

                  $scope.resultsButton.visible = false;
                  $scope.endText.visible = false;

                  $scope.resultsButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !");
                    $scope.resultsButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });
                  $scope.resultsButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");
                    $scope.resultsButton.gotoAndPlay("normal");
                    $scope.stage.update();
                    $rootScope.navigate("results");
                  });

                  initWaterfallCallback();
                })
                .error(function (error) {
                  console.error("Error on getting json for results button...", error);
                  initWaterfallCallback();
                });

            },

            function (callback) {

              /*Adding page title and description $scope.activityData.title*/
              $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "18px Arial", "white");
              $scope.pageTitle.x = backgroundPosition.x + (backgroundPosition.width / 8);
              $scope.pageTitle.y = backgroundPosition.y + (backgroundPosition.width / 27);
              $scope.pageTitle.maxWidth = backgroundPosition.width / 2 / $scope.scale;
              $scope.pageTitle.textBaseline = "alphabetic";
              $scope.pageTitle.scaleX = $scope.pageTitle.scaleY = $scope.scale;
              $scope.stage.addChild($scope.pageTitle);

              /*Adding page title and description $scope.activityData.title*/
              $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
                  activityFolder: $scope.activityFolder
                }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : ""), "18px Arial", "white");
              $scope.pageActivity.x = backgroundPosition.x + (backgroundPosition.width / 12);
              $scope.pageActivity.y = backgroundPosition.y + (backgroundPosition.height / 1.09);
              $scope.pageActivity.scaleX = $scope.pageActivity.scaleY = $scope.scale;
              $scope.pageActivity.maxWidth = backgroundPosition.width / 3 / $scope.scale;
              $scope.stage.addChild($scope.pageActivity);

              /*Adding page title and description*/
              $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
              $scope.pageDescription.x = backgroundPosition.x + (backgroundPosition.width / 12);
              $scope.pageDescription.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
              $scope.pageDescription.scaleX = $scope.pageDescription.scaleY = $scope.scale;
              $scope.pageDescription.maxWidth = backgroundPosition.width / 3 / $scope.scale;
              $scope.stage.addChild($scope.pageDescription);

              console.log("Waterfall loading title");

              callback();

            }, function (callback) {

              $scope.questionsContainer = new createjs.Container();
              $scope.questionsContainer.width = background.image.width / 1.1;
              $scope.questionsContainer.height = background.image.height / 3;
              $scope.questionsContainer.scaleX = $scope.questionsContainer.scaleY = $scope.scale;
              $scope.questionsContainer.x = backgroundPosition.x + backgroundPosition.width / 16;
              $scope.questionsContainer.y = -1500;
              $scope.stage.addChild($scope.questionsContainer);

              var questionBackground = new createjs.Bitmap($scope.rootDir + "data/assets/spray_choice_text_bubble.png");
              questionBackground.x = 40;
              $scope.questionsContainer.addChild(questionBackground);

              $scope.questionNumber = new createjs.Text("1", "33px Arial", "white");
              $scope.questionNumber.regX = $scope.questionNumber.getBounds().width / 2;
              $scope.questionNumber.regY = $scope.questionNumber.getBounds().height / 2;
              $scope.questionNumber.x = $scope.questionsContainer.width / 10;
              $scope.questionNumber.y = $scope.questionsContainer.height / 7.5;
              $scope.questionNumber.textAlign = "center";
              $scope.questionsContainer.addChild($scope.questionNumber);

              $scope.questionsTextContainer = new createjs.Container();
              $scope.questionsTextContainer.x = $scope.questionsContainer.width / 6;
              $scope.questionsTextContainer.y = $scope.questionsContainer.height / 5;
              $scope.questionsTextContainer.regX = $scope.questionsTextContainer.width / 2;
              $scope.questionsTextContainer.regY = $scope.questionsTextContainer.height / 2;
              $scope.questionsTextContainer.width = $scope.questionsContainer.width / 1.4;
              $scope.questionsTextContainer.height = $scope.questionsContainer.height / 1.5;
              $scope.questionsContainer.addChild($scope.questionsTextContainer);

              callback();

            }, function (callback) {

              $scope.answersContainer = new createjs.Container();
              $scope.answersContainer.width = background.image.width / 1.1;
              $scope.answersContainer.height = background.image.height / 2.8;
              $scope.answersContainer.scaleX = $scope.answersContainer.scaleY = $scope.scale;
              $scope.answersContainer.x = backgroundPosition.x + (backgroundPosition.width / 20);
              $scope.answersContainer.y = +1500;
              $scope.stage.addChild($scope.answersContainer);
              $scope.buttonContainers = {};

              $scope.buttonContainers["LeftaChoice"] = new createjs.Container();
              $scope.buttonContainers["LeftaChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["LeftaChoice"].height = $scope.answersContainer.height / 2;
              $scope.buttonContainers["LeftaChoice"].x = 0;
              $scope.buttonContainers["LeftaChoice"].y = 0;
              $scope.buttonContainers["LeftaChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["LeftaChoice"]);

              $scope.buttonContainers["LeftbChoice"] = new createjs.Container();
              $scope.buttonContainers["LeftbChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["LeftbChoice"].height = $scope.answersContainer.height / 2;
              $scope.buttonContainers["LeftbChoice"].x = 0;
              $scope.buttonContainers["LeftbChoice"].y = $scope.buttonContainers["LeftaChoice"].y + $scope.buttonContainers["LeftaChoice"].height;
              $scope.buttonContainers["LeftbChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["LeftbChoice"]);


              $scope.buttonContainers["RightaChoice"] = new createjs.Container();
              $scope.buttonContainers["RightaChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["RightaChoice"].height = $scope.answersContainer.height / 2;
              $scope.buttonContainers["RightaChoice"].x = $scope.answersContainer.width / 2;
              $scope.buttonContainers["RightaChoice"].y = 0;
              $scope.buttonContainers["RightaChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["RightaChoice"]);

              $scope.buttonContainers["RightbChoice"] = new createjs.Container();
              $scope.buttonContainers["RightbChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["RightbChoice"].height = $scope.answersContainer.height / 2;
              $scope.buttonContainers["RightbChoice"].x = $scope.answersContainer.width / 2;
              $scope.buttonContainers["RightbChoice"].y = $scope.buttonContainers["RightaChoice"].y + $scope.buttonContainers["RightaChoice"].height;
              $scope.buttonContainers["RightbChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["RightbChoice"]);


              $http.get($scope.rootDir + "data/assets/spray_choice_button_sprite.json")
                .success(function (response) {

                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                  var answerButtonSpriteSheet = new createjs.SpriteSheet(response);

                  $scope.buttonChoices = {};
                  $scope.buttonChoicesText = {};

                  $scope.buttonChoices["LeftaChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["LeftaChoice"].regX = $scope.buttonChoices["LeftaChoice"].getBounds().width / 2;
                  $scope.buttonChoices["LeftaChoice"].regY = $scope.buttonChoices["LeftaChoice"].getBounds().height / 2;
                  $scope.buttonChoices["LeftaChoice"].x = $scope.buttonContainers["LeftaChoice"].width / 2;
                  $scope.buttonChoices["LeftaChoice"].y = $scope.buttonContainers["LeftaChoice"].height / 2;
                  $scope.buttonContainers["LeftaChoice"].addChild($scope.buttonChoices["LeftaChoice"]);

                  var answerAButtonLetter = new createjs.Text("a.", "33px Arial", "white");
                  answerAButtonLetter.regX = answerAButtonLetter.getBounds().width / 2;
                  answerAButtonLetter.regY = answerAButtonLetter.getBounds().height / 2;
                  answerAButtonLetter.x = $scope.buttonContainers["LeftaChoice"].width / 4.6;
                  answerAButtonLetter.y = $scope.buttonContainers["LeftaChoice"].height / 1.8;
                  $scope.buttonContainers["LeftaChoice"].addChild(answerAButtonLetter);

                  $scope.buttonChoicesText["LeftaChoice"] = new createjs.Text("Answer A", "25px Arial", "white");
                  $scope.buttonChoicesText["LeftaChoice"].regY = $scope.buttonChoicesText["LeftaChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["LeftaChoice"].regX = $scope.buttonChoicesText["LeftaChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["LeftaChoice"].x = $scope.buttonContainers["LeftaChoice"].width / 1.55;
                  $scope.buttonChoicesText["LeftaChoice"].y = $scope.buttonContainers["LeftaChoice"].height / 1.8;
                  $scope.buttonChoicesText["LeftaChoice"].textAlign = "center";
                  $scope.buttonChoicesText["LeftaChoice"].maxWidth = $scope.buttonChoices["LeftaChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["LeftaChoice"].addChild($scope.buttonChoicesText["LeftaChoice"]);

                  $scope.buttonChoices["LeftaChoice"].addEventListener("pressup", function (event) {
                    console.log("answerAButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice(0, "aChoice");
                    }
                  });


                  $scope.buttonChoices["LeftbChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["LeftbChoice"].regX = $scope.buttonChoices["LeftbChoice"].getBounds().width / 2;
                  $scope.buttonChoices["LeftbChoice"].regY = $scope.buttonChoices["LeftbChoice"].getBounds().height / 2;
                  $scope.buttonChoices["LeftbChoice"].x = $scope.buttonContainers["LeftbChoice"].width / 2;
                  $scope.buttonChoices["LeftbChoice"].y = $scope.buttonContainers["LeftbChoice"].height / 2;
                  $scope.buttonContainers["LeftbChoice"].addChild($scope.buttonChoices["LeftbChoice"]);

                  var answerBButtonLetter = new createjs.Text("b.", "33px Arial", "white");
                  answerBButtonLetter.regX = answerBButtonLetter.getBounds().width / 2;
                  answerBButtonLetter.regY = answerBButtonLetter.getBounds().height / 2;
                  answerBButtonLetter.x = $scope.buttonContainers["LeftbChoice"].width / 4.6;
                  answerBButtonLetter.y = $scope.buttonContainers["LeftbChoice"].height / 1.8;
                  $scope.buttonContainers["LeftbChoice"].addChild(answerBButtonLetter);

                  $scope.buttonChoicesText["LeftbChoice"] = new createjs.Text("Answer B", "25px Arial", "white");
                  $scope.buttonChoicesText["LeftbChoice"].regY = $scope.buttonChoicesText["LeftbChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["LeftbChoice"].regX = $scope.buttonChoicesText["LeftbChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["LeftbChoice"].x = $scope.buttonContainers["LeftbChoice"].width / 1.55;
                  $scope.buttonChoicesText["LeftbChoice"].y = $scope.buttonContainers["LeftbChoice"].height / 1.8;
                  $scope.buttonChoicesText["LeftbChoice"].textAlign = "center";
                  $scope.buttonChoicesText["LeftbChoice"].maxWidth = $scope.buttonChoices["LeftbChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["LeftbChoice"].addChild($scope.buttonChoicesText["LeftbChoice"]);

                  $scope.buttonChoices["LeftbChoice"].addEventListener("pressup", function (event) {
                    console.log("answerBButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice(0, "bChoice");
                    }
                  });

                  $scope.buttonChoices["RightaChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["RightaChoice"].regX = $scope.buttonChoices["RightaChoice"].getBounds().width / 2;
                  $scope.buttonChoices["RightaChoice"].regY = $scope.buttonChoices["RightaChoice"].getBounds().height / 2;
                  $scope.buttonChoices["RightaChoice"].x = $scope.buttonContainers["RightaChoice"].width / 2;
                  $scope.buttonChoices["RightaChoice"].y = $scope.buttonContainers["RightaChoice"].height / 2;
                  $scope.buttonContainers["RightaChoice"].addChild($scope.buttonChoices["RightaChoice"]);

                  var answerAButtonLetter = new createjs.Text("a.", "33px Arial", "white");
                  answerAButtonLetter.regX = answerAButtonLetter.getBounds().width / 2;
                  answerAButtonLetter.regY = answerAButtonLetter.getBounds().height / 2;
                  answerAButtonLetter.x = $scope.buttonContainers["RightaChoice"].width / 4.6;
                  answerAButtonLetter.y = $scope.buttonContainers["RightaChoice"].height / 1.8;
                  $scope.buttonContainers["RightaChoice"].addChild(answerAButtonLetter);

                  $scope.buttonChoicesText["RightaChoice"] = new createjs.Text("Answer A", "25px Arial", "white");
                  $scope.buttonChoicesText["RightaChoice"].regY = $scope.buttonChoicesText["RightaChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["RightaChoice"].regX = $scope.buttonChoicesText["RightaChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["RightaChoice"].x = $scope.buttonContainers["RightaChoice"].width / 1.55;
                  $scope.buttonChoicesText["RightaChoice"].y = $scope.buttonContainers["RightaChoice"].height / 1.8;
                  $scope.buttonChoicesText["RightaChoice"].textAlign = "center";
                  $scope.buttonChoicesText["RightaChoice"].maxWidth = $scope.buttonChoices["RightaChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["RightaChoice"].addChild($scope.buttonChoicesText["RightaChoice"]);


                  $scope.buttonChoices["RightaChoice"].addEventListener("pressup", function (event) {
                    console.log("answerAButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice(1, "aChoice");
                    }
                  });


                  $scope.buttonChoices["RightbChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["RightbChoice"].regX = $scope.buttonChoices["RightbChoice"].getBounds().width / 2;
                  $scope.buttonChoices["RightbChoice"].regY = $scope.buttonChoices["RightbChoice"].getBounds().height / 2;
                  $scope.buttonChoices["RightbChoice"].x = $scope.buttonContainers["RightbChoice"].width / 2;
                  $scope.buttonChoices["RightbChoice"].y = $scope.buttonContainers["RightbChoice"].height / 2;
                  $scope.buttonContainers["RightbChoice"].addChild($scope.buttonChoices["RightbChoice"]);

                  var answerBButtonLetter = new createjs.Text("b.", "33px Arial", "white");
                  answerBButtonLetter.regX = answerBButtonLetter.getBounds().width / 2;
                  answerBButtonLetter.regY = answerBButtonLetter.getBounds().height / 2;
                  answerBButtonLetter.x = $scope.buttonContainers["RightbChoice"].width / 4.6;
                  answerBButtonLetter.y = $scope.buttonContainers["RightbChoice"].height / 1.8;
                  $scope.buttonContainers["RightbChoice"].addChild(answerBButtonLetter);

                  $scope.buttonChoicesText["RightbChoice"] = new createjs.Text("Answer B", "25px Arial", "white");
                  $scope.buttonChoicesText["RightbChoice"].regY = $scope.buttonChoicesText["RightbChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["RightbChoice"].regX = $scope.buttonChoicesText["RightbChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["RightbChoice"].x = $scope.buttonContainers["RightbChoice"].width / 1.55;
                  $scope.buttonChoicesText["RightbChoice"].y = $scope.buttonContainers["RightbChoice"].height / 1.8;
                  $scope.buttonChoicesText["RightbChoice"].textAlign = "center";
                  $scope.buttonChoicesText["RightbChoice"].maxWidth = $scope.buttonChoices["RightbChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["RightbChoice"].addChild($scope.buttonChoicesText["RightbChoice"]);

                  $scope.buttonChoices["RightbChoice"].addEventListener("pressup", function (event) {
                    console.log("answerBButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice(1, "bChoice");
                    }
                  });

                  callback();
                });

            }, function (callback) {

              $scope.navigatorContainer = new createjs.Container();
              $scope.navigatorContainer.width = background.image.width / 1.1;
              $scope.navigatorContainer.height = background.image.height / 8;
              $scope.navigatorContainer.scaleX = $scope.navigatorContainer.scaleY = $scope.scale;
              $scope.navigatorContainer.x = backgroundPosition.x + (backgroundPosition.width / 22);
              $scope.navigatorContainer.y = backgroundPosition.y + (backgroundPosition.height / 1.28);
              $scope.stage.addChild($scope.navigatorContainer);

              var yellowBar = new createjs.Bitmap($scope.rootDir + "data/assets/lesson_yellow_line.png");
              yellowBar.scaleX = 1.15;
              //yellowBar.regX = yellowBar.image.width / 2;
              //yellowBar.regY = yellowBar.image.height / 2;
              yellowBar.x = 20;
              yellowBar.y = 30;
              $scope.navigatorContainer.addChild(yellowBar);

              /*Yellow bar button Sprite Button*/
              $http.get($scope.rootDir + "data/assets/yellow_line_big_bubble.json")
                .success(function (response) {

                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var yellowBarButtonSpriteSheet = new createjs.SpriteSheet(response);

                  $scope.yellowBarContainers = {};
                  var buttonWidth = $scope.navigatorContainer.width / ($scope.activityData.questions.length + 1);

                  _.each($scope.activityData.questions, function (question, key, list) {

                    $scope.yellowBarContainers[key] = new createjs.Container();
                    $scope.yellowBarContainers[key].width = buttonWidth;
                    $scope.yellowBarContainers[key].height = $scope.navigatorContainer.height;
                    $scope.yellowBarContainers[key].regY = $scope.yellowBarContainers[key].height / 2;
                    $scope.yellowBarContainers[key].regX = $scope.yellowBarContainers[key].width / 2;
                    $scope.yellowBarContainers[key].x = $scope.yellowBarContainers[key].width + $scope.yellowBarContainers[key].width * key;
                    $scope.yellowBarContainers[key].y = $scope.yellowBarContainers[key].height / 2;
                    $scope.navigatorContainer.addChild($scope.yellowBarContainers[key]);

                    $scope.yellowBarContainers[key].yellowBarButtons = {};
                    $scope.yellowBarContainers[key].yellowBarButtons[key] = new createjs.Sprite(yellowBarButtonSpriteSheet, "white");
                    $scope.yellowBarContainers[key].yellowBarButtons[key].regX = $scope.yellowBarContainers[key].yellowBarButtons[key].getBounds().width / 2;
                    $scope.yellowBarContainers[key].yellowBarButtons[key].regY = $scope.yellowBarContainers[key].yellowBarButtons[key].getBounds().height / 2;
                    $scope.yellowBarContainers[key].yellowBarButtons[key].x = $scope.yellowBarContainers[key].width / 2;
                    $scope.yellowBarContainers[key].yellowBarButtons[key].y = $scope.yellowBarContainers[key].height / 2.3;


                    $scope.yellowBarContainers[key].yellowBarButtons[key].addEventListener("pressup", function (event) {

                      pressOnYellowBar(key);

                    });

                    $scope.yellowBarContainers[key].addChild($scope.yellowBarContainers[key].yellowBarButtons[key]);
                    var yellowBarButtonIndex = new createjs.Text(key + 1, "15px Arial", "black");
                    yellowBarButtonIndex.regY = yellowBarButtonIndex.getBounds().height / 2;
                    yellowBarButtonIndex.x = $scope.yellowBarContainers[key].width / 2.15;
                    yellowBarButtonIndex.y = $scope.yellowBarContainers[key].height / 6;
                    yellowBarButtonIndex.textAlign = "center";
                    $scope.yellowBarContainers[key].addChild(yellowBarButtonIndex);

                  });
                  callback();

                })
                .error(function (error) {
                  console.error("Error on getting json for answer button...", error);
                  callback();
                });
            }
          ],
          function (err, response) {
            console.log("General Callback and init");

            init();
          });


        function selectChoice(key, choice) {

          $scope.buttonChoices[(key ? "Right" : "Left") + choice].gotoAndPlay("yellow");
          _.each($scope.buttonChoices, function (c, index, l) {
            if (index !== (key ? "Right" + choice : "Left" + choice) && index.indexOf((key ? "Right" : "Left")) !== -1) {
              $scope.buttonChoices[index].gotoAndPlay("white");
            }
          });


          $scope.activityData.questions[$scope.activeQuestionIndex].questions[key].userAnswer = choice;

          if ($scope.activityData.questions[$scope.activeQuestionIndex].questions[0].userAnswer && $scope.activityData.questions[$scope.activeQuestionIndex].questions[1].userAnswer) {
            $scope.yellowBarContainers[$scope.activeQuestionIndex].yellowBarButtons[$scope.activeQuestionIndex].gotoAndPlay("yellow");
          }

          if ($scope.activityData.questions[$scope.activeQuestionIndex].questions[key].midtext) {

            var splittedText = $scope.buttonChoicesText[(key ? "Right" : "Left") + choice].text.split("...");
            $scope.firstGap[key].text = splittedText[0];
            $scope.secondGap[key].text = splittedText[1];

            $scope.firstGap[key].color = "black";
            $scope.secondGap[key].color = "black";

          } else {

            $scope.firstGap[key].text = $scope.buttonChoicesText[(key ? "Right" : "Left") + choice].text;
            $scope.firstGap[key].color = "black";

          }

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        function init() {
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          _.each($scope.activityData.questions, function (question, k, list) {
            if (k !== 0) {
              $scope.yellowBarContainers[k].scaleX = $scope.yellowBarContainers[k].scaleY = 1;
            }

            if (question.questions[0].userAnswer && question.questions[1].userAnswer) {

              if (!$scope.activityData.newGame) {
                if (question.questions[0].userAnswer === question.questions[0].answerChoice && question.questions[1].userAnswer === question.questions[1].answerChoice) {
                  $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("green");
                } else {
                  $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("red");
                }
              } else {
                $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("yellow");
              }
            }

          });
          loadQuestion(0);

          if (!$scope.activityData.newGame) {
            score();
          }
        }


        function loadQuestion(key) {

          $scope.activeQuestionIndex = key;
          $scope.questionNumber.text = key + 1;
          console.log("numChildren", $scope.questionsTextContainer.numChildren);
          $scope.questionsTextContainer.removeAllChildren();
          console.log("question", $scope.activityData.questions[key]);
          var question = $scope.activityData.questions[key];

          _.each($scope.buttonChoices, function (c, k, l) {
            $scope.buttonChoices[k].gotoAndPlay("white");
            $scope.buttonChoicesText[k].color = "white";
            $scope.buttonContainers[k].visible = false;
          });

          if (question.questions[0].userAnswer) {
            $scope.buttonChoices["Left" + question.questions[0].userAnswer].gotoAndPlay("yellow");
          }
          if (question.questions[1].userAnswer) {
            $scope.buttonChoices["Right" + question.questions[1].userAnswer].gotoAndPlay("yellow");
          }


          $scope.buttonContainers["LeftaChoice"].visible = true;
          $scope.buttonChoicesText["LeftaChoice"].text = question.questions[0].aChoice;

          $scope.buttonContainers["LeftbChoice"].visible = true;
          $scope.buttonChoicesText["LeftbChoice"].text = question.questions[0].bChoice;


          $scope.buttonContainers["RightaChoice"].visible = true;
          $scope.buttonChoicesText["RightaChoice"].text = question.questions[1].aChoice;

          $scope.buttonContainers["RightbChoice"].visible = true;
          $scope.buttonChoicesText["RightbChoice"].text = question.questions[1].bChoice;


          $scope.totalPositionY = 0;
          if (question.generalText) {
            var generalText = new createjs.Text(question.generalText, "22px Arial", "black");
            generalText.y = 0;
            $scope.questionsTextContainer.addChild(generalText);
            $scope.totalPositionY = 40;
          }

          positionQuestionText(0, question.questions[0], key);
          positionQuestionText(1, question.questions[1], key);


          //Alrready saved!
          if (!$scope.activityData.newGame) {

            if (question.questions[0].userAnswer === question.questions[0].answerChoice) {

              $scope.buttonChoices["Left" + question.questions[0].userAnswer].gotoAndPlay("green");
              $scope.buttonChoicesText["Left" + question.questions[0].userAnswer].color = "white";

            } else if (question.questions[0].userAnswer) {

              $scope.buttonChoices["Left" + question.questions[0].answerChoice].gotoAndPlay("green");
              $scope.buttonChoicesText["Left" + question.questions[0].answerChoice].color = "white";

              $scope.buttonChoices["Left" + question.questions[0].userAnswer].gotoAndPlay("red");
              $scope.buttonChoicesText["Left" + question.questions[0].userAnswer].color = "white";

            } else {

              $scope.buttonChoicesText["Left" + question.questions[0].answerChoice].color = "white";
              $scope.buttonChoices["Left" + question.questions[0].answerChoice].gotoAndPlay("red");

              if (question.questions[0].midtext) {
                var splittedText = $scope.buttonChoicesText["Left" + question.questions[0].answerChoice].text.split("...");
                $scope.firstGap[0].text = splittedText[0];
                $scope.secondGap[0].text = splittedText[1];
                $scope.firstGap[0].color = "black";
                $scope.secondGap[0].color = "black";
              } else {
                $scope.firstGap[0].text = $scope.buttonChoicesText["Left" + question.questions[0].answerChoice].text;
                $scope.firstGap[0].color = "black";
              }

            }


            if (question.questions[1].userAnswer === question.questions[1].answerChoice) {

              $scope.buttonChoices["Right" + question.questions[1].userAnswer].gotoAndPlay("green");
              $scope.buttonChoicesText["Right" + question.questions[1].userAnswer].color = "white";

            } else if (question.questions[1].userAnswer) {

              $scope.buttonChoices["Right" + question.questions[1].answerChoice].gotoAndPlay("green");
              $scope.buttonChoicesText["Right" + question.questions[1].answerChoice].color = "white";

              $scope.buttonChoices["Right" + question.questions[1].userAnswer].gotoAndPlay("red");
              $scope.buttonChoicesText["Right" + question.questions[1].userAnswer].color = "white";

            } else {

              $scope.buttonChoicesText["Right" + question.questions[1].answerChoice].color = "white";
              $scope.buttonChoices["Right" + question.questions[1].answerChoice].gotoAndPlay("red");

              if (question.questions[1].midtext) {
                var splittedText = $scope.buttonChoicesText["Right" + question.questions[1].answerChoice].text.split("...");
                $scope.firstGap[1].text = splittedText[0];
                $scope.secondGap[1].text = splittedText[1];
                $scope.firstGap[1].color = "black";
                $scope.secondGap[1].color = "black";
              } else {
                $scope.firstGap[1].text = $scope.buttonChoicesText["Right" + question.questions[1].answerChoice].text;
                $scope.firstGap[1].color = "black";
              }

            }

            if (question.questions[0].capitalized) {
              $scope.firstGap[0].text = $scope.firstGap[1].text[0].toUpperCase() + $scope.firstGap[0].text.substr(1);
            }

            if (question.questions[1].capitalized) {
              $scope.firstGap[1].text = $scope.firstGap[1].text[0].toUpperCase() + $scope.firstGap[1].text.substr(1);
            }

          }

          createjs.Tween.get($scope.answersContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 2.5)
            }, 300, createjs.Ease.getPowIn(2)).call(function () {
          });

          createjs.Tween.get($scope.questionsContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 8)
            }, 300, createjs.Ease.getPowIn(2));

        }

        var checkFirstCharOfPhrase = function (word) {
          if (word[0] !== "," && word[0] !== "." && word[0] !== "!" && word[0] !== ":" && word[0] !== ";" && word[0] !== "?") {
            word = " " + word;
          }
          return word;
        };
        var checkLastCharIfEmpty = function (word) {
          if (word[word.length - 1] !== " ") {
            word = word + " ";
          }
          return word;
        };

        var positionQuestionText = function (index, question, key) {


          console.warn("totalPositionY", $scope.totalPositionY);

          console.log(question);
          var pretexts = question.pretext.split("\n");
          var currentPretexts = {};
          var textHeight = 40;

          if (index === 1) {
            $scope.totalPositionY = $scope.totalPositionY + textHeight;
          }

          _.each(pretexts, function (text, l, li) {
            if (!text) {
              text = " ";
            }
            text = checkLastCharIfEmpty(text);
            currentPretexts[l] = new createjs.Text(text, "22px Arial", "black");
            currentPretexts[l].y = $scope.totalPositionY + textHeight * l;
            $scope.questionsTextContainer.addChild(currentPretexts[l]);
          });

          var firstGap = "_________________";
          if (question.firstGap) {
            firstGap = question.firstGap;
          }

          $scope.firstGap[index] = new createjs.Text(firstGap, "22px Arial", "black");
          $scope.firstGap[index].x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
          $scope.firstGap[index].y = currentPretexts[pretexts.length - 1].y;
          $scope.totalPositionY = currentPretexts[pretexts.length - 1].y;
          console.log("$scope.totalPositionY", $scope.totalPositionY);
          $scope.questionsTextContainer.addChild($scope.firstGap[index]);

          var firstGapUnderlinedText = $scope.firstGap[index].clone();
          $scope.questionsTextContainer.addChild(firstGapUnderlinedText);
          $scope.firstGap[index].textAlign = "center";
          $scope.firstGap[index].maxWidth = firstGapUnderlinedText.getBounds().width * 0.9;
          $scope.firstGap[index].x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width + firstGapUnderlinedText.getBounds().width / 2;

          if (question.midtext) {

            var midtexts = question.midtext.split("\n");
            console.log("midtexts", midtexts.length);
            var currentMidtexts = {};

            _.each(midtexts, function (text, l, li) {
              if (!text) {
                text = " ";
              }
              text = checkLastCharIfEmpty(text);
              text = checkFirstCharOfPhrase(text);
              currentMidtexts[l] = new createjs.Text(text, "22px Arial", "black");
              currentMidtexts[l].y = pretexts.length * textHeight + textHeight * l;
              console.log("currentMidtexts[l].y ", currentMidtexts[l].y);
              $scope.questionsTextContainer.addChild(currentMidtexts[l]);
            });


            var secondGap = "_________________";
            if (question.secondGap) {
              secondGap = question.secondGap;
            }
            $scope.secondGap[index] = new createjs.Text(secondGap, "22px Arial", "black");
            $scope.secondGap[index].x = currentMidtexts[pretexts.length - 1].x + currentMidtexts[pretexts.length - 1].getBounds().width;
            $scope.secondGap[index].y = currentMidtexts[pretexts.length - 1].y;
            $scope.questionsTextContainer.addChild($scope.secondGap[index]);

            var secondGapUnderlinedText = $scope.secondGap[index].clone();
            $scope.questionsTextContainer.addChild(secondGapUnderlinedText);

            $scope.secondGap[index].textAlign = "center";
            $scope.secondGap[index].maxWidth = secondGapUnderlinedText.getBounds().width * 0.9;
            $scope.secondGap[index].x = currentMidtexts[pretexts.length - 1].x + currentMidtexts[pretexts.length - 1].getBounds().width + secondGapUnderlinedText.getBounds().width / 2;

            if (question.postext) {
              var postextsWithMid = question.postext.split("\n");
              var currentPostextsWithMid = {};

              if (postextsWithMid.length > 1) {
                if (!postextsWithMid[0]) {
                  postextsWithMid[0] = " ";
                }

                postextsWithMid[0] = checkFirstCharOfPhrase(postextsWithMid[0]);
                currentPostextsWithMid[0] = new createjs.Text(postextsWithMid[0], "22px Arial", "black");
                currentPostextsWithMid[0].x = secondGapUnderlinedText.x + secondGapUnderlinedText.getBounds().width;
                currentPostextsWithMid[0].y = secondGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostextsWithMid[0]);

                postextsWithMid[1] = checkFirstCharOfPhrase(postextsWithMid[1]);

                currentPostextsWithMid[1] = new createjs.Text(postextsWithMid[1], "22px Arial", "black");
                currentPostextsWithMid[1].x = 0;
                currentPostextsWithMid[1].y = currentPostextsWithMid[0].y + textHeight;
                $scope.questionsTextContainer.addChild(currentPostextsWithMid[1]);

                $scope.totalPositionY = currentPostextsWithMid[1].y;

              } else {
                postextsWithMid[0] = checkFirstCharOfPhrase(postextsWithMid[0]);
                currentPostextsWithMid[0] = new createjs.Text(postextsWithMid[0], "22px Arial", "black");
                currentPostextsWithMid[0].x = secondGapUnderlinedText.x + secondGapUnderlinedText.getBounds().width;
                currentPostextsWithMid[0].y = secondGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostextsWithMid[0]);

                $scope.totalPositionY = currentPostextsWithMid[1].y;

              }
            }
          } else {

            if (question.postext) {

              var postexts = question.postext.split("\n");
              var currentPostexts = {};
              if (postexts.length > 1) {
                if (!postexts[0]) {
                  postexts[0] = " ";
                }
                postexts[0] = checkFirstCharOfPhrase(postexts[0]);

                currentPostexts[0] = new createjs.Text(postexts[0], "22px Arial", "black");
                currentPostexts[0].x = firstGapUnderlinedText.x + firstGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = firstGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);

                postexts[1] = checkFirstCharOfPhrase(postexts[1]);
                currentPostexts[1] = new createjs.Text(postexts[1], "22px Arial", "black");
                currentPostexts[1].x = 0;
                currentPostexts[1].y = currentPostexts[0].y + textHeight;
                $scope.questionsTextContainer.addChild(currentPostexts[1]);

                $scope.totalPositionY = currentPostexts[1].y;
              } else {
                postexts[0] = checkFirstCharOfPhrase(postexts[0]);

                currentPostexts[0] = new createjs.Text(postexts[0], "22px Arial", "black");
                currentPostexts[0].x = firstGapUnderlinedText.x + firstGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = firstGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);

                $scope.totalPositionY = currentPostexts[0].y;

              }

            }

          }

          if (question.userAnswer) {
            if ($scope.activityData.newGame) {
              if (question.midtext) {
                var splittedText = question[question.userAnswer].split("...");
                $scope.firstGap[index].text = splittedText[0];
                $scope.secondGap[index].text = splittedText[1];
                $scope.firstGap[index].color = "black";
                $scope.secondGap[index].color = "black";
              } else {
                $scope.firstGap[index].text = question[question.userAnswer];
                $scope.firstGap[index].color = "black";
              }
            } else {
              if (question.midtext) {
                var splittedText = question[question.answerChoice].split("...");
                $scope.firstGap[index].text = splittedText[0];
                $scope.secondGap[index].text = splittedText[1];
                $scope.firstGap[index].color = "black";
                $scope.secondGap[index].color = "black";
              } else {
                $scope.firstGap[index].text = question[question.answerChoice];
                $scope.firstGap[index].color = "black";
              }
            }
          }
        };

        function pressOnYellowBar(key) {

          $scope.yellowBarContainers[key].scaleX = $scope.yellowBarContainers[key].scaleY = 1.4;
          _.each($scope.activityData.questions, function (question, k, list) {
            if (k !== key) {
              $scope.yellowBarContainers[k].scaleX = $scope.yellowBarContainers[k].scaleY = 1;
            }
          });
          $scope.stage.update();

          async.parallel([function (parallelCallback) {

            createjs.Tween.get($scope.answersContainer, {loop: false})
              .to({
                y: +1000 * $scope.scale
              }, 300, createjs.Ease.getPowIn(2)).call(function () {
              parallelCallback();
            });

          }, function (parallelCallback) {

            createjs.Tween.get($scope.questionsContainer, {loop: false})
              .to({
                y: -1000 * $scope.scale
              }, 300, createjs.Ease.getPowIn(2)).call(function () {
              parallelCallback();
            });
          }], function (err, response) {
            loadQuestion(key);
          });

        }

        /*Function that restarts the exercise*/
        function restart() {

          $scope.nextButton.gotoAndPlay("normal");

          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");

          $scope.activityData.newGame = true;

          _.each($scope.activityData.questions, function (question, key, value) {
            $scope.activityData.questions[key].questions[0].userAnswer = "";
            $scope.activityData.questions[key].questions[1].userAnswer = "";

            $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("white");
            if (key !== 0) {
              $scope.yellowBarContainers[key].scaleX = $scope.yellowBarContainers[key].scaleY = 1;
            }
          });
          $scope.resultsButton.visible = false;
          $scope.endText.visible = false;
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          loadQuestion(0);
        }

        /*Function that calculates score*/
        function score() {

          console.log("score");

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, value) {
            console.log("Question " + key + " answer", question.userAnswer);

            if (question.questions[0].userAnswer === question.questions[0].answerChoice) {
              rightAnswers++;
            }

            if (question.questions[1].userAnswer === question.questions[1].answerChoice) {
              rightAnswers++;
            }

            if (question.questions[0].userAnswer === question.questions[0].answerChoice && question.questions[1].userAnswer === question.questions[1].answerChoice) {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("green");
            } else {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("red");
            }
          });

          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length * 2;

          $scope.activityData.score = rightAnswers;
          console.log("Completed Activity!");
          $scope.checkButton.alpha = 0.5;
          $scope.activityData.completed = true;
          $scope.nextButton.gotoAndPlay("onSelection");

          if (_.findIndex($scope.selectedLesson.activitiesMenu, {
              activityFolder: $scope.activityFolder
            }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

            $scope.resultsButton.visible = true;
            $scope.endText.visible = true;
            $scope.nextButton.visible = false;

          } else {
            console.log("Activity is not the last one");
            console.log("index", _.findIndex($scope.selectedLesson.activitiesMenu, {
                activityFolder: $scope.activityFolder
              }) + 1);
            console.log("activities", $scope.selectedLesson.activitiesMenu.length);
          }

          if ($scope.activityData.newGame) {
            $scope.activityData.attempts += 1;
            $scope.activityData.newGame = false;
          }

          pressOnYellowBar(0);
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

      });//end of image on complete
    }, 1500);
//end of timeout
  })
;

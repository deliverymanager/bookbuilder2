angular.module("bookbuilder2")
  .controller("MultipleSprayWithImageController", function ($scope, $ionicPlatform, $timeout, $http, _, $rootScope, Toast) {

    console.log("MultipleSprayWithImageController loaded!");
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

            var loadingBitmaps = [];

            _.each($scope.activityData.questions, function (file, key, list) {

              loadingBitmaps.push(function (seriesCallback) {
                var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/" + (key + 1) + ".png"
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

            $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "27px Arial", "white");
            $scope.scoreText.scaleX = $scope.scoreText.scaleY = $scope.scale;
            $scope.scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.35);
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
                returnButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
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
                  $scope.checkButton.x = backgroundPosition.x + (backgroundPosition.width / 1.7);
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

            }, function (callback) {

              /*Adding page title and description $scope.activityData.title*/
              $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "18px Arial", "white");
              $scope.pageTitle.x = backgroundPosition.x + (backgroundPosition.width / 8);
              $scope.pageTitle.y = backgroundPosition.y + (backgroundPosition.width / 27);
              $scope.pageTitle.textBaseline = "alphabetic";
              $scope.pageTitle.scaleX = $scope.pageTitle.scaleY = $scope.scale;
              $scope.pageTitle.maxWidth = backgroundPosition.width / 2 / $scope.scale;
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
              //questionBackground.regY = questionBackground.image.height / 2;
              //questionBackground.regX = questionBackground.image.width / 2;
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

              $scope.imageContainer = new createjs.Container();
              $scope.imageContainer.width = $scope.answersContainer.width / 2;
              $scope.imageContainer.height = $scope.answersContainer.height;
              $scope.answersContainer.addChild($scope.imageContainer);

              $scope.buttonContainers["aChoice"] = new createjs.Container();
              $scope.buttonContainers["aChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["aChoice"].height = $scope.answersContainer.height / 3;
              $scope.buttonContainers["aChoice"].x = $scope.answersContainer.width / 2;
              $scope.buttonContainers["aChoice"].y = 0;
              $scope.buttonContainers["aChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["aChoice"]);


              $scope.buttonContainers["bChoice"] = new createjs.Container();
              $scope.buttonContainers["bChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["bChoice"].height = $scope.answersContainer.height / 3;
              $scope.buttonContainers["bChoice"].x = $scope.answersContainer.width / 2;
              $scope.buttonContainers["bChoice"].y = $scope.buttonContainers["aChoice"].y + $scope.buttonContainers["aChoice"].height;
              $scope.buttonContainers["bChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["bChoice"]);

              $scope.buttonContainers["cChoice"] = new createjs.Container();
              $scope.buttonContainers["cChoice"].width = $scope.answersContainer.width / 2;
              $scope.buttonContainers["cChoice"].height = $scope.answersContainer.height / 3;
              $scope.buttonContainers["cChoice"].x = $scope.answersContainer.width / 2;
              $scope.buttonContainers["cChoice"].y = $scope.buttonContainers["bChoice"].y + $scope.buttonContainers["bChoice"].height;
              $scope.buttonContainers["cChoice"].visible = false;
              $scope.answersContainer.addChild($scope.buttonContainers["cChoice"]);


              $http.get($scope.rootDir + "data/assets/spray_choice_button_sprite.json")
                .success(function (response) {

                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                  var answerButtonSpriteSheet = new createjs.SpriteSheet(response);

                  $scope.buttonChoices = {};
                  $scope.buttonChoicesText = {};

                  $scope.buttonChoices["aChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["aChoice"].regX = $scope.buttonChoices["aChoice"].getBounds().width / 2;
                  $scope.buttonChoices["aChoice"].regY = $scope.buttonChoices["aChoice"].getBounds().height / 2;
                  $scope.buttonChoices["aChoice"].x = $scope.buttonContainers["aChoice"].width / 2;
                  $scope.buttonChoices["aChoice"].y = $scope.buttonContainers["aChoice"].height / 2;
                  $scope.buttonContainers["aChoice"].addChild($scope.buttonChoices["aChoice"]);

                  var answerAButtonLetter = new createjs.Text("a.", "33px Arial", "white");
                  answerAButtonLetter.regX = answerAButtonLetter.getBounds().width / 2;
                  answerAButtonLetter.regY = answerAButtonLetter.getBounds().height / 2;
                  answerAButtonLetter.x = $scope.buttonContainers["aChoice"].width / 4.6;
                  answerAButtonLetter.y = $scope.buttonContainers["aChoice"].height / 1.8;
                  $scope.buttonContainers["aChoice"].addChild(answerAButtonLetter);

                  $scope.buttonChoicesText["aChoice"] = new createjs.Text("Answer A", "25px Arial", "white");
                  $scope.buttonChoicesText["aChoice"].regY = $scope.buttonChoicesText["aChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["aChoice"].regX = $scope.buttonChoicesText["aChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["aChoice"].x = $scope.buttonContainers["aChoice"].width / 1.45;
                  $scope.buttonChoicesText["aChoice"].y = $scope.buttonContainers["aChoice"].height / 1.8;
                  $scope.buttonChoicesText["aChoice"].maxWidth = $scope.buttonChoices["aChoice"].getBounds().width * 0.7;
                  $scope.buttonChoicesText["aChoice"].textAlign = "center";
                  $scope.buttonContainers["aChoice"].addChild($scope.buttonChoicesText["aChoice"]);


                  $scope.buttonChoices["aChoice"].addEventListener("pressup", function (event) {
                    console.log("answerAButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice("aChoice");
                    }
                  });


                  $scope.buttonChoices["bChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["bChoice"].regX = $scope.buttonChoices["bChoice"].getBounds().width / 2;
                  $scope.buttonChoices["bChoice"].regY = $scope.buttonChoices["bChoice"].getBounds().height / 2;
                  $scope.buttonChoices["bChoice"].x = $scope.buttonContainers["bChoice"].width / 2;
                  $scope.buttonChoices["bChoice"].y = $scope.buttonContainers["bChoice"].height / 2;
                  $scope.buttonContainers["bChoice"].addChild($scope.buttonChoices["bChoice"]);

                  var answerBButtonLetter = new createjs.Text("b.", "33px Arial", "white");
                  answerBButtonLetter.regX = answerBButtonLetter.getBounds().width / 2;
                  answerBButtonLetter.regY = answerBButtonLetter.getBounds().height / 2;
                  answerBButtonLetter.x = $scope.buttonContainers["bChoice"].width / 4.6;
                  answerBButtonLetter.y = $scope.buttonContainers["bChoice"].height / 1.8;
                  $scope.buttonContainers["bChoice"].addChild(answerBButtonLetter);

                  $scope.buttonChoicesText["bChoice"] = new createjs.Text("Answer B", "25px Arial", "white");
                  $scope.buttonChoicesText["bChoice"].regY = $scope.buttonChoicesText["bChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["bChoice"].regX = $scope.buttonChoicesText["bChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["bChoice"].x = $scope.buttonContainers["bChoice"].width / 1.45;
                  $scope.buttonChoicesText["bChoice"].y = $scope.buttonContainers["bChoice"].height / 1.8;
                  $scope.buttonChoicesText["bChoice"].textAlign = "center";
                  $scope.buttonChoicesText["bChoice"].maxWidth = $scope.buttonChoices["bChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["bChoice"].addChild($scope.buttonChoicesText["bChoice"]);

                  $scope.buttonChoices["bChoice"].addEventListener("pressup", function (event) {
                    console.log("answerBButton fires pressup event!");
                    if ($scope.activityData.newGame) {

                      selectChoice("bChoice");
                    }
                  });

                  $scope.buttonChoices["cChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                  $scope.buttonChoices["cChoice"].regX = $scope.buttonChoices["cChoice"].getBounds().width / 2;
                  $scope.buttonChoices["cChoice"].regY = $scope.buttonChoices["cChoice"].getBounds().height / 2;
                  $scope.buttonChoices["cChoice"].x = $scope.buttonContainers["cChoice"].width / 2;
                  $scope.buttonChoices["cChoice"].y = $scope.buttonContainers["cChoice"].height / 2;
                  $scope.buttonContainers["cChoice"].addChild($scope.buttonChoices["cChoice"]);


                  var answerCButtonLetter = new createjs.Text("c.", "33px Arial", "white");
                  answerCButtonLetter.regX = answerCButtonLetter.getBounds().width / 2;
                  answerCButtonLetter.regY = answerCButtonLetter.getBounds().height / 2;
                  answerCButtonLetter.x = $scope.buttonContainers["cChoice"].width / 4.6;
                  answerCButtonLetter.y = $scope.buttonContainers["cChoice"].height / 1.8;
                  $scope.buttonContainers["cChoice"].addChild(answerCButtonLetter);

                  $scope.buttonChoicesText["cChoice"] = new createjs.Text("Answer C", "25px Arial", "white");
                  $scope.buttonChoicesText["cChoice"].regY = $scope.buttonChoicesText["cChoice"].getBounds().height / 2;
                  $scope.buttonChoicesText["cChoice"].regX = $scope.buttonChoicesText["cChoice"].getBounds().width / 2;
                  $scope.buttonChoicesText["cChoice"].x = $scope.buttonContainers["cChoice"].width / 1.45;
                  $scope.buttonChoicesText["cChoice"].y = $scope.buttonContainers["cChoice"].height / 1.8;
                  $scope.buttonChoicesText["cChoice"].textAlign = "center";
                  $scope.buttonChoicesText["cChoice"].maxWidth = $scope.buttonChoices["cChoice"].getBounds().width * 0.7;
                  $scope.buttonContainers["cChoice"].addChild($scope.buttonChoicesText["cChoice"]);


                  $scope.buttonChoices["cChoice"].addEventListener("pressup", function (event) {
                    console.log("answerCButton fires pressup event!");
                    if ($scope.activityData.newGame) {
                      selectChoice("cChoice");
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

        function selectChoice(choice) {
          console.log("choice", choice);

          $scope.buttonChoices[choice].gotoAndPlay("yellow");
          _.each($scope.buttonChoices, function (c, key, l) {
            if (key !== choice) {
              $scope.buttonChoices[key].gotoAndPlay("white");
            }
          });


          $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer = choice;

          $scope.yellowBarContainers[$scope.activeQuestionIndex].yellowBarButtons[$scope.activeQuestionIndex].gotoAndPlay("yellow");

          if ($scope.activityData.questions[$scope.activeQuestionIndex].midtext) {
            var splittedText = $scope.buttonChoicesText[choice].text.split("...");
            $scope.firstGap.text = splittedText[0];
            $scope.secondGap.text = splittedText[1];
            $scope.firstGap.color = "black";
            $scope.secondGap.color = "black";
          } else {
            $scope.firstGap.text = $scope.buttonChoicesText[choice].text;
            $scope.firstGap.color = "black";
          }

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };

        function init() {
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          _.each($scope.activityData.questions, function (question, k, list) {
            if (k !== 0) {
              $scope.yellowBarContainers[k].scaleX = $scope.yellowBarContainers[k].scaleY = 1;
            }

            if (question.userAnswer) {
              if (!$scope.activityData.newGame) {
                if (question.userAnswer === question.answerChoice) {
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

          if (question.userAnswer) {
            if (question.userAnswer === "cChoice") {
              $scope.buttonChoices["cChoice"].gotoAndPlay("yellow");
            } else {
              $scope.buttonChoices[question.userAnswer].gotoAndPlay("yellow");
            }
          }

          $scope.imageContainer.removeAllChildren();
          $scope.questionImage = new createjs.Bitmap($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/" + (key + 1) + ".png");
          $scope.questionImage.x = 0;
          //$scope.questionImage.regX = $scope.questionImage.image.width / 2;
          $scope.imageContainer.addChild($scope.questionImage);

          $scope.buttonContainers["aChoice"].visible = true;
          $scope.buttonContainers["bChoice"].visible = true;
          $scope.buttonChoicesText["aChoice"].text = question.aChoice;
          $scope.buttonChoicesText["bChoice"].text = question.bChoice;

          if (question.cChoice) {
            $scope.buttonContainers["cChoice"].visible = true;
            $scope.buttonChoicesText["cChoice"].text = question.cChoice;
          }

          positionQuestionText(question, key);


          if (!$scope.activityData.newGame) {

            console.log("UserAnswer", question.userAnswer);
            console.log("answerChoice", question.answerChoice);

            if (question.userAnswer === question.answerChoice) {

              if (question.userAnswer === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("green");
                $scope.buttonChoicesText["cChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.userAnswer].gotoAndPlay("green");
                $scope.buttonChoicesText[question.userAnswer].color = "white";
              }

            } else if (question.userAnswer) {

              if (question.answerChoice === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("green");
                $scope.buttonChoicesText["cChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.answerChoice].gotoAndPlay("green");
                $scope.buttonChoicesText[question.answerChoice].color = "white";
              }

              if (question.userAnswer === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("red");
                $scope.buttonChoicesText["cChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.userAnswer].gotoAndPlay("red");
                $scope.buttonChoicesText[question.userAnswer].color = "white";
              }

            } else {

              if (question.answerChoice === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("red");
                $scope.buttonChoicesText["cChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.answerChoice].gotoAndPlay("red");
                $scope.buttonChoicesText[question.answerChoice].color = "white";
              }

              if (question.midtext) {
                var splittedText = question[question.answerChoice].split("...");
                $scope.firstGap.text = splittedText[0];
                $scope.secondGap.text = splittedText[1];
                $scope.firstGap.color = "black";
                $scope.secondGap.color = "black";
              } else {
                $scope.firstGap.text = question[question.answerChoice];
                $scope.firstGap.color = "black";
              }

            }

            if (question.capitalized) {
              $scope.firstGap.text = $scope.firstGap.text[0].toUpperCase() + $scope.firstGap.text.substr(1);
            }

          }

          createjs.Tween.get($scope.answersContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 2.5)
            }, 300, createjs.Ease.getPowIn(2)).call(function () {
          });

          createjs.Tween.get($scope.questionsContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 10)
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

        var positionQuestionText = function (question, key) {

          var pretexts = question.pretext.split("\n");
          var currentPretexts = {};
          var textHeight = 40;
          _.each(pretexts, function (text, l, li) {
            if (!text) {
              text = " ";
            }
            text = checkLastCharIfEmpty(text);
            currentPretexts[l] = new createjs.Text(text, "22px Arial", "black");
            currentPretexts[l].y = textHeight * l;
            $scope.questionsTextContainer.addChild(currentPretexts[l]);
          });

          var firstGap = "________________";
          if (question.firstGap) {
            firstGap = question.firstGap;
          }

          $scope.firstGap = new createjs.Text(firstGap, "22px Arial", "black");
          $scope.firstGap.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
          $scope.firstGap.y = currentPretexts[pretexts.length - 1].y;
          $scope.questionsTextContainer.addChild($scope.firstGap);

          var firstGapUnderlinedText = $scope.firstGap.clone();
          $scope.questionsTextContainer.addChild(firstGapUnderlinedText);
          $scope.firstGap.textAlign = "center";
          $scope.firstGap.maxWidth = firstGapUnderlinedText.getBounds().width * 0.9;
          $scope.firstGap.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width + firstGapUnderlinedText.getBounds().width / 2;

          if ($scope.activityData.questions[key].midtext) {

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


            var secondGap = "________________";
            if (question.secondGap) {
              secondGap = question.secondGap;
            }
            $scope.secondGap = new createjs.Text(secondGap, "22px Arial", "black");
            $scope.secondGap.x = currentMidtexts[midtexts.length - 1].x + currentMidtexts[midtexts.length - 1].getBounds().width;
            $scope.secondGap.y = currentMidtexts[midtexts.length - 1].y;
            $scope.questionsTextContainer.addChild($scope.secondGap);

            var secondGapUnderlinedText = $scope.secondGap.clone();
            $scope.questionsTextContainer.addChild(secondGapUnderlinedText);

            $scope.secondGap.textAlign = "center";
            $scope.secondGap.maxWidth = secondGapUnderlinedText.getBounds().width * 0.9;
            $scope.secondGap.x = currentMidtexts[midtexts.length - 1].x + currentMidtexts[midtexts.length - 1].getBounds().width + secondGapUnderlinedText.getBounds().width / 2;

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
              } else {
                postextsWithMid[0] = checkFirstCharOfPhrase(postextsWithMid[0]);
                currentPostextsWithMid[0] = new createjs.Text(postextsWithMid[0], "22px Arial", "black");
                currentPostextsWithMid[0].x = secondGapUnderlinedText.x + secondGapUnderlinedText.getBounds().width;
                currentPostextsWithMid[0].y = secondGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostextsWithMid[0]);
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
              } else {
                postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                currentPostexts[0] = new createjs.Text(postexts[0], "22px Arial", "black");
                currentPostexts[0].x = firstGapUnderlinedText.x + firstGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = firstGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);
              }
            }

          }


          if (question.userAnswer) {
            if ($scope.activityData.newGame) {
              if (question.midtext) {
                var splittedText = question[question.userAnswer].split("...");
                $scope.firstGap.text = splittedText[0];
                $scope.secondGap.text = splittedText[1];
                $scope.firstGap.color = "black";
                $scope.secondGap.color = "black";
              } else {
                $scope.firstGap.text = question[question.userAnswer];
                $scope.firstGap.color = "black";
              }
            } else {
              if (question.midtext) {
                var splittedText = question[question.answerChoice].split("...");
                $scope.firstGap.text = splittedText[0];
                $scope.secondGap.text = splittedText[1];
                $scope.firstGap.color = "black";
                $scope.secondGap.color = "black";
              } else {
                $scope.firstGap.text = question[question.answerChoice];
                $scope.firstGap.color = "black";
              }
            }
          }
        };

        /*Function that restarts the exercise*/
        function restart() {

          $scope.nextButton.gotoAndPlay("normal");

          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");

          $scope.activityData.newGame = true;

          _.each($scope.activityData.questions, function (question, key, value) {
            $scope.activityData.questions[key].userAnswer = "";
            $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("white");
            if (key !== 0) {
              $scope.yellowBarContainers[key].scaleX = $scope.yellowBarContainers[key].scaleY = 1;
            }
          });
          $scope.resultsButton.visible = false;
          $scope.endText.visible = false;
          $scope.scoreText.text = "Score: " + 0 + " / " + $scope.activityData.questions.length;
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          loadQuestion(0);
        }


        /*Function that calculates score*/
        function score() {

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, value) {
            console.log("Question " + key + " answer", question.userAnswer);
            if (question.userAnswer === question.answerChoice) {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("green");
              rightAnswers++;
            } else {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("red");
            }
          });
          console.log("rightAnswers", rightAnswers);
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
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

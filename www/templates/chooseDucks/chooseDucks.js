angular.module("bookbuilder2")
  .controller("chooseDucksController", function ($scope, $ionicPlatform, $rootScope, $timeout, $http, _) {

    console.log("chooseDucksController loaded!");
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
        src: $scope.rootDir + "data/assets/chooseDucks_background.png"
      }));

      imageLoader.load();

      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/chooseDucks_background.png");

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
        console.log("GENERAL SCALING FACTOR: ", $scope.scale);

        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();
        console.log("backgroundPosition: ", backgroundPosition);


        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        $scope.stage.addChild($scope.mainContainer);

        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.on("mousedown", function (event) {
              console.log("Mouse down event on Menu button !");
              menuButton.gotoAndPlay("onSelection");
            });

            menuButton.on("pressup", function (event) {
              console.log("Press up event on Menu event!");
              menuButton.gotoAndPlay("normal");
              $rootScope.navigate("lessonNew");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          console.log("Getting activityData from local storage: ", $scope.activityData);
          init();

        } else {

          /*Getting the activityData from http.get request*/
          console.warn("There is no activity in local storage...Getting the json through $http.get()");
          console.log("selectedLesson.id: ", $scope.selectedLesson.id);
          console.log("activityFolder: ", $scope.activityFolder);

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/chooseDucks.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);
              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 0;
              $scope.activityData.newGame = true;
              $scope.activityData.activeQuestionIndex = 0;

              //Populating questions with the userChoice property
              _.each($scope.activityData.questions, function (question, key, list) {
                $scope.activityData.questions[key].userChoice = "";
              });

              save();
              init();
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes everything*/
        function init() {

          $scope.ducksSprites = {};
          $scope.ducksTexts = {};
          $scope.ducksIndexImages = {};
          $scope.ducksIndexes = {};
          $scope.userAnswersTexts = {};
          $scope.rightAnswersTexts = {};

          async.waterfall([

              function (callback) {
                /*Adding page title and description $scope.activityData.title*/
                $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "18px Arial", "white");
                $scope.pageTitle.x = 120;
                $scope.pageTitle.y = 10;
                $scope.pageTitle.maxWidth = 500;
                $scope.mainContainer.addChild($scope.pageTitle);

                /*Adding page title and description $scope.activityData.title*/
                $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
                    activityFolder: $scope.activityFolder
                  }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : ""), "18px Arial", "white");
                $scope.pageActivity.x = 85;
                $scope.pageActivity.y = 610;
                $scope.pageActivity.maxWidth = 250;
                $scope.mainContainer.addChild($scope.pageActivity);

                /*Adding page title and description*/
                $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
                $scope.pageDescription.x = 85;
                $scope.pageDescription.y = 630;
                $scope.pageDescription.maxWidth = 250;
                $scope.mainContainer.addChild($scope.pageDescription);
                //INITIALIZATIONS
                $scope.bombsContainers = {};
                $scope.bombsSprites = {};
                $scope.bombsTexts = {};
                $scope.rightAnswersTexts = {};
                $scope.userAnswersTexts = {};

                callback();
              },
              //Creating the mask container
              function (initWaterfallCallback) {

                $scope.maskContainer = new createjs.Container();
                $scope.maskContainer.width = 533;
                $scope.maskContainer.height = 210;
                $scope.maskContainer.x = 162;
                $scope.maskContainer.y = 136;
                $scope.mainContainer.addChild($scope.maskContainer);

                var maskGraphics = new createjs.Graphics().beginFill("red").drawRect(162, 136, 533, 210);
                var mask = new createjs.Shape(maskGraphics);
                $scope.maskContainer.mask = mask;

                initWaterfallCallback(null);
              },

              //Creating the internal container
              function (initWaterfallCallback) {
                $scope.internalContainer = new createjs.Container();
                $scope.internalContainer.width = 2221;
                $scope.internalContainer.height = 210;
                $scope.internalContainer.x = 0;
                $scope.internalContainer.y = 0;
                $scope.internalContainer.startingPointX = $scope.internalContainer.x;
                $scope.internalContainer.startingPointY = $scope.internalContainer.y;
                $scope.maskContainer.addChild($scope.internalContainer);

                var internalContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.internalContainer.width, $scope.internalContainer.height);
                var internalContainerBackground = new createjs.Shape(internalContainerGraphic);
                internalContainerBackground.alpha = 0.5;

                $scope.internalContainer.addChild(internalContainerBackground);

                initWaterfallCallback(null);
              },

              //Loading the internalBar image
              function (initWaterfallCallback) {
                var internalBarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/chooseDucks_bar.png"
                }));

                internalBarImageLoader.load();
                internalBarImageLoader.on("complete", function (r) {
                  $scope.internalBarImage = new createjs.Bitmap($scope.rootDir + "data/assets/chooseDucks_bar.png");
                  $scope.internalBarImage.x = -18;
                  $scope.internalBarImage.y = $scope.internalContainer.height - 44;
                  $scope.internalContainer.addChild($scope.internalBarImage);
                  initWaterfallCallback(null);
                });
              },

              //Loading the ducks sprites and texts
              function (initWaterfallCallback) {

                $http.get($scope.rootDir + "data/assets/chooseDucks_duck.json")
                  .success(function (response) {
                    console.log("Success on getting json for duck sprite!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var duckSpriteSheet = new createjs.SpriteSheet(response);

                    //Calculating the positions
                    var intervalBarXStep = $scope.internalContainer.width / 11;
                    console.warn("intervalBarXStep: ", intervalBarXStep);
                    var intervalBarXPositions = new Array(11);
                    _.each(intervalBarXPositions, function (step, key, list) {
                      intervalBarXPositions[key] = key * intervalBarXStep;
                    });
                    console.warn("intervalBarXPositions: ", intervalBarXPositions);

                    _.each(_.shuffle($scope.activityData.questions), function (question, key, list) {
                      $scope.ducksSprites[key] = new createjs.Sprite(duckSpriteSheet, "normal");
                      $scope.ducksSprites[key].x = intervalBarXPositions[key + 1];
                      $scope.ducksSprites[key].y = 50;
                      $scope.ducksSprites[key].startingPointX = $scope.ducksSprites[key].x;
                      $scope.ducksSprites[key].startingPointY = $scope.ducksSprites[key].y;

                      $scope.internalContainer.addChild($scope.ducksSprites[key]);

                      $scope.ducksSprites[key].on("pressup", function (event) {
                        console.log("Press up event on duck!");
                        if (!$scope.selectionInProgress) {
                          selectDuck(key);
                        }
                      });

                      //Adding the text
                      $scope.ducksTexts[key] = new createjs.Text(question.englishWord, "20px Arial", "black");
                      $scope.ducksTexts[key].x = $scope.ducksSprites[key].x + 73;
                      $scope.ducksTexts[key].y = 137;
                      $scope.ducksTexts[key].textAlign = "center";
                      $scope.ducksTexts[key].maxWidth = $scope.ducksSprites[key].width - 20;
                      $scope.internalContainer.addChild($scope.ducksTexts[key]);
                    });

                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for check button: ", error);
                    initWaterfallCallback(true, error);
                  });

              },

              //Loading the ducks indexes images and texts
              function (initWaterfallCallback) {

                //Getting the image
                var duckIndexImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/chooseDucks_number.png"
                }));

                duckIndexImageLoader.load();
                duckIndexImageLoader.on("complete", function (r) {

                  _.each($scope.ducksSprites, function (indexImage, key, list) {

                    //Creating the image
                    $scope.ducksIndexImages[key] = new createjs.Bitmap($scope.rootDir + "data/assets/chooseDucks_number.png");
                    $scope.ducksIndexImages[key].x = $scope.ducksSprites[key].x + 36;
                    $scope.ducksIndexImages[key].y = $scope.internalBarImage.y;
                    $scope.internalContainer.addChild($scope.ducksIndexImages[key]);

                    //Creating the index
                    $scope.ducksIndexes[key] = new createjs.Text((parseInt(key) + 1), "24px Arial", "white");
                    $scope.ducksIndexes[key].x = $scope.ducksIndexImages[key].x + $scope.ducksIndexImages[key].getBounds().width / 2;
                    $scope.ducksIndexes[key].y = $scope.ducksIndexImages[key].y + 10;
                    $scope.ducksIndexes[key].textAlign = "center";
                    $scope.internalContainer.addChild($scope.ducksIndexes[key]);
                  });
                  initWaterfallCallback(null);
                });


                initWaterfallCallback(null);
              },

              //Creating the greekWord Text
              function (initWaterfallCallback) {
                //Creating the index
                $scope.greekWordText = new createjs.Text("", "24px Arial", "black");
                $scope.greekWordText.x = 150;
                $scope.greekWordText.y = 522;
                $scope.greekWordText.textAlign = "center";
                $scope.mainContainer.addChild($scope.greekWordText);

                initWaterfallCallback(null);
              },

              //Move the ducks right
              function (initWaterfallCallback) {
                $http.get($scope.rootDir + "data/assets/education_next_questions.json")
                  .success(function (response) {
                    console.log("Success on getting json for moveRight button!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var moveRightButtonSpriteSheet = new createjs.SpriteSheet(response);

                    $scope.moveRightButton = new createjs.Sprite(moveRightButtonSpriteSheet, "normal");
                    $scope.moveRightButton.x = 560;
                    $scope.moveRightButton.y = 400;
                    /*Mouse down event*/
                    $scope.moveRightButton.on("mousedown", function (event) {
                      $scope.moveRightButton.gotoAndPlay("onSelection");
                      moveInternalContainerRight();
                    });

                    /*Press up event*/
                    $scope.moveRightButton.on("pressup", function (event) {
                      $scope.moveRightButton.gotoAndPlay("normal");
                      internalContainerMoving();
                    });

                    $scope.mainContainer.addChild($scope.moveRightButton);
                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for moveRight button: ", error);
                    initWaterfallCallback(true, error);
                  });

              },

              //Move the ducks left
              function (initWaterfallCallback) {
                $http.get($scope.rootDir + "data/assets/education_previous_questions.json")
                  .success(function (response) {
                    console.log("Success on getting json for moveLeft button!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var moveLeftButtonSpriteSheet = new createjs.SpriteSheet(response);

                    $scope.moveLeftButton = new createjs.Sprite(moveLeftButtonSpriteSheet, "normal");
                    $scope.moveLeftButton.x = 260;
                    $scope.moveLeftButton.y = 400;
                    /*Mouse down event*/
                    $scope.moveLeftButton.on("mousedown", function (event) {
                      console.log("Mouse down event on moveLeftButton!");
                      $scope.moveLeftButton.gotoAndPlay("onSelection");
                      moveInternalContainerLeft();
                    });

                    /*Press up event*/
                    $scope.moveLeftButton.on("pressup", function (event) {
                      console.log("Press up event on moveLeftButton!");
                      $scope.moveLeftButton.gotoAndPlay("normal");
                      internalContainerMoving();
                    });
                    $scope.mainContainer.addChild($scope.moveLeftButton);
                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for moveLeft button: ", error);
                    initWaterfallCallback(true, error);
                  });

              },

              //Creating the questionResult Container, Background, Text
              function (initWaterfallCallback) {

                //Creating question result background
                var questionResultImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/bombs_results_table.png"
                }));
                questionResultImageLoader.load();
                questionResultImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for questionResultBackground*/
                  $scope.questionResultBackground = new createjs.Bitmap($scope.rootDir + "data/assets/bombs_results_table.png");
                  $scope.questionResultBackground.x = 0;
                  $scope.questionResultBackground.y = 0;

                  //Creating a letter container
                  $scope.questionResultContainer = new createjs.Container();
                  $scope.questionResultContainer.width = 697;
                  $scope.questionResultContainer.height = 427;
                  $scope.questionResultContainer.x = 100;
                  $scope.questionResultContainer.y = 100;

                  //Creating the questionResult text
                  $scope.questionResultText = new createjs.Text("", "30px Arial", "black");
                  $scope.questionResultText.x = $scope.questionResultContainer.width / 2;
                  $scope.questionResultText.textAlign = "center";
                  $scope.questionResultText.y = 140;

                  //Make it invisible
                  $scope.questionResultContainer.visible = false;

                  //Adding the background
                  $scope.questionResultContainer.addChild($scope.questionResultBackground);
                  $scope.questionResultContainer.addChild($scope.questionResultText);
                  $scope.mainContainer.addChild($scope.questionResultContainer);

                  initWaterfallCallback(null);
                });
              },

              //Creating the Continue button
              function (initWaterfallCallback) {
                //Getting the sprite for Continue button
                var continueButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/soccer_results_continue.png"
                }));
                continueButtonImageLoader.load();

                continueButtonImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for continue button*/
                  $scope.continueButton = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_continue.png");
                  $scope.continueButton.x = 40;
                  $scope.continueButton.y = 270;
                  $scope.questionResultContainer.addChild($scope.continueButton);

                  /*Mouse down event*/
                  $scope.continueButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on continue button!");
                    $scope.continueButton.alpha = 0.5;
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.continueButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on continue button!");
                    $scope.continueButton.alpha = 1;
                    $scope.stage.update();

                    var thereIsUnansweredQuestion = _.findWhere($scope.activityData.questions, {"userChoice": ""});

                    if (!thereIsUnansweredQuestion) {
                      openResultsTotalContainer();
                      return;
                    } else {
                      $scope.activityData.activeQuestionIndex += 1;
                      save();
                      loadQuestion();
                    }

                    closeQuestionResults();

                  });

                  initWaterfallCallback(null);
                });//end of continueButtonImageLoader
              },

              /*Creating the Restart button*/
              function (initWaterfallCallback) {
                var restartButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/soccer_results_restart.png"
                }));
                restartButtonImageLoader.load();

                restartButtonImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for restart button*/
                  $scope.restartButton = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_restart.png");
                  $scope.restartButton.x = 385;
                  $scope.restartButton.y = 270;
                  $scope.questionResultContainer.addChild($scope.restartButton);

                  /*Mouse down event*/
                  $scope.restartButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on restart button!");
                    $scope.restartButton.alpha = 0.5;
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.restartButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on restart button!");
                    $scope.restartButton.alpha = 1;
                    $scope.stage.update();
                    restartQuestion();
                    closeQuestionResults();
                  });

                  initWaterfallCallback(null);
                });//end of restartButtonImageLoader

              },

              //Creation resultsTotal
              function (initWaterfallCallback) {

                $scope.resultsTotalContainer = new createjs.Container();
                $scope.resultsTotalContainer.width = $scope.mainContainer.width;
                $scope.resultsTotalContainer.height = $scope.mainContainer.height;
                $scope.resultsTotalContainer.x = 0;
                $scope.resultsTotalContainer.y = -50;
                $scope.resultsTotalContainer.visible = false;
                $scope.mainContainer.addChild($scope.resultsTotalContainer);

                console.log("Adding results background...");
                /*Creating the questionTextBackground bitmap*/
                var resultsTotalBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/results_table_image.png"
                }));
                resultsTotalBackgroundImageLoader.load();

                resultsTotalBackgroundImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for answerHolder background image*/
                  $scope.resultsTotalBackground = new createjs.Bitmap($scope.rootDir + "data/assets/results_table_image.png");
                  $scope.resultsTotalBackground.x = 10;
                  $scope.resultsTotalBackground.y = 0;
                  $scope.resultsTotalContainer.addChild($scope.resultsTotalBackground);

                  /*Adding Score Text*/
                  $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
                  $scope.scoreText.x = 590;
                  $scope.scoreText.y = 580;
                  $scope.resultsTotalContainer.addChild($scope.scoreText);

                  //Adding two additional containers with white backgrounds
                  $scope.userAnswersContainer = new createjs.Container();
                  $scope.userAnswersContainer.width = 385;
                  $scope.userAnswersContainer.height = 460;
                  $scope.userAnswersContainer.x = 38;
                  $scope.userAnswersContainer.y = 110;
                  $scope.resultsTotalContainer.addChild($scope.userAnswersContainer);

                  var userAnswersContainerGraphic = new createjs.Graphics().beginFill("white").drawRect(0, 0, $scope.userAnswersContainer.width, $scope.userAnswersContainer.height);
                  var userAnswersContainerBackground = new createjs.Shape(userAnswersContainerGraphic);
                  $scope.userAnswersContainer.addChild(userAnswersContainerBackground);

                  //Adding two additional containers with white backgrounds
                  $scope.rightAnswersContainer = new createjs.Container();
                  $scope.rightAnswersContainer.width = 385;
                  $scope.rightAnswersContainer.height = 460;
                  $scope.rightAnswersContainer.x = $scope.userAnswersContainer.x + $scope.userAnswersContainer.width + 20;
                  $scope.rightAnswersContainer.y = $scope.userAnswersContainer.y;
                  $scope.resultsTotalContainer.addChild($scope.rightAnswersContainer);

                  var rightAnswersContainerGraphic = new createjs.Graphics().beginFill("white").drawRect(0, 0, $scope.rightAnswersContainer.width, $scope.rightAnswersContainer.height);
                  var rightAnswersContainerBackground = new createjs.Shape(rightAnswersContainerGraphic);
                  $scope.rightAnswersContainer.addChild(rightAnswersContainerBackground);

                  //Adding the texts for right answers and for user answers
                  _.each($scope.activityData.questions, function (question, key, list) {

                    $scope.userAnswersTexts[key] = new createjs.Text("", "25px Arial", "black");
                    $scope.userAnswersTexts[key].x = 10;
                    $scope.userAnswersTexts[key].y = key === 0 ? 45 : $scope.userAnswersTexts[key - 1].y + 37;
                    $scope.userAnswersTexts[key].maxWidth = $scope.userAnswersContainer.width - 10;
                    $scope.userAnswersContainer.addChild($scope.userAnswersTexts[key]);

                    $scope.rightAnswersTexts[key] = new createjs.Text("", "25px Arial", "green");
                    $scope.rightAnswersTexts[key].x = 10;
                    $scope.rightAnswersTexts[key].y = key === 0 ? 45 : $scope.rightAnswersTexts[key - 1].y + 37;
                    $scope.rightAnswersTexts[key].maxWidth = $scope.rightAnswersContainer.width - 10;
                    $scope.rightAnswersTexts[key].visible = false;

                    var rightAnswersContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.rightAnswersContainer.width, 40);
                    var rightAnswersContainerBackground = new createjs.Shape(rightAnswersContainerGraphic);
                    $scope.rightAnswersContainer.addChild(rightAnswersContainerBackground);
                    var correctAnswersTitle = new createjs.Text("Correct Answers", "30px Arial", "white");
                    correctAnswersTitle.x = $scope.rightAnswersContainer.width / 2;
                    correctAnswersTitle.textAlign = "center";
                    correctAnswersTitle.y = 3;
                    $scope.rightAnswersContainer.addChild(correctAnswersTitle);
                    $scope.rightAnswersContainer.addChild($scope.rightAnswersTexts[key]);
                  });

                  initWaterfallCallback(null);
                });

              },

              function (initWaterfallCallback) {

                $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                  .success(function (response) {
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                    $scope.resultsButton.x = 695;
                    $scope.resultsButton.y = 635;
                    $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6;
                    $scope.mainContainer.addChild($scope.resultsButton);

                    $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                    $scope.endText.x = 730;
                    $scope.endText.y = 625;
                    $scope.mainContainer.addChild($scope.endText);

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

              //Creation of Check button
              function (initWaterfallCallback) {
                $http.get($scope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for check button!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                    /*Press up event*/
                    $scope.checkButton.addEventListener("pressup", function (event) {
                      $scope.stage.update();
                      updateScore();
                    });

                    $scope.checkButton.x = 60;
                    $scope.checkButton.y = 575;
                    $scope.checkButton.gotoAndPlay("normal");
                    $scope.resultsTotalContainer.addChild($scope.checkButton);
                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for check button: ", error);
                    initWaterfallCallback(true, error);
                  });
              },

              //Creation of restartTotal button
              function (initWaterfallCallback) {
                $http.get($scope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for restart button!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var restartTotalButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.restartTotalButton = new createjs.Sprite(restartTotalButtonSpriteSheet, "normal");

                    /*Mouse down event*/
                    $scope.restartTotalButton.addEventListener("mousedown", function (event) {
                      $scope.restartTotalButton.alpha = 0.5;
                      $scope.stage.update();
                    });

                    /*Press up event*/
                    $scope.restartTotalButton.addEventListener("pressup", function (event) {
                      $scope.restartTotalButton.alpha = 1;
                      $scope.stage.update();
                      restartActivity();
                    });

                    $scope.restartTotalButton.x = 340;
                    $scope.restartTotalButton.y = 590;
                    $scope.restartTotalButton.gotoAndPlay("normal");
                    $scope.resultsTotalContainer.addChild($scope.restartTotalButton);
                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for check button: ", error);
                    initWaterfallCallback(true, error);
                  });
              },

              /*Next Activity Button*/
              function (initWaterfallCallback) {
                /*NEXT BUTTON*/
                $http.get($scope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                  .success(function (response) {
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                    $scope.nextButton.addEventListener("mousedown", function (event) {
                      if (!$scope.activityData.newGame) {
                        $scope.nextButton.gotoAndPlay("onSelection");
                      }
                      $scope.stage.update();
                    });

                    $scope.nextButton.addEventListener("pressup", function (event) {
                      if (!$scope.activityData.newGame) {
                        $scope.nextButton.gotoAndPlay("normal");
                        $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                      }
                    });

                    $scope.nextButton.x = 720;
                    $scope.nextButton.y = 645;
                    $scope.mainContainer.addChild($scope.nextButton);
                    initWaterfallCallback();
                  })
                  .error(function (error) {

                    console.log("Error on getting json data for check button...", error);
                    initWaterfallCallback();
                  });
              }
            ],

            //General callback
            function (error, result) {
              if (error) {
                console.error("There was an error during init waterfall process...:", result);
              } else {
                console.log("Success during init waterfall process!");
                //Loading game
                loadQuestion();
              }
            });
        }

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        //Function for saving
        function save() {
          //Saving it to localStorage
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        //Function that loads the question for the current index
        function loadQuestion() {

          if (!$scope.activityData.newGame) {
            openResultsTotalContainer();
            updateScore();
            return;
          }

          //Checking if all questions have answer, if it's true resultsTotal opens
          if (_.findWhere($scope.activityData.questions, {"userChoice": ""})) {
            console.warn("Loading question: The are questions that need to be answered. Loading the game normally...");
          } else {
            console.warn("Loading question: All questions have answers...");
            openResultsTotalContainer();
            return;
          }


          //Checking for unanswered questions
          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userChoice === "") {
              var unansweredDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[key].englishWord});
              $scope.ducksTexts[unansweredDuckIndex].visible = true;
              $scope.ducksSprites[unansweredDuckIndex].visible = true;
              $scope.ducksSprites[unansweredDuckIndex].y = $scope.ducksSprites[unansweredDuckIndex].startingPointY;
              $scope.ducksSprites[unansweredDuckIndex].gotoAndPlay("normal");
            }
          });


          //Checking if there are already answered questions
          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userChoice !== "") {
              var selectedDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[key].userChoice});
              console.warn("Filled question index: " + key + " -Filled duckText index: " + selectedDuckIndex);
              $scope.ducksTexts[selectedDuckIndex].visible = false;
              $scope.ducksSprites[selectedDuckIndex].visible = false;
            }
          });

          $scope.stage.update();

          //Load the next question
          $scope.greekWordText.text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].greekWord;
          internalContainerMoving();
        }

        //Function that restarts the current question
        function restartQuestion() {
          var selectedDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice});
          $scope.ducksTexts[selectedDuckIndex].visible = true;
          $scope.ducksSprites[selectedDuckIndex].gotoAndPlay("normal");
          $scope.ducksSprites[selectedDuckIndex].y = $scope.ducksSprites[selectedDuckIndex].startingPointY;
          $scope.ducksSprites[selectedDuckIndex].visible = true;
          $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice = "";
          save();
          loadQuestion();
        }

        //Function that moves the bar
        function internalContainerMoving() {
          if ($scope.selectionInProgress) {
            return;
          }
          createjs.Tween.removeAllTweens($scope.internalContainer);
          $scope.stage.update();

          createjs.Tween.get($scope.internalContainer, {loop: false})
            .to({
              x: $scope.internalContainer.x > -1000 ? -1670 : -150,
              y: $scope.internalContainer.y
            }, 17000, createjs.Ease.getPowInOut(1))
            .call(function () {
              internalContainerMoving();
            });
        }

        //Function for moving internal bar right
        function moveInternalContainerRight() {
          if ($scope.selectionInProgress) {
            return;
          }
          createjs.Tween.removeAllTweens($scope.internalContainer);
          $scope.stage.update();

          createjs.Tween.get($scope.internalContainer, {loop: false})
            .to({
              x: -1670,
              y: $scope.internalContainer.y
            }, -(-1670 - ($scope.internalContainer.x)) * 4, createjs.Ease.getPowInOut(1));

        }

        //Function for selecting duck
        function moveInternalContainerLeft() {
          if ($scope.selectionInProgress) {
            return;
          }
          createjs.Tween.removeAllTweens($scope.internalContainer);
          $scope.stage.update();

          createjs.Tween.get($scope.internalContainer, {loop: false})
            .to({
              x: -150,
              y: $scope.internalContainer.y
            }, -(($scope.internalContainer.x) + 150 ) * 4, createjs.Ease.getPowInOut(1));
        }


        //Function for checking activity
        function selectDuck(key) {

          if ($scope.selectionInProgress) {
            return;
          }

          $scope.selectionInProgress = true;
          createjs.Tween.removeAllTweens($scope.internalContainer);

          $scope.stage.update();
          $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice = $scope.ducksTexts[key].text;
          save();

          $scope.ducksTexts[key].visible = false;

          $scope.ducksSprites[key].gotoAndPlay("selected");
          createjs.Tween.get($scope.ducksSprites[key], {loop: false})
            .to({
              x: $scope.ducksSprites[key].x,
              y: -500
            }, 1000, createjs.Ease.getPowInOut(2)).call(
            function () {
              $scope.ducksSprites[key].visible = false;
              openQuestionResults();
            }
          );
        }


        //Function that opens questionResults window
        function openQuestionResults() {
          $scope.greekWordText.text = "";
          $scope.questionResultText.text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].greekWord + " = "
            + $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice;
          $scope.questionResultContainer.visible = true;
          $scope.stage.update();
        }

        function closeQuestionResults() {
          $timeout(function () {
            $scope.questionResultContainer.visible = false;
            $scope.questionResultText.text = "";
            $scope.selectionInProgress = false;
          });
        }


        //Function used for opening resultsTotalContainer
        function openResultsTotalContainer() {
          $scope.resultsTotalContainer.visible = true;
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.userAnswersTexts[key].text = key + 1 + ". " + $scope.activityData.questions[key].greekWord + " = " + $scope.activityData.questions[key].userChoice;
          });
        }

        //Function used for closing resultsTotalContainer
        function closeResultsTotalContainer() {
          $scope.resultsTotalContainer.visible = false;
          closeQuestionResults();
          //Erasing all texts from resultsTotalContainer
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.userAnswersTexts[key].text = "";
            $scope.userAnswersTexts[key].color = "black";
            $scope.rightAnswersTexts[key].text = "";
            $scope.rightAnswersTexts[key].visible = false;
          })
        }

        //Function for restarting activity
        function restartActivity() {

          _.each($scope.activityData.questions, function (word, key, list) {
            $scope.activityData.questions[key].userChoice = "";
          });

          $scope.checkButton.alpha = 1;
          $scope.activityData.newGame = true;
          $scope.activityData.score = 0;
          $scope.activityData.activeQuestionIndex = 0;
          $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;

          closeResultsTotalContainer();
          loadQuestion();
          save();
        }

        //Function that updates the score

        function updateScore() {

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, list) {

            $scope.userAnswersTexts[key].text = $scope.activityData.questions[key].greekWord + " = " + $scope.activityData.questions[key].userChoice;
            $scope.rightAnswersTexts[key].text = $scope.activityData.questions[key].englishWord;
            if ($scope.activityData.questions[key].userChoice === $scope.activityData.questions[key].englishWord) {
              rightAnswers++;
              $scope.userAnswersTexts[key].color = "green";
            } else {
              $scope.userAnswersTexts[key].color = "red";
              $scope.rightAnswersTexts[key].visible = true;
            }

          });

          //Updating score
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

          //Mark activity as completed
          $scope.activityData.score = rightAnswers;
          $scope.activityData.completed = true;
          $scope.checkButton.alpha = 0.5;

          if (_.findIndex($scope.selectedLesson.activitiesMenu, {
              activityFolder: $scope.activityFolder
            }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

            $scope.resultsButton.visible = true;
            $scope.endText.visible = true;
            $scope.nextButton.visible = false;

          }

          if ($scope.activityData.newGame) {
            $scope.activityData.attempts += 1;
            $scope.activityData.newGame = false;
          }
          save();
          $scope.nextButton.gotoAndPlay("selected");
          $scope.stage.update();
        }

      });//end of image on complete
    }, 500);//end of timeout
  })
;

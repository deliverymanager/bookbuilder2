angular.module("bookbuilder2")
  .controller("bombsController", function ($scope, $ionicPlatform, $rootScope, $timeout, $http, _) {

    console.log("bombsController loaded!");

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

      createjs.Ticker.addEventListener("tick", handleTick);

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/bombs_backgroun.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/bombs_backgroun.png");

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

            menuButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on Menu button !");
              menuButton.gotoAndPlay("onSelection");
            });

            menuButton.addEventListener("pressup", function (event) {
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


        /************************************** Initializing Page **************************************/
        /*Getting the activityData from the local storage*/
        console.log("activityNameInLocalStorage", window.localStorage.getItem(activityNameInLocalStorage));

        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          init();

        } else {

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/bombs.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 0;
              $scope.activityData.newGame = true;

              //Filling the activityData with questionWords and userChoices properties
              _.each($scope.activityData.questions, function (question, key, list) {
                //Filling activityData with questionWords
                $scope.activityData.questions[key].questionWords = $scope.activityData.questions[key].questionPhrase.split("$");
                $scope.activityData.questions[key].questionWords[$scope.activityData.questions[key].questionWords.length - 1] += " ";

                //Filling activityData with userChoices
                $scope.activityData.questions[key].userChoices = [];
              });

              init();
              save();
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes almost everything*/
        function init() {

          /*Adding page title and description $scope.activityData.title*/
          $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "18px Arial", "white");
          $scope.pageTitle.x = 120;
          $scope.pageTitle.y = 10;
          $scope.pageTitle.maxWidth = 300;
          $scope.mainContainer.addChild($scope.pageTitle);

          /*Adding page title and description $scope.activityData.title*/
          $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
            activityFolder: $scope.activityFolder
          }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : ""), "18px Arial", "white");
          $scope.pageActivity.x = 85;
          $scope.pageActivity.y = 610;
          $scope.pageActivity.maxWidth = 300;
          $scope.mainContainer.addChild($scope.pageActivity);

          /*Adding page title and description*/
          $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
          $scope.pageDescription.x = 85;
          $scope.pageDescription.y = 630;
          $scope.pageDescription.maxWidth = 300;
          $scope.mainContainer.addChild($scope.pageDescription);
          //INITIALIZATIONS
          $scope.bombsContainers = {};
          $scope.bombsSprites = {};
          $scope.bombsTexts = {};
          $scope.rightAnswersTexts = {};
          $scope.userAnswersTexts = {};

          console.log("Starting initialization!");
          async.waterfall([

              //Initializing activeQuestionIndex
              function (initWaterfallCallback) {

                $scope.activityData.activeQuestionIndex = $scope.activityData.activeQuestionIndex ? $scope.activityData.activeQuestionIndex : 0;
                save();

                initWaterfallCallback(null);
              },

              //Getting the bombs spriteSheet
              function (initWaterfallCallback) {
                //Getting the sprite for bombs
                $http.get($scope.rootDir + "data/assets/bombs_bomb_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for the bombs sprite!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                    $scope.bombsSpriteSheet = new createjs.SpriteSheet(response);

                    initWaterfallCallback(null);
                  })
                  .error(function (error) {
                    console.error("Error on getting json data for bombs: ", error);
                    initWaterfallCallback(true, error);
                  });


              },

              //Creating the 10 Bomb Containers, Sprites and Texts
              function (initWaterfallCallback) {
                _.each(new Array(10), function (bomb, key, list) {

                  //Creating the bombs sprite
                  $scope.bombsSprites[key] = new createjs.Sprite($scope.bombsSpriteSheet, "normal");

                  //Creating a bombs container
                  $scope.bombsContainers[key] = new createjs.Container();
                  $scope.bombsContainers[key].width = $scope.bombsSprites[key].getBounds().width;
                  $scope.bombsContainers[key].height = $scope.bombsSprites[key].getBounds().height;
                  $scope.bombsContainers[key].visible = false;

                  $scope.bombsSprites[key].addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on bomb!");
                  });

                  $scope.bombsSprites[key].addEventListener("pressup", function (event) {
                    console.log("Press up event on bomb!");

                    //The selected sprite plays explosion
                    $scope.bombsSprites[key].gotoAndPlay("explosion1");


                    $scope.bombsTexts[key].visible = false;
                    $timeout(function () {
                      //Make the sprite invisible
                      $scope.bombsContainers[key].visible = false;
                    }, 200);

                    //Add selected word into userChoices
                    if (_.indexOf($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices, $scope.bombsTexts[key].text) === -1) {
                      $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.push($scope.bombsTexts[key].text);
                    } else {
                      console.log("Blocking double click selection on Sprite");
                      return;
                    }
                    save();

                    //Update the questionText
                    updateQuestionText();

                    //Checking if it's was the last choice
                    if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length
                      === $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords.length) {
                      openTheQuestionResult($scope.activityData.activeQuestionIndex);
                    }

                  });
                  $scope.bombsSprites[key].x = 0;
                  $scope.bombsSprites[key].y = 0;
                  $scope.bombsContainers[key].addChild($scope.bombsSprites[key]);

                  //Creating the bombs text
                  $scope.bombsTexts[key] = new createjs.Text("", "20px Arial", "white");
                  $scope.bombsTexts[key].x = 70;
                  $scope.bombsTexts[key].y = 110;
                  $scope.bombsTexts[key].textAlign = "center";
                  $scope.bombsTexts[key].maxWidth = $scope.bombsContainers[key].width - 25;
                  $scope.bombsContainers[key].addChild($scope.bombsTexts[key]);

                  //Finally adding the bombs container filled with the sprite and the text
                  $scope.mainContainer.addChild($scope.bombsContainers[key]);

                });


                var bombsContainerIndex = 0;

                for (var i = 0; i < 3; i++) {
                  console.log("i:", i);
                  for (var j = 0; j < 7; j++) {
                    console.log("j:", j);
                    if (i === 0 && j % 2 === 1) {
                      $scope.bombsContainers[bombsContainerIndex].x = j === 1 ? 140 : $scope.bombsContainers[bombsContainerIndex - 1].x + 220;
                      $scope.bombsContainers[bombsContainerIndex].y = 40;
                      bombsContainerIndex++;
                    }
                    if (i === 1 && j % 2 === 0) {
                      $scope.bombsContainers[bombsContainerIndex].x = j === 0 ? 40 : $scope.bombsContainers[bombsContainerIndex - 1].x + 210;
                      $scope.bombsContainers[bombsContainerIndex].y = 190;
                      bombsContainerIndex++;
                    }
                    if (i === 2 && j % 2 === 1) {
                      $scope.bombsContainers[bombsContainerIndex].x = j === 1 ? 140 : $scope.bombsContainers[7].x + 220 * bombsContainerIndex;
                      $scope.bombsContainers[bombsContainerIndex].y = 340;
                      bombsContainerIndex++;
                    }
                  }
                }
                initWaterfallCallback(null);
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
                        $scope.nextButton.gotoAndPlay("selected");
                      }
                      $scope.stage.update();
                    });
                    $scope.nextButton.addEventListener("pressup", function (event) {
                      console.log("pressup event!");

                      if (!$scope.activityData.newGame) {
                        $scope.nextButton.gotoAndPlay("onSelection");
                        /*Calling next function!*/
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
              },

              function (initWaterfallCallback) {

                $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                  .success(function (response) {
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                    $scope.resultsButton.x = 680;
                    $scope.resultsButton.y = 635;
                    $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6;
                    $scope.mainContainer.addChild($scope.resultsButton);

                    $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                    $scope.endText.x = 720;
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
              //Creating the Undo button
              function (initWaterfallCallback) {
                //Getting the sprite for undoButton
                $http.get($scope.rootDir + "data/assets/bombs_undo_button_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for the undo button!");
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var undoButtonSpriteSheet = new createjs.SpriteSheet(response);

                    $scope.undoButton = new createjs.Sprite(undoButtonSpriteSheet, "normal");

                    $scope.undoButton.addEventListener("mousedown", function (event) {
                      console.log("Mouse down event on undo button!");
                      $scope.undoButton.gotoAndPlay("onSelection");
                    });

                    $scope.undoButton.addEventListener("pressup", function (event) {
                      console.log("Press up event on undo button!");
                      $scope.undoButton.gotoAndPlay("normal");
                      undoWord();
                    });

                    $scope.undoButton.x = 25;
                    $scope.undoButton.y = 490;
                    $scope.mainContainer.addChild($scope.undoButton);

                    initWaterfallCallback(null);
                  })
                  .error(function (error) {
                    console.error("Error on getting json data for undo button: ", error);
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
                  $scope.questionResultContainer.y = -1300;

                  //Creating the questionResult text
                  $scope.questionResultText = new createjs.Text("", "30px Arial", "black");
                  $scope.questionResultText.x = 60;
                  $scope.questionResultText.y = 140;
                  $scope.questionResultText.maxWidth = 600;

                  //Make it invisible
                  $scope.questionResultContainer.visible = true;

                  //Adding the background
                  $scope.questionResultContainer.addChild($scope.questionResultBackground);
                  $scope.questionResultContainer.addChild($scope.questionResultText);
                  $scope.mainContainer.addChild($scope.questionResultContainer);

                  $scope.questionResultContainer.visible = false;

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

                    if (!$scope.activityData.newGame) {
                      return;
                    }
                    console.log("Press up event on continue button!");
                    $scope.continueButton.alpha = 1;
                    $scope.stage.update();

                    if ($scope.activityData.activeQuestionIndex + 1 >= $scope.activityData.questions.length) {
                      console.warn("Maximum question index reached!");
                      //Opening resultsTotalContainer
                      openResultsTotalContainer();
                      return;
                    } else {
                      $scope.activityData.activeQuestionIndex++;
                      save();
                    }

                    closeTheQuestionResult();
                    loadQuestion();

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
                    if (!$scope.activityData.newGame) {
                      return;
                    }
                    console.log("Press up event on restart button!");
                    $scope.restartButton.alpha = 1;
                    $scope.stage.update();
                    restartQuestion();
                    closeTheQuestionResult();
                  });

                  initWaterfallCallback(null);
                });//end of restartButtonImageLoader

              },

              //Creation of questionText
              function (initWaterfallCallback) {

                /**NOTE TEXT CONTAINER MAX WIDTH ? **/

                //Creating the questionResult text
                $scope.questionText = new createjs.Text("", "20px Arial", "black");
                $scope.questionText.x = 150;
                $scope.questionText.y = 530;

                $scope.mainContainer.addChild($scope.questionText);

                initWaterfallCallback(null);
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

                    $scope.userAnswersTexts[key] = new createjs.Text(key + 1 + ". ", "15px Arial", "black");
                    $scope.userAnswersTexts[key].x = 10;
                    $scope.userAnswersTexts[key].y = key === 0 ? 30 : $scope.userAnswersTexts[key - 1].y + 40;
                    $scope.userAnswersTexts[key].maxWidth = 350;
                    $scope.userAnswersContainer.addChild($scope.userAnswersTexts[key]);

                    $scope.rightAnswersTexts[key] = new createjs.Text(key + 1 + ". ", "15px Arial", "green");
                    $scope.rightAnswersTexts[key].x = 10;
                    $scope.rightAnswersTexts[key].y = key === 0 ? 30 : $scope.rightAnswersTexts[key - 1].y + 40;
                    $scope.rightAnswersTexts[key].maxWidth = 350;
                    $scope.rightAnswersTexts[key].visible = false;
                    $scope.rightAnswersContainer.addChild($scope.rightAnswersTexts[key]);
                  });

                  initWaterfallCallback(null);
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

                    /*Mouse down event*/
                    $scope.checkButton.addEventListener("mousedown", function (event) {
                      $scope.stage.update();
                    });

                    /*Press up event*/
                    $scope.checkButton.addEventListener("pressup", function (event) {
                      updateScore();
                      $scope.nextButton.gotoAndPlay("onSelection");
                      $scope.activityData.completed = true;
                      $scope.activityData.attempts += 1;
                      $scope.activityData.newGame = false;

                      if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                          activityFolder: $scope.activityFolder
                        }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

                        $scope.resultsButton.visible = true;
                        $scope.endText.visible = true;
                        $scope.nextButton.visible = false;

                      }

                      save();
                    });

                    $scope.checkButton.x = 45;
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
                      console.log("Click on Restart button!");
                      $scope.restartTotalButton.alpha = 1;
                      $scope.checkButton.visible = true;
                      $scope.stage.update();
                      restartActivity();
                      closeResultsTotalContainer();
                      save();

                    });//End of press up element

                    $scope.restartTotalButton.x = 280;
                    $scope.restartTotalButton.y = 590;
                    $scope.restartTotalButton.gotoAndPlay("normal");
                    $scope.resultsTotalContainer.addChild($scope.restartTotalButton);
                    initWaterfallCallback(null);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for check button: ", error);
                    initWaterfallCallback(true, error);
                  });
              }

            ],
            //General Callback
            function (error, result) {
              if (error) {
                console.error("There was an error during init waterfall process...:", result);
              } else {
                if ($scope.activityData.activeQuestionIndex === $scope.activityData.questions.length - 1
                  && $scope.activityData.questions[$scope.activityData.questions.length - 1].userChoices.length === $scope.activityData.questions[$scope.activityData.questions.length - 1].questionWords.length) {
                  openResultsTotalContainer();
                  $scope.resultsButton.visible = true;
                  $scope.endText.visible = true;
                  $scope.nextButton.visible = false;
                  updateScore();
                } else {
                  loadQuestion();
                }
              }
            })


        }//end of function init()

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        function loadQuestion() {

          closeTheQuestionResult();

          //Clear everything
          _.each($scope.bombsContainers, function (bombContainer, key, list) {
            //All bombs play the normal animation
            $scope.bombsSprites[key].gotoAndPlay("normal");
            //Make all bombs containers invisible
            $scope.bombsTexts[key].visible = false;
            $scope.bombsContainers[key].visible = false;
            //Re-initializing the question text
            $scope.questionText.text = key + 1 + ". ";
          });

          //Checking if user has already chose answers
          if (getUserChoicesFullSentence().length > 0) {

            _.each($scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords, function (word, key, list) {

              //Checking if the word exists in userChoices
              if (_.indexOf($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices, $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords[key]) === -1) {

                $scope.bombsTexts[key].text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords[key];
                $scope.bombsContainers[key].visible = true;
                $scope.bombsTexts[key].visible = true;
              }
            });

            //Update the questionText
            updateQuestionText();

            if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length
              === $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords.length) {
              openTheQuestionResult($scope.activityData.activeQuestionIndex);
            }

          } else {
            //No answers. Building the question from scratch

            //Clear everything
            _.each($scope.bombsContainers, function (bombContainer, key, list) {
              //Make all bomb texts blank again
              $scope.bombsTexts[key].text = "";
              //All bombs play the normal animation
              $scope.bombsSprites[key].gotoAndPlay("normal");
              //Make all bombs containers invisible
              $scope.bombsTexts[key].visible = false;
              $scope.bombsContainers[key].visible = false;
            });

            $scope.questionText.text = $scope.activityData.activeQuestionIndex + 1 + ". ";

            var shuffledQuestionWords = _.shuffle($scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords);
            console.log(shuffledQuestionWords);
            _.each(shuffledQuestionWords, function (word, key, list) {
              //Adding each word to the bomb text
              console.log("Adding the word: ", shuffledQuestionWords[key]);
              //Assign the word to bomb text
              $scope.bombsTexts[key].text = shuffledQuestionWords[key];
              $scope.bombsContainers[key].visible = true;
              $scope.bombsTexts[key].visible = true;
            });
          }
        }

        //Function for returning the full sentence by the user choices
        function getUserChoicesFullSentence() {
          var fullSentence = "";
          _.each($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices, function (word, key, list) {
            fullSentence += $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices[key];
          });

          console.log("The full sentence: ", fullSentence);
          return fullSentence;
        }

        //Function for updating the questionText
        function updateQuestionText() {
          var fullSentence = "";
          _.each($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices, function (word, key, list) {
            fullSentence += $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices[key];
          });
          $scope.questionText.text = $scope.activityData.activeQuestionIndex + 1 + ". " + fullSentence;
        }

        //Function for restarting the question
        function restartQuestion() {
          _.each($scope.bombsContainers, function (bombContainer, key, list) {
            //Make all bomb texts blank again
            $scope.bombsTexts[key].text = "";
            //All bombs play the normal animation
            $scope.bombsSprites[key].gotoAndPlay("normal");
            //Make all bombs containers invisible
            $scope.bombsTexts[key].visible = false;
            $scope.bombsContainers[key].visible = false;
          });

          //Erasing from userChoices all current answers and saving again
          $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices = [];
          save();

          loadQuestion();
        }

        //Function that erases the last word
        function undoWord() {

          if ($scope.questionResultContainer.visible) {
            console.warn("Question has completed!");
            return;
          }

          if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length === 0) {
            console.warn("No word has chosen yet!");
            return;
          }

          //Make the word's container visible again
          console.log("User choices: ", $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices);
          var poppedOutWordIndex = _.findKey($scope.bombsTexts, {"text": $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices[$scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length - 1]});

          if (poppedOutWordIndex) {
            console.log("Index of the popped out word: ", poppedOutWordIndex);
            console.log($scope.bombsTexts);
            $scope.bombsSprites[poppedOutWordIndex].gotoAndPlay("normal");
            $scope.bombsContainers[poppedOutWordIndex].visible = true;
            $scope.bombsTexts[poppedOutWordIndex].visible = true;

            //Pop last word from user choices
            $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.pop();
            //save
            save();
            //Update the questionText
            updateQuestionText();
          } else {

            console.warn("Probably it's from a restart so finding a new empty index");

            var emptyIndex = _.findKey($scope.bombsTexts, {"text": ""});
            $scope.bombsTexts[emptyIndex].text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices[$scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length - 1];
            $scope.bombsSprites[emptyIndex].gotoAndPlay("normal");
            $scope.bombsContainers[emptyIndex].visible = true;
            $scope.bombsTexts[poppedOutWordIndex].visible = true;

            $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.pop();
            //save
            save();
            //Update the questionText
            updateQuestionText();
          }
        }

        //Function for saving
        function save() {
          //Saving it to localStorage
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        //Function for opening the question result
        function openTheQuestionResult(key) {

          $scope.questionResultContainer.visible = true;
          $scope.questionResultText.text = key + 1 + ". " + getUserChoicesFullSentence();
          createjs.Tween.get($scope.questionResultContainer, {loop: false})
            .to({
              x: 80,
              y: 80
            }, 800, createjs.Ease.getPowIn(2));
          $scope.stage.update();
        }

        //Function for closing the question result
        function closeTheQuestionResult() {
          $scope.questionResultContainer.visible = false;
          $scope.nextButton.gotoAndPlay("normal");
        }

        //Updating Score
        function updateScore() {

          $scope.checkButton.visible = false;

          var totalScore = 0;
          _.each($scope.activityData.questions, function (question, key, list) {
            var fullUserSentence = "";
            var fullRightSentence = "";
            _.each($scope.activityData.questions[key].userChoices, function (word, k, l) {
              fullUserSentence += $scope.activityData.questions[key].userChoices[k];
            });
            _.each($scope.activityData.questions[key].questionWords, function (word, k, l) {
              fullRightSentence += $scope.activityData.questions[key].questionWords[k];
              $scope.rightAnswersTexts[key].text += $scope.activityData.questions[key].questionWords[k];
            });

            if (fullUserSentence === fullRightSentence) {
              $scope.userAnswersTexts[key].color = "green";
              totalScore++;
            } else {
              $scope.userAnswersTexts[key].color = "red";
              $scope.rightAnswersTexts[key].visible = true;
              $scope.stage.update();
            }
          });
          //updating the scoreText
          $scope.activityData.score = totalScore;
          $scope.scoreText.text = "Score: " + totalScore + " / " + $scope.activityData.questions.length;
          save();
        }

        //Function used for opening resultsTotalContainer
        function openResultsTotalContainer() {

          $scope.resultsTotalContainer.visible = true;
          //Populating with user choices
          _.each($scope.activityData.questions, function (question, key, list) {
            var fullSentence = "";
            _.each($scope.activityData.questions[key].userChoices, function (word, k, list) {
              fullSentence += $scope.activityData.questions[key].userChoices[k];
            });
            $scope.userAnswersTexts[key].text = key + 1 + ". " + fullSentence;
          });

        }

        //Function used for closing resultsTotalContainer
        function closeResultsTotalContainer() {
          $scope.resultsTotalContainer.visible = false;
          //Erasing all texts from resultsTotalContainer
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.userAnswersTexts[key].color = "black";
            $scope.rightAnswersTexts[key].text = "";
            $scope.rightAnswersTexts[key].visible = false;
          })
        }

        function restartActivity() {
          //Erasing all answers
          _.each($scope.activityData.questions, function (word, key, l) {
            $scope.activityData.questions[key].userChoices = [];
          });

          //Make index 0 again
          $scope.activityData.activeQuestionIndex = 0;
          $scope.activityData.score = 0;
          $scope.activityData.newGame = true;
          save();
          closeResultsTotalContainer();
          loadQuestion();
        }

      });//end of image on complete
    }, 500);//end of timeout
  });

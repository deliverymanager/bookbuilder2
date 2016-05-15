angular.module("bookbuilder2")
  .controller("bombsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

    console.log("bombsController loaded!");

    //START OF DEVELOPMENT SNIPPET
    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }
    $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
    $rootScope.activityName = window.localStorage.getItem("activityName");
    //END OF DEVELOPMENT SNIPPET

    /*Name of activity in localStorage*/
    var activityNameInLocalStorage = $rootScope.selectedLesson.id + "_" + $rootScope.activityFolder;
    console.log("Name of activity in localStorage: ", activityNameInLocalStorage);

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

      var handleTick = function () {
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

      $scope.sounds = {};
      if (window.cordova && window.cordova.platformId !== "browser") {
        _.each(["select", "check"], function (sound, key, list) {
          if (ionic.Platform.isIOS() && window.cordova) {
            console.log("Else iOS");
            resolveLocalFileSystemURL($rootScope.rootDir + "data/assets/" + sound + ".mp3", function (entry) {
              $scope.sounds[sound] = new Media(entry.toInternalURL(), function () {
                console.log("Sound success");
              }, function (err) {
                console.log("Sound error", err);
              }, function (status) {
                console.log("Sound status", status);
              });
            });
          } else {
            console.log("Else Android");
            $scope.sounds[sound] = new Media($rootScope.rootDir + "data/assets/" + sound + ".mp3", function () {
              console.log("Sound success");
            }, function (err) {
              console.log("Sound error", err);
            }, function (status) {
              console.log("Sound status", status);
            });
          }
        });
      }
      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/bombs_backgroun.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/bombs_backgroun.png");

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
        console.log("GENERAL SCALING FACTOR: ", scale);

        background.scaleX = scale;
        background.scaleY = scale;
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
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        $scope.stage.addChild($scope.mainContainer);

        // var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
        // var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
        // mainContainerBackground.alpha = 0.5;
        //
        // $scope.mainContainer.addChild(mainContainerBackground);


        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on Menu button !");
              menuButton.gotoAndPlay("onSelection");
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("Press up event on Menu event!");
              menuButton.gotoAndPlay("normal");
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });

              /*Removing all tween before navigating back*/
              $ionicHistory.clearCache();
              createjs.Tween.removeAllTweens();
              $scope.stage.removeAllEventListeners();
              $scope.stage.removeAllChildren();

              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        /************************************** Initializing Page **************************************/

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);

        /*Getting the activityData from the local storage*/
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          console.log("Getting activityData from local storage: ", $scope.activityData);


          init();

        } else {

          /*Getting the activityData from http.get request*/
          console.warn("There is no activity in local storage...Getting the json through $http.get()");
          console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/bombs.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 1;

              //Filling the activityData with questionWords and userChoices properties
              _.each($scope.activityData.questions, function (question, key, list) {
                //Filling activityData with questionWords
                $scope.activityData.questions[key].questionWords = $scope.activityData.questions[key].questionPhrase.split("$");
                //Filling activityData with userChoices
                $scope.activityData.questions[key].userChoices = [];
              });

              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
              console.log("Activity data: ", $scope.activityData);

              init();

              //Saving it to localStorage
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes almost everything*/
        function init() {

          /*Adding page title and description*/
          $scope.pageTitle = new createjs.Text($scope.activityData.title, "18px Arial", "white");
          $scope.pageTitle.x = 85;
          $scope.pageTitle.y = 610;
          $scope.mainContainer.addChild($scope.pageTitle);

          /*Adding page title and description*/
          $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
          $scope.pageDescription.x = 120;
          $scope.pageDescription.y = 630;
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
                $http.get($rootScope.rootDir + "data/assets/bombs_bomb_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for the bombs sprite!");
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

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
                      openTheQuestionResult();
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
                      $scope.bombsContainers[bombsContainerIndex].x = j === 1 ? 130 : $scope.bombsContainers[bombsContainerIndex - 1].x + 220;
                      $scope.bombsContainers[bombsContainerIndex].y = 40;
                      bombsContainerIndex++;
                    }
                    if (i === 1 && j % 2 === 0) {
                      $scope.bombsContainers[bombsContainerIndex].x = j === 0 ? 40 : $scope.bombsContainers[bombsContainerIndex - 1].x + 210;
                      $scope.bombsContainers[bombsContainerIndex].y = 210;
                      bombsContainerIndex++;
                    }
                    if (i === 2 && j % 2 === 1) {
                      $scope.bombsContainers[bombsContainerIndex].x = j === 1 ? 130 : $scope.bombsContainers[7].x + 220 * bombsContainerIndex;
                      $scope.bombsContainers[bombsContainerIndex].y = 380;
                      bombsContainerIndex++;
                    }
                  }
                }
                initWaterfallCallback(null);
              },

              /*Next Activity Button*/
              function (initWaterfallCallback) {
                /*NEXT BUTTON*/
                $http.get($rootScope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                  .success(function (response) {
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                    var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");
                    $scope.nextButton.alpha = 0.5;

                    $scope.nextButton.addEventListener("mousedown", function (event) {
                      console.log("mousedown event on a button !", $scope.activityData.completed);
                      $scope.nextButton.alpha = 0.5;
                      if ($scope.activityData.completed) {
                        $scope.nextButton.gotoAndPlay("onSelection");
                      }
                      $scope.stage.update();
                    });
                    $scope.nextButton.addEventListener("pressup", function (event) {
                      console.log("pressup event!");

                      $scope.nextButton.alpha = 1;

                      if ($scope.activityData.completed) {
                        $scope.nextButton.gotoAndPlay("normal");
                        /*Calling next function!*/
                        TypicalFunctions.nextActivity();
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
              //Creating the Undo button
              function (initWaterfallCallback) {
                //Getting the sprite for undoButton
                $http.get($rootScope.rootDir + "data/assets/bombs_undo_button_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for the undo button!");
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
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
                  src: $rootScope.rootDir + "data/assets/bombs_results_table.png"
                }));
                questionResultImageLoader.load();
                questionResultImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for questionResultBackground*/
                  $scope.questionResultBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/bombs_results_table.png");
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
                  src: $rootScope.rootDir + "data/assets/soccer_results_continue.png"
                }));
                continueButtonImageLoader.load();

                continueButtonImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for continue button*/
                  $scope.continueButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_continue.png");
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
                  src: $rootScope.rootDir + "data/assets/soccer_results_restart.png"
                }));
                restartButtonImageLoader.load();

                restartButtonImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for restart button*/
                  $scope.restartButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_restart.png");
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
                  src: $rootScope.rootDir + "data/assets/results_table_image.png"
                }));
                resultsTotalBackgroundImageLoader.load();

                resultsTotalBackgroundImageLoader.on("complete", function (r) {

                  /*Creating Bitmap Background for answerHolder background image*/
                  $scope.resultsTotalBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/results_table_image.png");
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

                    $scope.userAnswersTexts[key] = new createjs.Text("", "15px Arial", "black");
                    $scope.userAnswersTexts[key].x = 10;
                    $scope.userAnswersTexts[key].y = key === 0 ? 30 : $scope.userAnswersTexts[key - 1].y + 70;
                    $scope.userAnswersContainer.addChild($scope.userAnswersTexts[key]);

                    $scope.rightAnswersTexts[key] = new createjs.Text("", "15px Arial", "green");
                    $scope.rightAnswersTexts[key].x = 10;
                    $scope.rightAnswersTexts[key].y = key === 0 ? 30 : $scope.rightAnswersTexts[key - 1].y + 70;
                    $scope.rightAnswersTexts[key].visible = false;
                    $scope.rightAnswersContainer.addChild($scope.rightAnswersTexts[key]);
                  });

                  initWaterfallCallback(null);
                });

              },

              //Creation of Check button
              function (initWaterfallCallback) {
                $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for check button!");
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                    var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                    /*Mouse down event*/
                    $scope.checkButton.addEventListener("mousedown", function (event) {
                      $scope.checkButton.alpha = 0.5;
                      $scope.stage.update();
                    });

                    /*Press up event*/
                    $scope.checkButton.addEventListener("pressup", function (event) {
                      console.log("Click on Check Answers button!");
                      $scope.checkButton.alpha = 1;
                      console.log("Checking the answers...");
                      updateScore();
                      //nextActivity play onSelection
                      $scope.nextButton.gotoAndPlay("onSelection");
                      $scope.activityData.completed = true;
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
                $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                  .success(function (response) {
                    console.log("Success on getting json for restart button!");
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
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
                      $scope.stage.update();
                      restartActivity();
                      closeResultsTotalContainer();
                      $scope.activityData.completed = false;
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
                console.log("Success during init waterfall process!");

                console.log("Checking if all questions answered...");
                if ($scope.activityData.activeQuestionIndex === $scope.activityData.questions.length - 1
                  && $scope.activityData.questions[$scope.activityData.questions.length - 1].userChoices.length === $scope.activityData.questions[$scope.activityData.questions.length - 1].questionWords.length) {
                  console.warn("The activity has finished opening resultsTotalContainer!");
                  openResultsTotalContainer();
                } else {
                  console.warn("The activity hasn't finished yet...");
                  loadQuestion();
                }
              }
            })


        }//end of function init()

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        function loadQuestion() {

          closeTheQuestionResult();

          console.log("Loading question with index: ", $scope.activityData.activeQuestionIndex);

          //Clear everything
          _.each($scope.bombsContainers, function (bombContainer, key, list) {
            //All bombs play the normal animation
            $scope.bombsSprites[key].gotoAndPlay("normal");
            //Make all bombs containers invisible
            $scope.bombsTexts[key].visible = false;
            $scope.bombsContainers[key].visible = false;
            //Re-initializing the question text
            $scope.questionText.text = "";
          });

          //Checking if user has already chose answers
          if (getUserChoicesFullSentence().length > 0) {

            //Checking each of question's words if the word is in choices ok either way a bomb is build
            console.log("Active question index: ", $scope.activityData.activeQuestionIndex);
            console.warn("User has chosen words in this question!");
            console.log("User choices so far: ", $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices);

            _.each($scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords, function (word, key, list) {

              //Checking if the word exists in userChoices
              if (_.indexOf($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices, $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords[key]) === -1) {
                //Adding each word to the bomb text
                console.log("Adding the word: ", $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords[key]);
                //Assign the word to bomb text
                $scope.bombsTexts[key].text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords[key];
                $scope.bombsContainers[key].visible = true;
                $scope.bombsTexts[key].visible = true;
              }
            });

            //Update the questionText
            updateQuestionText();

            if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length
              === $scope.activityData.questions[$scope.activityData.activeQuestionIndex].questionWords.length) {
              openTheQuestionResult();
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
              //Re-initializing the question text
              $scope.questionText.text = "";
            });

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
          console.log("Getting full sentence for the question with index: ", $scope.activityData.activeQuestionIndex);
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
            //Re-initializing the question text
            $scope.questionText.text = "";
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

            //Pop last word from user choices
            $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.pop();
            //save
            save();
            //Update the questionText
            updateQuestionText();
          } else {

            console.warn("Probably it's from a restart so finding a new empty index");

            var emptyIndex = _.findKey($scope.bombsTexts, {"text": ""});
            console.log("New empty index: ", emptyIndex);
            console.log($scope.bombsTexts);
            $scope.bombsTexts[emptyIndex].text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices[$scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoices.length - 1];
            $scope.bombsSprites[emptyIndex].gotoAndPlay("normal");
            $scope.bombsContainers[emptyIndex].visible = true;

            //Pop last word from user choices
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
        function openTheQuestionResult() {

          $scope.questionResultContainer.visible = true;
          $scope.questionResultText.text = getUserChoicesFullSentence();
          createjs.Tween.get($scope.questionResultContainer, {loop: false})
            .to({
              x: 100,
              y: 80
            }, 800, createjs.Ease.getPowIn(2));
          $scope.stage.update();
        }

        //Function for closing the question result
        function closeTheQuestionResult() {
          $scope.questionResultContainer.visible = false;

          //nextActivity play normal
          $scope.nextButton.gotoAndPlay("normal");
        }

        //Updating Score
        function updateScore() {
          var totalScore = 0;
          _.each($scope.activityData.questions, function (question, key, list) {
            var fullUserSentence = "";
            var fullRightSentence = "";
            _.each($scope.activityData.questions[key].userChoices, function (word, k, l) {
              fullUserSentence += $scope.activityData.questions[key].userChoices[k];
            });
            _.each($scope.activityData.questions[key].questionWords, function (word, k, l) {
              fullRightSentence += $scope.activityData.questions[key].questionWords[k];
              $scope.rightAnswersTexts[key].text = fullRightSentence;
            });

            console.log("fullUserSentence: ", fullUserSentence);
            console.log("fullRightSentence:", fullRightSentence);

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
          $scope.scoreText.text = "Score: " + totalScore + " / " + $scope.activityData.questions.length;
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
          })
        }

        //Function used for closing resultsTotalContainer
        function closeResultsTotalContainer() {
          $scope.resultsTotalContainer.visible = false;
          //Erasing all texts from resultsTotalContainer
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.userAnswersTexts[key].text = "";
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
          save();
          closeResultsTotalContainer();
          loadQuestion();
        }

      });//end of image on complete
    }, 500);//end of timeout
  });

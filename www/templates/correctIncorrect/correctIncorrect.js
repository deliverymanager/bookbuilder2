angular.module("bookbuilder2")
  .controller("correctIncorrectController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

    console.log("correctIncorrectController loaded!");

    TypicalFunctions.loadVariablesFromLocalStorage();

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
        src: $rootScope.rootDir + "data/assets/correct_incorrect_background_image.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/correct_incorrect_background_image.png");

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

        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */
        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.on("mousedown", function (event) {
              console.log("Mouse down event on Menu button !");
              menuButton.gotoAndPlay("onSelection");
            });

            menuButton.on("pressup", function (event) {
              console.log("Press up event on Menu event!");
              menuButton.gotoAndPlay("normal");
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });

              $ionicHistory.clearCache();
              createjs.Tween.removeAllTweens();
              $scope.stage.removeAllEventListeners();
              $scope.stage.removeAllChildren();

              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5 - 30;

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

          console.warn("Starting init()...");
          init();

        } else {

          /*Getting the activityData from http.get request*/
          console.warn("There is no activity in local storage...Getting the json through $http.get()");
          console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/correctIncorrect.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);
              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 1;

              console.log("Building activity's logic");

              //Populating questions with the userChoice property
              _.each($scope.activityData.questions, function (question, key, list) {
                $scope.activityData.questions[key].userChoice = "";
              });

              //Saving to localStorage
              save();

              //Initializing
              console.warn("Starting init()...");
              init();

            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes everything*/
        function init() {

          $scope.phrases = {};
          $scope.correctPhrases = {};
          $scope.checkboxes = {};
          $scope.resultsBoxes = {};

          async.waterfall([
            function (initWaterfallCallback) {

              /*Adding page title and description*/
              $scope.pageTitle = new createjs.Text($scope.activityData.title, "18px Arial", "white");
              $scope.pageTitle.x = 85;
              $scope.pageTitle.y = 610;
              $scope.mainContainer.addChild($scope.pageTitle);

              /*Adding page title and description*/
              $scope.pageDescription = new createjs.Text($scope.activityData.description, "15px Arial", "white");
              $scope.pageDescription.x = 75;
              $scope.pageDescription.y = 630;
              $scope.mainContainer.addChild($scope.pageDescription);

              initWaterfallCallback(null);
            },

            //Function that creates the phrases container
            function (initWaterfallCallback) {

              console.log("Creating the phrases container.");

              $scope.phrasesContainer = new createjs.Container();
              $scope.phrasesContainer.width = 470;
              $scope.phrasesContainer.height = 400;
              $scope.phrasesContainer.x = 80;
              $scope.phrasesContainer.y = 110;
              $scope.mainContainer.addChild($scope.phrasesContainer);

              // var phrasesContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.phrasesContainer.width, $scope.phrasesContainer.height);
              // var phrasesContainerBackground = new createjs.Shape(phrasesContainerGraphic);
              // phrasesContainerBackground.alpha = 0.5;
              //
              // $scope.phrasesContainer.addChild(phrasesContainerBackground);

              initWaterfallCallback(null);
            },
            //Populating phrasesContainer with phrases
            function (initWaterfallCallback) {

              _.each($scope.activityData.questions, function (question, key, list) {
                //Creating the phrase text
                $scope.phrases[key] = new createjs.Text((key + 1) + ". " + $scope.activityData.questions[key].phrase, "20px Arial", "black");
                $scope.phrases[key].x = 3;
                $scope.phrases[key].y = key === 0 ? 30 : $scope.phrases[key - 1].y + 80;
                $scope.phrases[key].maxWidth = $scope.phrasesContainer.width;
                $scope.phrasesContainer.addChild($scope.phrases[key]);

                //Creating the correct phrase text
                $scope.correctPhrases[key] = new createjs.Text($scope.activityData.questions[key].correctPhrase, "18px Arial", "green");
                $scope.correctPhrases[key].x = 3;
                $scope.correctPhrases[key].y = key === 0 ? 50 : $scope.phrases[key - 1].y + 100;
                $scope.correctPhrases[key].maxWidth = $scope.phrasesContainer.width;
                $scope.phrasesContainer.addChild($scope.correctPhrases[key]);
                $scope.correctPhrases[key].visible = false;

              });

              initWaterfallCallback(null);
            },
            //Loading correctIncorrectChoice label image
            function (initWaterfallCallback) {

              //Getting the image
              $scope.correctIncorrectChoiceImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/correct_incorrect_choise.png"
              }));

              $scope.correctIncorrectChoiceImageLoader.load();
              $scope.correctIncorrectChoiceImageLoader.on("complete", function (r) {
                console.log("Success on loading correctIncorrectChoice image!");

                $scope.correctIncorrectChoiceImage = new createjs.Bitmap($rootScope.rootDir + "data/assets/correct_incorrect_choise.png");
                $scope.correctIncorrectChoiceImage.x = $scope.phrasesContainer.x + $scope.phrasesContainer.width + 5;
                $scope.correctIncorrectChoiceImage.y = $scope.phrasesContainer.y - 30;
                $scope.mainContainer.addChild($scope.correctIncorrectChoiceImage);

                $scope.correctLabel = new createjs.Text("Correct", "19px Arial", "white");
                $scope.correctLabel.x = $scope.correctIncorrectChoiceImage.x + 20;
                $scope.correctLabel.y = $scope.correctIncorrectChoiceImage.y + 10;
                $scope.mainContainer.addChild($scope.correctLabel);

                $scope.incorrectLabel = new createjs.Text("Incorrect", "19px Arial", "white");
                $scope.incorrectLabel.x = $scope.correctIncorrectChoiceImage.x + 100;
                $scope.incorrectLabel.y = $scope.correctIncorrectChoiceImage.y + 10;
                $scope.mainContainer.addChild($scope.incorrectLabel);

                initWaterfallCallback(null);
              });

            },

            //Getting checkbox sprite
            function (initWaterfallCallback) {

              $http.get($rootScope.rootDir + "data/assets/correct_incorrect_tick_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting and creating checkboxes!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkboxSpriteSheet = new createjs.SpriteSheet(response);

                  //Creating checkboxes
                  _.each($scope.activityData.questions, function (question, key, list) {

                    $scope.checkboxes[key] = {};

                    //Creating Correct checkbox
                    $scope.checkboxes[key]["correct"] = new createjs.Sprite(checkboxSpriteSheet, "normal");
                    $scope.checkboxes[key]["correct"].x = $scope.phrasesContainer.x + $scope.phrasesContainer.width + 30;
                    $scope.checkboxes[key]["correct"].y = $scope.phrasesContainer.y + $scope.phrases[key].y - 10;
                    /*Mouse down event*/
                    $scope.checkboxes[key]["correct"].on("mousedown", function (event) {
                      console.log("Mouse down event on correct checkbox!");
                    });
                    /*Press up event*/
                    $scope.checkboxes[key]["correct"].on("pressup", function (event) {
                      console.log("Press up event on correct checkbox!");
                      selectAnswer(key, "correct");
                    });
                    $scope.mainContainer.addChild($scope.checkboxes[key]["correct"]);

                    //Creating Incorrect checkbox

                    //Creating Correct checkbox
                    $scope.checkboxes[key]["incorrect"] = new createjs.Sprite(checkboxSpriteSheet, "normal");
                    $scope.checkboxes[key]["incorrect"].x = $scope.checkboxes[key]["correct"].x + 60;
                    $scope.checkboxes[key]["incorrect"].y = $scope.checkboxes[key]["correct"].y;
                    /*Mouse down event*/
                    $scope.checkboxes[key]["incorrect"].on("mousedown", function (event) {
                      console.log("Mouse down event on incorrect checkbox!");
                    });
                    /*Press up event*/
                    $scope.checkboxes[key]["incorrect"].on("pressup", function (event) {
                      console.log("Press up event on incorrect checkbox!");
                      selectAnswer(key, "incorrect");
                    });
                    $scope.mainContainer.addChild($scope.checkboxes[key]["incorrect"]);
                  });

                  initWaterfallCallback(null);
                })
                .error(function (error) {
                  console.log("Error on getting json data for checkboxes...", error);
                  initWaterfallCallback(true, error);
                });

            },
            function (initWaterfallCallback) {
              $http.get($rootScope.rootDir + "data/assets/correct_incorrect_tick_X.json")
                .success(function (response) {
                  console.log("Success on getting and creating results boxes!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var resultsBoxesSpriteSheet = new createjs.SpriteSheet(response);

                  //Creating checkboxes
                  _.each($scope.activityData.questions, function (question, key, list) {

                    //Creating results boxes
                    $scope.resultsBoxes[key] = new createjs.Sprite(resultsBoxesSpriteSheet, "normal");
                    $scope.resultsBoxes[key].x = $scope.checkboxes[key]["incorrect"].x + 70;
                    $scope.resultsBoxes[key].y = $scope.checkboxes[key]["incorrect"].y;
                    $scope.mainContainer.addChild($scope.resultsBoxes[key]);
                  });

                  initWaterfallCallback(null);
                })
                .error(function (error) {
                  console.log("Error on getting json data for results boxes...", error);
                  initWaterfallCallback(true, error);
                });
            },
            /*Check Button*/
            function (initWaterfallCallback) {
              $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  /*Mouse down event*/
                  $scope.checkButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on check button !");
                    if (!$scope.activityData.completed) {
                      $scope.checkButton.gotoAndPlay("onSelection");
                    }
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.checkButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on check button!");

                    if (!$scope.activityData.completed) {
                      $scope.checkButton.gotoAndPlay("normal");
                      if (window.cordova && window.cordova.platformId !== "browser") {
                        $scope.sounds["check"].play();
                      }
                      checkAnswers();
                    }
                  });

                  $scope.checkButton.x = 80;
                  $scope.checkButton.y = 545;
                  $scope.mainContainer.addChild($scope.checkButton);
                  initWaterfallCallback(null);
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initWaterfallCallback(true, error);
                });
            },

            /*Restart Button*/
            function (initWaterfallCallback) {
              /*RESTART BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var restartButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.restartButton = new createjs.Sprite(restartButtonSpriteSheet, "normal");

                  /*Mouse down event*/
                  $scope.restartButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on restart button!");
                    $scope.restartButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.restartButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on restart button!");
                    $scope.restartButton.gotoAndPlay("normal");
                    //Action when restart button is pressed
                    restartActivity();
                  });
                  $scope.restartButton.x = 300;
                  $scope.restartButton.y = 560;
                  $scope.mainContainer.addChild($scope.restartButton);
                  initWaterfallCallback(null);
                })
                .error(function (error) {
                  console.log("Error on getting json data for return button...", error);
                  initWaterfallCallback(true, error);
                });
            },

            /*Score Text*/
            function (initWaterfallCallback) {

              var scoreGraphic = new createjs.Graphics().beginFill("red").drawRect(510, 535, 180, 60);
              var scoreBackground = new createjs.Shape(scoreGraphic);

              $scope.mainContainer.addChild(scoreBackground);

              $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
              $scope.scoreText.x = 520;
              $scope.scoreText.y = 550;
              $scope.mainContainer.addChild($scope.scoreText);

              initWaterfallCallback(null);
            },

            /*Next Activity Button*/
            function (initCallback) {
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
                  $scope.nextButton.x = 730;
                  $scope.nextButton.y = 640;
                  $scope.mainContainer.addChild($scope.nextButton);
                  $scope.stage.update();
                  initCallback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initCallback();
                });
            }
          ], function (error, result) {
            if (error) {
              console.error("There was an error during init waterfall process...:", result);
            } else {
              console.log("Success during init waterfall process!");
              buildGame();
            }
          });

        }

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        //Function for saving
        function save() {
          //Saving it to localStorage
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        //Function for building game
        function buildGame() {

          console.log("Building the game!");

          //Filling any completed answer
          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userChoice !== "") {
              //Filling the answer key
              $scope.checkboxes[key][$scope.activityData.questions[key].userChoice].gotoAndPlay("onselect");
            }
          });

          //Checking for already answered questions
          if ($scope.activityData.completed) {
            checkAnswers();
          }
        }

        //Function for checking answers and updates the score
        function checkAnswers() {

          console.warn("Checking activities!");

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, list) {

            console.warn("Question Key: ", key);
            console.log("userChoice: ", $scope.activityData.questions[key].userChoice);
            console.log("correctPhrase: ", $scope.activityData.questions[key].correctPhrase);

            if ($scope.activityData.questions[key].userChoice !== "") {

              if ($scope.activityData.questions[key].userChoice === "correct" && $scope.activityData.questions[key].correctPhrase === "") {
                //Incrementing right answers
                rightAnswers++;
                $scope.resultsBoxes[key].gotoAndPlay("right");

                console.log("Phrase is correct and user answered correctly!");

              } else if ($scope.activityData.questions[key].userChoice === "incorrect" && $scope.activityData.questions[key].correctPhrase !== "") {
                //Incrementing right answers
                rightAnswers++;
                console.log("Phrase is incorrect and user answered correctly!");
                $scope.resultsBoxes[key].gotoAndPlay("right");
              } else if ($scope.activityData.questions[key].userChoice === "correct" && $scope.activityData.questions[key].correctPhrase !== "") {
                //Wrong answer
                $scope.resultsBoxes[key].gotoAndPlay("wrong");
                console.log("Phrase is correct and user answered incorrectly...");
              } else {
                //Wrong answer
                $scope.resultsBoxes[key].gotoAndPlay("wrong");
                console.log("Phrase is incorrect and user answered incorrectly...");
              }
            } else {
              //No answer
              $scope.resultsBoxes[key].gotoAndPlay("empty");
              console.log("User hasn't answered...");
            }
          });

          //Updating score
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

          //Mark activity as completed
          $scope.activityData.completed = true;
          save();

          $scope.nextButton.gotoAndPlay("selected");

        }

        //Action when restart button is pressed
        function restartActivity() {
          console.warn("Restarting activity!");

          //Initializing userChoices
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.activityData.questions[key].userChoice = "";
            //Initializing the buttons again
            $scope.checkboxes[key]["correct"].gotoAndPlay("normal");
            $scope.checkboxes[key]["incorrect"].gotoAndPlay("normal");
            $scope.resultsBoxes[key].gotoAndPlay("normal");
          });

          //Initializing score
          $scope.scoreText.text = "Score: " + 0 + " / " + $scope.activityData.questions.length;

          //Mark activity as incomplete
          $scope.activityData.completed = false;
          save();

          //Restarting Next activity
          $scope.nextButton.gotoAndPlay("normal");
        }

        //Function for selecting answer
        function selectAnswer(answerKey, answerChoice) {
          /**
           * answerKey = 1,2,3...
           * answerChoice = "correct" or "incorrect"
           * **/

            //Initializing the buttons again
          $scope.checkboxes[answerKey]["correct"].gotoAndPlay("normal");
          $scope.checkboxes[answerKey]["incorrect"].gotoAndPlay("normal");


          console.warn("Selecting answer for the question with index: ", answerKey);
          console.log("Answer selected: ", answerChoice);

          $scope.activityData.questions[answerKey].userChoice = answerChoice;
          save();

          $scope.checkboxes[answerKey][answerChoice].gotoAndPlay("onselect");
        }

      });//end of image on complete
    }, 500);//end of timeout
  })
;

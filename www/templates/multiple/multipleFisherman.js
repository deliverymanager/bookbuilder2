angular.module("bookbuilder2")
  .controller("MultipleFishermanController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("MultipleFishermanController loaded!");
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
        src: $rootScope.rootDir + "data/assets/multipleFisherman_background.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/multipleFisherman_background.png");

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


        /* ------------------------------------------ GENERAL INITIALIZATION ---------------------------------------------- */
        $scope.activeQuestionIndex = 0;


        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        $scope.stage.addChild($scope.mainContainer);

        //mainContainer Background
        /* var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
         var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
         mainContainerBackground.alpha = 0.5;

         $scope.mainContainer.addChild(mainContainerBackground);
         */
        /* ------------------------------------------ TOP CONTAINER ---------------------------------------------- */
        $scope.topContainer = new createjs.Container();
        $scope.topContainer.width = $scope.mainContainer.width;
        $scope.topContainer.height = 120;
        $scope.topContainer.startingPointY = 0;
        $scope.topContainer.x = 0;
        $scope.topContainer.y = 0;
        $scope.mainContainer.addChild($scope.topContainer);

        //mainContainer Background
        var topContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.topContainer.width, $scope.topContainer.height);
        var topContainerBackground = new createjs.Shape(topContainerGraphic);
        topContainerBackground.alpha = 0.5;

        $scope.topContainer.addChild(topContainerBackground);


        /* ------------------------------------------ PLAY CONTAINER ---------------------------------------------- */
        $scope.playContainer = new createjs.Container();
        $scope.playContainer.width = $scope.mainContainer.width - 40;
        $scope.playContainer.height = 480;
        $scope.playContainer.x = 20;
        $scope.playContainer.y = $scope.topContainer.y + $scope.topContainer.height + 5;
        $scope.mainContainer.addChild($scope.playContainer);

        //playContainer Background
        var playContainerGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.playContainer.width, $scope.playContainer.height);
        var playContainerBackground = new createjs.Shape(playContainerGraphic);
        playContainerBackground.alpha = 0.5;

        $scope.playContainer.addChild(playContainerBackground);


        /* ------------------------------------------ RESULTS CONTAINER ---------------------------------------------- */
        $scope.resultsContainer = new createjs.Container();
        $scope.resultsContainer.width = 740;
        $scope.resultsContainer.height = 500;
        $scope.resultsContainer.x = 60;
        $scope.resultsContainer.y = 80;
        $scope.mainContainer.addChild($scope.resultsContainer);

        //resultsContainer Background
        /*var resultsContainerGraphic = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.resultsContainer.width, $scope.resultsContainer.height);
         var resultsContainerBackground = new createjs.Shape(resultsContainerGraphic);
         resultsContainerBackground.alpha = 0.5;

         $scope.resultsContainer.addChild(resultsContainerBackground);*/

        $scope.resultsContainer.visible = true;


        /* ------------------------------------------ TOTAL RESULTS CONTAINER ---------------------------------------------- */
        $scope.resultsTotalContainer = new createjs.Container();
        $scope.resultsTotalContainer.width = $scope.mainContainer.width;
        $scope.resultsTotalContainer.height = $scope.mainContainer.height;
        $scope.resultsTotalContainer.x = 0;
        $scope.resultsTotalContainer.y = 0;
        $scope.mainContainer.addChild($scope.resultsTotalContainer);

        //mainContainer Background
        /*var resultsTotalContainerGraphic = new createjs.Graphics().beginFill("pink").drawRect(0, 0, $scope.resultsTotalContainer.width, $scope.resultsTotalContainer.height);
         var resultsTotalContainerBackground = new createjs.Shape(resultsTotalContainerGraphic);
         resultsTotalContainerBackground.alpha = 0.5;

         $scope.resultsTotalContainer.addChild(resultsTotalContainerBackground);*/

        $scope.resultsTotalContainer.visible = true;


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
              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.mainContainer.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        /************************************** Initializing Page **************************************/

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          console.log("activityData: ", $scope.activityData);

          init();

        } else {

          console.warn("There is no activity...Getting the json through $http.get()");

          console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/multiple.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 1;

              /*Adding the userAnswer attribute to response object before assigning it to activityData*/
              _.each($scope.activityData.questions, function (question, key, value) {
                $scope.activityData.questions[key].userAnswer = "";
              });

              init();

              //Saving it to localStorage
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /******************************************* INIT *****************************************/
        function init() {

          console.log("Starting init process!");

          /*Main waterfall initialization process*/
          async.waterfall([
              /*Questions and Answers*/
              function (mainWaterfallCallback) {
                /***************************** CREATION OF QUESTION AND ANSWERS ELEMENTS*****************************/
                //Adding questionTextContainer and questionText
                async.waterfall([

                    //0.5 Creating question background
                    function (questionsAndAnswersCallback) {

                      var questionBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                        src: $rootScope.rootDir + "data/assets/question_bubble_image.png"
                      }));
                      questionBackgroundImageLoader.load();

                      questionBackgroundImageLoader.on("complete", function (r) {

                        /*Creating Bitmap questionBackground*/
                        $scope.questionBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/question_bubble_image.png");
                        $scope.questionBackground.x = 120;
                        $scope.questionBackground.y = 0;
                        $scope.questionBackground.scaleX = $scope.questionBackground.scaleY = 0.7;
                        $scope.topContainer.addChild($scope.questionBackground);

                        /* ------------------------------------------ QUESTION CONTAINER ---------------------------------------------- */
                        $scope.questionContainer = new createjs.Container();
                        $scope.questionContainer.width = 530;
                        $scope.questionContainer.height = 70;
                        $scope.questionContainer.x = 130;
                        $scope.questionContainer.y = 30;
                        $scope.topContainer.addChild($scope.questionContainer);

                        //mainContainer Background
                        var questionContainerGraphic = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.questionContainer.width, $scope.questionContainer.height);
                        var questionContainerBackground = new createjs.Shape(questionContainerGraphic);
                        questionContainerBackground.alpha = 0.5;

                        $scope.questionContainer.addChild(questionContainerBackground);

                        questionsAndAnswersCallback(null);
                      });
                    },


                    function (questionsAndAnswersCallback) {
                      /*Adding a container for the question text*/
                      $scope.questionTextContainer = new createjs.Container();
                      $scope.questionTextContainer.width = $scope.questionContainer.width;
                      $scope.questionTextContainer.height = 60;
                      $scope.questionTextContainer.x = 5;
                      $scope.questionTextContainer.y = 5;
                      $scope.questionContainer.addChild($scope.questionTextContainer);

                      //questionContainer Background
                      /*var questionTextContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.questionTextContainer.width, $scope.questionTextContainer.height);
                       var questionTextContainerBackground = new createjs.Shape(questionTextContainerGraphic);
                       questionTextContainerBackground.alpha = 0.5;
                       $scope.questionTextContainer.addChild(questionTextContainerBackground);*/

                      /*Adding the Text that holds the question*/
                      /* $scope.questionText = new createjs.Text("", "25px Arial", "white");
                       $scope.questionText.x = $scope.questionTextContainer.x;
                       $scope.questionText.y = 0;
                       $scope.questionText.maxWidth = $scope.questionTextContainer.width;
                       $scope.questionTextContainer.addChild($scope.questionText);*/

                      questionsAndAnswersCallback(null);
                    }
                  ],
                  /*General Callback*/
                  function (err, result) {
                    if (!err) {
                      console.log("Success on loading the Question and Answer elements!");
                      mainWaterfallCallback(null);
                    } else {
                      console.error("There was an error on parallel process that loads the Question and Answers: ", err);
                      mainWaterfallCallback(true, err);
                    }
                  });
              },

              /*Creating Skip button, goToResults button, pageDescription and nextActivity button*/
              function (mainWaterfallCallback) {
                /***************************** CREATION OF BUTTONS,  DESCRIPTION AND  TEXTS*****************************/
                console.log("Starting waterfall process for creating Skip button, goToResults button, pageDescription, questionTexts, AnswersTexts and nextActivity button!");
                async.waterfall([
                    //1. Creating Skip button
                    function (createPageButtonsAndDescriptionCallback) {
                      $http.get($rootScope.rootDir + "data/assets/skip_one_answer_button_sprite.json")
                        .success(function (response) {
                          console.log("Success on getting json for skipAnswer button!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                          var skipAnswerSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.skipAnswerButton = new createjs.Sprite(skipAnswerSpriteSheet, "normal");


                          /*Mouse down event*/
                          $scope.skipAnswerButton.addEventListener("mousedown", function (event) {
                          });

                          /*Press up event*/
                          $scope.skipAnswerButton.addEventListener("pressup", function (event) {


                            if ($scope.activeQuestionIndex >= $scope.activityData.questions.length - 1) {
                              return;
                            }


                            /*Incrementing the index of the question*/
                            $scope.activeQuestionIndex++;
                            loadQuestion($scope.activeQuestionIndex);

                          });

                          $scope.skipAnswerButton.x = 755;
                          $scope.skipAnswerButton.y = 27;
                          $scope.topContainer.addChild($scope.skipAnswerButton);

                          createPageButtonsAndDescriptionCallback(null);
                        })
                        .error(function (error) {

                          console.error("Error on getting json data for skipAnswer button: ", error);
                          createPageButtonsAndDescriptionCallback(true, error);
                        });
                    },

                    //2. Creating goToResults button
                    function (createPageButtonsAndDescriptionCallback) {

                      $http.get($rootScope.rootDir + "data/assets/go_to_results_button_sprite.json")
                        .success(function (response) {
                          console.log("Success on getting json for goToResults button!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                          var goToResultsSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.goToResultsButton = new createjs.Sprite(goToResultsSpriteSheet, "normal");

                          /*Mouse down event*/
                          $scope.goToResultsButton.addEventListener("mousedown", function (event) {
                          });

                          /*Press up event*/
                          $scope.goToResultsButton.addEventListener("pressup", function (event) {
                            updateResultsTotalQuestions();
                            $scope.resultsTotalContainer.visible = true;
                          });

                          $scope.goToResultsButton.x = 755;
                          $scope.goToResultsButton.y = 85;
                          $scope.topContainer.addChild($scope.goToResultsButton);

                          createPageButtonsAndDescriptionCallback(null);
                        })
                        .error(function (error) {

                          console.error("Error on getting json data for goToResults button: ", error);
                          createPageButtonsAndDescriptionCallback(true, error);
                        });
                    },

                    //3. Creating pageDescription
                    function (createPageButtonsAndDescriptionCallback) {

                      console.warn("Adding pageDescription");

                      $scope.pageDescription = new createjs.Text($scope.activityData.description, "23px Arial", "black");
                      $scope.pageDescription.x = 70;
                      $scope.pageDescription.y = 680;
                      $scope.mainContainer.addChild($scope.pageDescription);

                      createPageButtonsAndDescriptionCallback(null);
                    },

                    //4. Creating nextActivity button
                    function (createPageButtonsAndDescriptionCallback) {

                      console.warn("Adding nextActivity button");

                      $http.get($rootScope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                        .success(function (response) {
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");
                          $scope.nextButton.alpha = 0.5;

                          $scope.nextButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on a button !", $scope.activityData.completed);
                            if ($scope.activityData.completed) {
                              $scope.nextButton.gotoAndPlay("onSelection");
                            }
                            $scope.stage.update();
                          });
                          $scope.nextButton.addEventListener("pressup", function (event) {
                            console.log("Press up event!");

                            if ($scope.activityData.completed) {
                              $scope.nextButton.gotoAndPlay("normal");
                              /*Calling next function!*/
                              next();
                            }
                          });
                          $scope.nextButton.x = 730;
                          $scope.nextButton.y = 700;
                          $scope.mainContainer.addChild($scope.nextButton);
                          $scope.stage.update();
                          createPageButtonsAndDescriptionCallback(null);
                        })
                        .error(function (error) {
                          console.log("Error on getting json data for check button...", error);
                          createPageButtonsAndDescriptionCallback(true, error);
                        });
                    }

                  ],
                  //General callback
                  function (err, result) {
                    if (!err) {
                      console.log("Success on creating Skip button, goToResults button, pageDescription and nextActivity button!");
                      mainWaterfallCallback(null);
                    } else {
                      console.error("Fail on creating Skip button, goToResults button, pageDescription and nextActivity button...", err);
                      mainWaterfallCallback(true, err);
                    }
                  });
              },

              /*Creation of game*/
              function (mainWaterfallCallback) {
                /***************************** CREATION OF GAME *****************************/
                async.waterfall([

                    //.0 Creating fisherman and hook
                    function (createGameWaterfallCallback) {
                      $http.get($rootScope.rootDir + "data/assets/multipleFisherman_floating.json")
                        .success(function (response) {
                          console.log("Success on getting json for fisherman!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var fishermanSpriteSheet = new createjs.SpriteSheet(response);

                          /*Creating a container for the fisherman and the hook*/
                          $scope.fishermanContainer = new createjs.Container();
                          $scope.fishermanContainer.width = 250;
                          $scope.fishermanContainer.height = 30;
                          $scope.fishermanContainer.x = 450;
                          $scope.fishermanContainer.y = 90;
                          $scope.playContainer.addChild($scope.fishermanContainer);

                          var fishermanContainerGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.fishermanContainer.width, $scope.fishermanContainer.height);
                          var fishermanContainerBackground = new createjs.Shape(fishermanContainerGraphic);
                          fishermanContainerBackground.alpha = 0.5;
                          $scope.fishermanContainer.addChild(fishermanContainerBackground);

                          /*Creating the fisherman*/
                          $scope.fisherman = new createjs.Sprite(fishermanSpriteSheet, "floating");
                          $scope.fisherman.x = 170;
                          $scope.fisherman.y = 0;
                          $scope.fisherman.scaleX = $scope.fisherman.scaleY = 1;
                          /*Mouse down event*/
                          $scope.fisherman.addEventListener("mousedown", function (event) {
                          });
                          /*Press up event*/
                          $scope.fisherman.addEventListener("pressup", function (event) {
                          });
                          $scope.fishermanContainer.addChild($scope.fisherman);
                          //Starting floating movement
                          fishermanFloating();

                          createGameWaterfallCallback(null);

                        })
                        .error(function (error) {

                          console.log("Error on getting json data for ufo spaceship: ", error);
                          createGameWaterfallCallback(true, error);
                        });
                    },

                    //.0.5 Creating fisherman's hook
                    function (createGameWaterfallCallback) {

                      $http.get($rootScope.rootDir + "data/assets/multipleFisherman_hook.json")
                        .success(function (response) {
                          console.log("Success on getting json for hook!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var fishermanHookSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.fishermanHook = new createjs.Sprite(fishermanHookSpriteSheet, "normal");

                          /*Mouse down event*/
                          $scope.fishermanHook.addEventListener("mousedown", function (event) {

                          });
                          /*Press up event*/
                          $scope.fishermanHook.addEventListener("pressup", function (event) {
                            fishermanHook.gotoAndPlay("normal");
                          });

                          $scope.fishermanHook.x = 2;
                          $scope.fishermanHook.y = 9;
                          $scope.fishermanHook.scaleX = $scope.fishermanHook.scaleY = 0.8;
                          $scope.fishermanContainer.addChild($scope.fishermanHook);

                          createGameWaterfallCallback(null);

                        })
                        .error(function (error) {
                          console.log("Error on getting json data for fisherman: ", error);
                          createGameWaterfallCallback(true, error);
                        });
                    },

                    //.1 Creating first fish
                    function (createGameWaterfallCallback) {

                      $http.get($rootScope.rootDir + "data/assets/multipleFisherman_achoice.json")
                        .success(function (response) {
                          console.log("Success on getting json for first fish!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var firstFishSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.firstFish = new createjs.Sprite(firstFishSpriteSheet, "normal");

                          /*Mouse down event*/
                          $scope.firstFish.addEventListener("mousedown", function (event) {
                          });

                          /*Press up event*/
                          $scope.firstFish.addEventListener("pressup", function (event) {
                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "aChoice", $scope.firstFish.x);
                            }
                          });

                          $scope.firstFish.x = 100;
                          $scope.firstFish.y = 320;
                          $scope.firstFish.scaleX = $scope.firstFish.scaleY = 0.9;
                          $scope.firstFish.gotoAndPlay("normal");
                          $scope.playContainer.addChild($scope.firstFish);

                          /*Adding a container for the answer A text*/
                          $scope.answerATextContainer = new createjs.Container();
                          $scope.answerATextContainer.width = 125;
                          $scope.answerATextContainer.height = 50;
                          $scope.answerATextContainer.x = 220;
                          $scope.answerATextContainer.y = 280;
                          $scope.answerATextContainer.addEventListener("pressup", function (event) {
                            console.log("Press up event on A button!");
                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "aChoice", $scope.firstFish.x);
                            }
                          });
                          $scope.playContainer.addChild($scope.answerATextContainer);

                          //answer A Background
                          /*var answerATextContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.answerATextContainer.width, $scope.answerATextContainer.height);
                          var answerATextContainerBackground = new createjs.Shape(answerATextContainerGraphic);
                          answerATextContainerBackground.alpha = 0.5;
                          $scope.answerATextContainer.addChild(answerATextContainerBackground);*/


                          /*Adding the Text that holds the question*/
                          $scope.answerAText = new createjs.Text("CHOICE A", "23px Arial", "black");
                          $scope.answerAText.x = $scope.answerATextContainer.width / 2;
                          $scope.answerAText.y = 9;
                          $scope.answerAText.textAlign = "center";
                          $scope.answerAText.maxWidth = $scope.answerATextContainer.width;
                          $scope.answerATextContainer.addChild($scope.answerAText);

                          createGameWaterfallCallback(null);

                        })
                        .error(function (error) {
                          console.log("Error on getting json data for first fish: ", error);
                          createGameWaterfallCallback(true, error);
                        });
                    },

                    //.2 Creating second fish
                    function (createGameWaterfallCallback) {
                      $http.get($rootScope.rootDir + "data/assets/multipleFisherman_bchoice.json")
                        .success(function (response) {
                          console.log("Success on getting json for second fish!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var secondFishSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.secondFish = new createjs.Sprite(secondFishSpriteSheet, "normal");

                          /*Mouse down event*/
                          $scope.secondFish.addEventListener("mousedown", function (event) {

                          });

                          /*Press up event*/
                          $scope.secondFish.addEventListener("pressup", function (event) {

                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "bChoice", $scope.secondFish.x);
                            }

                          });

                          $scope.secondFish.x = 360;
                          $scope.secondFish.y = 220;
                          $scope.secondFish.scaleX = $scope.secondFish.scaleY = 0.9;
                          $scope.secondFish.gotoAndPlay("normal");
                          $scope.playContainer.addChild($scope.secondFish);

                          /*Adding a container for the answer B text*/
                          $scope.answerBTextContainer = new createjs.Container();
                          $scope.answerBTextContainer.width = 125;
                          $scope.answerBTextContainer.height = 50;
                          $scope.answerBTextContainer.x = 480;
                          $scope.answerBTextContainer.y = 180;
                          $scope.answerBTextContainer.addEventListener("pressup", function (event) {
                            console.log("Press up event on B button!");

                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "bChoice", $scope.secondFish.x);
                            }

                          });
                          $scope.playContainer.addChild($scope.answerBTextContainer);

                          //answer B Background
                          /*var answerBTextContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.answerBTextContainer.width, $scope.answerBTextContainer.height);
                          var answerBTextContainerBackground = new createjs.Shape(answerBTextContainerGraphic);
                          answerBTextContainerBackground.alpha = 0.5;
                          $scope.answerBTextContainer.addChild(answerBTextContainerBackground);*/

                          /*Adding the Text that holds the question*/
                          $scope.answerBText = new createjs.Text("CHOICE B", "23px Arial", "black");
                          $scope.answerBText.x = $scope.answerBTextContainer.width / 2;
                          $scope.answerBText.y = 9;
                          $scope.answerBText.textAlign = "center";
                          $scope.answerBText.maxWidth = $scope.answerBTextContainer.width;
                          $scope.answerBTextContainer.addChild($scope.answerBText);

                          createGameWaterfallCallback(null);

                        })
                        .error(function (error) {
                          console.log("Error on getting json data for second fish: ", error);
                          createGameWaterfallCallback(true, error);
                        });
                    },

                    //.3 Creating third fish
                    function (createGameWaterfallCallback) {
                      $http.get($rootScope.rootDir + "data/assets/multipleFisherman_cchoice.json")
                        .success(function (response) {
                          console.log("Success on getting json for third fish!");
                          response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                          var thirdFishSpriteSheet = new createjs.SpriteSheet(response);
                          $scope.thirdFish = new createjs.Sprite(thirdFishSpriteSheet, "normal");

                          /*Mouse down event*/
                          $scope.thirdFish.addEventListener("mousedown", function (event) {

                          });

                          /*Press up event*/
                          $scope.thirdFish.addEventListener("pressup", function (event) {

                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "cChoice", $scope.thirdFish.x);
                            }

                          });

                          $scope.thirdFish.x = 500;
                          $scope.thirdFish.y = 370;
                          $scope.thirdFish.scaleX = $scope.thirdFish.scaleY = 0.9;
                          $scope.thirdFish.gotoAndPlay("normal");
                          $scope.playContainer.addChild($scope.thirdFish);

                          /*Adding a container for the answer C text*/
                          $scope.answerCTextContainer = new createjs.Container();
                          $scope.answerCTextContainer.width = 125;
                          $scope.answerCTextContainer.height = 50;
                          $scope.answerCTextContainer.x = 620;
                          $scope.answerCTextContainer.y = 330;
                          $scope.answerCTextContainer.addEventListener("pressup", function (event) {
                            console.log("Press up event on C button!");

                            if(!$scope.selectionInProgress){
                              selectFish($scope.activeQuestionIndex, "cChoice", $scope.thirdFish);
                            }

                          });
                          $scope.playContainer.addChild($scope.answerCTextContainer);

                          //answer C Background
                          /*var answerCTextContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.answerCTextContainer.width, $scope.answerCTextContainer.height);
                          var answerCTextContainerBackground = new createjs.Shape(answerCTextContainerGraphic);
                          answerCTextContainerBackground.alpha = 0.5;
                          $scope.answerCTextContainer.addChild(answerCTextContainerBackground);*/

                          /*Adding the Text that holds the question*/
                          $scope.answerCText = new createjs.Text("CHOICE C", "23px Arial", "black");
                          $scope.answerCText.x = $scope.answerCTextContainer.width / 2;
                          $scope.answerCText.y = 9;
                          $scope.answerCText.textAlign = "center";
                          $scope.answerCText.maxWidth = $scope.answerCTextContainer.width;
                          $scope.answerCTextContainer.addChild($scope.answerCText);

                          createGameWaterfallCallback(null);

                        })
                        .error(function (error) {
                          console.log("Error on getting json data for third fish: ", error);
                          createGameWaterfallCallback(true, error);
                        });
                    }
                  ],
                  //General callback for creating game waterfall
                  function (err, result) {
                    if (!err) {
                      console.log("Success on creating game elements!");
                      mainWaterfallCallback(null);
                    } else {
                      console.error("Fail on creating game elements...", err);
                      mainWaterfallCallback(true, err);
                    }
                  });
              },//end of second main waterfall function



              /*Creation of results frames*/
              function (mainWaterfallCallback) {

                /***************************** CREATION OF RESULTS FRAMES *****************************/
                async.waterfall([
                    /*Results table*/
                    function (mainWaterfallCallback) {
                      async.waterfall([
                        /*Adding background image in result table */
                        function (resultWaterfallCallback) {

                          console.log("Adding results background...");
                          /*Creating the questionTextBackground bitmap*/
                          var resultsBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                            src: $rootScope.rootDir + "data/assets/soccer_results_table_image.png"
                          }));
                          resultsBackgroundImageLoader.load();

                          resultsBackgroundImageLoader.on("complete", function (r) {

                            /*Creating Bitmap Background for answerHolder background image*/
                            $scope.resultsBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_table_image.png");
                            $scope.resultsBackground.x = 0;
                            $scope.resultsBackground.y = 0;
                            $scope.resultsContainer.addChild($scope.resultsBackground);

                            /*Making results container invisible when its created*/
                            $scope.resultsContainer.visible = false;

                            resultWaterfallCallback(null);

                          });//end of questionTextBackgroundImageLoader
                        },

                        /*Results Question*/
                        function (resultWaterfallCallback) {

                          //Creating container for results question
                          $scope.resultQuestionContainer = new createjs.Container();
                          $scope.resultQuestionContainer.width = 630;
                          $scope.resultQuestionContainer.height = 80;
                          $scope.resultQuestionContainer.x = 30;
                          $scope.resultQuestionContainer.y = 85;
                          $scope.resultsContainer.addChild($scope.resultQuestionContainer);

                          //resultQuestionContainer Background
                          /*var resultQuestionContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultQuestionContainer.width, $scope.resultQuestionContainer.height);
                           var resultQuestionContainerBackground = new createjs.Shape(resultQuestionContainerGraphic);
                           resultQuestionContainerBackground.alpha = 0.5;
                           $scope.resultQuestionContainer.addChild(resultQuestionContainerBackground);*/


                          resultWaterfallCallback(null);
                        },

                        /*Results Answer*/
                        function (resultWaterfallCallback) {

                          //Creating container for results answer
                          $scope.resultAnswerContainer = new createjs.Container();
                          $scope.resultAnswerContainer.width = 200;
                          $scope.resultAnswerContainer.height = 70;
                          $scope.resultAnswerContainer.x = 320;
                          $scope.resultAnswerContainer.y = 195;
                          $scope.resultsContainer.addChild($scope.resultAnswerContainer);

                          //resultAnswerContainer Background
                          /*var resultAnswerContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultAnswerContainer.width, $scope.resultAnswerContainer.height);
                           var resultAnswerContainerBackground = new createjs.Shape(resultAnswerContainerGraphic);
                           resultAnswerContainerBackground.alpha = 0.5;
                           $scope.resultAnswerContainer.addChild(resultAnswerContainerBackground);*/

                          //Creating the text element for the result answer
                          $scope.resultAnswerText = new createjs.Text("", "20px Arial", "red");
                          $scope.resultAnswerText.x = 0;
                          $scope.resultAnswerText.y = 10;
                          $scope.resultAnswerText.maxWidth = $scope.resultAnswerContainer.width;
                          $scope.resultAnswerContainer.addChild($scope.resultAnswerText);

                          resultWaterfallCallback(null);
                        },

                        /*Results and Restart Buttons*/
                        function (resultWaterfallCallback) {

                          /*Waterfall for creating the Results and Restart buttons in results page*/
                          async.waterfall([
                            function (resultsButtonsWaterfallCallback) {

                              /*Creating the continue button*/
                              var continueButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                src: $rootScope.rootDir + "data/assets/soccer_results_continue.png"
                              }));
                              continueButtonImageLoader.load();

                              continueButtonImageLoader.on("complete", function (r) {

                                /*Creating Bitmap Background for continue button*/
                                $scope.continueButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_continue.png");
                                $scope.continueButton.x = 40;
                                $scope.continueButton.y = 303;
                                $scope.resultsContainer.addChild($scope.continueButton);

                                /*Mouse down event*/
                                $scope.continueButton.addEventListener("mousedown", function (event) {
                                  $scope.activeQuestionIndex++;
                                  loadQuestion($scope.activeQuestionIndex);
                                });

                                /*Press up event*/
                                $scope.continueButton.addEventListener("pressup", function (event) {
                                });

                                resultsButtonsWaterfallCallback(null);
                              });//end of continueButtonImageLoader

                            }
                          ], function (err, result) {
                            if (!err) {
                              console.log("Success in creating Continue and Restart buttons in results page!");
                              resultWaterfallCallback(null);
                            } else {
                              console.error("Fail in creating Continue and Restart buttons in results page: ", err);
                              resultWaterfallCallback(true, err);
                            }
                          });
                        }

                      ], function (err, results) {

                        if (!err) {
                          console.log("Success on adding Page description and Skip, goToResults Buttons!");
                          mainWaterfallCallback(null);
                        } else {
                          console.log("Error on creating results page: ", err);
                          mainWaterfallCallback(true, err);
                        }
                      });
                    },

                    /*resultsTotal table*/
                    function (mainWaterfallCallback) {
                      async.waterfall([
                        /*Adding background image in result table */
                        function (resultWaterfallCallback) {

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

                            /*Adding container in resultsTotalContainer to create a working space in background image frame*/
                            $scope.resultsTotalBackgroundContainer = new createjs.Container();
                            $scope.resultsTotalBackgroundContainer.width = 820;
                            $scope.resultsTotalBackgroundContainer.height = 480;
                            $scope.resultsTotalBackgroundContainer.x = 25;
                            $scope.resultsTotalBackgroundContainer.y = 85;
                            $scope.resultsTotalContainer.addChild($scope.resultsTotalBackgroundContainer);

                            //mainContainer Background
                            /*var resultsTotalBackgroundContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.resultsTotalBackgroundContainer.width, $scope.resultsTotalBackgroundContainer.height);
                             var resultsTotalBackgroundContainerBackground = new createjs.Shape(resultsTotalBackgroundContainerGraphic);
                             resultsTotalBackgroundContainerBackground.alpha = 0.5;
                             $scope.resultsTotalBackgroundContainer.addChild(resultsTotalBackgroundContainerBackground);*/

                            //Making it invisible
                            $scope.resultsTotalContainer.visible = false;

                            /*Adding each question container an initializing various data*/
                            $scope.resultsTotalRowContainers = {};
                            $scope.resultsTotalRowQuestionsContainers = {};
                            $scope.resultsTotalRowAnswersContainers = {};
                            $scope.resultsTotalRowQuestionsTexts = {};
                            $scope.resultsTotalRowAnswersTexts = {};
                            $scope.resultsAnswersTableContainerA = {};
                            $scope.resultsAnswersTableContainerB = {};
                            $scope.resultsAnswersTableContainerC = {};
                            $scope.answerResultsATexts = {};
                            $scope.answerResultsBTexts = {};
                            $scope.answerResultsCTexts = {};


                            //Creating the little answersTable
                            var resultsAnswersOptionsTableImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                              src: $rootScope.rootDir + "data/assets/soccer_results_answers.png"
                            }));
                            resultsAnswersOptionsTableImageLoader.load();

                            resultsAnswersOptionsTableImageLoader.on("complete", function (r) {

                              /*Creating Bitmap for results*/
                              $scope.resultsAnswersOptionsTable = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_answers.png");
                              $scope.resultsAnswersOptionsTable.x = 640;
                              $scope.resultsAnswersOptionsTable.y = -10;
                              $scope.resultsAnswersOptionsTable.visible = false;

                              /*A container for the answers options table that holds the answers every time it opens*/
                              $scope.resultsAnswersOptionsTableContainer = new createjs.Container();
                              $scope.resultsAnswersOptionsTableContainer.width = 176;
                              $scope.resultsAnswersOptionsTableContainer.height = 145;
                              $scope.resultsAnswersOptionsTableContainer.x = $scope.resultsAnswersOptionsTable.x;
                              $scope.resultsAnswersOptionsTableContainer.y = $scope.resultsAnswersOptionsTable.y + 20;
                              $scope.resultsAnswersOptionsTableContainer.visible = false;

                              /*var resultsAnswersOptionsTableContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultsAnswersOptionsTableContainer.width, $scope.resultsAnswersOptionsTableContainer.height);
                               var resultsAnswersOptionsTableContainerBackground = new createjs.Shape(resultsAnswersOptionsTableContainerGraphic);
                               resultsAnswersOptionsTableContainerBackground.alpha = 0.5;
                               $scope.resultsAnswersOptionsTableContainer.addChild(resultsAnswersOptionsTableContainerBackground);*/

                              //-------Containers

                              /** After resultsAnswerOptionsTable loads the rest of the game builds **/

                              /*Creating the page's restart and check buttons*/

                              /*Check Button*/
                              $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                                .success(function (response) {
                                  console.log("Success on getting json for check button!");
                                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                                  /*Mouse down event*/
                                  $scope.checkButton.addEventListener("mousedown", function (event) {
                                  });

                                  /*Press up event*/
                                  $scope.checkButton.addEventListener("pressup", function (event) {
                                    console.log("Click on Check Answers button!");

                                    //Checking all answers if userAnswer === answerChoice
                                    var rightQuestions = 0;
                                    _.each($scope.activityData.questions, function (question, key, list) {
                                      if ($scope.activityData.questions[key].userAnswer === $scope.activityData.questions[key].answerChoice) {

                                        /** Right Answer **/
                                        rightQuestions++;
                                        /*During score check the question text becomes green and changes to right answer*/
                                        $scope.resultsTotalRowQuestionsTexts[key].color = "green";

                                        /*During score check the answer text becomes green or red if the user answer is right or wrong*/
                                        $scope.resultsTotalRowAnswersTexts[key].color = "green";

                                      } else {

                                        /** Wrong Answer **/
                                        /*During score check the question text becomes green and changes to right answer*/

                                        //!!!!!!! has to find the right answer from answers
                                        $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].answerChoice];
                                        $scope.resultsTotalRowQuestionsTexts[key].color = "green";

                                        /*During score check the answer text becomes green or red if the user answer is right or wrong*/
                                        $scope.resultsTotalRowAnswersTexts[key].color = "red";
                                      }
                                    });

                                    //Completed
                                    $scope.activityData.completed = true;
                                    $scope.nextButton.gotoAndPlay("onSelection");

                                    //Updating the Score text
                                    $scope.scoreText.text = "Score: " + rightQuestions + " / " + $scope.activityData.questions.length;

                                  });

                                  $scope.checkButton.x = 45;
                                  $scope.checkButton.y = 575;
                                  $scope.checkButton.gotoAndPlay("normal");
                                  $scope.resultsTotalContainer.addChild($scope.checkButton);

                                })
                                .error(function (error) {
                                  console.log("Error on getting json data for check button: ", error);
                                });


                              /*Restart Button for totalResults frame !!!*/
                              $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                                .success(function (response) {
                                  console.log("Success on getting json for restartTotal button!");
                                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                  var restartTotalButtonSpriteSheet = new createjs.SpriteSheet(response);
                                  $scope.restartTotalButton = new createjs.Sprite(restartTotalButtonSpriteSheet, "normal");

                                  /*Mouse down event*/
                                  $scope.restartTotalButton.addEventListener("mousedown", function (event) {
                                  });


                                  /*Press up event*/
                                  $scope.restartTotalButton.addEventListener("pressup", function (event) {
                                    console.log("Click on RestartTotal button!");

                                    async.waterfall([
                                      function (restartWaterfallCallback) {
                                        //Erase all saved answers and restarts all elements
                                        _.each($scope.activityData.questions, function (question, key, list) {
                                          $scope.activityData.questions[key].userAnswer = "";
                                          $scope.resultsTotalRowQuestionsTexts[key].text = "";
                                          $scope.resultsTotalRowQuestionsTexts[key].color = "black";
                                          $scope.resultsTotalRowAnswersTexts[key].text = "-";
                                          $scope.resultsTotalRowAnswersTexts[key].color = "black";
                                        });

                                        //Making index 0 again...
                                        $scope.activeQuestionIndex = 0;
                                        loadQuestion(0);

                                        $timeout(function () {
                                          restartWaterfallCallback(null);
                                        }, 200);
                                      }
                                    ], function (err, results) {

                                      //Hide resultsTotal container and making pageDescription and nextButton visible again
                                      $scope.resultsTotalContainer.visible = false;
                                      $scope.pageDescription.visible = true;

                                      //Restarting activity so the completed property has to be false
                                      $scope.activityData.completed = false;

                                      //Next button playing normal animation
                                      $scope.nextButton.gotoAndPlay("normal");

                                      _.each($scope.activityData.questions, function (question, key, list) {
                                        $scope.activityData.questions[key].userAnswer = "";
                                      });

                                      //Restarting score again
                                      $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;

                                    });
                                  });//End of press up element

                                  $scope.restartTotalButton.x = 280;
                                  $scope.restartTotalButton.y = 590;
                                  $scope.restartTotalButton.gotoAndPlay("normal");
                                  $scope.resultsTotalContainer.addChild($scope.restartTotalButton);

                                })
                                .error(function (error) {
                                  console.log("Error on getting json data for check button: ", error);
                                });

                              /*Creating Row containers*/
                              _.each($scope.activityData.questions, function (question, key, list) {

                                $scope.resultsTotalRowContainers[key] = new createjs.Container();
                                $scope.resultsTotalRowContainers[key].width = $scope.resultsTotalBackgroundContainer.width - 10;
                                $scope.resultsTotalRowContainers[key].height = 43;
                                $scope.resultsTotalRowContainers[key].x = 5;
                                $scope.resultsTotalRowContainers[key].y = 5 + 48 * key;
                                $scope.resultsTotalBackgroundContainer.addChild($scope.resultsTotalRowContainers[key]);

                                /*var resultsTotalRowContainersGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultsTotalRowContainers[key].width, $scope.resultsTotalRowContainers[key].height);
                                 var resultsTotalRowContainersBackground = new createjs.Shape(resultsTotalRowContainersGraphic);
                                 resultsTotalRowContainersBackground.alpha = 0.5;
                                 $scope.resultsTotalRowContainers[key].addChild(resultsTotalRowContainersBackground);*/

                                /*Creating Row Questions containers*/
                                $scope.resultsTotalRowQuestionsContainers[key] = new createjs.Container();
                                $scope.resultsTotalRowQuestionsContainers[key].width = 630;
                                $scope.resultsTotalRowQuestionsContainers[key].height = $scope.resultsTotalRowContainers[key].height;
                                $scope.resultsTotalRowQuestionsContainers[key].x = 0;
                                $scope.resultsTotalRowQuestionsContainers[key].y = 0;
                                $scope.resultsTotalRowContainers[key].addChild($scope.resultsTotalRowQuestionsContainers[key]);

                                var resultsTotalRowQuestionsContainersGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.resultsTotalRowQuestionsContainers[key].width, $scope.resultsTotalRowQuestionsContainers[key].height);
                                var resultsTotalRowQuestionsContainersBackground = new createjs.Shape(resultsTotalRowQuestionsContainersGraphic);
                                resultsTotalRowQuestionsContainersBackground.alpha = 0.5;
                                $scope.resultsTotalRowQuestionsContainers[key].addChild(resultsTotalRowQuestionsContainersBackground);

                                //Question index
                                var indexNumber = new createjs.Text((key + 1) + ". ", "19px Arial", "black");
                                indexNumber.x = 0;
                                indexNumber.y = 0;
                                $scope.resultsTotalRowQuestionsContainers[key].addChild(indexNumber);

                                //Pretext
                                var pretext = new createjs.Text($scope.activityData.questions[key].pretext, "19px Arial", "black");
                                pretext.x = indexNumber.x + indexNumber.getBounds().width;
                                pretext.y = 0;
                                $scope.resultsTotalRowQuestionsContainers[key].addChild(pretext);

                                //Underline
                                var questionUnderline = new createjs.Text("__________", "19px Arial", "black");
                                questionUnderline.x = pretext.x + pretext.getBounds().width;
                                questionUnderline.y = pretext.y;
                                $scope.resultsTotalRowQuestionsContainers[key].addChild(questionUnderline);

                                //Answer
                                $scope.resultsTotalRowQuestionsTexts[key] = new createjs.Text(" ", "19px Arial", "black");
                                $scope.resultsTotalRowQuestionsTexts[key].x = questionUnderline.x + questionUnderline.getBounds().width / 2;
                                $scope.resultsTotalRowQuestionsTexts[key].y = questionUnderline.y;
                                $scope.resultsTotalRowQuestionsTexts[key].textAlign = "center";
                                $scope.resultsTotalRowQuestionsContainers[key].addChild($scope.resultsTotalRowQuestionsTexts[key]);

                                if ($scope.activityData.questions[key].postext) {

                                  var postexts = $scope.activityData.questions[key].postext.split("\n");
                                  console.log("Postexts: ", postexts.length);
                                  var currentPostexts = {};

                                  if (postexts.length > 1) {
                                    if (!postexts[0]) {
                                      postexts[0] = " ";
                                    }

                                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                                    currentPostexts[0].y = 0;
                                    $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPostexts[0]);

                                    currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                                    currentPostexts[1].x = pretext.x;
                                    currentPostexts[1].y = currentPostexts[0].y + 28;
                                    $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPostexts[1]);

                                  } else {

                                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                                    currentPostexts[0].y = 0;
                                    $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPostexts[0]);
                                  }
                                }


                                /*Creating Row Answers containers*/
                                $scope.resultsTotalRowAnswersContainers[key] = new createjs.Container();
                                $scope.resultsTotalRowAnswersContainers[key].width = 170;
                                $scope.resultsTotalRowAnswersContainers[key].height = $scope.resultsTotalRowContainers[key].height;
                                $scope.resultsTotalRowAnswersContainers[key].x = $scope.resultsTotalRowQuestionsContainers[key].x
                                  + $scope.resultsTotalRowQuestionsContainers[key].width
                                  + 10;
                                $scope.resultsTotalRowAnswersContainers[key].y = 0;
                                $scope.resultsTotalRowContainers[key].addChild($scope.resultsTotalRowAnswersContainers[key]);

                                var resultsTotalRowAnswersContainersGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.resultsTotalRowAnswersContainers[key].width, $scope.resultsTotalRowAnswersContainers[key].height);
                                var resultsTotalRowAnswersContainersBackground = new createjs.Shape(resultsTotalRowAnswersContainersGraphic);
                                resultsTotalRowAnswersContainersBackground.alpha = 0.5;
                                $scope.resultsTotalRowAnswersContainers[key].addChild(resultsTotalRowAnswersContainersBackground);

                                /*Answer Text*/
                                $scope.resultsTotalRowAnswersTexts[key] = new createjs.Text($scope.activityData.questions[key].userAnswer === "" ? "-" : $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer], "25px Arial", "black");
                                $scope.resultsTotalRowAnswersTexts[key].textAlign = "center";
                                $scope.resultsTotalRowAnswersTexts[key].x = $scope.resultsTotalRowAnswersContainers[key].width / 2;
                                $scope.resultsTotalRowAnswersTexts[key].y = 5;
                                $scope.resultsTotalRowAnswersTexts[key].maxWidth = $scope.resultsTotalRowAnswersContainers[key].width;
                                $scope.resultsTotalRowAnswersContainers[key].addChild($scope.resultsTotalRowAnswersTexts[key]);



                                //Adding three mini containers that will hold the answers making click selection easier
                                //Answer Container A
                                $scope.resultsAnswersTableContainerA[key] = new createjs.Container();
                                $scope.resultsAnswersTableContainerA[key].width = 176;
                                $scope.resultsAnswersTableContainerA[key].height = 45;
                                $scope.resultsAnswersTableContainerA[key].x = 0;
                                $scope.resultsAnswersTableContainerA[key].y = 0;
                                $scope.resultsAnswersTableContainerA[key].visible = false;

                                var resultsAnswersTableContainerAGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.resultsAnswersTableContainerA[key].width, $scope.resultsAnswersTableContainerA[key].height);
                                var resultsAnswersTableContainerABackground = new createjs.Shape(resultsAnswersTableContainerAGraphic);
                                resultsAnswersTableContainerABackground.alpha = 0.5;
                                $scope.resultsAnswersTableContainerA[key].addChild(resultsAnswersTableContainerABackground);


                                //Answer Container B
                                $scope.resultsAnswersTableContainerB[key] = new createjs.Container();
                                $scope.resultsAnswersTableContainerB[key].width = 176;
                                $scope.resultsAnswersTableContainerB[key].height = 45;
                                $scope.resultsAnswersTableContainerB[key].x = 0;
                                $scope.resultsAnswersTableContainerB[key].y = 50;
                                $scope.resultsAnswersTableContainerB[key].visible = false;

                                var resultsAnswersTableContainerBGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.resultsAnswersTableContainerB[key].width, $scope.resultsAnswersTableContainerB[key].height);
                                var resultsAnswersTableContainerBBackground = new createjs.Shape(resultsAnswersTableContainerBGraphic);
                                resultsAnswersTableContainerBBackground.alpha = 0.5;
                                $scope.resultsAnswersTableContainerB[key].addChild(resultsAnswersTableContainerBBackground);


                                /** Checking if the question has answer C first!**/
                                if ($scope.activityData.questions[key].cChoice !== "") {
                                  //Answer Container C
                                  $scope.resultsAnswersTableContainerC[key] = new createjs.Container();
                                  $scope.resultsAnswersTableContainerC[key].width = 176;
                                  $scope.resultsAnswersTableContainerC[key].height = 45;
                                  $scope.resultsAnswersTableContainerC[key].x = 0;
                                  $scope.resultsAnswersTableContainerC[key].y = 100;
                                  $scope.resultsAnswersTableContainerC[key].visible = false;

                                  var resultsAnswersTableContainerCGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.resultsAnswersTableContainerC[key].width, $scope.resultsAnswersTableContainerC[key].height);
                                  var resultsAnswersTableContainerCBackground = new createjs.Shape(resultsAnswersTableContainerCGraphic);
                                  resultsAnswersTableContainerCBackground.alpha = 0.5;
                                  $scope.resultsAnswersTableContainerC[key].addChild(resultsAnswersTableContainerCBackground);
                                }

                                /** Checking if the question has answer D first!**/
                                if ($scope.activityData.questions[key].dChoice !== "") {

                                }


                                /** A Choice **/
                                $scope.answerResultsATexts[key] = new createjs.Text($scope.activityData.questions[key].aChoice, "21px Arial", "black");
                                $scope.answerResultsATexts[key].x = $scope.resultsAnswersTableContainerA[key].width / 2;
                                $scope.answerResultsATexts[key].regX = $scope.answerResultsATexts[key].getBounds().width / 2;
                                $scope.answerResultsATexts[key].y = 6;
                                $scope.answerResultsATexts[key].visible = false;

                                /*Click event for the option A*/
                                $scope.resultsAnswersTableContainerA[key].addEventListener("pressup", function (event) {
                                  console.log("Click on answer A!");
                                  $scope.resultsAnswersOptionsTableContainer.visible = false;
                                  $scope.resultsAnswersOptionsTable.visible = false;
                                  $scope.activityData.questions[key].userAnswer = "aChoice";
                                  //make the text of answerContainers
                                  $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                  $scope.resultsTotalRowAnswersTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                  $scope.resultsAnswersTableContainerA[key].visible = false;
                                  $scope.answerResultsATexts[key].visible = false;
                                  $scope.stage.update();
                                });


                                /** B Choice **/
                                $scope.answerResultsBTexts[key] = new createjs.Text($scope.activityData.questions[key].bChoice, "21px Arial", "black");
                                $scope.answerResultsBTexts[key].x = $scope.resultsAnswersTableContainerB[key].width / 2;
                                $scope.answerResultsBTexts[key].regX = $scope.answerResultsBTexts[key].getBounds().width / 2;
                                $scope.answerResultsBTexts[key].y = 6;
                                $scope.answerResultsBTexts[key].visible = false;

                                /*Click event for the option B*/
                                $scope.resultsAnswersTableContainerB[key].addEventListener("pressup", function (event) {
                                  console.log("Click on answer B!");
                                  $scope.resultsAnswersOptionsTableContainer.visible = false;
                                  $scope.resultsAnswersOptionsTable.visible = false;
                                  $scope.activityData.questions[key].userAnswer = "bChoice";
                                  //make the text of answerContainers
                                  $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                  $scope.resultsTotalRowAnswersTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                  $scope.resultsAnswersTableContainerB[key].visible = false;
                                  $scope.answerResultsBTexts[key].visible = false;
                                  $scope.stage.update();
                                });


                                /** Checking if the question has answer C first!**/
                                if ($scope.activityData.questions[key].cChoice !== "") {
                                  /** C Choice **/
                                  $scope.answerResultsCTexts[key] = new createjs.Text($scope.activityData.questions[key].cChoice, "21px Arial", "black");
                                  $scope.answerResultsCTexts[key].x = $scope.resultsAnswersTableContainerA[key].width / 2;
                                  $scope.answerResultsCTexts[key].regX = $scope.answerResultsCTexts[key].getBounds().width / 2;
                                  $scope.answerResultsCTexts[key].y = 6;
                                  $scope.answerResultsCTexts[key].visible = false;

                                  /*Click event for the option C*/
                                  $scope.resultsAnswersTableContainerC[key].addEventListener("pressup", function (event) {
                                    console.log("Click on answer C!");
                                    $scope.resultsAnswersOptionsTableContainer.visible = false;
                                    $scope.resultsAnswersOptionsTable.visible = false;
                                    $scope.activityData.questions[key].userAnswer = "cChoice";
                                    $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                    $scope.resultsTotalRowAnswersTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
                                    $scope.resultsAnswersTableContainerC[key].visible = false;
                                    $scope.answerResultsCTexts[key].visible = false;
                                    $scope.stage.update();
                                  });
                                }

                                /** Checking if the question has answer D first!**/
                                if ($scope.activityData.questions[key].dChoice !== "") {

                                }


                                /*Click event on resultsTotalRowAnswersContainers for choosing an option*/
                                $scope.resultsTotalRowAnswersContainers[key].addEventListener("pressup", function (event) {

                                  //Making containers in choices invisible
                                  _.each($scope.resultsAnswersTableContainerA, function (answer, key, list) {
                                    $scope.resultsAnswersTableContainerA[key].visible = false;
                                    $scope.resultsAnswersTableContainerB[key].visible = false;
                                    /** Checking if the question has answer C first!**/
                                    if ($scope.activityData.questions[key].cChoice !== "") {
                                      $scope.resultsAnswersTableContainerC[key].visible = false;
                                    }
                                    /** Checking if the question has answer D first!**/
                                    if ($scope.activityData.questions[key].dChoice !== "") {

                                    }

                                  });

                                  //Making texts in choices invisible
                                  _.each($scope.answerResultsATexts, function (answer, key, list) {
                                    $scope.answerResultsATexts[key].visible = false;
                                    $scope.answerResultsBTexts[key].visible = false;
                                    /** Checking if the question has answer C first!**/
                                    if ($scope.activityData.questions[key].cChoice !== "") {
                                      $scope.answerResultsCTexts[key].visible = false;
                                    }
                                    /** Checking if the question has answer D first!**/
                                    if ($scope.activityData.questions[key].dChoice !== "") {

                                    }
                                  });

                                  console.log("Press up event on resultsTotalRowAnswersContainers with index: ", key);
                                  $scope.resultsAnswersOptionsTable.y = $scope.resultsTotalRowContainers[key].y - 10;
                                  $scope.resultsAnswersOptionsTableContainer.y = $scope.resultsAnswersOptionsTable.y + 20;

                                  /*Making the background and the resultsAnswersOptionsTableContainer visible and dynamically appear on the y of clicked answer*/
                                  if ($scope.activityData.completed) {
                                    console.log("The activity has completed! Cannot select an answer...");
                                  } else {
                                    $scope.resultsAnswersOptionsTable.visible = true;
                                    $scope.resultsAnswersOptionsTableContainer.visible = true;
                                  }

                                  /*Appearing only the choices of the selected answer, the disappearing is handled in choice's event*/
                                  $scope.resultsAnswersTableContainerA[key].visible = true;
                                  $scope.resultsAnswersTableContainerB[key].visible = true;
                                  /** Checking if the question has answer C first!**/
                                  if ($scope.activityData.questions[key].cChoice !== "") {
                                    $scope.resultsAnswersTableContainerC[key].visible = true;
                                  }
                                  /** Checking if the question has answer D first!**/
                                  if ($scope.activityData.questions[key].dChoice !== "") {

                                  }

                                  $scope.answerResultsATexts[key].visible = true;
                                  $scope.answerResultsBTexts[key].visible = true;
                                  /** Checking if the question has answer C first!**/
                                  if ($scope.activityData.questions[key].cChoice !== "") {
                                    $scope.answerResultsCTexts[key].visible = true;
                                  }
                                  /** Checking if the question has answer D first!**/
                                  if ($scope.activityData.questions[key].dChoice !== "") {

                                  }


                                  $scope.stage.update();
                                });//end of click on resultsTotalRowAnswersContainers for choosing an answer


                                /*After all elements are loaded finally the resultsAnswersOptionsTable is loaded to get higher index*/
                                $scope.resultsTotalBackgroundContainer.addChild($scope.resultsAnswersOptionsTable);
                                $scope.resultsTotalBackgroundContainer.addChild($scope.resultsAnswersOptionsTableContainer);
                                $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerA[key]);
                                $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerB[key]);
                                /** Checking if the question has answer C first!**/
                                if ($scope.activityData.questions[key].cChoice !== "") {
                                  $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerC[key]);
                                }
                                /** Checking if the question has answer D first!**/
                                if ($scope.activityData.questions[key].dChoice !== "") {

                                }

                                $scope.resultsAnswersTableContainerA[key].addChild($scope.answerResultsATexts[key]);
                                $scope.resultsAnswersTableContainerB[key].addChild($scope.answerResultsBTexts[key]);
                                /** Checking if the question has answer C first!**/
                                if ($scope.activityData.questions[key].cChoice !== "") {
                                  $scope.resultsAnswersTableContainerC[key].addChild($scope.answerResultsCTexts[key]);
                                }
                                /** Checking if the question has answer D first!**/
                                if ($scope.activityData.questions[key].dChoice !== "") {

                                }
                              });//end of each

                            });//end of resultsAnswersOptionsTableImageLoader

                            resultWaterfallCallback(null);

                          });//end of questionTextBackgroundImageLoader
                        },

                        /*Results Question*/
                        function (resultWaterfallCallback) {

                          //Creating container for results question
                          $scope.resultQuestionContainer = new createjs.Container();
                          $scope.resultQuestionContainer.width = 630;
                          $scope.resultQuestionContainer.height = 80;
                          $scope.resultQuestionContainer.x = 30;
                          $scope.resultQuestionContainer.y = 85;
                          $scope.resultsContainer.addChild($scope.resultQuestionContainer);

                          //resultQuestionContainer Background
                          /*var resultQuestionContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultQuestionContainer.width, $scope.resultQuestionContainer.height);
                           var resultQuestionContainerBackground = new createjs.Shape(resultQuestionContainerGraphic);
                           resultQuestionContainerBackground.alpha = 0.5;
                           $scope.resultQuestionContainer.addChild(resultQuestionContainerBackground);*/

                          //Creating the text element for the result question
                          $scope.resultQuestionText = new createjs.Text("", "25px Arial", "black");
                          $scope.resultQuestionText.x = 0;
                          $scope.resultQuestionText.y = 10;
                          $scope.resultQuestionText.maxWidth = $scope.resultQuestionContainer.width;
                          $scope.resultQuestionContainer.addChild($scope.resultQuestionText);

                          resultWaterfallCallback(null);
                        },

                        /*Results Answer*/
                        function (resultWaterfallCallback) {

                          //Creating container for results answer
                          $scope.resultAnswerContainer = new createjs.Container();
                          $scope.resultAnswerContainer.width = 200;
                          $scope.resultAnswerContainer.height = 70;
                          $scope.resultAnswerContainer.x = 320;
                          $scope.resultAnswerContainer.y = 195;
                          $scope.resultsContainer.addChild($scope.resultAnswerContainer);

                          //resultAnswerContainer Background
                          /*var resultAnswerContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.resultAnswerContainer.width, $scope.resultAnswerContainer.height);
                           var resultAnswerContainerBackground = new createjs.Shape(resultAnswerContainerGraphic);
                           resultAnswerContainerBackground.alpha = 0.5;
                           $scope.resultAnswerContainer.addChild(resultAnswerContainerBackground);*/

                          //Creating the text element for the result answer
                          $scope.resultAnswerText = new createjs.Text("", "25px Arial", "red");
                          $scope.resultAnswerText.textAlign = "center";
                          $scope.resultAnswerText.x = $scope.resultAnswerContainer.width / 2;
                          $scope.resultAnswerText.y = $scope.resultAnswerContainer.height / 3.3;
                          $scope.resultAnswerText.maxWidth = $scope.resultAnswerContainer.width;
                          $scope.resultAnswerContainer.addChild($scope.resultAnswerText);

                          resultWaterfallCallback(null);
                        },

                        /*Results and Restart Buttons*/
                        function (resultWaterfallCallback) {

                          /*Waterfall for creating the Results and Restart buttons in results page*/
                          async.waterfall([
                            function (resultsButtonsWaterfallCallback) {

                              /*Creating the continue button*/
                              var continueButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                src: $rootScope.rootDir + "data/assets/soccer_results_continue.png"
                              }));
                              continueButtonImageLoader.load();

                              continueButtonImageLoader.on("complete", function (r) {

                                /*Creating Bitmap Background for continue button*/
                                $scope.continueButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_continue.png");
                                $scope.continueButton.x = 40;
                                $scope.continueButton.y = 303;
                                $scope.resultsContainer.addChild($scope.continueButton);

                                /*Mouse down event*/
                                $scope.continueButton.addEventListener("mousedown", function (event) {
                                });

                                /*Press up event*/
                                $scope.continueButton.addEventListener("pressup", function (event) {
                                  if($scope.activeQuestionIndex === $scope.activityData.questions.length-1){

                                    /*Going to total results !!!*/
                                    updateResultsTotalQuestions();
                                    $scope.resultsTotalContainer.visible = true;

                                  }else{
                                    $scope.activeQuestionIndex++;
                                    loadQuestion($scope.activeQuestionIndex);
                                  }
                                });

                                resultsButtonsWaterfallCallback(null);
                              });//end of continueButtonImageLoader

                            },
                            function (resultsButtonsWaterfallCallback) {

                              /*Creating the restart button*/
                              var restartButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                src: $rootScope.rootDir + "data/assets/soccer_results_restart.png"
                              }));
                              restartButtonImageLoader.load();

                              restartButtonImageLoader.on("complete", function (r) {

                                /*Creating Bitmap Background for restart button*/
                                $scope.restartButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_restart.png");
                                $scope.restartButton.x = 385;
                                $scope.restartButton.y = 303;
                                $scope.resultsContainer.addChild($scope.restartButton);

                                /*Mouse down event*/
                                $scope.restartButton.addEventListener("mousedown", function (event) {
                                });

                                /*Press up event*/
                                $scope.restartButton.addEventListener("pressup", function (event) {
                                  $scope.nextButton.gotoAndPlay("normal");
                                  console.log("Click on restart button for question: ",$scope.activeQuestionIndex);
                                  $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer = "";
                                  loadQuestion($scope.activeQuestionIndex);
                                });

                                resultsButtonsWaterfallCallback(null);
                              });//end of restartButtonImageLoader

                            }
                          ], function (err, result) {
                            if (!err) {
                              console.log("Success in creating Continue and Restart buttons in results page!");
                              /*After waterfall for creating the result buttons finishes resultWaterfallCallback is called*/
                              resultWaterfallCallback(null);
                            } else {
                              console.error("Fail in creating Continue and Restart buttons in results page: ", err);
                              resultWaterfallCallback(true, err);
                            }
                          });
                        }

                      ], function (err, results) {

                        if (!err) {
                          console.log("Success on adding Page description and Skip, goToResults Buttons!");
                          mainWaterfallCallback(null);
                        } else {
                          console.log("Error on creating results page: ", err);
                          mainWaterfallCallback(true, err);
                        }
                      });
                    }
                  ],
                  //General callback
                  function (err, result) {
                    if (!err) {
                      console.log("Success on creating results frames!");
                      mainWaterfallCallback(null);
                    } else {
                      console.error("Fail on creating results frames...", err);
                      mainWaterfallCallback(true, err);
                    }
                  });
              }
            ],
            //General callback for init waterfall
            function (err, result) {
              if (!err) {
                console.log("Success on main waterfall process!!!");
                loadQuestion($scope.activeQuestionIndex);
              } else {
                console.error("Error on main waterfall process...", err);
              }
            });
        }

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        /*Function that loads question according to $scope.activeQuestionIndex*/
        function loadQuestion(questionIndex) {

          /*The current question is the last question so it will not load*/
          if ($scope.activeQuestionIndex > $scope.activityData.questions.length - 1) {
            $scope.skipAnswerButton.alpha = 0.5;
            console.log("Question will not load! " + "activeQuestionIndex: " + $scope.activeQuestionIndex);
            return;

          } else {

            //Making skipButton visible
            $scope.skipAnswerButton.alpha = 1;
            if ($scope.activeQuestionIndex === $scope.activityData.questions.length - 1) {
              console.log("Last element!");
              $scope.skipAnswerButton.alpha = 0.5;
            }
          }

          console.log("Question loads! " + "activeQuestionIndex: " + $scope.activeQuestionIndex);
          //Flag that secures no multiple animation will occur when user selects a choice
          $scope.userSelectedChoice = false;


          $scope.questionTextContainer.removeAllChildren();

          async.waterfall([
              /*Loading question and answers*/
              function (loadQuestionWaterfallCallback) {

                /* 1. Loading Question Text*/
                console.log("Loading question for index: ", questionIndex);

                //Question index
                var indexNumber = new createjs.Text((questionIndex + 1) + ". ", "19px Arial", "black");
                indexNumber.x = 0;
                indexNumber.y = 0;
                $scope.questionTextContainer.addChild(indexNumber);

                //Pretext
                var pretext = new createjs.Text($scope.activityData.questions[questionIndex].pretext, "19px Arial", "black");
                pretext.x = indexNumber.x + indexNumber.getBounds().width;
                pretext.y = 0;
                $scope.questionTextContainer.addChild(pretext);


                //Underline
                var questionUnderline = new createjs.Text("__________", "19px Arial", "black");
                questionUnderline.x = pretext.x + pretext.getBounds().width;
                questionUnderline.y = pretext.y;
                $scope.questionTextContainer.addChild(questionUnderline);

                //Answer
                $scope.questionAnswer = new createjs.Text(" ", "19px Arial", "black");
                $scope.questionAnswer.x = questionUnderline.x + questionUnderline.getBounds().width / 2;
                $scope.questionAnswer.y = questionUnderline.y - 10;
                $scope.questionAnswer.textAlign = "center";
                $scope.questionTextContainer.addChild($scope.questionAnswer);


                if ($scope.activityData.questions[questionIndex].postext) {

                  var postexts = $scope.activityData.questions[questionIndex].postext.split("\n");
                  console.log("Postexts: ", postexts.length);
                  var currentPostexts = {};

                  if (postexts.length > 1) {
                    if (!postexts[0]) {
                      postexts[0] = " ";
                    }

                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = 0;
                    $scope.questionTextContainer.addChild(currentPostexts[0]);

                    currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                    currentPostexts[1].x = pretext.x;
                    currentPostexts[1].y = currentPostexts[0].y + 28;
                    $scope.questionTextContainer.addChild(currentPostexts[1]);

                  } else {

                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = 0;
                    $scope.questionTextContainer.addChild(currentPostexts[0]);
                  }
                }


                /* 2. Loading Answers Texts*/

                //Make the texts visible again
                $scope.answerAText.visible = true;
                $scope.answerBText.visible = true;
                $scope.answerCText.visible = true;

                //Updating the answers texts
                $scope.answerAText.text = $scope.activityData.questions[questionIndex].aChoice;
                $scope.answerBText.text = $scope.activityData.questions[questionIndex].bChoice;

                if ($scope.activityData.questions[questionIndex].cChoice) {
                  $scope.answerCText.text = $scope.activityData.questions[questionIndex].cChoice;
                }

                loadQuestionWaterfallCallback(null);

              },
              /*Loading game*/
              function (loadQuestionWaterfallCallback) {
                $scope.fisherman.gotoAndPlay("normal");

                createjs.Tween.removeTweens($scope.fishermanContainer);
                fishermanFloating();

                /*Make cows visible and make them play normal*/
                $scope.firstFish.visible = true;
                $scope.firstFish.y = 320;
                $scope.firstFish.gotoAndPlay("normal");
                $scope.secondFish.visible = true;
                $scope.secondFish.y = 220;
                $scope.secondFish.gotoAndPlay("normal");
                $scope.thirdFish.visible = true;
                $scope.thirdFish.y = 370;
                $scope.thirdFish.gotoAndPlay("normal");

                loadQuestionWaterfallCallback(null);
              }
            ],
            //General callback
            function (err, results) {

              /*If resultsContainer is visible, make it invisible again AND make pageDescription and next button appear*/
              if ($scope.resultsContainer.visible) {
                $scope.resultsContainer.visible = false;
              }

              /*If playContainer is invisible make it visible again*/
              if (!$scope.playContainer.visible) {
                $scope.playContainer.visible = true;
                $scope.topContainer.visible = true;
              }
            });
        }//end of loadQuestion function

        /*Function that handles navigation to next function*/
        function next() {
          console.log("Going to next activity!");
          var index = _.findIndex($rootScope.selectedLesson.lessonMenu, {
            "activityFolder": $rootScope.activityFolder
          });
          console.log("Lessons Index: ", index);

          if (index < $rootScope.selectedLesson.lessonMenu.length - 1) {
            $rootScope.activityFolder = $rootScope.selectedLesson.lessonMenu[index + 1].activityFolder;
            $rootScope.activityName = $rootScope.selectedLesson.lessonMenu[index + 1].name;
            window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
            window.localStorage.setItem("activityName", $rootScope.activityName);
            console.log("Next $rootScope.activityFolder: " + $rootScope.activityFolder + " $rootScope.activityName" + $rootScope.activityName);
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go($rootScope.selectedLesson.lessonMenu[index + 1].activityTemplate, {}, {reload: true});
          } else {
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go("results", {}, {reload: true});
          }
        }

        /*Function that creates the fisherman's recursive movement*/
        function fishermanFloating() {

          createjs.Tween.get($scope.fishermanContainer, {loop: false})
            .to({
              x: $scope.fishermanContainer.x < 340 ? 570 : 70,
              y: 90
            }, 10000, createjs.Ease.getPowInOut(2))
            .call(function () {
              console.log("Hovering Tween completed!");
              fishermanFloating();
            });
        }

        //Flag that indicates selection is in progress
        $scope.selectionInProgress = false;

        /*Selecting a cow*/
        function selectFish(questionIndex, userAnswer, xPositionOfSelectedFish) {

          console.log("User selected answer: ", userAnswer);

          //Selection progress started
          $scope.selectionInProgress = true;

          async.waterfall([
              //1.Get ufo to the chosen fish
              function (selectFishCallback) {

                console.log("Getting fisherman to the right position!");

                createjs.Tween.removeTweens($scope.fishermanContainer);

                createjs.Tween.get($scope.fishermanContainer, {loop: false})
                  .to({
                    x: userAnswer === "aChoice" ? 60 : (userAnswer === "bChoice" ? 310 : 450),
                    y: 90
                  }, 700, createjs.Ease.getPowIn(2))
                  .call(function () {
                    selectFishCallback(null);
                  });

              },
              //2.Play fisherman's hook
              function (selectFishCallback) {
                console.log("Playing fisherman's hook!");

                if (userAnswer === "aChoice") {
                  $scope.fishermanHook.gotoAndPlay("catchMiddle");
                } else if (userAnswer === "bChoice") {
                  $scope.fishermanHook.gotoAndPlay("catchHigh");
                } else {
                  $scope.fishermanHook.gotoAndPlay("catchLow");
                }
                $timeout(function () {
                  selectFishCallback(null);
                }, 1000);
              },
              //3.Playing rising fish
              function (selectFishCallback) {
                console.log("Playing rising fish!");

                /*If it's the second fish assigning new y for fixing the animation*/
                if(userAnswer === "bChoice"){
                  $scope.secondFish.y = 145;
                }

                /*Disappearing texts and other fishes*/
                $scope.answerAText.visible = false;
                $scope.answerBText.visible = false;
                $scope.answerCText.visible = false;


                if(userAnswer !== "aChoice"){
                  $scope.firstFish.visible = false;
                }

                if(userAnswer !== "bChoice"){
                  $scope.secondFish.visible = false;
                }

                if(userAnswer !== "cChoice"){
                  $scope.thirdFish.visible = false;
                }

                /*Selected fish goes and play 'selected' animation*/
                (userAnswer === "aChoice" ? $scope.firstFish
                  : userAnswer === "bChoice" ? $scope.secondFish : $scope.thirdFish).gotoAndPlay("selected");

                /*Tweening the selected fish animation*/
                createjs.Tween.get(userAnswer === "aChoice" ? $scope.firstFish : userAnswer === "bChoice" ? $scope.secondFish : $scope.thirdFish, {loop: false})
                  .to({
                    x: xPositionOfSelectedFish,
                    y: userAnswer === "aChoice" ? 180 : userAnswer === "bChoice" ? 120 : 200
                  }, 1000, createjs.Ease.getPowIn(1))
                  .call(function () {
                    selectFishCallback(null);
                  });
              }
            ],
            //General callback
            function (err, result) {

              //Selection process ended
              $scope.selectionInProgress = false;

              if (!err) {
                console.log("Animation success! Opening the results frame...");

                /*Results frame opens! Making playContainer and topContainer invisible and making resultsContainer appear*/
                $scope.playContainer.visible = false;
                $scope.topContainer.visible = false;

                $scope.resultsContainer.visible = true;

                //Removing previous elements
                $scope.resultQuestionContainer.removeAllChildren();

                /*------------------------------------------- POSTEXT TESTING --------------------------------------*/
                //Question index
                var indexNumber = new createjs.Text(($scope.activeQuestionIndex + 1) + ". ", "19px Arial", "black");
                indexNumber.x = 0;
                indexNumber.y = 0;
                $scope.resultQuestionContainer.addChild(indexNumber);


                //Pretext
                var pretext = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].pretext, "19px Arial", "black");
                pretext.x = indexNumber.x + indexNumber.getBounds().width;
                pretext.y = 0;
                $scope.resultQuestionContainer.addChild(pretext);


                //Underline
                var questionUnderline = new createjs.Text("__________", "19px Arial", "black");
                questionUnderline.x = pretext.x + pretext.getBounds().width;
                questionUnderline.y = pretext.y;
                $scope.resultQuestionContainer.addChild(questionUnderline);


                //Answer
                $scope.resultQuestionAnswer = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex][$scope.activityData.questions[$scope.activeQuestionIndex].answerChoice], "19px Arial", "green");
                $scope.resultQuestionAnswer.x = questionUnderline.x + questionUnderline.getBounds().width / 2;
                $scope.resultQuestionAnswer.y = questionUnderline.y;
                $scope.resultQuestionAnswer.textAlign = "center";
                $scope.resultQuestionContainer.addChild($scope.resultQuestionAnswer);


                if ($scope.activityData.questions[$scope.activeQuestionIndex].postext) {

                  var postexts = $scope.activityData.questions[$scope.activeQuestionIndex].postext.split("\n");
                  console.log("Postexts: ", postexts.length);
                  var currentPostexts = {};

                  if (postexts.length > 1) {
                    if (!postexts[0]) {
                      postexts[0] = " ";
                    }

                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = 0;
                    $scope.resultQuestionContainer.addChild(currentPostexts[0]);

                    currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                    currentPostexts[1].x = pretext.x;
                    currentPostexts[1].y = currentPostexts[0].y + 28;
                    $scope.resultQuestionContainer.addChild(currentPostexts[1]);

                  } else {

                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = 0;
                    $scope.resultQuestionContainer.addChild(currentPostexts[0]);
                  }
                }

                /*------------------------------------------- POSTEXT TESTING --------------------------------------*/

                //Saving user answer
                $scope.activityData.questions[questionIndex].userAnswer = userAnswer;

                /*$scope.resultQuestionPostText.text = $scope.activityData.questions[$scope.activeQuestionIndex].postext;
                 $scope.resultQuestionPostText.x = $scope.resultQuestionUnderline.x + $scope.resultQuestionUnderline.getBounds().width;*/

                console.log("User answered: ", userAnswer);
                $scope.resultAnswerText.text = $scope.activityData.questions[$scope.activeQuestionIndex][userAnswer];
                //Checking if the answer is right and changes the color
                if ($scope.activityData.questions[questionIndex].answerChoice === userAnswer) {
                  $scope.resultAnswerText.color = "green";
                } else {
                  $scope.resultAnswerText.color = "red";
                }
              } else {
                console.log("Error on select cow process: ", err);
              }
            });
        }

        /*Function for checking if there are already answered questions*/
        function updateResultsTotalQuestions() {
          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userAnswer !== "") {
              //The question has been answered updating question text and answer text
              $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
              $scope.resultsTotalRowAnswersTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
            }
          });
          $scope.stage.update();
          console.warn("Has it already answer: ", $scope.activityData.questions);
        }

      });//end of image on complete
    }, 500);//end of timeout
  });

angular.module("bookbuilder2")
  .controller("MultipleSoccerController", function ($scope, $ionicPlatform, $rootScope, $timeout, $http, _, Toast) {

    console.log("MultipleSoccerController loaded!");
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
        src: $scope.rootDir + "data/assets/soccer_background_image.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_background_image.png");

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

        /* ------------------------------------------ PLAY CONTAINER ---------------------------------------------- */
        $scope.playContainer = new createjs.Container();
        $scope.playContainer.width = $scope.mainContainer.width;
        $scope.playContainer.height = 370;
        $scope.playContainer.x = 0;
        $scope.playContainer.y = 230;
        $scope.mainContainer.addChild($scope.playContainer);

        /* ------------------------------------------ QUESTION CONTAINER ---------------------------------------------- */
        $scope.questionContainer = new createjs.Container();
        $scope.questionContainer.width = 610;
        $scope.questionContainer.height = 100;
        $scope.questionContainer.startingPointY = 0;
        $scope.questionContainer.x = 75;
        $scope.questionContainer.y = 70;
        $scope.mainContainer.addChild($scope.questionContainer);

        /* ------------------------------------------ ANSWERS CONTAINER ---------------------------------------------- */
        $scope.answersContainer = new createjs.Container();
        $scope.answersContainer.width = 260;
        $scope.answersContainer.height = 300;
        $scope.answersContainer.startingPointX = 610;
        $scope.answersContainer.x = 1300;
        $scope.answersContainer.y = 40;
        $scope.mainContainer.addChild($scope.answersContainer);

        /* ------------------------------------------ OPTIONS CONTAINER ---------------------------------------------- */
        $scope.optionsContainer = new createjs.Container();
        $scope.optionsContainer.width = 350;
        $scope.optionsContainer.height = 75;
        $scope.optionsContainer.x = 465;
        $scope.optionsContainer.y = 520;
        $scope.mainContainer.addChild($scope.optionsContainer);

        /* ------------------------------------------ RESULTS CONTAINER ---------------------------------------------- */
        $scope.resultsContainer = new createjs.Container();
        $scope.resultsContainer.width = 740;
        $scope.resultsContainer.height = 500;
        $scope.resultsContainer.x = 90;
        $scope.resultsContainer.y = 80;
        $scope.mainContainer.addChild($scope.resultsContainer);

        /* ------------------------------------------ TOTAL RESULTS CONTAINER ---------------------------------------------- */
        $scope.resultsTotalContainer = new createjs.Container();
        $scope.resultsTotalContainer.width = $scope.mainContainer.width;
        $scope.resultsTotalContainer.height = $scope.mainContainer.height;
        $scope.resultsTotalContainer.x = 0;
        $scope.resultsTotalContainer.y = 0;
        $scope.mainContainer.addChild($scope.resultsTotalContainer);


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

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          console.log("activityData: ", $scope.activityData);

          init();

        } else {

          console.log("There is no activity...Getting the json through get");

          console.log("selectedLesson.id: ", $scope.selectedLesson.id);
          console.log("activityFolder: ", $scope.activityFolder);

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/multiple.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 0;
              $scope.activityData.activeQuestionIndex = 0;
              $scope.activityData.newGame = true;

              /*Adding the userAnswer attribute to response object before assigning it to activityData*/
              _.each($scope.activityData.questions, function (question, key, value) {
                $scope.activityData.questions[key].userAnswer = "";
              });

              init();

              //Saving it to localStorage
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.log("Error on getting json for the url...:", error);
            });
        }


        function init() {

          console.log("Starting init process!");
          async.waterfall([
              /*Questions and Answers*/
              function (initWaterfallCallback) {

                var questionsAndAnswersParallelFunctions = [];

                //Question background bitmap
                questionsAndAnswersParallelFunctions.push(function (questionsAndAnswersCallback) {

                  /*Creating the questionTextBackground bitmap*/
                  var questionTextBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                    src: $scope.rootDir + "data/assets/question_bubble_image.png"
                  }));
                  questionTextBackgroundImageLoader.load();

                  questionTextBackgroundImageLoader.on("complete", function (r) {

                    /*Creating Bitmap questionBackground*/
                    $scope.questionBackground = new createjs.Bitmap($scope.rootDir + "data/assets/question_bubble_image.png");
                    $scope.questionBackground.scaleY = 0.8;
                    $scope.questionBackground.scaleX = 0.85;
                    $scope.questionContainer.addChild($scope.questionBackground);

                    $scope.questionTextContainer = new createjs.Container();
                    $scope.questionTextContainer.width = $scope.questionContainer.width;
                    $scope.questionTextContainer.height = 60;
                    $scope.questionTextContainer.x = 15;
                    $scope.questionTextContainer.y = 10;
                    $scope.questionContainer.addChild($scope.questionTextContainer);

                    questionsAndAnswersCallback(null);

                  });//end of questionTextBackgroundImageLoader
                });


                //Loading A answer bitmap
                questionsAndAnswersParallelFunctions.push(function (questionsAndAnswersCallback) {
                  /*Creating the questionTextBackground bitmap*/
                  var answerABackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                    src: $scope.rootDir + "data/assets/soccer_a_choice.png"
                  }));
                  answerABackgroundImageLoader.load();

                  answerABackgroundImageLoader.on("complete", function (r) {

                    /*Creating Bitmap Background for answerHolder background image*/
                    $scope.answerABackground = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_a_choice.png");
                    $scope.answerABackground.x = 0;
                    $scope.answerABackground.y = 0;
                    $scope.answerABackground.scaleX = $scope.answerABackground.scaleY = 0.45;
                    $scope.answerABackground.addEventListener("mousedown", function (event) {
                      if (!$scope.selectionInProgress) {
                        $scope.answerABackground.alpha = 0.5;
                        $scope.stage.update();
                      }
                    });

                    $scope.answerABackground.addEventListener("pressup", function (event) {
                      console.log("Press up event on A button!");
                      if (!$scope.selectionInProgress) {
                        $scope.answerABackground.alpha = 1;
                        $scope.stage.update();
                        check($scope.activityData.activeQuestionIndex, "aChoice");
                      }
                    });
                    $scope.answersContainer.addChild($scope.answerABackground);

                    /*Adding a container for the answer A text*/
                    $scope.answerATextContainer = new createjs.Container();
                    $scope.answerATextContainer.width = 125;
                    $scope.answerATextContainer.height = 50;
                    $scope.answerATextContainer.x = 50;
                    $scope.answerATextContainer.y = 20;
                    $scope.answersContainer.addChild($scope.answerATextContainer);

                    /*Adding the Text that holds the question*/
                    $scope.answerAText = new createjs.Text("CHOICE A", "23px Arial", "white");
                    $scope.answerAText.x = $scope.questionTextContainer.x - 15;
                    $scope.answerAText.y = 9;
                    $scope.answerAText.maxWidth = $scope.answerATextContainer.width;
                    $scope.answerATextContainer.addChild($scope.answerAText);

                    questionsAndAnswersCallback(null);

                  });//end of questionTextBackgroundImageLoader
                });


                //Loading B answer bitmap
                questionsAndAnswersParallelFunctions.push(function (questionsAndAnswersCallback) {
                  /*Creating the questionTextBackground bitmap*/
                  var answerBBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                    src: $scope.rootDir + "data/assets/soccer_b_choice.png"
                  }));
                  answerBBackgroundImageLoader.load();

                  answerBBackgroundImageLoader.on("complete", function (r) {

                    /*Creating Bitmap Background for answerHolder background image*/
                    $scope.answerBBackground = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_b_choice.png");
                    $scope.answerBBackground.x = 0;
                    $scope.answerBBackground.y = $scope.answersContainer.height / 3;
                    $scope.answerBBackground.scaleX = $scope.answerBBackground.scaleY = 0.45;
                    $scope.answerBBackground.addEventListener("mousedown", function (event) {
                      if (!$scope.selectionInProgress) {
                        $scope.answerBBackground.alpha = 0.5;
                        $scope.stage.update();
                      }
                    });

                    $scope.answerBBackground.addEventListener("pressup", function (event) {
                      console.log("Press up event on B button!");
                      if (!$scope.selectionInProgress) {
                        $scope.answerBBackground.alpha = 1;
                        check($scope.activityData.activeQuestionIndex, "bChoice");
                      }
                    });
                    $scope.answersContainer.addChild($scope.answerBBackground);

                    /*Adding a container for the answer A text*/
                    $scope.answerBTextContainer = new createjs.Container();
                    $scope.answerBTextContainer.width = 125;
                    $scope.answerBTextContainer.height = 50;
                    $scope.answerBTextContainer.x = 50;
                    $scope.answerBTextContainer.y = $scope.answersContainer.height / 3 + 20;
                    $scope.answersContainer.addChild($scope.answerBTextContainer);

                    /*Adding the Text that holds the question*/
                    $scope.answerBText = new createjs.Text("CHOICE B", "23px Arial", "white");
                    $scope.answerBText.x = $scope.questionTextContainer.x - 15;
                    $scope.answerBText.y = 9;
                    $scope.answerBText.maxWidth = $scope.answerBTextContainer.width;
                    $scope.answerBTextContainer.addChild($scope.answerBText);

                    questionsAndAnswersCallback(null);

                  });//end of questionTextBackgroundImageLoader
                });


                //Loading C answer bitmap
                questionsAndAnswersParallelFunctions.push(function (questionsAndAnswersCallback) {
                  /*Creating the questionTextBackground bitmap*/
                  var answerCBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                    src: $scope.rootDir + "data/assets/soccer_c_choice.png"
                  }));
                  answerCBackgroundImageLoader.load();

                  answerCBackgroundImageLoader.on("complete", function (r) {

                    /*Creating Bitmap Background for answerHolder background image*/
                    $scope.answerCBackground = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_c_choice.png");
                    $scope.answerCBackground.x = 0;
                    $scope.answerCBackground.y = $scope.answersContainer.height / 1.5;
                    $scope.answerCBackground.scaleX = $scope.answerCBackground.scaleY = 0.45;
                    $scope.answerCBackground.addEventListener("mousedown", function (event) {
                      if (!$scope.selectionInProgress) {
                        $scope.answerCBackground.alpha = 0.5;
                        $scope.stage.update();
                      }
                    });

                    $scope.answerCBackground.addEventListener("pressup", function (event) {
                      console.log("Press up event on C button!");
                      if (!$scope.selectionInProgress) {
                        $scope.answerCBackground.alpha = 1;
                        check($scope.activityData.activeQuestionIndex, "cChoice");
                      }
                    });
                    $scope.answerCBackground.visible = false;
                    $scope.answersContainer.addChild($scope.answerCBackground);

                    /*Adding a container for the answer A text*/
                    $scope.answerCTextContainer = new createjs.Container();
                    $scope.answerCTextContainer.width = 125;
                    $scope.answerCTextContainer.height = 50;
                    $scope.answerCTextContainer.x = 50;
                    $scope.answerCTextContainer.y = $scope.answersContainer.height / 1.5 + 20;
                    $scope.answerCTextContainer.visible = false;
                    $scope.answersContainer.addChild($scope.answerCTextContainer);


                    /*Adding the Text that holds the question*/
                    $scope.answerCText = new createjs.Text("CHOICE C", "23px Arial", "white");
                    $scope.answerCText.x = $scope.questionTextContainer.x - 15;
                    $scope.answerCText.y = 9;
                    $scope.answerCText.maxWidth = $scope.answerCTextContainer.width;
                    $scope.answerCText.visible = false;
                    $scope.answerCTextContainer.addChild($scope.answerCText);

                    questionsAndAnswersCallback(null);

                  });//end of questionTextBackgroundImageLoader
                });


                /*Loading and creating bitmaps for question and answers*/
                async.waterfall(questionsAndAnswersParallelFunctions, function (err, results) {
                  if (!err) {
                    console.log("Success on loading the Q+A bitmaps!");
                    initWaterfallCallback(null);
                  } else {
                    console.error("There was an error on parallel process that loads the Q+A bitmaps: ", err);
                  }
                });

              },

              /*Soccer game*/
              function (initWaterfallCallback) {

                var createSoccerGameParallelFunctions = [];

                //parallel function for getting the soccer net
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_net_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer net!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      /*response.animations = {
                       "normal": [0],
                       "goal": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,0]
                       };*/
                      var soccerNetSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerNet = new createjs.Sprite(soccerNetSpriteSheet, "normal");
                      $scope.soccerNet.x = 370;
                      $scope.soccerNet.y = 100;
                      $scope.playContainer.addChild($scope.soccerNet);
                      parallelCallback(null);
                    })
                    .error(function (error) {

                      console.error("Error on getting json data for soccer net: ", error);
                      parallelCallback(true, error);
                    });
                });

                //parallel function for getting the soccer ball
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_ball_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer ball!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var soccerBallSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerBall = new createjs.Sprite(soccerBallSpriteSheet, "normal");
                      $scope.soccerBall.x = 0;
                      $scope.soccerBall.y = 310;
                      $scope.soccerBall.gotoAndPlay("normal");
                      $scope.playContainer.addChild($scope.soccerBall);

                      parallelCallback(null);

                    })
                    .error(function (error) {

                      console.log("Error on getting json data for soccer ball: ", error);
                      parallelCallback(true, error);
                    });
                });

                //parallel function for getting the soccer keeper
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_keeper_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer keeper!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var soccerKeeperSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerKeeper = new createjs.Sprite(soccerKeeperSpriteSheet, "normal");

                      $scope.soccerKeeper.x = 300;
                      $scope.soccerKeeper.y = 60;
                      $scope.soccerKeeper.scaleX = $scope.soccerKeeper.scaleY = 0.50;
                      $scope.soccerKeeper.gotoAndPlay("play");
                      $scope.playContainer.addChild($scope.soccerKeeper);

                      parallelCallback(null);
                    })
                    .error(function (error) {

                      console.error("Error on getting json data for soccer keeper: ", error);
                      parallelCallback(true, error);
                    });
                });

                /*Creating fail keeper 1*/
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_keeper_keeper_fail_1.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer keeper!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var soccerKeeperFailOneSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerKeeperFailOne = new createjs.Sprite(soccerKeeperFailOneSpriteSheet, "normal");
                      $scope.soccerKeeperFailOne.visible = false;
                      $scope.soccerKeeperFailOne.x = 0;
                      $scope.soccerKeeperFailOne.y = 130;
                      $scope.soccerKeeperFailOne.gotoAndPlay("normal");
                      $scope.soccerKeeperFailOne.scaleX = $scope.soccerKeeperFailOne.scaleY = 1.30;
                      $scope.playContainer.addChild($scope.soccerKeeperFailOne);

                      parallelCallback(null);
                    })
                    .error(function (error) {

                      console.error("Error on getting json data for soccer keeper: ", error);
                      parallelCallback(true, error);
                    });
                });

                /*Creating fail keeper 2*/
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_keeper_left_high.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer keeper!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var soccerKeeperFailTwoSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerKeeperFailTwo = new createjs.Sprite(soccerKeeperFailTwoSpriteSheet, "normal");
                      $scope.soccerKeeperFailTwo.visible = false;
                      $scope.soccerKeeperFailTwo.x = 300;
                      $scope.soccerKeeperFailTwo.y = 60;
                      $scope.soccerKeeperFailTwo.gotoAndPlay("normal");
                      $scope.soccerKeeperFailTwo.scaleX = $scope.soccerKeeperFailTwo.scaleY = 0.5;
                      $scope.playContainer.addChild($scope.soccerKeeperFailTwo);
                      parallelCallback(null);
                    })
                    .error(function (error) {

                      console.error("Error on getting json data for soccer keeper: ", error);
                      parallelCallback(true, error);
                    });
                });

                //parallel function for getting the soccer player
                createSoccerGameParallelFunctions.push(function (parallelCallback) {
                  $http.get($scope.rootDir + "data/assets/soccer_boy_striking_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json for soccer player!");
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var soccerPlayerSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.soccerPlayer = new createjs.Sprite(soccerPlayerSpriteSheet, "normal");
                      $scope.soccerPlayer.x = 270;
                      $scope.soccerPlayer.y = 200;
                      $scope.soccerPlayer.scaleX = $scope.soccerPlayer.scaleY = 0.9;
                      $scope.playContainer.addChild($scope.soccerPlayer);
                      parallelCallback(null);
                    })
                    .error(function (error) {
                      console.error("Error on getting json data for soccer player: ", error);
                      parallelCallback(true, error);
                    });
                });

                async.waterfall(createSoccerGameParallelFunctions, function (err, results) {

                  if (!err) {
                    console.log("Success on creating soccer game! Adding elements to mainContainer!");
                    initWaterfallCallback(null);

                  } else {
                    console.error("Fail on creating soccer game. Error: ", err)
                  }
                });
              },

              function (initWaterfallCallback) {
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
                    $scope.pageActivity.x = 75;
                    $scope.pageActivity.y = 610;
                    $scope.pageActivity.maxWidth = 400;
                    $scope.mainContainer.addChild($scope.pageActivity);

                    /*Adding page title and description*/
                    $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
                    $scope.pageDescription.x = 75;
                    $scope.pageDescription.y = 630;
                    $scope.pageDescription.maxWidth = 400;
                    $scope.mainContainer.addChild($scope.pageDescription);

                    console.log("Waterfall loading title");

                    callback();

                  },

                  /*Adding Skip Button*/
                  function (generalButtonsWaterfallCallback) {
                    $http.get($scope.rootDir + "data/assets/skip_one_answer_button_sprite.json")
                      .success(function (response) {
                        console.log("Success on getting json for skipAnswer button!");
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                        var skipAnswerSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.skipAnswerButton = new createjs.Sprite(skipAnswerSpriteSheet, "normal");


                        /*Mouse down event*/
                        $scope.skipAnswerButton.addEventListener("mousedown", function (event) {

                          /*If question index already reached maximum, disabling skip button*/
                          if ($scope.activityData.activeQuestionIndex >= $scope.activityData.questions.length - 1) {
                            console.warn("Maximun question index reached!");
                            return;
                          }

                          /*Selection process in progress, disabling skip button*/
                          if ($scope.selectionInProgress) {
                            console.warn("Selection in progress!");
                            return;
                          }

                          $scope.skipAnswerButton.alpha = 0.5;
                          $scope.stage.update();
                        });

                        /*Press up event*/
                        $scope.skipAnswerButton.addEventListener("pressup", function (event) {

                          /*If question index already reached maximum, disabling skip button*/
                          if ($scope.activityData.activeQuestionIndex >= $scope.activityData.questions.length - 1) {
                            console.warn("Maximun question index reached!");
                            return;
                          }

                          /*Selection process in progress, disabling skip button*/
                          if ($scope.selectionInProgress) {
                            console.warn("Selection in progress!");
                            return;
                          }

                          $scope.skipAnswerButton.alpha = 1;
                          $scope.stage.update();
                          $scope.activityData.activeQuestionIndex++;

                          createjs.Tween.get($scope.answersContainer, {loop: false})
                            .to({
                              x: $scope.answersContainer.x + 500,
                              y: 130
                            }, 700, createjs.Ease.getPowIn(2));

                          /*Tween question and answers back to stage again with the question text and answers text updated*/
                          $timeout(function () {

                            loadQuestion($scope.activityData.activeQuestionIndex);

                            createjs.Tween.get($scope.answersContainer, {loop: false})
                              .to({
                                x: $scope.answersContainer.startingPointX,
                                y: 130
                              }, 700, createjs.Ease.getPowIn(2));

                          }, 300);
                        });

                        $scope.skipAnswerButton.x = 90;
                        $scope.skipAnswerButton.y = 30;

                        generalButtonsWaterfallCallback(null);
                      })
                      .error(function (error) {

                        console.error("Error on getting json data for skipAnswer button: ", error);
                        generalButtonsWaterfallCallback(true, error);
                      });
                  },

                  /*Adding GoToResults Button*/
                  function (generalButtonsWaterfallCallback) {
                    $http.get($scope.rootDir + "data/assets/go_to_results_button_sprite.json")
                      .success(function (response) {
                        console.log("Success on getting json for goToResults button!");
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                        var goToResultsSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.goToResultsButton = new createjs.Sprite(goToResultsSpriteSheet, "normal");

                        /*Mouse down event*/
                        $scope.goToResultsButton.addEventListener("mousedown", function (event) {
                          if (!$scope.resultsContainer.visible) {
                            $scope.goToResultsButton.alpha = 0.5;
                            $scope.stage.update();
                          }
                        });

                        /*Press up event*/
                        $scope.goToResultsButton.addEventListener("pressup", function (event) {

                          if (!$scope.resultsContainer.visible) {

                            $scope.goToResultsButton.alpha = 1;
                            $scope.stage.update();
                            updateResultsTotalQuestions();

                            createjs.Tween.get($scope.answersContainer, {loop: false})
                              .to({
                                x: $scope.answersContainer.x + 500,
                                y: 130
                              }, 700, createjs.Ease.getPowIn(2));

                            //While making resultsTotalContainer visible, description and Next activity button have to hide
                            $scope.resultsTotalContainer.visible = true;
                            $scope.pageActivity.visible = false;
                            $scope.pageDescription.visible = false;


                            if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                                activityFolder: $scope.activityFolder
                              }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

                              console.log("resultsButton", $scope.resultsButton);
                              $scope.resultsButton.visible = true;
                              $scope.endText.visible = true;
                              $scope.nextButton.visible = false;

                            } else {
                              $scope.nextButton.visible = true;
                            }
                            $scope.stage.update();

                          }
                        });

                        $scope.goToResultsButton.x = 250;
                        $scope.goToResultsButton.y = 30;

                        generalButtonsWaterfallCallback(null);
                      })
                      .error(function (error) {
                        console.error("Error on getting json data for goToResults button: ", error);
                        generalButtonsWaterfallCallback(true, error);
                      });
                  },
                  /*Adding Next Activity button*/
                  function (generalButtonsWaterfallCallback) {

                    $http.get($scope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                      .success(function (response) {
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                        var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                        $scope.nextButton.visible = false;

                        $scope.nextButton.addEventListener("mousedown", function (event) {
                          console.log("Mouse down event on next button!", !$scope.activityData.newGame);
                          if (!$scope.activityData.newGame) {
                            $scope.nextButton.gotoAndPlay("selected");
                            $scope.stage.update();
                          }
                        });
                        $scope.nextButton.addEventListener("pressup", function (event) {
                          console.log("Press up event on next button!");

                          if (!$scope.activityData.newGame) {
                            $scope.nextButton.gotoAndPlay("onSelection");
                            $scope.stage.update();
                            $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                          }

                        });
                        $scope.nextButton.x = 440;
                        $scope.nextButton.y = 600;
                        $scope.mainContainer.addChild($scope.nextButton);
                        $scope.stage.update();
                        generalButtonsWaterfallCallback(null);
                      })
                      .error(function (error) {
                        console.log("Error on getting json data for check button...", error);
                        generalButtonsWaterfallCallback(true, error);
                      });
                  },

                  function (initWaterfallCallback) {

                    $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                      .success(function (response) {
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                        var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                        $scope.resultsButton.x = 410;
                        $scope.resultsButton.y = 590;
                        $scope.resultsButton.scaleY = $scope.resultsButton.scaleX = 0.7;
                        $scope.mainContainer.addChild($scope.resultsButton);

                        $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                        $scope.endText.x = 450;
                        $scope.endText.y = 580;
                        $scope.endText.scaleY = $scope.endText.scaleX = 0.8;
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

                  }

                ], function (err, results) {

                  if (!err) {
                    console.log("Success on adding Page description and Skip, goToResults Buttons!");

                    //Adding to page
                    $scope.optionsContainer.addChild($scope.skipAnswerButton);
                    $scope.optionsContainer.addChild($scope.goToResultsButton);
                    $scope.optionsContainer.addChild();

                    initWaterfallCallback(null);
                  } else {
                    initWaterfallCallback(true, err);
                  }
                });
              },

              /*Results table*/
              function (initWaterfallCallback) {
                async.waterfall([
                  /*Adding background image in result table */
                  function (resultWaterfallCallback) {

                    console.log("Adding results background...");
                    /*Creating the questionTextBackground bitmap*/
                    var resultsBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                      src: $scope.rootDir + "data/assets/soccer_results_table_image.png"
                    }));
                    resultsBackgroundImageLoader.load();

                    resultsBackgroundImageLoader.on("complete", function (r) {

                      /*Creating Bitmap Background for answerHolder background image*/
                      $scope.resultsBackground = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_table_image.png");
                      $scope.resultsBackground.x = 0;
                      $scope.resultsBackground.y = 0;
                      $scope.resultsContainer.addChild($scope.resultsBackground);

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

                    /*Creating the text elements for the result question*/
                    //Pretext
                    $scope.resultQuestionPreText = new createjs.Text(" ", "25px Arial", "black");
                    $scope.resultQuestionPreText.x = 0;
                    $scope.resultQuestionPreText.y = 15;
                    $scope.resultQuestionContainer.addChild($scope.resultQuestionPreText);

                    //Underline
                    $scope.resultQuestionUnderline = new createjs.Text(" ", "25px Arial", "black");
                    $scope.resultQuestionUnderline.x = $scope.resultQuestionPreText.x + $scope.resultQuestionPreText.getBounds().width;
                    $scope.resultQuestionUnderline.y = 19;
                    $scope.resultQuestionContainer.addChild($scope.resultQuestionUnderline);

                    //Answer
                    $scope.resultQuestionAnswer = new createjs.Text("", "25px Arial", "black");
                    $scope.resultQuestionAnswer.x = $scope.resultQuestionPreText.x + $scope.resultQuestionPreText.getBounds().width;
                    $scope.resultQuestionAnswer.y = 15;
                    $scope.resultQuestionAnswer.textAlign = "center";
                    $scope.resultQuestionContainer.addChild($scope.resultQuestionAnswer);

                    //PosText
                    $scope.resultQuestionPostText = new createjs.Text(" ", "25px Arial", "black");
                    $scope.resultQuestionPostText.x = $scope.resultQuestionUnderline.x + $scope.resultQuestionUnderline.getBounds().width;
                    $scope.resultQuestionPostText.y = 15;
                    $scope.resultQuestionContainer.addChild($scope.resultQuestionPostText);

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

                    //Creating the text element for the result answer
                    $scope.resultAnswerText = new createjs.Text("", "20px Arial", "black");
                    $scope.resultAnswerText.x = 0;
                    $scope.resultAnswerText.y = 10;
                    $scope.resultAnswerText.maxWidth = $scope.resultAnswerContainer.width;
                    $scope.resultAnswerContainer.addChild($scope.resultAnswerText);

                    resultWaterfallCallback(null);
                  }
                ], function (err, results) {

                  if (!err) {
                    console.log("Success on adding Page description and Skip, goToResults Buttons!");
                    initWaterfallCallback(null);
                  } else {
                    console.log("Error on creating results page: ", err);
                    initWaterfallCallback(true, err);
                  }
                });
              },

              /*resultsTotal table*/
              function (initWaterfallCallback) {
                async.waterfall([
                  /*Adding background image in result table */
                  function (resultWaterfallCallback) {

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


                      $scope.activityData.score = 0;
                      window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));


                      /*Adding container in resultsTotalContainer to create a working space in background image frame*/
                      $scope.resultsTotalBackgroundContainer = new createjs.Container();
                      $scope.resultsTotalBackgroundContainer.width = 820;
                      $scope.resultsTotalBackgroundContainer.height = 480;
                      $scope.resultsTotalBackgroundContainer.x = 25;
                      $scope.resultsTotalBackgroundContainer.y = 85;
                      $scope.resultsTotalContainer.addChild($scope.resultsTotalBackgroundContainer);


                      //Making it invisible
                      $scope.resultsTotalContainer.visible = false;
                      $scope.resultsButton.visible = false;
                      $scope.endText.visible = false;
                      $scope.pageActivity.visible = true;
                      $scope.pageDescription.visible = true;
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
                        src: $scope.rootDir + "data/assets/soccer_results_answers.png"
                      }));
                      resultsAnswersOptionsTableImageLoader.load();

                      resultsAnswersOptionsTableImageLoader.on("complete", function (r) {

                        /*Creating Bitmap for results*/
                        $scope.resultsAnswersOptionsTable = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_answers.png");
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
                        $http.get($scope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                          .success(function (response) {
                            console.log("Success on getting json for check button!");
                            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                            var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                            $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                            /*Press up event*/
                            $scope.checkButton.addEventListener("pressup", function (event) {
                              $scope.checkButton.visible = false;

                              //Checking all answers if userAnswer === answerChoice
                              var rightQuestions = 0;
                              _.each($scope.activityData.questions, function (question, key, list) {
                                if ($scope.activityData.questions[key].userAnswer === $scope.activityData.questions[key].answerChoice) {
                                  rightQuestions++;
                                  $scope.resultsTotalRowQuestionsTexts[key].color = "green";
                                  $scope.resultsTotalRowAnswersTexts[key].color = "green";
                                } else {
                                  $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].answerChoice];
                                  $scope.resultsTotalRowQuestionsTexts[key].color = "green";
                                  $scope.resultsTotalRowAnswersTexts[key].color = "red";
                                }
                              });
                              //Updating the Score text
                              $scope.activityData.score = rightQuestions;
                              $scope.scoreText.text = "Score: " + rightQuestions + " / " + $scope.activityData.questions.length;
                              $scope.nextButton.gotoAndPlay("onSelection");

                              if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                                  activityFolder: $scope.activityFolder
                                }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

                                console.log($scope.resultsButton);
                                $scope.resultsButton.visible = true;
                                $scope.endText.visible = true;
                                $scope.nextButton.visible = false;

                              } else {

                                $scope.nextButton.visible = true;
                                console.log("Activity is not the last one");
                                console.log("index", _.findIndex($scope.selectedLesson.activitiesMenu, {
                                    activityFolder: $scope.activityFolder
                                  }) + 1);
                                console.log("activities", $scope.selectedLesson.activitiesMenu.length);
                              }

                              //Completed
                              $scope.activityData.completed = true;
                              if ($scope.activityData.newGame) {
                                $scope.activityData.newGame = false;
                                $scope.activityData.attempts += 1;
                              }

                              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                            });

                            $scope.checkButton.x = 45;
                            $scope.checkButton.y = 575;
                            $scope.checkButton.gotoAndPlay("normal");
                            $scope.resultsTotalContainer.addChild($scope.checkButton);

                          })
                          .error(function (error) {
                            console.log("Error on getting json data for check button: ", error);
                          });


                        /*Restart Button*/
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
                              $scope.stage.update();
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

                                  $scope.activityData.activeQuestionIndex = 0;
                                  loadQuestion($scope.activityData.activeQuestionIndex);
                                  $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;
                                  $scope.activityData.score = 0;
                                  window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                                  $timeout(function () {
                                    restartWaterfallCallback(null);
                                  }, 200);
                                }
                              ], function (err, results) {

                                $scope.resultsTotalContainer.visible = false;
                                $scope.resultsButton.visible = false;
                                $scope.endText.visible = false;
                                $scope.pageActivity.visible = true;
                                $scope.pageDescription.visible = true;
                                $scope.activityData.newGame = true;
                                $scope.checkButton.visible = true;

                                $scope.nextButton.visible = false;
                                $scope.nextButton.gotoAndPlay("normal");
                                _.each($scope.activityData.questions, function (question, key, list) {
                                  $scope.activityData.questions[key].userAnswer = "";
                                });
                                $scope.stage.update();

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

                          var pretexts = $scope.activityData.questions[key].pretext.split("\n");
                          var currentPretexts = {};
                          var textHeight = 20;
                          _.each(pretexts, function (text, l, li) {
                            if (!text) {
                              text = " ";
                            }

                            if (l === 0) {
                              text = (key + 1) + ". " + text;
                            }
                            text = checkLastCharIfEmpty(text);

                            currentPretexts[l] = new createjs.Text(text, "19px Arial", "black");
                            currentPretexts[l].y = textHeight * l;
                            $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPretexts[l]);
                          });

                          //Underline
                          $scope.firstGap = "________________";
                          if ($scope.activityData.questions[key].firstGap) {
                            $scope.firstGap = $scope.activityData.questions[key].firstGap;
                          }

                          var questionUnderline = new createjs.Text($scope.firstGap, "19px Arial", "black");
                          questionUnderline.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
                          questionUnderline.y = currentPretexts[pretexts.length - 1].y;
                          $scope.resultsTotalRowQuestionsContainers[key].addChild(questionUnderline);


                          //Answer
                          $scope.resultsTotalRowQuestionsTexts[key] = new createjs.Text(" ", "19px Arial", "black");
                          $scope.resultsTotalRowQuestionsTexts[key].x = questionUnderline.x + questionUnderline.getBounds().width / 2;
                          $scope.resultsTotalRowQuestionsTexts[key].y = questionUnderline.y;
                          $scope.resultsTotalRowQuestionsTexts[key].textAlign = "center";
                          $scope.resultsTotalRowQuestionsTexts[key].maxWidth = 110;
                          $scope.resultsTotalRowQuestionsContainers[key].addChild($scope.resultsTotalRowQuestionsTexts[key]);

                          if ($scope.activityData.questions[key].postext) {

                            var postexts = $scope.activityData.questions[key].postext.split("\n");
                            console.log("Postexts: ", postexts.length);
                            var currentPostexts = {};

                            if (postexts.length > 1) {
                              if (!postexts[0]) {
                                postexts[0] = " ";
                              }

                              postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                              currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                              currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                              currentPostexts[0].y = questionUnderline.y;
                              $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPostexts[0]);

                              currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                              currentPostexts[1].x = 0;
                              currentPostexts[1].y = currentPostexts[0].y + textHeight;
                              $scope.resultsTotalRowQuestionsContainers[key].addChild(currentPostexts[1]);

                            } else {
                              postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                              currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                              currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                              currentPostexts[0].y = questionUnderline.y;
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
                          //Resolving if it'a already has an answer
                          $scope.resultsTotalRowAnswersTexts[key] = new createjs.Text($scope.activityData.questions[key].userAnswer === "" ? "-" : $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer], "25px Arial", "black");
                          $scope.resultsTotalRowAnswersTexts[key].textAlign = "center";
                          $scope.resultsTotalRowAnswersTexts[key].x = $scope.resultsTotalRowAnswersContainers[key].width / 2;
                          $scope.resultsTotalRowAnswersTexts[key].y = 5;
                          $scope.resultsTotalRowAnswersTexts[key].maxWidth = $scope.resultsTotalRowAnswersContainers[key].width;
                          $scope.resultsTotalRowAnswersContainers[key].addChild($scope.resultsTotalRowAnswersTexts[key]);


//**********

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
//**********


                          /** A Choice **/
                          $scope.answerResultsATexts[key] = new createjs.Text($scope.activityData.questions[key].aChoice, "23px Arial", "black");
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
                          $scope.answerResultsBTexts[key] = new createjs.Text($scope.activityData.questions[key].bChoice, "23px Arial", "black");
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


                          /** C Choice **/
                          $scope.answerResultsCTexts[key] = new createjs.Text($scope.activityData.questions[key].cChoice ? $scope.activityData.questions[key].cChoice : "C Choice", "23px Arial", "black");
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


                          /*Click event on resultsTotalRowAnswersContainers for choosing an option*/
                          $scope.resultsTotalRowAnswersContainers[key].addEventListener("pressup", function (event) {

                            //Making containers in choices invisible
                            _.each($scope.resultsAnswersTableContainerA, function (answer, key, list) {
                              $scope.resultsAnswersTableContainerA[key].visible = false;
                              $scope.resultsAnswersTableContainerB[key].visible = false;
                              $scope.resultsAnswersTableContainerC[key].visible = false;
                            });

                            //Making texts in choices invisible
                            _.each($scope.answerResultsATexts, function (answer, key, list) {
                              $scope.answerResultsATexts[key].visible = false;
                              $scope.answerResultsBTexts[key].visible = false;
                              $scope.answerResultsCTexts[key].visible = false;
                            });

                            console.log("Press up event on resultsTotalRowAnswersContainers with index: ", key);
                            $scope.resultsAnswersOptionsTable.y = $scope.resultsTotalRowContainers[key].y - 10;
                            $scope.resultsAnswersOptionsTableContainer.y = $scope.resultsAnswersOptionsTable.y + 20;

                            /*Making the background and the resultsAnswersOptionsTableContainer visible and dynamically appear on the y of clicked answer*/
                            if (!$scope.activityData.newGame) {
                              console.log("The activity has completed! Cannot select an answer...");
                            } else {
                              $scope.resultsAnswersOptionsTable.visible = true;
                              $scope.resultsAnswersOptionsTableContainer.visible = true;
                            }

                            /*Appearing only the choices of the selected answer, the disappearing is handled in choice's event*/
                            $scope.resultsAnswersTableContainerA[key].visible = true;
                            $scope.resultsAnswersTableContainerB[key].visible = true;
                            if ($scope.activityData.questions[key].cChoice) {
                              $scope.resultsAnswersTableContainerC[key].visible = true;
                            }
                            $scope.answerResultsATexts[key].visible = true;
                            $scope.answerResultsBTexts[key].visible = true;

                            if ($scope.activityData.questions[key].cChoice) {
                              $scope.answerResultsCTexts[key].visible = true;
                            }

                            $scope.stage.update();
                          });//end of click on resultsTotalRowAnswersContainers for choosing an answer


                          /*After all elements are loaded finally the resultsAnswersOptionsTable is loaded to get higher index*/
                          $scope.resultsTotalBackgroundContainer.addChild($scope.resultsAnswersOptionsTable);
                          $scope.resultsTotalBackgroundContainer.addChild($scope.resultsAnswersOptionsTableContainer);
                          $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerA[key]);
                          $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerB[key]);
                          $scope.resultsAnswersOptionsTableContainer.addChild($scope.resultsAnswersTableContainerC[key]);
                          $scope.resultsAnswersTableContainerA[key].addChild($scope.answerResultsATexts[key]);
                          $scope.resultsAnswersTableContainerB[key].addChild($scope.answerResultsBTexts[key]);
                          $scope.resultsAnswersTableContainerC[key].addChild($scope.answerResultsCTexts[key]);


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

                    //Creating the text element for the result answer
                    $scope.resultAnswerText = new createjs.Text("", "25px Arial", "black");
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
                          src: $scope.rootDir + "data/assets/soccer_results_continue.png"
                        }));
                        continueButtonImageLoader.load();

                        continueButtonImageLoader.on("complete", function (r) {

                          /*Creating Bitmap Background for continue button*/
                          $scope.continueButton = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_continue.png");
                          $scope.continueButton.x = 40;
                          $scope.continueButton.y = 303;
                          $scope.resultsContainer.addChild($scope.continueButton);

                          /*Mouse down event*/
                          $scope.continueButton.addEventListener("mousedown", function (event) {
                            $scope.continueButton.alpha = 0.5;
                            $scope.stage.update();
                          });

                          /*Press up event*/
                          $scope.continueButton.addEventListener("pressup", function (event) {
                            $scope.continueButton.alpha = 1;

                            if ($scope.activityData.activeQuestionIndex === $scope.activityData.questions.length - 1) {
                              updateResultsTotalQuestions();
                              $scope.resultsTotalContainer.visible = true;
                              $scope.pageActivity.visible = false;
                              $scope.pageDescription.visible = false;

                              if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                                  activityFolder: $scope.activityFolder
                                }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

                                console.log("show resultsButton", $scope.resultsButton);
                                $scope.resultsButton.visible = true;
                                $scope.endText.visible = true;
                                $scope.nextButton.visible = false;

                              } else {
                                $scope.nextButton.visible = true;
                              }
                              $scope.stage.update();

                            } else {
                              $scope.activityData.activeQuestionIndex++;
                              loadQuestion($scope.activityData.activeQuestionIndex);
                            }
                            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                          });

                          resultsButtonsWaterfallCallback(null);
                        });//end of continueButtonImageLoader

                      },
                      function (resultsButtonsWaterfallCallback) {

                        /*Creating the restart button*/
                        var restartButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                          src: $scope.rootDir + "data/assets/soccer_results_restart.png"
                        }));
                        restartButtonImageLoader.load();

                        restartButtonImageLoader.on("complete", function (r) {

                          /*Creating Bitmap Background for restart button*/
                          $scope.restartButton = new createjs.Bitmap($scope.rootDir + "data/assets/soccer_results_restart.png");
                          $scope.restartButton.x = 385;
                          $scope.restartButton.y = 303;
                          $scope.resultsContainer.addChild($scope.restartButton);

                          /*Mouse down event*/
                          $scope.restartButton.addEventListener("mousedown", function (event) {
                            $scope.restartButton.alpha = 0.5;
                            $scope.stage.update();
                          });

                          /*Press up event*/
                          $scope.restartButton.addEventListener("pressup", function (event) {
                            $scope.restartButton.alpha = 1;
                            $scope.nextButton.visible = false;
                            $scope.nextButton.gotoAndPlay("normal");
                            $scope.stage.update();
                            loadQuestion($scope.activityData.activeQuestionIndex);
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
                    initWaterfallCallback(null);
                  } else {
                    console.log("Error on creating results page: ", err);
                    initWaterfallCallback(true, err);
                  }
                });
              }
            ],//end of functions

            /*init function's waterfall general callback*/
            function (err, result) {
              if (!err) {
                console.log("Success on init waterfall process!");

                if (!$scope.activityData.newGame) {

                  $scope.pageActivity.visible = false;
                  $scope.pageDescription.visible = false;
                  $scope.resultsTotalContainer.visible = true;
                  $scope.checkButton.visible = false;

                  if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                      activityFolder: $scope.activityFolder
                    }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

                    console.log("init resultsButton", $scope.resultsButton);
                    $scope.resultsButton.visible = true;
                    $scope.endText.visible = true;
                    $scope.nextButton.visible = false;

                  } else {
                    $scope.nextButton.visible = true;
                  }

                  updateResultsTotalQuestions();
                  //Checking all answers if userAnswer === answerChoice
                  var rightQuestions = 0;
                  _.each($scope.activityData.questions, function (question, key, list) {
                    if ($scope.activityData.questions[key].userAnswer === $scope.activityData.questions[key].answerChoice) {
                      rightQuestions++;
                      $scope.resultsTotalRowQuestionsTexts[key].color = "green";
                      $scope.resultsTotalRowAnswersTexts[key].color = "green";
                    } else {
                      $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].answerChoice];
                      $scope.resultsTotalRowQuestionsTexts[key].color = "green";
                      $scope.resultsTotalRowAnswersTexts[key].color = "red";
                    }
                  });
                  //Updating the Score text
                  $scope.activityData.score = rightQuestions;
                  $scope.scoreText.text = "Score: " + rightQuestions + " / " + $scope.activityData.questions.length;
                  $scope.nextButton.gotoAndPlay("onSelection");
                  window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                  $scope.stage.update();

                } else {
                  loadQuestion($scope.activityData.activeQuestionIndex);
                }
              } else {
                console.error("Error on init waterfall process: ", err);
              }
            });
        }

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        /*Function that loads question according to $scope.activityData.activeQuestionIndex*/
        function loadQuestion(questionIndex) {

          if ($scope.activityData.activeQuestionIndex > $scope.activityData.questions.length - 1) {

            /*Question will not load...*/
            $scope.skipAnswerButton.alpha = 0.5;
            console.log("Question will not load! " + "activeQuestionIndex: " + $scope.activityData.activeQuestionIndex);
            return;
          } else {

            /*Question loads!*/

            //Making skipButton visible
            $scope.skipAnswerButton.alpha = 1;
            if ($scope.activityData.activeQuestionIndex === $scope.activityData.questions.length - 1) {
              console.log("Last element!");
              $scope.skipAnswerButton.alpha = 0.5;
            }
          }

          //Flag that secures no multiple animation will occur when user selects a choice
          $scope.userSelectedChoice = false;

          //Removing previous question before adding a new one
          $scope.questionTextContainer.removeAllChildren();

          async.waterfall([
              /*Loading question and answers*/
              function (loadQuestionWaterfallCallback) {
                /* 1. Loading Question Text*/
                console.log("Loading question for index: ", questionIndex);


                var pretexts = $scope.activityData.questions[questionIndex].pretext.split("\n");
                var currentPretexts = {};
                var textHeight = 28;
                _.each(pretexts, function (text, l, li) {
                  if (!text) {
                    text = " ";
                  }

                  if (l === 0) {
                    text = (questionIndex + 1) + ". " + text;
                  }
                  text = checkLastCharIfEmpty(text);

                  currentPretexts[l] = new createjs.Text(text, "19px Arial", "black");
                  currentPretexts[l].y = textHeight * l;
                  $scope.questionTextContainer.addChild(currentPretexts[l]);
                });

                //Underline
                $scope.firstGap = "________________";
                if ($scope.activityData.questions[questionIndex].firstGap) {
                  $scope.firstGap = $scope.activityData.questions[questionIndex].firstGap;
                }

                var questionUnderline = new createjs.Text($scope.firstGap, "19px Arial", "black");
                questionUnderline.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
                questionUnderline.y = currentPretexts[pretexts.length - 1].y;
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
                    postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = questionUnderline.y;
                    $scope.questionTextContainer.addChild(currentPostexts[0]);

                    currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                    currentPostexts[1].x = 0;
                    currentPostexts[1].y = currentPostexts[0].y + textHeight;
                    $scope.questionTextContainer.addChild(currentPostexts[1]);

                  } else {
                    postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                    currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                    currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                    currentPostexts[0].y = questionUnderline.y;
                    $scope.questionTextContainer.addChild(currentPostexts[0]);
                  }
                }

                /* 2. Loading Answers Texts*/
                $scope.answerAText.text = $scope.activityData.questions[questionIndex].aChoice;
                $scope.answerBText.text = $scope.activityData.questions[questionIndex].bChoice;


                if ($scope.activityData.questions[questionIndex].cChoice) {
                  $scope.answerCText.text = $scope.activityData.questions[questionIndex].cChoice;
                  $scope.answerCBackground.visible = true;
                  $scope.answerCTextContainer.visible = true;
                  $scope.answerCText.visible = true;
                } else {
                  $scope.answerCBackground.visible = false;
                  $scope.answerCTextContainer.visible = false;
                  $scope.answerCText.visible = false;
                }
                loadQuestionWaterfallCallback(null);

              },
              /*Loading game*/
              function (loadQuestionWaterfallCallback) {
                /*Nets has to play "normal"*/
                $scope.soccerNet.gotoAndPlay("normal");

                /*Keeper has to go to starting point and play "normal"*/
                $scope.soccerKeeper.visible = true;
                $scope.soccerKeeperFailOne.visible = false;
                $scope.soccerKeeperFailOne.gotoAndPlay("normal");
                $scope.soccerKeeperFailTwo.gotoAndPlay("normal");
                $scope.soccerKeeperFailTwo.visible = false;
                $scope.soccerKeeper.gotoAndPlay("normal");

                /*Ball has to go to start point and play "normal"*/
                $scope.soccerBall.gotoAndPlay("normal");

                /*Player has to go to starting point and play "normal"*/
                $scope.soccerPlayer.gotoAndPlay("normal");

                loadQuestionWaterfallCallback(null);
              }
            ],
            //General callback
            function (err, results) {

              /*0. If resultsContainer is visible, make it invisible again AND make pageDescription and next button appear*/
              if ($scope.resultsContainer.visible) {
                $scope.resultsContainer.visible = false;
                $scope.questionContainer.visible = true;
              }

              /*2. tween answerContainer back to stage*/
              createjs.Tween.get($scope.answersContainer, {loop: false})
                .to({
                  x: $scope.answersContainer.startingPointX,
                  y: 130
                }, 700, createjs.Ease.getPowIn(2));

              /*3. If playContainer is invisible make it visible again*/
              if (!$scope.playContainer.visible) {
                $scope.playContainer.visible = true;
              }
            });
        }//end of loadQuestion function


        //Flag that indicates selection is in progress
        $scope.selectionInProgress = false;

        /*Function for checking if answer was correct*/
        function check(questionIndex, userAnswer) {

          $scope.selectionInProgress = true;
          console.log("Checking if user answered right...Question Index: " + questionIndex + ", user answered: ", userAnswer);

          /* 0. Play goal */
          async.waterfall([
              function (goalWaterfallCallback) {
                $scope.soccerPlayer.gotoAndPlay("striking");
                console.log("Player strikes the ball!");
                $timeout(function () {
                  goalWaterfallCallback(null);
                }, 500);

              },
              function (goalWaterfallCallback) {
                console.log("Ball's animation!");

                if ($scope.activityData.questions[questionIndex].answerChoice === userAnswer) {
                  //The answer was right!
                  $scope.soccerBall.gotoAndPlay("shootRightUp");
                } else {
                  //The answer was wrong...
                  console.warn(Math.random());
                  if (Math.floor(Math.random() * 2) > 0.5) {
                    $scope.soccerBall.gotoAndPlay("shootLeftUp");

                  } else {
                    $scope.soccerBall.gotoAndPlay("shootRightLow");
                  }
                }
                $timeout(function () {
                  goalWaterfallCallback(null);
                }, 500);
              },
              function (goalWaterfallCallback) {
                console.log("Keeper's animation!");

                if ($scope.activityData.questions[questionIndex].answerChoice === userAnswer) {
                  //The answer was right!
                  $scope.soccerKeeper.visible = false;
                  $scope.soccerKeeperFailOne.visible = true;
                  $scope.soccerKeeperFailOne.gotoAndPlay("dive");
                } else {
                  //The answer was wrong...
                  $scope.soccerKeeper.visible = false;
                  $scope.soccerKeeperFailTwo.visible = true;
                  $scope.soccerKeeperFailTwo.gotoAndPlay("dive");
                }
                $timeout(function () {
                  goalWaterfallCallback(null);
                }, 600);
              },
              function (goalWaterfallCallback) {

                console.log("Nets wavering!");
                $scope.soccerNet.gotoAndPlay("goal");
                $scope.soccerPlayer.gotoAndPlay("normal");

                /*if ($scope.activityData.questions[questionIndex].answerChoice === userAnswer) {}*/

                $timeout(function () {
                  goalWaterfallCallback(null);
                }, 1500);
              }
            ],
            function (err, result) {
              $scope.stage.update();

              /* 2. Tween Answers Container*/
              createjs.Tween.get($scope.answersContainer, {loop: false})
                .to({
                  x: $scope.answersContainer.x + 500,
                  y: 130
                }, 700, createjs.Ease.getPowIn(2));

              /* 3. Disappear playContainer and making resultsContainer visible again*/
              $scope.playContainer.visible = false;
              $scope.resultsContainer.visible = true;
              $scope.questionContainer.visible = false;

              //!*Saving user selection to userAnswer field*!
              $scope.activityData.questions[questionIndex].userAnswer = userAnswer;

              $scope.resultQuestionContainer.removeAllChildren();

              var pretexts = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].pretext.split("\n");
              var currentPretexts = {};
              var textHeight = 28;
              _.each(pretexts, function (text, l, li) {
                if (!text) {
                  text = " ";
                }

                if (l === 0) {
                  text = ($scope.activityData.activeQuestionIndex + 1) + ". " + text;
                }
                text = checkLastCharIfEmpty(text);

                currentPretexts[l] = new createjs.Text(text, "19px Arial", "black");
                currentPretexts[l].y = textHeight * l;
                $scope.resultQuestionContainer.addChild(currentPretexts[l]);
              });

              //Underline
              $scope.firstGap = "________________";
              if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].firstGap) {
                $scope.firstGap = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].firstGap;
              }

              var questionUnderline = new createjs.Text($scope.firstGap, "19px Arial", "black");
              questionUnderline.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
              questionUnderline.y = currentPretexts[pretexts.length - 1].y;
              $scope.resultQuestionContainer.addChild(questionUnderline);


              $scope.activityData.questions[questionIndex].userAnswer = userAnswer;

              //Answer
              $scope.resultQuestionAnswer = new createjs.Text($scope.activityData.questions[$scope.activityData.activeQuestionIndex][$scope.activityData.questions[$scope.activityData.activeQuestionIndex].userAnswer], "19px Arial", "black");
              $scope.resultQuestionAnswer.x = questionUnderline.x + questionUnderline.getBounds().width / 2;
              $scope.resultQuestionAnswer.y = questionUnderline.y;
              $scope.resultQuestionAnswer.textAlign = "center";
              $scope.resultQuestionContainer.addChild($scope.resultQuestionAnswer);


              if ($scope.activityData.questions[$scope.activityData.activeQuestionIndex].postext) {

                var postexts = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].postext.split("\n");
                console.log("Postexts: ", postexts.length);
                var currentPostexts = {};

                if (postexts.length > 1) {
                  if (!postexts[0]) {
                    postexts[0] = " ";
                  }
                  postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                  currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                  currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                  currentPostexts[0].y = questionUnderline.y;
                  $scope.resultQuestionContainer.addChild(currentPostexts[0]);

                  currentPostexts[1] = new createjs.Text(postexts[1], "19px Arial", "black");
                  currentPostexts[1].x = 0;
                  currentPostexts[1].y = currentPostexts[0].y + textHeight;
                  $scope.resultQuestionContainer.addChild(currentPostexts[1]);

                } else {

                  postexts[0] = checkFirstCharOfPhrase(postexts[0]);
                  currentPostexts[0] = new createjs.Text(postexts[0], "19px Arial", "black");
                  currentPostexts[0].x = questionUnderline.x + questionUnderline.getBounds().width;
                  currentPostexts[0].y = questionUnderline.y;
                  $scope.resultQuestionContainer.addChild(currentPostexts[0]);
                }
              }

              $scope.resultAnswerText.text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex][userAnswer];
              $scope.selectionInProgress = false;
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

            });

        }//end of check function


        /*Function for checking if there are already answered questions*/
        function updateResultsTotalQuestions() {
          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userAnswer !== "") {
              console.warn("The question " + $scope.activityData.questions[key] + " has an answer...");
              //The question has been answered updating question text and answer text
              $scope.resultsTotalRowQuestionsTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
              $scope.resultsTotalRowAnswersTexts[key].text = $scope.activityData.questions[key][$scope.activityData.questions[key].userAnswer];
            }
          });
          $scope.stage.update();
          console.warn("Has already answer: ", $scope.activityData.questions);
        }
      });//end of image on complete
    }, 500);//end of timeout
  });

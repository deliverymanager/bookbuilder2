angular.module("bookbuilder2")
  .controller("wizardController", function ($scope, $ionicPlatform, $timeout, $http, _, $rootScope) {

    console.log("wizardController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));
    $scope.activityFolder = window.localStorage.getItem("activityFolder");

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
        src: $scope.rootDir + "data/assets/wizard_results_table.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/wizard_results_table.png");

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
              $scope.stage.update();
              $rootScope.navigate("lessonNew");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get menu button


        /*1. Dividing th activity data into the two separate groups*/

        $scope.englishWords = {};
        $scope.greekWords = {};
        $scope.englishWordsContainers = {};
        $scope.greekWordsContainers = {};
        $scope.englishWordsBackgrounds = {};
        $scope.greekWordsBackgrounds = {};
        $scope.englishWordsTexts = {};
        $scope.greekWordsTexts = {};
        $scope.rightWordsContainers = {};
        $scope.rightWordsBackgrounds = {};
        $scope.rightWordsTexts = {};
        $scope.checkboxes = {};
        var englishWordsContainers;
        var greekWordsContainers;
        var rightWordsContainers;


        /************************************** Initializing Page **************************************/

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);

        /*Getting the activityData from the local storage*/
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          init();

        } else {

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/wizard.json")
            .success(function (response) {

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 0;
              $scope.activityData.newGame = true;

              restartActivity();

              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes almost everything*/
        function init() {

          if ($scope.activityData.newGame) {

            $scope.questionsGroups = _.groupBy($scope.activityData.questions, "group");
            $scope.englishWords.group_1 = _.groupBy(_.shuffle($scope.questionsGroups.group_1), "englishWord");
            $scope.greekWords.group_1 = _.groupBy(_.shuffle($scope.questionsGroups.group_1), "greekWord");
            $scope.englishWords.group_2 = _.groupBy(_.shuffle($scope.questionsGroups.group_2), "englishWord");
            $scope.greekWords.group_2 = _.groupBy(_.shuffle($scope.questionsGroups.group_2), "greekWord");

          }

          if (window.localStorage.getItem("questionsGroups")) {
            console.log("read from localstorage");
            $scope.questionsGroups = JSON.parse(window.localStorage.getItem("questionsGroups"));
          }

          if (window.localStorage.getItem("englishWords")) {
            console.log("read from localstorage");

            $scope.englishWords = JSON.parse(window.localStorage.getItem("englishWords"));
          }

          if (window.localStorage.getItem("greekWords")) {
            console.log("read from localstorage");

            $scope.greekWords = JSON.parse(window.localStorage.getItem("greekWords"));
          }

          if (window.localStorage.getItem("englishWordsContainers")) {
            console.log("read from localstorage");

            englishWordsContainers = JSON.parse(window.localStorage.getItem("englishWordsContainers"));
          }

          if (window.localStorage.getItem("greekWordsContainers")) {
            console.log("read from localstorage");
            greekWordsContainers = JSON.parse(window.localStorage.getItem("greekWordsContainers"));
          }

          if (window.localStorage.getItem("rightWordsContainers")) {
            console.log("read from localstorage");
            rightWordsContainers = JSON.parse(window.localStorage.getItem("rightWordsContainers"));
          }

          $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "20px Arial", "white");
          $scope.pageTitle.x = 120;
          $scope.pageTitle.y = 55;
          $scope.pageTitle.maxWidth = 500;
          $scope.mainContainer.addChild($scope.pageTitle);

          /*Adding page title and description $scope.activityData.title*/
          $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
              activityFolder: $scope.activityFolder
            }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : "") + " - " + $scope.activityData.description, "20px Arial", "white");
          $scope.pageActivity.x = 120;
          $scope.pageActivity.y = 630;
          $scope.pageActivity.maxWidth = 600;
          $scope.mainContainer.addChild($scope.pageActivity);

          $scope.activityData.score = 0;

          async.waterfall([

            /*Check Button*/
            function (initCallback) {
              $http.get($scope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");


                  /*Press up event*/
                  $scope.checkButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on check button!");

                    if ($scope.activityData.newGame) {
                      $scope.checkButton.gotoAndPlay("normal");
                      checkAnswers();
                    }
                  });

                  $scope.checkButton.x = 240;
                  $scope.checkButton.y = 555;
                  $scope.mainContainer.addChild($scope.checkButton);
                  initCallback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initCallback();
                });
            },

            /*Restart Button*/
            function (initCallback) {
              /*RESTART BUTTON*/
              $http.get($scope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
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
                  $scope.restartButton.x = 150;
                  $scope.restartButton.y = 570;
                  $scope.mainContainer.addChild($scope.restartButton);
                  initCallback();
                })
                .error(function (error) {
                  console.log("Error on getting json data for return button...", error);
                  initCallback();
                });
            },

            /*Score Text*/
            function (initCallback) {

              $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
              $scope.scoreText.x = 620;
              $scope.scoreText.y = 575;
              $scope.mainContainer.addChild($scope.scoreText);
              initCallback(null);
            },

            function (initWaterfallCallback) {

              $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                  $scope.resultsButton.x = 430;
                  $scope.resultsButton.y = 580;
                  $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6;
                  $scope.mainContainer.addChild($scope.resultsButton);

                  $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                  $scope.endText.x = 460;
                  $scope.endText.y = 570;
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

            /*Next Activity Button*/
            function (initCallback) {
              /*NEXT BUTTON*/
              $http.get($scope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                  $scope.nextButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !", !$scope.activityData.newGame);
                    if (!$scope.activityData.newGame) {
                      $scope.nextButton.gotoAndPlay("selected");
                    }
                    $scope.stage.update();
                  });
                  $scope.nextButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");

                    if (!$scope.activityData.newGame) {
                      $scope.nextButton.gotoAndPlay("onSelection");
                      $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                    }

                  });
                  $scope.nextButton.x = 460;
                  $scope.nextButton.y = 590;
                  $scope.mainContainer.addChild($scope.nextButton);
                  $scope.stage.update();
                  initCallback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initCallback();
                });
            },

            function (initCallback) {

              console.log("Add lines...");

              /*Image Loader*/
              var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $scope.rootDir + "data/assets/wizard_connecting_line.png"
              }));

              imageLoader.load();

              /*IMAGE LOADER COMPLETED*/
              imageLoader.on("complete", function (r) {

                var connectingLines = {};

                _.each($scope.activityData.questions, function (line, key, list) {

                  connectingLines[key] = new createjs.Bitmap($scope.rootDir + "data/assets/wizard_connecting_line.png");
                  connectingLines[key].x = 212;
                  connectingLines[key].y = key === 0 ? 111 : key === 5 ? connectingLines[key - 1].y + 60 : connectingLines[key - 1].y + 40;
                  $scope.mainContainer.addChild(connectingLines[key]);

                });

                initCallback(null);
              });

            },
            /*Getting the sprite of checkbox*/
            function (initCallback) {
              $http.get($scope.rootDir + "data/assets/wizard_tick_wrong_bubble_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var checkboxSpriteSheet = new createjs.SpriteSheet(response);

                  initCallback(null, checkboxSpriteSheet);

                })
                .error(function (error) {
                  initCallback(true, error);
                  console.log("Error on getting json data for checkbox...", error);
                });
            },

            /*Creating the game, first foreach word a container, a shape and text is created*/
            function (restartButtonSpriteSheet, initCallback) {
              _.each($scope.questionsGroups, function (group, key, list) {

                var counter = 0;
                /*Deploying the english words*/
                _.each($scope.englishWords[key], function (word, wordKey, wordList) {

                  /* 1.A. The container for the english words*/
                  $scope.englishWordsContainers[wordKey] = new createjs.Container();
                  $scope.englishWordsContainers[wordKey].width = 170;
                  $scope.englishWordsContainers[wordKey].height = 35;
                  $scope.englishWordsContainers[wordKey].x = 80;
                  $scope.englishWordsContainers[wordKey].containerIndex = (englishWordsContainers ? englishWordsContainers[wordKey].containerIndex : counter);
                  $scope.englishWordsContainers[wordKey].questionIsRight = false;
                  counter++;

                  var englishWordsContainersKeys = _.allKeys($scope.englishWordsContainers);
                  var currentEnglishWordIndex = _.indexOf(englishWordsContainersKeys, wordKey);

                  if (currentEnglishWordIndex >= 1) {
                    var previousEnglishWordKey = englishWordsContainersKeys[currentEnglishWordIndex - 1];
                  }

                  /*Checking if it's the first element to enter*/
                  $scope.englishWordsContainers[wordKey].y = (key === "group_2" && currentEnglishWordIndex === 5) ? $scope.englishWordsContainers[previousEnglishWordKey].y + 60 :
                    (currentEnglishWordIndex === 0 ? 100 : $scope.englishWordsContainers[previousEnglishWordKey].y + 40);


                  $scope.englishWordsContainers[wordKey].startingPointX = $scope.englishWordsContainers[wordKey].x;
                  $scope.englishWordsContainers[wordKey].startingPointY = $scope.englishWordsContainers[wordKey].y;

                  /** ************************************************ CHECK **********************************************************/

                  /*Mouse down event*/
                  $scope.englishWordsContainers[wordKey].on("mousedown", function (evt) {
                    //Check if completed
                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      return;
                    }

                    var global = $scope.mainContainer.localToGlobal(this.x, this.y);
                    this.offset = {
                      'x': global.x - evt.stageX,
                      'y': global.y - evt.stageY
                    };
                    this.global = {
                      'x': global.x,
                      'y': global.y
                    };
                    _.each($scope.currentQuestions, function (question, k, list) {
                      if (parseInt($scope.currentQuestions[k].userAnswer) === key + 1) {
                        $scope.currentQuestions[k].userAnswer = "";
                      }
                    });
                  });

                  /*Press move event*/
                  $scope.englishWordsContainers[wordKey].on("pressmove", function (evt) {
                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      return;
                    }
                    var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                    this.x = local.x;
                    this.y = local.y;
                  });

                  /*Press up event*/
                  $scope.englishWordsContainers[wordKey].on("pressup", function (evt) {
                    console.log("Press up event while dropping the answer!");

                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      console.log("Activity has not completed...");
                      return;
                    }


                    var collisionDetectedQuestion = collision(evt.stageX / $scope.scale - $scope.mainContainer.x / $scope.scale, evt.stageY / $scope.scale - $scope.mainContainer.y / $scope.scale, currentEnglishWordIndex);

                    if (collisionDetectedQuestion !== -1) {
                      console.log(wordKey);
                      console.log(collisionDetectedQuestion);
                      swapWords(wordKey, collisionDetectedQuestion, "left");
                    } else {

                      /*No collision going back to start point*/
                      createjs.Tween.get(this, {
                        loop: false
                      })
                        .to({
                          x: this.startingPointX,
                          y: this.startingPointY
                        }, 200, createjs.Ease.getPowIn(2));
                      $scope.stage.update();
                    }
                  }); //end of press up event

                  $scope.mainContainer.addChild($scope.englishWordsContainers[wordKey]);

                  /* 2.A. Creating the letterBackground*/
                  var englishWordsGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.englishWordsContainers[wordKey].width, $scope.englishWordsContainers[wordKey].height);
                  $scope.englishWordsBackgrounds[wordKey] = new createjs.Shape(englishWordsGraphic);
                  $scope.englishWordsContainers[wordKey].addChild($scope.englishWordsBackgrounds[wordKey]);

                  /* 3.A Adding text*/
                  $scope.englishWordsTexts[wordKey] = new createjs.Text($scope.englishWords[key][wordKey][0].englishWord, "20px Arial", "white");
                  $scope.englishWordsTexts[wordKey].x = $scope.englishWordsContainers[wordKey].width / 2;
                  $scope.englishWordsTexts[wordKey].y = $scope.englishWordsContainers[wordKey].height / 2;
                  $scope.englishWordsTexts[wordKey].textAlign = "center";
                  $scope.englishWordsTexts[wordKey].textBaseline = "middle";
                  $scope.englishWordsContainers[wordKey].addChild($scope.englishWordsTexts[wordKey]);


                  /*Adding checkboxes*/
                  $scope.checkboxes[wordKey] = new createjs.Sprite(restartButtonSpriteSheet, "normal");
                  $scope.checkboxes[wordKey].x = $scope.englishWordsContainers[wordKey].width + $scope.englishWordsContainers[wordKey].x + 500;
                  $scope.checkboxes[wordKey].y = $scope.englishWordsContainers[wordKey].y;
                  $scope.mainContainer.addChild($scope.checkboxes[wordKey]);
                  $scope.checkboxes[wordKey].gotoAndPlay("normal");

                });

                var secondCounter = 0;
                /*Deploying the greek words*/
                _.each($scope.greekWords[key], function (word, wordKey, wordList) {

                  /* 1.B. The container for the greek words*/
                  $scope.greekWordsContainers[wordKey] = new createjs.Container();
                  $scope.greekWordsContainers[wordKey].width = 170;
                  $scope.greekWordsContainers[wordKey].height = 35;
                  $scope.greekWordsContainers[wordKey].x = 350;
                  $scope.greekWordsContainers[wordKey].containerIndex = (greekWordsContainers ? greekWordsContainers[wordKey].containerIndex : secondCounter);
                  secondCounter++;

                  var greekWordsContainersKeys = _.allKeys($scope.greekWordsContainers);
                  var currentGreekWordIndex = _.indexOf(greekWordsContainersKeys, wordKey);

                  if (currentGreekWordIndex >= 1) {
                    var previousGreekWordKey = greekWordsContainersKeys[currentGreekWordIndex - 1];
                  }
                  /*Checking if its the first element to enter*/
                  $scope.greekWordsContainers[wordKey].y = (key === "group_2" && currentGreekWordIndex === 5) ? $scope.greekWordsContainers[previousGreekWordKey].y + 60 : (currentGreekWordIndex === 0 ? 100 : $scope.greekWordsContainers[previousGreekWordKey].y + 40);
                  $scope.greekWordsContainers[wordKey].startingPointX = $scope.greekWordsContainers[wordKey].x;
                  $scope.greekWordsContainers[wordKey].startingPointY = $scope.greekWordsContainers[wordKey].y;

                  /*EVENTS*/
                  /*Mouse down event*/
                  $scope.greekWordsContainers[wordKey].on("mousedown", function (evt) {
                    //Check if completed
                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      return;
                    }

                    var global = $scope.mainContainer.localToGlobal(this.x, this.y);
                    this.offset = {
                      'x': global.x - evt.stageX,
                      'y': global.y - evt.stageY
                    };
                    this.global = {
                      'x': global.x,
                      'y': global.y
                    };
                    _.each($scope.currentQuestions, function (question, k, list) {
                      if (parseInt($scope.currentQuestions[k].userAnswer) === key + 1) {
                        $scope.currentQuestions[k].userAnswer = "";
                      }
                    });
                  });

                  /*Press move event*/
                  $scope.greekWordsContainers[wordKey].on("pressmove", function (evt) {
                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      return;
                    }
                    var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                    this.x = local.x;
                    this.y = local.y;
                  });

                  /*Press up event*/
                  $scope.greekWordsContainers[wordKey].on("pressup", function (evt) {
                    console.log("Press up event while dropping the answer!");

                    if (!$scope.activityData.newGame || $scope.swappingWord) {
                      console.log("Activity has not completed...");
                      return;
                    }


                    var collisionDetectedQuestion = collision(evt.stageX / $scope.scale - $scope.mainContainer.x / $scope.scale, evt.stageY / $scope.scale - $scope.mainContainer.y / $scope.scale, currentGreekWordIndex);

                    if (collisionDetectedQuestion !== -1) {
                      console.log(wordKey);
                      console.log(collisionDetectedQuestion);
                      swapWords(wordKey, collisionDetectedQuestion, "right");
                    } else {

                      /*No collision going back to start point*/
                      createjs.Tween.get(this, {
                        loop: false
                      })
                        .to({
                          x: this.startingPointX,
                          y: this.startingPointY
                        }, 200, createjs.Ease.getPowIn(2));
                      $scope.stage.update();
                    }
                  }); //end of press up event

                  $scope.mainContainer.addChild($scope.greekWordsContainers[wordKey]);

                  /* 2.A. Creating the letterBackground*/
                  var greekWordsGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.greekWordsContainers[wordKey].width, $scope.greekWordsContainers[wordKey].height);
                  $scope.greekWordsBackgrounds[wordKey] = new createjs.Shape(greekWordsGraphic);
                  $scope.greekWordsContainers[wordKey].addChild($scope.greekWordsBackgrounds[wordKey]);

                  /* 3.B. Adding text*/
                  $scope.greekWordsTexts[wordKey] = new createjs.Text($scope.greekWords[key][wordKey][0].greekWord, "20px Arial", "white");
                  $scope.greekWordsTexts[wordKey].x = $scope.greekWordsContainers[wordKey].width / 2;
                  $scope.greekWordsTexts[wordKey].y = $scope.greekWordsContainers[wordKey].height / 2;
                  $scope.greekWordsTexts[wordKey].textAlign = "center";
                  $scope.greekWordsTexts[wordKey].textBaseline = "middle";
                  $scope.greekWordsContainers[wordKey].addChild($scope.greekWordsTexts[wordKey]);

                });

                var rightWordContainerCounter = 0;
                /*Deploying the right words*/
                _.each($scope.englishWords[key], function (word, wordKey, wordList) {

                  /* 1.A. The container for the english words*/
                  $scope.rightWordsContainers[wordKey] = new createjs.Container();
                  $scope.rightWordsContainers[wordKey].width = 170;
                  $scope.rightWordsContainers[wordKey].height = 35;
                  $scope.rightWordsContainers[wordKey].x = 540;
                  $scope.rightWordsContainers[wordKey].y = $scope.englishWordsContainers[wordKey].y;
                  $scope.rightWordsContainers[wordKey].containerIndex = (rightWordsContainers ? rightWordsContainers[wordKey].containerIndex : rightWordContainerCounter);
                  ;
                  $scope.rightWordsContainers[wordKey].visible = false;
                  rightWordContainerCounter++;

                  /* 2.A. Creating the letterBackground*/
                  var rightWordsGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.rightWordsContainers[wordKey].width, $scope.rightWordsContainers[wordKey].height);
                  $scope.rightWordsBackgrounds[wordKey] = new createjs.Shape(rightWordsGraphic);
                  $scope.rightWordsContainers[wordKey].addChild($scope.rightWordsBackgrounds[wordKey]);

                  /* 3.A Adding text*/
                  $scope.rightWordsTexts[wordKey] = new createjs.Text("", "20px Arial", "white");
                  $scope.rightWordsTexts[wordKey].x = $scope.rightWordsContainers[wordKey].width / 2;
                  $scope.rightWordsTexts[wordKey].y = $scope.rightWordsContainers[wordKey].height / 2;
                  $scope.rightWordsTexts[wordKey].textAlign = "center";
                  $scope.rightWordsTexts[wordKey].textBaseline = "middle";
                  $scope.rightWordsContainers[wordKey].addChild($scope.rightWordsTexts[wordKey]);

                  $scope.mainContainer.addChild($scope.rightWordsContainers[wordKey]);
                });

              });

              //Waterfall callback
              initCallback(null);
            }

          ], function (error, result) {
            if (!error) {
              console.log("Success on creating game!");

              if (!$scope.activityData.newGame) {
                console.log("THIS IS A COMPLETED GAME");
                $scope.checkButton.gotoAndPlay("normal");
                checkAnswers();
              }
              save();
            } else {
              console.error("Error on creating the game during init function. Error: ", result);
            }

          });

        } //end of function init()


        var savePositions = function () {

          var greekWordsContainers = {};
          _.each(_.allKeys($scope.greekWordsContainers), function (container, key, list) {

            greekWordsContainers[container] = {containerIndex: $scope.greekWordsContainers[container].containerIndex};
          });
          window.localStorage.setItem("greekWordsContainers", JSON.stringify(greekWordsContainers));

          var rightWordsContainers = {};
          _.each(_.allKeys($scope.rightWordsContainers), function (container, key, list) {

            rightWordsContainers[container] = {containerIndex: $scope.rightWordsContainers[container].containerIndex};
          });
          window.localStorage.setItem("rightWordsContainers", JSON.stringify(rightWordsContainers));


          var englishWordsContainers = {};
          _.each(_.allKeys($scope.englishWordsContainers), function (container, key, list) {
            englishWordsContainers[container] = {containerIndex: $scope.englishWordsContainers[container].containerIndex};
          });
          window.localStorage.setItem("englishWordsContainers", JSON.stringify(englishWordsContainers));


          window.localStorage.setItem("questionsGroups", JSON.stringify($scope.questionsGroups));
          window.localStorage.setItem("englishWords", JSON.stringify($scope.englishWords));
          window.localStorage.setItem("greekWords", JSON.stringify($scope.greekWords));

        };

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        /*Function for swapping words when there is collision*/
        function swapWords(movingWordKey, passiveWordKey, side) {


          console.log("swapWords");

          $scope.swappingWord = true;

          $timeout(function () {
            $scope.swappingWord = false;
          }, 400);

          /*Checking if they are both english words*/

          if (side === "left") {

            /*First checking if it's english or greek word and after that if it's in the same group*/
            if (_.has($scope.englishWords.group_1, movingWordKey) && _.has($scope.englishWords.group_1, passiveWordKey)) {
              console.log("They are both English, Group 1");
              /*Swapping positions*/

              async.parallel([

                function (callback) {
                  createjs.Tween.get($scope.englishWordsContainers[movingWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.englishWordsContainers[passiveWordKey].x,
                      y: $scope.englishWordsContainers[passiveWordKey].y
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.englishWordsContainers[movingWordKey].startingPointX = $scope.englishWordsContainers[movingWordKey].x;
                      $scope.englishWordsContainers[movingWordKey].startingPointY = $scope.englishWordsContainers[movingWordKey].y;
                      callback();
                    });

                },
                function (callback) {
                  createjs.Tween.get($scope.englishWordsContainers[passiveWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.englishWordsContainers[movingWordKey].startingPointX,
                      y: $scope.englishWordsContainers[movingWordKey].startingPointY
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.englishWordsContainers[passiveWordKey].startingPointX = $scope.englishWordsContainers[passiveWordKey].x;
                      $scope.englishWordsContainers[passiveWordKey].startingPointY = $scope.englishWordsContainers[passiveWordKey].y;
                      callback();
                    });


                }
              ], function (err, result) {

                $timeout(function () {
                  swapIndexes(movingWordKey, passiveWordKey, "left");
                }, 250);

              });

            } else if (_.has($scope.englishWords.group_2, movingWordKey) && _.has($scope.englishWords.group_2, passiveWordKey)) {
              console.log("They are both English, Group 2");
              /*Swapping positions*/

              /*Swapping indexes*/

              async.parallel([

                function (callback) {
                  createjs.Tween.get($scope.englishWordsContainers[movingWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.englishWordsContainers[passiveWordKey].x,
                      y: $scope.englishWordsContainers[passiveWordKey].y
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.englishWordsContainers[movingWordKey].startingPointX = $scope.englishWordsContainers[movingWordKey].x;
                      $scope.englishWordsContainers[movingWordKey].startingPointY = $scope.englishWordsContainers[movingWordKey].y;
                      callback();
                    });
                },
                function (callback) {
                  createjs.Tween.get($scope.englishWordsContainers[passiveWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.englishWordsContainers[movingWordKey].startingPointX,
                      y: $scope.englishWordsContainers[movingWordKey].startingPointY
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.englishWordsContainers[passiveWordKey].startingPointX = $scope.englishWordsContainers[passiveWordKey].x;
                      $scope.englishWordsContainers[passiveWordKey].startingPointY = $scope.englishWordsContainers[passiveWordKey].y;
                      callback();
                    });


                }
              ], function (err, result) {
                $timeout(function () {
                  swapIndexes(movingWordKey, passiveWordKey, "left");
                }, 250);

              });


            } else {
              console.warn("It's not the same group...");

              createjs.Tween.get($scope.englishWordsContainers[movingWordKey], {
                loop: false
              })
                .to({
                  x: $scope.englishWordsContainers[movingWordKey].startingPointX,
                  y: $scope.englishWordsContainers[movingWordKey].startingPointY
                }, 200, createjs.Ease.getPowIn(2));
              $scope.stage.update();
            }


          } else {


            if (_.indexOf(_.allKeys($scope.greekWords.group_1), movingWordKey) !== -1 && _.indexOf(_.allKeys($scope.greekWords.group_1), passiveWordKey) !== -1) {

              console.log("They are both Greek, Group 1");
              /*Swapping positions*/
              async.parallel([

                function (callback) {
                  createjs.Tween.get($scope.greekWordsContainers[movingWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.greekWordsContainers[passiveWordKey].x,
                      y: $scope.greekWordsContainers[passiveWordKey].y
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.greekWordsContainers[movingWordKey].startingPointX = $scope.greekWordsContainers[movingWordKey].x;
                      $scope.greekWordsContainers[movingWordKey].startingPointY = $scope.greekWordsContainers[movingWordKey].y;
                      callback();
                    });

                },
                function (callback) {
                  createjs.Tween.get($scope.greekWordsContainers[passiveWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.greekWordsContainers[movingWordKey].startingPointX,
                      y: $scope.greekWordsContainers[movingWordKey].startingPointY
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.greekWordsContainers[passiveWordKey].startingPointX = $scope.greekWordsContainers[passiveWordKey].x;
                      $scope.greekWordsContainers[passiveWordKey].startingPointY = $scope.greekWordsContainers[passiveWordKey].y;
                      callback();
                    });

                }
              ], function (err, result) {


                $timeout(function () {
                  swapIndexes(movingWordKey, passiveWordKey, "right");
                }, 250);

              });

            } else if (_.indexOf(_.allKeys($scope.greekWords.group_2), movingWordKey) !== -1 && _.indexOf(_.allKeys($scope.greekWords.group_2), passiveWordKey) !== -1) {
              console.log("They are both Greek, Group 2");
              /*Swapping positions*/

              async.parallel([

                function (callback) {
                  createjs.Tween.get($scope.greekWordsContainers[movingWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.greekWordsContainers[passiveWordKey].x,
                      y: $scope.greekWordsContainers[passiveWordKey].y
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.greekWordsContainers[movingWordKey].startingPointX = $scope.greekWordsContainers[movingWordKey].x;
                      $scope.greekWordsContainers[movingWordKey].startingPointY = $scope.greekWordsContainers[movingWordKey].y;
                      callback();
                    });

                },
                function (callback) {
                  createjs.Tween.get($scope.greekWordsContainers[passiveWordKey], {
                    loop: false
                  })
                    .to({
                      x: $scope.greekWordsContainers[movingWordKey].startingPointX,
                      y: $scope.greekWordsContainers[movingWordKey].startingPointY
                    }, 200, createjs.Ease.getPowIn(2))
                    .call(function () {
                      /*Re-initializing values*/
                      $scope.greekWordsContainers[passiveWordKey].startingPointX = $scope.greekWordsContainers[passiveWordKey].x;
                      $scope.greekWordsContainers[passiveWordKey].startingPointY = $scope.greekWordsContainers[passiveWordKey].y;
                      callback();
                    });

                }
              ], function (err, result) {
                $timeout(function () {
                  swapIndexes(movingWordKey, passiveWordKey, "right");
                }, 250);
              });

            } else {
              console.warn("It's not the same group...");
              createjs.Tween.get($scope.greekWordsContainers[movingWordKey], {
                loop: false
              })
                .to({
                  x: $scope.greekWordsContainers[movingWordKey].startingPointX,
                  y: $scope.greekWordsContainers[movingWordKey].startingPointY
                }, 200, createjs.Ease.getPowIn(2));
              $scope.stage.update();
            }
          }
        }

        /*Function that handles collision*/
        function collision(x, y, wordIndexToRemove) {

          console.log("Collision stageX: ", x);
          console.log("Collision stageY: ", y);

          var englishWordsContainersKeys = _.allKeys($scope.englishWordsContainers);
          var greekWordsContainersKeys = _.allKeys($scope.greekWordsContainers);

          englishWordsContainersKeys.splice(wordIndexToRemove, 1);
          greekWordsContainersKeys.splice(wordIndexToRemove, 1);

          for (var i = 0; i < englishWordsContainersKeys.length; i++) {
            if (ionic.DomUtil.rectContains(
                x,
                y,
                $scope.englishWordsContainers[englishWordsContainersKeys[i]].x,
                $scope.englishWordsContainers[englishWordsContainersKeys[i]].y,
                $scope.englishWordsContainers[englishWordsContainersKeys[i]].x + $scope.englishWordsContainers[englishWordsContainersKeys[i]].width,
                $scope.englishWordsContainers[englishWordsContainersKeys[i]].y + $scope.englishWordsContainers[englishWordsContainersKeys[i]].height)) {
              console.log("Collision returns: ", englishWordsContainersKeys[i]);
              return englishWordsContainersKeys[i];
            }
          }

          for (var i = 0; i < greekWordsContainersKeys.length; i++) {
            if (ionic.DomUtil.rectContains(
                x,
                y,
                $scope.greekWordsContainers[greekWordsContainersKeys[i]].x,
                $scope.greekWordsContainers[greekWordsContainersKeys[i]].y,
                $scope.greekWordsContainers[greekWordsContainersKeys[i]].x + $scope.greekWordsContainers[greekWordsContainersKeys[i]].width,
                $scope.greekWordsContainers[greekWordsContainersKeys[i]].y + $scope.greekWordsContainers[greekWordsContainersKeys[i]].height)) {
              console.log("Collision returns: ", greekWordsContainersKeys[i]);
              return greekWordsContainersKeys[i];
            }
          }
          return -1;
        }


        /*Function that swaps index for the two given elements*/
        function swapIndexes(movingWordKey, passiveWordKey, side) {

          if (side === "left") {
            var tempIndex = $scope.englishWordsContainers[movingWordKey].containerIndex;
            $scope.englishWordsContainers[movingWordKey].containerIndex = $scope.englishWordsContainers[passiveWordKey].containerIndex;
            $scope.englishWordsContainers[passiveWordKey].containerIndex = tempIndex;

          } else if (side === "right") {
            var tempIndex = $scope.greekWordsContainers[movingWordKey].containerIndex;
            $scope.greekWordsContainers[movingWordKey].containerIndex = $scope.greekWordsContainers[passiveWordKey].containerIndex;
            $scope.greekWordsContainers[passiveWordKey].containerIndex = tempIndex;
          }
          save();
        }


        //Function that checks for answers
        function checkAnswers() {

          console.log("Checking answers!");

          //Filling rightWordsTexts
          console.log($scope.greekWordsTexts);
          console.log($scope.greekWords);

          var rightWordIndex = 0;
          _.each($scope.rightWordsTexts, function (text, key, list) {
            $scope.rightWordsTexts[key].rightWordIndex = rightWordIndex;
            rightWordIndex++
          });

          var iterationIndex = 0;
          _.each($scope.greekWordsTexts, function (text, key, list) {
            _.findWhere($scope.rightWordsTexts, {
              "rightWordIndex": iterationIndex
            }).text = $scope.greekWordsTexts[key].text;
            iterationIndex++;
          });


          //Starting check
          _.each($scope.englishWordsContainers, function (container, key, list) {

            var greekEquivalentObject = _.findWhere($scope.activityData.questions, {
              "englishWord": key
            });
            console.warn(greekEquivalentObject);
            var greekEquivalentKey = greekEquivalentObject.greekWord;


            //CORRECT ANSWER
            if ($scope.englishWordsContainers[key].containerIndex === $scope.greekWordsContainers[greekEquivalentKey].containerIndex) {
              $scope.englishWordsContainers[key].questionIsRight = true;
              $scope.checkboxes[key].gotoAndPlay("right");

              //Make the greekWordContainer green
              $scope.greekWordsBackgrounds[greekEquivalentKey].graphics.beginFill("green")
                .drawRect(0, 0, $scope.greekWordsContainers[greekEquivalentKey].width, $scope.greekWordsContainers[greekEquivalentKey].height);


              //FALSE ANSWER
            } else {

              //Checkbox play "wrong" animation
              $scope.checkboxes[key].gotoAndPlay("wrong");

              //Make the rightWordsContainer visible and assign to the text the user choice
              $scope.rightWordsContainers[key].visible = true;


              //Εδώ πρέπει να κάνω την ελληνική λέξη να πάει στη σωστή θέση της
              //Πρέπει πρώτα να βρώ όμως στη σωστή θέση ποιά ελληνική λέξη υπάρχει.

              //Tween the greek word to the right english one
              createjs.Tween.get($scope.greekWordsContainers[greekEquivalentKey], {
                loop: false
              })
                .to({
                  x: $scope.greekWordsContainers[greekEquivalentKey].x,
                  y: $scope.englishWordsContainers[key].y
                }, 200, createjs.Ease.getPowIn(2));
            }
          });

          updateScore();

          //Mark activity as completed
          $scope.activityData.completed = true;
          $scope.checkButton.visible = false;
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
          save();


        }

        //Function that restarts questions
        function restartActivity() {

          $scope.englishWords = {};
          $scope.greekWords = {};
          $scope.englishWordsContainers = {};
          $scope.greekWordsContainers = {};
          $scope.englishWordsBackgrounds = {};
          $scope.greekWordsBackgrounds = {};
          $scope.englishWordsTexts = {};
          $scope.greekWordsTexts = {};
          $scope.rightWordsContainers = {};
          $scope.rightWordsBackgrounds = {};
          $scope.rightWordsTexts = {};
          $scope.checkboxes = {};
          englishWordsContainers = null;
          greekWordsContainers = null;
          rightWordsContainers = null;

          window.localStorage.removeItem("questionsGroups");
          window.localStorage.removeItem("englishWords");
          window.localStorage.removeItem("greekWords");
          window.localStorage.removeItem("englishWordsContainers");
          window.localStorage.removeItem("greekWordsContainers");
          window.localStorage.removeItem("rightWordsContainers");

          $scope.activityData.newGame = true;

          $scope.mainContainer.removeAllChildren();
          $scope.stage.removeAllEventListeners();
          init();
        }


        //Function for saving
        function save() {
          //Saving it to localStorage
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          savePositions();
        }


        //Function that updates score
        function updateScore() {
          console.log("Updating Score!");
          var rightAnswers = 0;
          _.each($scope.englishWordsContainers, function (container, key, list) {
            if ($scope.englishWordsContainers[key].questionIsRight) {
              rightAnswers++;
            }
          });
          //Finally updating the text
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
          $scope.activityData.score = rightAnswers;
          $scope.stage.update();
          save();
        }

      }); //end of image on complete
    }, 500); //end of timeout
  });

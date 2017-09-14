angular.module("bookbuilder2")
  .controller("DraganddropWallController", function ($rootScope, $scope, $ionicPlatform, $timeout, $http, _, Toast) {

    console.log("DraganddropWallController loaded!");
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

      /****************************** Image Loader ******************************/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/drag_and_drop_wall_background_2.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        $scope.background = new createjs.Bitmap($scope.rootDir + "data/assets/drag_and_drop_wall_background_2.png");

        /**** CALCULATING SCALING ****/
        var scaleY = $scope.stage.canvas.height / $scope.background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / $scope.background.image.width;
        scaleX = scaleX.toFixed(2);
        $scope.scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR: ", $scope.scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        $scope.background.scaleX = $scope.scale;
        $scope.background.scaleY = $scope.scale;
        $scope.background.regX = $scope.background.image.width / 2;
        $scope.background.regY = $scope.background.image.height / 2;
        $scope.background.x = $scope.stage.canvas.width / 2;
        $scope.background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild($scope.background);
        $scope.backgroundPosition = $scope.background.getTransformedBounds();

        var init = function () {

          /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
          $scope.mainContainer = new createjs.Container();
          $scope.mainContainer.width = $scope.background.image.width;
          $scope.mainContainer.height = $scope.background.image.height;
          $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
          $scope.mainContainer.x = $scope.backgroundPosition.x;
          $scope.mainContainer.y = $scope.backgroundPosition.y;
          $scope.stage.addChild($scope.mainContainer);

          /* ------------------------------------------ QUESTIONS CONTAINER ---------------------------------------------- */
          $scope.questionsContainer = new createjs.Container();
          $scope.questionsContainer.width = 480;
          $scope.questionsContainer.height = 380;
          $scope.questionsContainer.x = 60;
          $scope.questionsContainer.y = 90;
          $scope.mainContainer.addChild($scope.questionsContainer);

          /* ------------------------------------------ ANSWERS CONTAINER ---------------------------------------------- */
          $scope.answersContainer = new createjs.Container();
          $scope.answersContainer.width = 215;
          $scope.answersContainer.height = 370;
          $scope.answersContainer.x = 585;
          $scope.answersContainer.y = 90;
          $scope.mainContainer.addChild($scope.answersContainer);

          /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

          $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
            .success(function (response) {

              //Reassigning images with the rest of resource
              response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

              var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
              var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

              menuButton.addEventListener("mousedown", function (event) {
                console.log("mousedown event on a button !");
                menuButton.gotoAndPlay("onSelection");
                $scope.stage.update();
              });

              menuButton.addEventListener("pressup", function (event) {
                createjs.Tween.removeAllTweens();
                console.log("pressup event!");
                menuButton.gotoAndPlay("normal");
                $scope.stage.update();
                $rootScope.navigate("lessonNew");
              });

              menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
              menuButton.x = 0;
              menuButton.y = -menuButton.getTransformedBounds().height / 5;

              $scope.stage.addChild(menuButton);
              $scope.stage.update();
            })
            .error(function (error) {
              console.error("Error on getting json for results button...", error);
            });//end of get menu button


          /*Adding Score Text*/
          $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
          $scope.scoreText.x = 140;
          $scope.scoreText.y = 550;
          $scope.activityData.score = 0;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          $scope.mainContainer.addChild($scope.scoreText);


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


          /********************* QUESTIONS *********************/
          $scope.questionText = {};
          var waterfallFunctions = [];

          $scope.questionRowContainers = {};
          $scope.questionTextBackgroundsContainers = {};
          $scope.questionImages = {};
          $scope.currentPretexts = {};

          _.each($scope.activityData.questions, function (question, key, list) {

            console.log("The question is: ", question);

            //Filling the waterfall
            waterfallFunctions.push(function (waterfallCallback) {

              /*Creating the row container*/
              /*Creating the question bitmap*/
              var questionImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $scope.rootDir + "data/assets/drag_and_drop_wall_answer_holder.png"
              }));
              questionImageLoader.load();

              questionImageLoader.on("complete", function (r) {

                /*Creating the questionTextBackground bitmap*/
                var questionTextBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/drag_and_drop_wall_question_background.png"
                }));
                questionTextBackgroundImageLoader.load();

                questionTextBackgroundImageLoader.on("complete", function (r) {


                  $scope.questionTextBackground = new createjs.Bitmap($scope.rootDir + "data/assets/drag_and_drop_wall_question_background.png");
                  $scope.questionTextBackground.x = -5;
                  $scope.questionTextBackground.y = -5;
                  $scope.questionTextBackgroundsContainers[key] = new createjs.Container();
                  $scope.questionTextBackgroundsContainers[key].height = $scope.questionTextBackground.image.height;
                  $scope.questionTextBackgroundsContainers[key].width = $scope.questionsContainer.width;
                  $scope.questionTextBackgroundsContainers[key].y = key * 81;
                  $scope.questionTextBackgroundsContainers[key].addChild($scope.questionTextBackground);


                  $scope.currentPretexts[key] = new createjs.Text(question.pretext, "17px Arial", "white");
                  $scope.currentPretexts[key].x = 0;
                  $scope.currentPretexts[key].y = $scope.questionTextBackgroundsContainers[key].height / 3;
                  $scope.currentPretexts[key].maxWidth = 270;
                  $scope.questionTextBackgroundsContainers[key].addChild($scope.currentPretexts[key]);
                  $scope.questionsContainer.addChild($scope.questionTextBackgroundsContainers[key]);

                  /*Creating Bitmap Background for answerHolder background image*/
                  $scope.questionImages[key] = new createjs.Bitmap($scope.rootDir + "data/assets/drag_and_drop_wall_answer_holder.png");
                  $scope.questionImages[key].x = 0;
                  $scope.questionImages[key].y = -3;

                  $scope.questionRowContainers[key] = new createjs.Container();
                  $scope.questionRowContainers[key].height = $scope.questionImages[key].image.height + 10;
                  $scope.questionRowContainers[key].width = $scope.questionImages[key].image.width + 10;
                  $scope.questionRowContainers[key].x = 275;
                  $scope.questionRowContainers[key].y = key * 81;
                  $scope.questionRowContainers[key].startingPointX = $scope.questionRowContainers[key].x;
                  $scope.questionRowContainers[key].startingPointY = $scope.questionRowContainers[key].y;
                  $scope.questionsContainer.addChild($scope.questionRowContainers[key]);
                  $scope.questionRowContainers[key].addChild($scope.questionImages[key]);

                  $scope.questionText[key] = new createjs.Text("", "20px Arial", "white");
                  $scope.questionText[key].x = $scope.questionRowContainers[key].width / 2;
                  $scope.questionText[key].y = $scope.questionRowContainers[key].height / 3;
                  $scope.questionText[key].maxWidth = $scope.questionRowContainers[key].width;
                  $scope.questionText[key].textAlign = "center";
                  $scope.questionText[key].startingPointX = $scope.questionImages[key].x;
                  $scope.questionText[key].startingPointY = $scope.questionImages[key].y;

                  $scope.questionRowContainers[key].addChild($scope.questionText[key]);

                  /* ------------------------- QUESTION EVENTS ------------------------- */

                  /*Mouse down event*/
                  $scope.questionRowContainers[key].on("mousedown", function (evt) {

                    if (!$scope.activityData.newGame) {
                      console.log("On mouse down event ---> !$scope.activityData.newGame is true so the function aborts...");
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

                    console.log("this.offset: " + this.offset + " this.global: ", this.global);

                  });


                  /*Press move event*/
                  $scope.questionRowContainers[key].on("pressmove", function (evt) {

                    if (!$scope.activityData.newGame) {
                      return;
                    }

                    if ($scope.questionText[key].text === "") {
                      return;
                    }

                    $scope.reSelectedAnswerIndex = _.findIndex($scope.activityData.answers, {"text": $scope.questionText[key].text});
                    $scope.answerRowContainers[$scope.reSelectedAnswerIndex].visible = true;
                    var local = $scope.mainContainer.globalToLocal(evt.stageX + $scope.answerRowContainers[$scope.reSelectedAnswerIndex].offset.x, evt.stageY + $scope.answerRowContainers[$scope.reSelectedAnswerIndex].offset.y);
                    $scope.answerRowContainers[$scope.reSelectedAnswerIndex].x = local.x;
                    $scope.answerRowContainers[$scope.reSelectedAnswerIndex].y = local.y;
                  });

                  if (question.postext) {

                    var postexts = question.postext.split("\n");
                    console.log("postexts", postexts.length);
                    var currentPostexts = {};

                    if (postexts.length > 1) {
                      if (!postexts[0]) {
                        postexts[0] = " ";
                      }
                      currentPostexts[0] = new createjs.Text(postexts[0], "13px Arial", "black");
                      currentPostexts[0].x = $scope.questionRowContainers[key].x + $scope.questionRowContainers[key].width;
                      currentPostexts[0].y = $scope.questionRowContainers[key].y + 7;
                      $scope.questionsContainer.addChild(currentPostexts[0]);

                      currentPostexts[1] = new createjs.Text(postexts[1], "13px Arial", "black");
                      currentPostexts[1].x = 10;
                      currentPostexts[1].y = currentPostexts[0].y + 20;
                      $scope.questionsContainer.addChild(currentPostexts[1]);

                    } else {

                      currentPostexts[0] = new createjs.Text(postexts[0], "13px Arial", "black");
                      currentPostexts[0].x = $scope.questionRowContainers[key].x + $scope.questionRowContainers[key].width;
                      currentPostexts[0].y = $scope.questionRowContainers[key].y + 7;
                      $scope.questionsContainer.addChild(currentPostexts[0]);
                    }
                  }

                  waterfallCallback();
                });//end of questionTextBackgroundImageLoader
              });//end of questionImageLoader
            });
          });//end of each on activityData.questions

          /********************* ANSWERS *********************/
          $scope.answerRowContainers = {};
          $scope.answerPieces = {};
          $scope.questionTextWrong = {};

          var answerWaterfallFunctions = [];


          /*Creating the spriteSheet for answer  *UNIQUE TO draganddropWall template* */

          $http.get($scope.rootDir + "data/assets/drag_and_drop_wall_answer_sprite.json")
            .success(function (response) {
              //Reassigning images with the rest of resource
              response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
              var answerPieceSpriteSheet = new createjs.SpriteSheet(response);

              $scope.activityData.answers = _.shuffle(JSON.parse(JSON.stringify($scope.activityData.answers)));

              /*Getting the SpriteSheet was successful so it continiues*/
              _.each($scope.activityData.answers, function (answer, key, list) {

                //Filling the waterfall
                answerWaterfallFunctions.push(function (waterfallCallback) {

                  /*Creating the answer container*/
                  $scope.answerRowContainers[key] = new createjs.Container();
                  $scope.answerRowContainers[key].width = 160;
                  $scope.answerRowContainers[key].height = 30;
                  $scope.answerRowContainers[key].x = $scope.answersContainer.width / 2;
                  $scope.answerRowContainers[key].y = 15 + key * 81;

                  $scope.answerRowContainers[key].startingPointX = $scope.answerRowContainers[key].x;
                  $scope.answerRowContainers[key].startingPointY = $scope.answerRowContainers[key].y;

                  /*Mouse down event*/
                  $scope.answerRowContainers[key].on("mousedown", function (evt) {

                    //Check if completed
                    if (!$scope.activityData.newGame) {
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

                    /*Resolving if it's already used as an answer or not. If it's already used, the questionRowContainer userAnswer is innstatiated*/
                    _.each($scope.activityData.questions, function (question, ke, list) {
                      if (parseInt($scope.activityData.questions[ke].userAnswer) === parseInt(answer.answer)) {
                        console.log("The answerRowContainer is already placed in questionRowContainer! Re instantiating userAnswer...");
                        $scope.activityData.questions[ke].userAnswer = "";
                      }
                    });
                  });

                  /*Press move event*/
                  $scope.answerRowContainers[key].on("pressmove", function (evt) {
                    if (!$scope.activityData.newGame) {
                      return;
                    }
                    var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                    this.x = local.x;
                    this.y = local.y;
                  });

                  /*Press up event*/
                  $scope.answerRowContainers[key].on("pressup", function (evt) {
                    console.log("Press up event while dropping the answer!");

                    if (!$scope.activityData.newGame) {
                      return;
                    }
                    var collisionDetectedQuestion = collision(evt.stageX / $scope.scale - $scope.mainContainer.x / $scope.scale, evt.stageY / $scope.scale - $scope.mainContainer.y / $scope.scale);

                    /*There is collision*/
                    if (collisionDetectedQuestion !== -1) {

                      placeAnswer(key, collisionDetectedQuestion);

                    } else {

                      //There is no collision
                      createjs.Tween.get(this, {loop: false})
                        .to({x: this.startingPointX, y: this.startingPointY}, 200, createjs.Ease.getPowIn(2));
                      $scope.stage.update()
                    }
                  });//end of press up event


                  $scope.answersContainer.addChild($scope.answerRowContainers[key]);

                  /*Creating an instance of answerPieces*/
                  $scope.answerPieces[key] = new createjs.Sprite(answerPieceSpriteSheet, "normal");

                  /*Mouse down event*/
                  $scope.answerPieces[key].addEventListener("mousedown", function (event) {
                    if (!$scope.activityData.newGame) {
                      console.log("On mouse down event ---> !$scope.activityData.newGame is true so the function aborts...");
                      return;
                    }

                    console.log("Mouse down event on restart button!");
                    $scope.answerPieces[key].gotoAndPlay("normal");
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.answerPieces[key].addEventListener("pressup", function (event) {
                    if (!$scope.activityData.newGame) {
                      console.log("On mouse down event ---> !$scope.activityData.newGame is true so the function aborts...");
                      return;
                    }

                    console.log("Press up event on restart button!");
                    $scope.answerPieces[key].gotoAndPlay("normal");

                  });
                  $scope.answerPieces[key].x = 0;
                  $scope.answerPieces[key].y = 0;
                  $scope.answerRowContainers[key].addChild($scope.answerPieces[key]);


                  /*Adding the answer text after answerPiece has loaded*/
                  $scope.answerRowContainers[key].answerText = new createjs.Text(answer.text, "16px Arial", "white");
                  $scope.answerRowContainers[key].answerText.x = $scope.answerPieces[key].width / 2;
                  $scope.answerRowContainers[key].answerText.y = $scope.answerPieces[key].height / 2 - 7;
                  $scope.answerRowContainers[key].answerText.textAlign = "center";
                  $scope.answerRowContainers[key].answerText.capitalized =  answer.capitalized;
                  $scope.answerRowContainers[key].answerText.maxWidth = $scope.answerPieces[key].width;
                  $scope.answerRowContainers[key].addChild($scope.answerRowContainers[key].answerText);


                  $scope.questionTextWrong[key] = new createjs.Text("", "18px Arial", "red");
                  $scope.questionTextWrong[key].x = $scope.answerRowContainers[key].x
                  $scope.questionTextWrong[key].y = $scope.answerRowContainers[key].y
                  $scope.questionTextWrong[key].textAlign = "center";
                  $scope.questionTextWrong[key].visible = false;
                  $scope.questionTextWrong[key].maxWidth = $scope.answerPieces[key].width;
                  $scope.answersContainer.addChild($scope.questionTextWrong[key]);

                  waterfallCallback();


                });
              });


            })
            .error(function (error) {
              console.log("Error on getting json data for return button...", error);

            });


          async.waterfall(waterfallFunctions, function (err, result) {
            console.log("Questions Inserted!");

            /********************************** BUTTONS ***********************************/

            async.parallel([function (callback) {
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
                    restart();

                  });
                  $scope.restartButton.x = 450;
                  $scope.restartButton.y = 550;
                  $scope.mainContainer.addChild($scope.restartButton);
                  $scope.restartButton.visible = false;
                  callback();
                })
                .error(function (error) {
                  callback();
                  console.log("Error on getting json data for return button...", error);

                });
            }, function (callback) {

              /*CHECK BUTTON*/
              $http.get($scope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  if ($scope.activityData.newGame) {
                    $scope.checkButton.visible = true;
                  } else {
                    $scope.checkButton.visible = false;
                  }

                  /*Mouse down event*/
                  $scope.checkButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on check button !");
                    if ($scope.activityData.newGame) {
                      $scope.checkButton.gotoAndPlay("onSelection");
                    }
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.checkButton.addEventListener("pressup", function (event) {
                    console.log("Press up event on check button!");

                    if ($scope.activityData.newGame) {
                      $scope.checkButton.gotoAndPlay("normal");
                      score();
                    }
                  });

                  $scope.checkButton.x = 385;
                  $scope.checkButton.y = 540;
                  $scope.mainContainer.addChild($scope.checkButton);
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
                    $scope.resultsButton.x = 685;
                    $scope.resultsButton.y = 630;
                    $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6;
                    $scope.mainContainer.addChild($scope.resultsButton);

                    $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                    $scope.endText.x = 720;
                    $scope.endText.y = 620;
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

              function (callback) {

                /*NEXT BUTTON*/
                $http.get($scope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                  .success(function (response) {
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                    $scope.nextButton.addEventListener("mousedown", function (event) {
                      console.log("mousedown event on a button !", !$scope.activityData.newGame);
                      if (!$scope.activityData.newGame) {
                        $scope.nextButton.gotoAndPlay("onSelection");
                      }
                      $scope.stage.update();
                    });
                    $scope.nextButton.addEventListener("pressup", function (event) {
                      console.log("pressup event!");
                      if (!$scope.activityData.newGame) {
                        $scope.nextButton.gotoAndPlay("normal");
                        /*Calling next function!*/
                        $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                      }

                    });
                    $scope.nextButton.x = 730;
                    $scope.nextButton.y = 640;
                    $scope.mainContainer.addChild($scope.nextButton);
                    $scope.stage.update();
                    callback();
                  })
                  .error(function (error) {

                    console.log("Error on getting json data for check button...", error);
                    callback();
                  });
              }], function (err, response) {

              async.waterfall(answerWaterfallFunctions, function (callback) {
                console.log("answers Inserted!");

                _.each($scope.activityData.questions, function (question, key, value) {
                  console.log(key + " User Answer", question.userAnswer);
                  if (question.userAnswer) {

                    placeAnswer(_.findIndex($scope.activityData.answers, {
                      "answer": question.userAnswer
                    }), key);
                  }
                });

                if (!$scope.activityData.newGame) {
                  score();
                }

              });
            });

          });

        };
        /************************************** Initializing Page **************************************/

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          init();

        } else {

          $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/draganddropWall.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 0;
              $scope.activityData.newGame = true;

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

        /********************************** FUNCTIONS ***********************************/


        /*Function that restarts the exercise*/
        function restart() {

          _.each($scope.activityData.questions, function (question, key, value) {
            $scope.activityData.questions[key].userAnswer = "";
            $scope.answerPieces[key].gotoAndPlay("normal");
            $scope.questionTextWrong[key].text = "";
            $scope.questionTextWrong[key].visible = false;
          });

          $scope.stage.removeAllEventListeners();
          $scope.stage.removeAllChildren();
          $scope.stage.addChild($scope.background);

          init();

          $scope.nextButton.gotoAndPlay("normal");
          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");
          $scope.activityData.score = 0;
          $scope.resultsButton.visible = false;
          $scope.endText.visible = false;
          $scope.checkButton.visible = true;
          $scope.restartButton.visible = false;
          $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;
          $scope.activityData.newGame = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        /*Function that calculates score for the completed activity*/
        function score() {

          $scope.nextButton.gotoAndPlay("onSelection");

          placeAnswersOnRightQuestions();

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, value) {

            if (question.userAnswer === question.answer) {
              $scope.answerPieces[_.findIndex($scope.activityData.answers, {
                "answer": question.answer
              })].gotoAndPlay("onSelection");
              rightAnswers++;
            } else {
              $scope.answerPieces[_.findIndex($scope.activityData.answers, {
                "answer": question.answer
              })].gotoAndPlay("selected");
              console.log($scope.questionTextWrong[key]);
              console.log("question.userAnswer", question.userAnswer);
              if (question.userAnswer) {
                $scope.questionTextWrong[key].text = _.findWhere($scope.activityData.answers, {
                  "answer": question.userAnswer
                }).text;
                $scope.questionTextWrong[key].visible = true;
              }
            }
            $scope.stage.update();
          });

          //Capitalize first letter
          _.each($scope.answerRowContainers, function (answer, key, value) {
            console.log("answer.answerText", answer.answerText.text);
            if (answer.answerText.capitalized) {
              $scope.answerRowContainers[key].answerText.text = $scope.answerRowContainers[key].answerText.text[0].toUpperCase() + $scope.answerRowContainers[key].answerText.text.substr(1);
              console.log("Letter should be capitalized", $scope.answerRowContainers[key].answerText.text);
            }
          });

          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
          $scope.activityData.score = rightAnswers;
          $scope.activityData.completed = true;
          $scope.checkButton.visible = false;
          $scope.restartButton.visible = true;

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
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        /*Placing answers on right question gaps*/
        function placeAnswersOnRightQuestions() {
          _.each($scope.activityData.questions, function (question, key, list) {

            var rightAnswerIndex = _.findIndex($scope.activityData.answers, {
              "answer": $scope.activityData.questions[key].answer
            });

            createjs.Tween.get($scope.answerRowContainers[rightAnswerIndex], {loop: false})
              .to({
                x: ($scope.questionRowContainers[key].x + $scope.questionsContainer.x - $scope.answersContainer.x) + 96,
                y: ($scope.questionRowContainers[key].y + $scope.questionsContainer.y - $scope.answersContainer.y) + 20
              }, 500, createjs.Ease.getPowIn(2));
            $scope.stage.update()
          })
        }

        /*Function for placing answer when there is collision*/
        function placeAnswer(answerKey, questionKey) {

          /*There is no answer*/
          if ($scope.activityData.questions[questionKey].userAnswer === "") {
            $scope.activityData.questions[questionKey].userAnswer = $scope.activityData.answers[answerKey].answer;
            $scope.answerRowContainers[answerKey].x = ($scope.questionRowContainers[questionKey].x + $scope.questionsContainer.x - $scope.answersContainer.x) + 93;
            $scope.answerRowContainers[answerKey].y = ($scope.questionRowContainers[questionKey].y + $scope.questionsContainer.y - $scope.answersContainer.y) + 20;
            $scope.questionText[questionKey].color = "black";
            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          } else {

            //There is no collision
            createjs.Tween.get($scope.answerRowContainers[answerKey], {loop: false})
              .to({
                x: $scope.answerRowContainers[answerKey].startingPointX,
                y: $scope.answerRowContainers[answerKey].startingPointY
              }, 200, createjs.Ease.getPowIn(2));
            $scope.stage.update()
          }
        }


        function collision(x, y) {
          for (var i = 0; i < $scope.activityData.questions.length; i++) {
            if (ionic.DomUtil.rectContains(
                x,
                y,
                $scope.questionRowContainers[i].x + $scope.questionsContainer.x,
                $scope.questionRowContainers[i].y + $scope.questionsContainer.y,
                $scope.questionRowContainers[i].x + $scope.questionsContainer.x + $scope.questionRowContainers[i].width,
                $scope.questionRowContainers[i].y + $scope.questionsContainer.y + $scope.questionRowContainers[i].height)) {
              console.log("Collision returns", i);
              return i;
            }
          }
          return -1;
        }

      });//end of image on complete
    }, 1500);//end of timeout
  });

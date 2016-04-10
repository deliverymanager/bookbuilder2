angular.module("bookbuilder2")
  .controller("DraganddropParkController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("DraganddropParkController loaded!");

    //START OF DEVELOPMENT SNIPPET
    /*if (window.cordova && window.cordova.platformId !== "browser") {
     $rootScope.rootDir = window.cordova.file.dataDirectory;
     } else {
     $rootScope.rootDir = "";
     }
     $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
     $rootScope.activityFolder = window.localStorage.getItem("activityFolder");*/
    //END OF DEVELOPMENT SNIPPET


    /************************************
     *
     *
     * NOTE!!!!! for developing reason instantiating $rootScope.selectedLesson.id
     *
     *
     * */

    $rootScope.rootDir = "";
    $rootScope.activityFolder = "vocabulary3";
    $rootScope.selectedLesson = {
      "title": "Lesson 1",
      "active": true,
      "lessonTemplate": "lesson",
      "lessonButtonSprite": "first_menu_lesson_1_button_sprite.json",
      "id": "lesson1"
    };


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

      //EVENTS THAT SHOULD BE USED TO CONTROL THE APP
      $scope.$on('$destroy', function () {
        console.log('destroy');
        createjs.Ticker.framerate = 0;

        _.each($scope.sounds, function (sound, key, list) {
          $scope.sounds[key].stop();
          $scope.sounds[key].release();
        });

      });

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
      });

      $ionicPlatform.on('resume', function () {
        console.log('resume');
        $timeout(function () {
          createjs.Ticker.framerate = 20;
        }, 2000);
      });

      $scope.sounds = {};
      if (window.cordova && window.cordova.platformId !== "browser") {
        _.each(["drag", "drop", "check"], function (sound, key, list) {
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


      /****************************** Image Loader ******************************/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/drag_and_drop_park_background_2.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_park_background_2.png");

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
        console.log("GENERAL SCALING FACTOR", scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();
        console.log(backgroundPosition);

        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        /*$scope.mainContainer.x = backgroundPosition.x + (backgroundPosition.width / 2);
         $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 2);*/
        $scope.stage.addChild($scope.mainContainer);

        //mainContainer Background
        var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
        var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
        mainContainerBackground.alpha = 0.5;

        $scope.mainContainer.addChild(mainContainerBackground);


        /* ------------------------------------------ QUESTIONS CONTAINER ---------------------------------------------- */
        $scope.questionsContainer = new createjs.Container();
        $scope.questionsContainer.width = 431;
        $scope.questionsContainer.height = 295;
        $scope.questionsContainer.x = 82;
        $scope.questionsContainer.y = 230;
        $scope.mainContainer.addChild($scope.questionsContainer);

        //mainContainer Background
        var questionsContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.questionsContainer.width, $scope.questionsContainer.height);
        var questionsContainerBackground = new createjs.Shape(questionsContainerGraphic);
        questionsContainerBackground.alpha = 0.5;

        $scope.questionsContainer.addChild(questionsContainerBackground);

        /* ------------------------------------------ ANSWERS CONTAINER ---------------------------------------------- */
        $scope.answersContainer = new createjs.Container();
        $scope.answersContainer.width = 160;
        $scope.answersContainer.height = 260;
        $scope.answersContainer.x = 607;
        $scope.answersContainer.y = 320;
        $scope.mainContainer.addChild($scope.answersContainer);

        //mainContainer Background
        var answersContainerGraphic = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.answersContainer.width, $scope.answersContainer.height);
        var answersContainerBackground = new createjs.Shape(answersContainerGraphic);
        answersContainerBackground.alpha = 0.5;

        $scope.answersContainer.addChild(answersContainerBackground);


        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              menuButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
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

            $scope.stage.addChild(menuButton);
            $scope.stage.update();
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        var init = function () {

          /*Adding Score Text*/
          $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "25px Arial", "white");
          $scope.scoreText.x = 235;
          $scope.scoreText.y = 635;
          $scope.scoreText.textBaseline = "middle";
          $scope.mainContainer.addChild($scope.scoreText);


          /* ------------------------------------------ QUESTIONS & ANSWERS ---------------------------------------------- */
          $scope.questionText = {};
          var waterfallFunctions = [];

          $scope.questionRowContainers = {};

          /*Creating the bitmap for the question*/

          _.each($scope.activityData.questions, function (question, key, list) {

            console.log("The question is: ", question);

            //Filling the waterfall
            waterfallFunctions.push(function (waterfallCallback) {

              var pretexts = question.pretext.split("\n");
              $scope.currentPretexts = {};
              console.log("Pretext Array for the question: ", pretexts);
              _.each(pretexts, function (text, ke, li) {
                if (!text) {
                  text = " ";
                }
                $scope.currentPretexts[ke] = new createjs.Text(text, "13px Arial", "black");
                $scope.currentPretexts[ke].x = 10;
                $scope.currentPretexts[ke].y = 10 + ke * 20 + key * 60;
                $scope.currentPretexts[ke].textBaseline = "middle";
                $scope.currentPretexts[ke].lineHeight = 30;
                $scope.questionsContainer.addChild($scope.currentPretexts[ke]);
              });

              console.log("currentPretexts: ", $scope.currentPretexts);


              /*Creating the row container*/
              console.log("$scope.questionRowContainers[key]");
              $scope.questionRowContainers[key] = new createjs.Container();
              $scope.questionRowContainers[key].height = 27;
              $scope.questionRowContainers[key].width = 159;
              $scope.questionRowContainers[key].regY = $scope.questionRowContainers[key].height / 2;
              $scope.questionRowContainers[key].x = $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].x + $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].getBounds().width;
              $scope.questionRowContainers[key].y = $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].y;
              $scope.questionRowContainers[key].startingPointX = $scope.questionRowContainers[key].x;
              $scope.questionRowContainers[key].startingPointY = $scope.questionRowContainers[key].y;


              /*Creating the question bitmap*/
              var questionImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/drag_and_drop_chat_answer_holder.png"
              }));
              questionImageLoader.load();

              questionImageLoader.on("complete", function (r) {

                /*Creating Bitmap Background for Canvas*/
                var questionImage = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_park_answer_holder.png");
                questionImage.x = 0;
                questionImage.y = 0;
                $scope.questionRowContainers[key].addChild(questionImage);
                $scope.questionsContainer.addChild($scope.questionRowContainers[key]);

              });


              //Text that will be filled when user drop an answer ?
              $scope.questionText[key] = new createjs.Text("", "13px Arial", "black");
              /*$scope.questionText[key].x = $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].x + $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].getBounds().width;
              $scope.questionText[key].y = $scope.currentPretexts[pretexts.length === 1 ? 0 : 1].y;*/

              $scope.questionText[key].x = $scope.questionRowContainers[key].width / 2;
              $scope.questionText[key].y = $scope.questionRowContainers[key].height / 2;
              $scope.questionText[key].textBaseline = "middle";
              $scope.questionText[key].textAlign = "center";

              $scope.questionText[key].startingPointX = $scope.questionText[key].x;
              $scope.questionText[key].startingPointY = $scope.questionText[key].y;

              $scope.questionText[key].textBaseline = "middle";
              $scope.questionText[key].lineHeight = 20;
              $scope.questionText[key].maxWidth = $scope.questionRowContainers[key].width;


              $scope.questionRowContainers[key].addChild($scope.questionText[key]);


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
                  currentPostexts[0].y = $scope.questionRowContainers[key].y;
                  currentPostexts[0].textBaseline = "middle";
                  $scope.questionsContainer.addChild(currentPostexts[0]);

                  currentPostexts[1] = new createjs.Text(postexts[1], "13px Arial", "black");
                  currentPostexts[1].x = 10;
                  currentPostexts[1].y = currentPostexts[0].y + 20;
                  currentPostexts[1].textBaseline = "middle";
                  $scope.questionsContainer.addChild(currentPostexts[1]);

                } else {

                  currentPostexts[0] = new createjs.Text(postexts[0], "13px Arial", "black");
                  currentPostexts[0].x = $scope.questionRowContainers[key].x + $scope.questionRowContainers[key].width;
                  currentPostexts[0].y = $scope.questionRowContainers[key].y;
                  currentPostexts[0].textBaseline = "middle";
                  $scope.questionsContainer.addChild(currentPostexts[0]);
                }
              }


              /*Mouse down event*/
              $scope.questionRowContainers[key].on("mousedown", function (evt) {

                if ($scope.activityData.completed) {
                  console.log("On mouse down event ---> $scope.activityData.completed is true so the function aborts...");
                  return;
                }

                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sounds["drag"].play();
                }

                var global = $scope.stage.localToGlobal(this.x, this.y);
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

                if ($scope.activityData.completed) {
                  return;
                }

                if ($scope.questionRowContainers[key].text === "") {
                  return;
                }

                var local = $scope.stage.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                this.x = local.x;
                this.y = local.y;
                $scope.stage.update();
              });


              /*Press up event*/
              $scope.questionRowContainers[key].on("pressup", function (evt) {
                console.log("Press up event!");

                if ($scope.activityData.completed) {
                  return;
                }

                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sounds["drop"].play();
                }

                var collisionDetectedQuestion = collision(evt.stageX + this.offset.x, evt.stageY + this.offset.y);

                if (collisionDetectedQuestion !== -1) {

                  $scope.questionRowContainers[key].x = $scope.questionRowContainers[key].startingPointX;
                  $scope.questionRowContainers[key].y = $scope.questionRowContainers[key].startingPointY;

                  placeAnswer(_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  }), collisionDetectedQuestion);

                  $scope.activityData.questions[key].userAnswer = "";
                  $scope.activityData.questions[key].userAnswerLabel = "";
                  $scope.questionRowContainers[key].text = "";
                } else {
                  $scope.answerRowContainers[key].answerText[_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  })].visible = true;

                  $scope.answerRowContainers[key].answerText[_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  })].x = $scope.answerRowContainers[key].answerText[_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  })].startingPointX;

                  $scope.answerRowContainers[key].answerText[_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  })].y = $scope.answerRowContainers[key].answerText[_.findIndex($scope.activityData.answers, {
                    "text": $scope.questionRowContainers[key].text
                  })].startingPointY;

                  $scope.activityData.questions[key].userAnswer = "";
                  $scope.activityData.questions[key].userAnswerLabel = "";
                  $scope.questionRowContainers[key].text = "";
                  $scope.questionRowContainers[key].x = $scope.questionRowContainers[key].startingPointX;
                  $scope.questionRowContainers[key].y = $scope.questionRowContainers[key].startingPointY;
                }

                $scope.stage.update();
              });


              waterfallCallback();

            });
          });

          /******** ANSWERS ********/
          $scope.answerRowContainers = {};
          var answerWaterfallFunctions = [];

          //Populating container with answers
          _.each($scope.activityData.answers, function (answer, key, list) {

            //Filling the waterfall
            answerWaterfallFunctions.push(function (waterfallCallback) {

              /*Creating the answer container*/
              $scope.answerRowContainers[key] = new createjs.Container();
              $scope.answerRowContainers[key].width = 160;
              $scope.answerRowContainers[key].height = 30;
              $scope.answerRowContainers[key].x = 0;
              $scope.answerRowContainers[key].y = key * 52;
              $scope.answerRowContainers[key].startingPointX = $scope.answerRowContainers[key].x;
              $scope.answerRowContainers[key].startingPointY = $scope.answerRowContainers[key].y;
              $scope.answerRowContainers[key].answerText = answer.text;

              /*Mouse down event*/
              $scope.answerRowContainers[key].on("mousedown", function (evt) {

                if ($scope.activityData.completed) {
                  return;
                }


                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sounds["drag"].play();
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

                console.log("In side mouse down event ---> this.offset: ", this.offset);
                console.log("In side mouse down event ---> this.global: ", this.global);

              });

              /*DRAG AND DROP EVENT*/
              $scope.answerRowContainers[key].on("pressmove", function (evt) {
                if ($scope.activityData.completed) {
                  return;
                }

                var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                this.x = local.x;
                this.y = local.y;
                $scope.stage.update();

                console.log("this.x: " + this.x + " this.y: ", this.y);

              });

              /*Press up event*/
              $scope.answerRowContainers[key].on("pressup", function (evt) {
                console.log("Press up event while dropping the answer!");

                if ($scope.activityData.completed) {
                  return;
                }
                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sounds["drop"].play();
                }
                var collisionDetectedQuestion = collision(evt.stageX + this.offset.x, evt.stageY + this.offset.y);

                if (collisionDetectedQuestion !== -1) {

                  placeAnswer(key, collisionDetectedQuestion);

                } else {
                  createjs.Tween.get(this, {loop: false})
                    .to({x: this.startingPointX, y: this.startingPointY}, 200, createjs.Ease.getPowIn(2));
                  $scope.stage.update()
                }
              });//end of press up event


              $scope.answersContainer.addChild($scope.answerRowContainers[key]);


              var singleAnswerContainerContainerGraphic = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.answerRowContainers[key].width, $scope.answerRowContainers[key].height);
              var singleAnswerContainerBackground = new createjs.Shape(singleAnswerContainerContainerGraphic);
              singleAnswerContainerBackground.alpha = 0.5;

              $scope.answerRowContainers[key].addChild(singleAnswerContainerBackground);

              /*Creating the answer bitmap*/
              var answerImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/drag_and_drop_chat_answer_holder.png"
              }));
              answerImageLoader.load();

              answerImageLoader.on("complete", function (r) {

                /*Creating Bitmap Background for Canvas*/
                var answerImage = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_park_answer_holder.png");
                answerImage.width = $scope.answerRowContainers[key].width;
                answerImage.height = $scope.answerRowContainers[key].height;
                answerImage.x = 0;
                answerImage.y = 0;
                answerImage.maxWidth = $scope.answerRowContainers[key].width;

                $scope.answerRowContainers[key].addChild(answerImage);

                /*Adding the answer text after image has loaded*/
                var answerText = new createjs.Text(answer.text, "13px Arial", "black");
                answerText.x = answerImage.width / 2;
                answerText.y = answerImage.height / 2;
                answerText.textBaseline = "middle";
                answerText.textAlign = "center";
                $scope.answerRowContainers[key].addChild(answerText);

                waterfallCallback();

              });
            });
          });

          async.waterfall(waterfallFunctions, function (callback) {
            console.log("Questions Inserted!");

            /********************************** BUTTONS ***********************************/

            async.parallel([function (callback) {
              /*RESTART BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");

                  returnButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !");
                    returnButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });

                  returnButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");
                    returnButton.gotoAndPlay("normal");

                    //action
                    restart();

                  });
                  returnButton.x = 150;
                  returnButton.y = 625;
                  $scope.mainContainer.addChild(returnButton);
                  callback();
                })
                .error(function (error) {
                  callback();
                  console.log("Error on getting json data for return button...", error);

                });
            }, function (callback) {

              /*CHECK BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  if (!$scope.activityData.completed) {
                    $scope.checkButton.alpha = 1;
                  } else {
                    $scope.checkButton.alpha = 0.5;
                  }

                  $scope.checkButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !");
                    if (!$scope.activityData.completed) {
                      $scope.checkButton.gotoAndPlay("onSelection");
                    }
                    $scope.stage.update();
                  });
                  $scope.checkButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");

                    if (!$scope.activityData.completed) {
                      $scope.checkButton.gotoAndPlay("normal");
                      if (window.cordova && window.cordova.platformId !== "browser") {
                        $scope.sounds["check"].play();
                      }
                      check();
                    }
                  });
                  $scope.checkButton.x = 150;
                  $scope.checkButton.y = 625;
                  $scope.mainContainer.addChild($scope.checkButton);
                  callback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  callback();
                });
            }, function (callback) {

              /*NEXT BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");
                  $scope.nextButton.alpha = 0.5;

                  $scope.nextButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !", $scope.activityData.completed);
                    if ($scope.activityData.completed) {
                      $scope.nextButton.gotoAndPlay("onSelection");
                    }
                    $scope.stage.update();
                  });
                  $scope.nextButton.addEventListener("pressup", function (event) {
                    console.log("pressup event!");


                    if ($scope.activityData.completed) {
                      $scope.nextButton.gotoAndPlay("normal");
                      next();
                    }

                  });
                  $scope.nextButton.x = 710;
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

                check();
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

          console.log("$rootScope.selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("$rootScope.activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/draganddrop.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 1;

              /*Adding the userAnswerLabel attribute to response object before assigning it to activityData*/
              _.each($scope.activityData.questions, function (question, key, value) {
                $scope.activityData.questions[key].userAnswer = "";
                $scope.activityData.questions[key].userAnswerLabel = "";
              });
              init();
              //Saving it to localStorage
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.log("Error on getting json for the url...:", error);
            });
        }


        function completedActivity() {
          console.log("Completed Activity!");
          $scope.nextButton.alpha = 1;
          $scope.checkButton.alpha = 0.5;
          $scope.activityData.completed = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }

        /* ------------------------------------------ TITLE ---------------------------------------------- */

        var title = new createjs.Text($rootScope.activityName, "15px Arial", "white");

        /*background.scaleX = background.scaleY = scale;*/
        title.scaleX = title.scaleY = scale;
        title.x = 30;
        title.y = 5;
        $scope.mainContainer.addChild(title);


        /********************************** FUNCTIONS ***********************************/
        /*Function that restarts the exercise*/
        function restart() {
          $scope.nextButton.alpha = 0.5;
          $scope.nextButton.gotoAndPlay("normal");

          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");

          $scope.activityData.completed = false;
          $scope.activityData.attempts += +1;

          _.each($scope.activityData.questions, function (question, key, value) {
            $scope.activityData.questions[key].userAnswer = "";
            $scope.activityData.questions[key].userAnswerLabel = "";
            $scope.questionText[key].text = $scope.answerRowContainers[key].answerText;
            $scope.answerRowContainers[key].answerText[key].visible = true;
            createjs.Tween.get($scope.answerRowContainers[key].answerText[key], {loop: false})
              .to({
                x: $scope.answerRowContainers[key].answerText[key].startingPointX,
                y: $scope.answerRowContainers[key].answerText[key].startingPointY
              }, 200, createjs.Ease.getPowIn(2));

            $scope.questionText[key].color = "blue";
           /* $scope.questionText[key].x = $scope.underlinedText[key].getTransformedBounds().x + $scope.underlinedText[key].getTransformedBounds().width / 2 - $scope.questionText[key].getTransformedBounds().width / 2;*/
          });
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          score();
        }

        function check() {

          if (_.findWhere($scope.activityData.questions, {
              "userAnswer": ""
            })) {
            console.log("Please fill all the gaps!");
            Toast.show("Please fill all the gaps!");
            return;
          } else {
            score();
            completedActivity();
          }
        }

        /*Function that calculates score*/
        function score() {

          console.log("$scope.activityData", $scope.activityData);

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, value) {
            if (question.userAnswer === question.answer) {

              if (!$scope.activityData.questions[key].userAnswerLabel) {
                $scope.activityData.questions[key].userAnswerLabel = question.answer;
                $scope.questionText[key].color = "green";
                rightAnswers++;
              } else if ($scope.activityData.questions[key].userAnswerLabel !== $scope.activityData.questions[key].answer) {
                $scope.questionText[key].color = "red";
              } else {
                $scope.questionText[key].color = "green";
                rightAnswers++;
              }

            } else if (question.userAnswer) {
              if (!$scope.activityData.questions[key].userAnswerLabel) {
                $scope.activityData.questions[key].userAnswerLabel = question.userAnswer;
              }
              placeAnswer(_.findIndex($scope.activityData.answers, {
                "answer": question.answer
              }), key);
              $scope.questionText[key].color = "red";
            }
          });

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
          $scope.stage.update();
        }

        /*Function for placing answer when there is collision*/
        function placeAnswer(answerKey, questionKey) {

          console.log("Placing answer ---> answerKey: ", answerKey);
          console.log("Placing answer ---> questionKey: ", questionKey);

          $scope.answerRowContainers[answerKey].answerText.visible = false;
          $scope.questionText[questionKey].text = $scope.activityData.answers[answerKey].text;
          $scope.activityData.questions[questionKey].userAnswer = $scope.activityData.answers[answerKey].answer;
          $scope.questionText[questionKey].color = "black";
          /*$scope.questionText[questionKey].x = $scope.underlinedText[questionKey].getTransformedBounds().x + $scope.underlinedText[questionKey].getTransformedBounds().width / 2 - $scope.questionText[questionKey].getTransformedBounds().width / 2;*/
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }


        /*Function that goes to the next activity*/
        function next() {
          console.log("next activity!");
          var index = _.findIndex($rootScope.selectedLesson.lessonMenu, {
            "activityFolder": $rootScope.activityFolder
          });
          console.log(index);

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


        function collision(x, y) {

          return 0;

          console.log("Collision x: "+x+" y: "+y);

          var formattedQuestionXY = $scope.answerRowContainers[0].localToGlobal(x,y);

          console.log("After Question XY formatted: ",formattedQuestionXY);


          for (var i = 0; i < $scope.activityData.questions.length; i++) {
            /*var bounds = $scope.questionText[i].getTransformedBounds();*/

            /*var formattedQuestionXY = $scope.answersContainer.globalToLocal($scope.questionRowContainers[i].getTransformedBounds().x,$scope.questionRowContainers[i].getTransformedBounds().y);*/
            /*var formattedQuestionXYPlusWidthHeight = $scope.questionRowContainers[i].localToLocal($scope.questionRowContainers[i].getTransformedBounds().x + $scope.questionRowContainers[i].getTransformedBounds().width,
              $scope.questionRowContainers[i].getTransformedBounds().y + $scope.questionRowContainers[i].getTransformedBounds().height,$scope.answersContainer);*/
           /*
           console.log("After Question XY formatted: ",formattedQuestionXY);
            console.log("After Question XY + Width and Height formatted: ",formattedQuestionXYPlusWidthHeight);
            console.log("$scope.questionRowContainers[i]: ", $scope.questionRowContainers[i]);*/
            /*if (ionic.DomUtil.rectContains(x, y, bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height)) {*/
            if (ionic.DomUtil.rectContains(
                formattedQuestionXY.x,
                formattedQuestionXY.y,
                $scope.questionRowContainers[i].getTransformedBounds().x,
                $scope.questionRowContainers[i].getTransformedBounds().y,
                $scope.questionRowContainers[i].getTransformedBounds().x + $scope.questionRowContainers[i].getTransformedBounds().width,
                $scope.questionRowContainers[i].getTransformedBounds().y + $scope.questionRowContainers[i].getTransformedBounds().height)) {
              console.log("Collision returns i...");
              return i;
            }
          }
          console.log("Collision returns -1...");
          return -1;
        }

      });//end of image on complete
    }, 500);//end of timeout
  });

angular.module("bookbuilder2")
  .controller("DraganddropWallController", function (TypicalFunctions, $scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("DraganddropWallController loaded!");
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
        src: $rootScope.rootDir + "data/assets/drag_and_drop_wall_background_2.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_wall_background_2.png");

        /**** CALCULATING SCALING ****/
        var scaleY = $scope.stage.canvas.height / background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / background.image.width;
        scaleX = scaleX.toFixed(2);
        scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR: ", $scope.scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


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

        //mainContainer Background
        /*var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
         var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
         mainContainerBackground.alpha = 0.5;
         $scope.mainContainer.addChild(mainContainerBackground);*/


        /* ------------------------------------------ QUESTIONS CONTAINER ---------------------------------------------- */
        $scope.questionsContainer = new createjs.Container();
        $scope.questionsContainer.width = 480;
        $scope.questionsContainer.height = 380;
        $scope.questionsContainer.x = 60;
        $scope.questionsContainer.y = 90;
        $scope.mainContainer.addChild($scope.questionsContainer);

        //mainContainer Background
        /* var questionsContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.questionsContainer.width, $scope.questionsContainer.height);
         var questionsContainerBackground = new createjs.Shape(questionsContainerGraphic);
         questionsContainerBackground.alpha = 0.5;

         $scope.questionsContainer.addChild(questionsContainerBackground);
         */
        /* ------------------------------------------ ANSWERS CONTAINER ---------------------------------------------- */
        $scope.answersContainer = new createjs.Container();
        $scope.answersContainer.width = 215;
        $scope.answersContainer.height = 370;
        $scope.answersContainer.x = 585;
        $scope.answersContainer.y = 90;
        $scope.mainContainer.addChild($scope.answersContainer);

        //mainContainer Background
        /*var answersContainerGraphic = new createjs.Graphics().beginFill("blue")
         .drawRect(0, 0, $scope.answersContainer.width, $scope.answersContainer.height);
         var answersContainerBackground = new createjs.Shape(answersContainerGraphic);
         answersContainerBackground.alpha = 0.5;

         $scope.answersContainer.addChild(answersContainerBackground);*/


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
              createjs.Tween.removeAllTweens();
              console.log("pressup event!");
              menuButton.gotoAndPlay("normal");
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale;
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
          $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
          $scope.scoreText.x = 140;
          $scope.scoreText.y = 550;
          $scope.activityData.score = 0;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          $scope.mainContainer.addChild($scope.scoreText);

          var title = new createjs.Text($scope.activityData.title, "25px Arial", "white");
          title.x = 130;
          title.y = 4;
          $scope.mainContainer.addChild(title);

          var description = new createjs.Text($scope.activityData.description, "25px Arial", "white");
          description.x = 100;
          description.y = 615;
          $scope.mainContainer.addChild(description);


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
                src: $rootScope.rootDir + "data/assets/drag_and_drop_wall_answer_holder.png"
              }));
              questionImageLoader.load();

              questionImageLoader.on("complete", function (r) {

                /*Creating the questionTextBackground bitmap*/
                var questionTextBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $rootScope.rootDir + "data/assets/drag_and_drop_wall_question_background.png"
                }));
                questionTextBackgroundImageLoader.load();

                questionTextBackgroundImageLoader.on("complete", function (r) {


                  $scope.questionTextBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_wall_question_background.png");
                  $scope.questionTextBackground.x = -5;
                  $scope.questionTextBackground.y = -5;
                  $scope.questionTextBackgroundsContainers[key] = new createjs.Container();
                  $scope.questionTextBackgroundsContainers[key].height = $scope.questionTextBackground.image.height;
                  $scope.questionTextBackgroundsContainers[key].width = $scope.questionsContainer.width;
                  $scope.questionTextBackgroundsContainers[key].y = key * 81;
                  /*var questionTextBackgroundsContainersGraphics = new createjs.Graphics().beginFill("black").drawRect(0, 0, $scope.questionTextBackgroundsContainers[key].width, $scope.questionTextBackgroundsContainers[key].height);
                   var questionTextBackgroundsContainersBackground = new createjs.Shape(questionTextBackgroundsContainersGraphics);
                   questionTextBackgroundsContainersBackground.alpha = 0.5;
                   $scope.questionTextBackgroundsContainers[key].addChild(questionTextBackgroundsContainersBackground);*/
                  $scope.questionTextBackgroundsContainers[key].addChild($scope.questionTextBackground);


                  $scope.currentPretexts[key] = new createjs.Text(question.pretext, "17px Arial", "white");
                  $scope.currentPretexts[key].x = 0;
                  $scope.currentPretexts[key].y = $scope.questionTextBackgroundsContainers[key].height / 3;
                  $scope.questionTextBackgroundsContainers[key].addChild($scope.currentPretexts[key]);
                  $scope.questionsContainer.addChild($scope.questionTextBackgroundsContainers[key]);

                  /*Creating Bitmap Background for answerHolder background image*/
                  $scope.questionImages[key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_wall_answer_holder.png");
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

                  /*var questionRowContainersGraphics = new createjs.Graphics().beginFill("black").drawRect(0, 0, $scope.questionRowContainers[key].width, $scope.questionRowContainers[key].height);
                   var questionRowContainersBackground = new createjs.Shape(questionRowContainersGraphics);
                   questionRowContainersBackground.alpha = 0.5;
                   $scope.questionRowContainers[key].addChild(questionRowContainersBackground);*/
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

                    if ($scope.activityData.completed) {
                      console.log("On mouse down event ---> $scope.activityData.completed is true so the function aborts...");
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

                    console.log("this.offset: " + this.offset + " this.global: ", this.global);

                  });


                  /*Press move event*/
                  $scope.questionRowContainers[key].on("pressmove", function (evt) {

                    if ($scope.activityData.completed) {
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


                  /*Press up event*/
                  $scope.questionRowContainers[key].on("pressup", function (evt) {
                    console.log("Press up event on question button!");

                    if ($scope.activityData.completed) {
                      return;
                    }

                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["drop"].play();
                    }

                    var collisionDetectedQuestion = collision(evt.stageX / $scope.scale - $scope.mainContainer.x / $scope.scale, evt.stageY / $scope.scale - $scope.mainContainer.y / $scope.scale);

                    if (collisionDetectedQuestion !== -1) {

                      /*There is collision*/
                      console.log("Question Press up! ---> Collision: ", collisionDetectedQuestion);

                    }

                    else {

                      /*There is no collision...*/
                      console.log("Question Press up! ---> Collision: ", collisionDetectedQuestion);


                    }

                    $scope.stage.update();
                  });//end of questionRowContainers press up event


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
          var answerWaterfallFunctions = [];


          /*Creating the spriteSheet for answer  *UNIQUE TO draganddropWall template* */

          $http.get($rootScope.rootDir + "data/assets/drag_and_drop_wall_answer_sprite.json")
            .success(function (response) {
              //Reassigning images with the rest of resource
              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var answerPieceSpriteSheet = new createjs.SpriteSheet(response);


              /*Getting the SpriteSheet was successful so it continiues*/
              _.each($scope.activityData.answers, function (answer, key, list) {

                //Filling the waterfall
                answerWaterfallFunctions.push(function (waterfallCallback) {

                  /*Creating the answer container*/
                  $scope.answerRowContainers[key] = new createjs.Container();
                  $scope.answerRowContainers[key].width = 160;
                  $scope.answerRowContainers[key].height = 30;
                  $scope.answerRowContainers[key].x = $scope.answersContainer.width / 2;
                  /*********************************************************************************************************/
                  $scope.answerRowContainers[key].y = 15 + key * 81;

                  $scope.answerRowContainers[key].startingPointX = $scope.answerRowContainers[key].x;
                  $scope.answerRowContainers[key].startingPointY = $scope.answerRowContainers[key].y;

                  /*Mouse down event*/
                  $scope.answerRowContainers[key].on("mousedown", function (evt) {

                    //Check if completed
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

                    /*Resolving if it's already used as an answer or not. If it's already used, the questionRowContainer userAnswer is innstatiated*/
                    _.each($scope.activityData.questions, function (question, ke, list) {
                      if (parseInt($scope.activityData.questions[ke].userAnswer) === key + 1) {
                        console.log("The answerRowContainer is already placed in questionRowContainer! Re instantiating userAnswer...");
                        $scope.activityData.questions[ke].userAnswer = "";
                      }
                    });

                    /*Updating the index making it the element with the greatest index so it will not covered by other element*/
                    var restIndexes = 3;
                    _.each($scope.answersContainer.children, function (childElement, ke, list) {
                      if ($scope.answerRowContainers[ke].id === $scope.answerRowContainers[key].id) {
                        $scope.answersContainer.setChildIndex($scope.answerRowContainers[key], 4);
                      } else {
                        $scope.answersContainer.setChildIndex($scope.answerRowContainers[ke], restIndexes -= 1);
                      }

                      console.log("The element '" + $scope.answerRowContainers[ke].answerText + "' has index: ", $scope.answersContainer.getChildIndex($scope.answerRowContainers[key]));

                    });
                  });

                  /*Press move event*/
                  $scope.answerRowContainers[key].on("pressmove", function (evt) {
                    if ($scope.activityData.completed) {
                      return;
                    }
                    var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                    this.x = local.x;
                    this.y = local.y;
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
                    if ($scope.activityData.completed) {
                      console.log("On mouse down event ---> $scope.activityData.completed is true so the function aborts...");
                      return;
                    }

                    console.log("Mouse down event on restart button!");
                    $scope.answerPieces[key].gotoAndPlay("normal");
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.answerPieces[key].addEventListener("pressup", function (event) {
                    if ($scope.activityData.completed) {
                      console.log("On mouse down event ---> $scope.activityData.completed is true so the function aborts...");
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
                  $scope.answerRowContainers[key].addChild($scope.answerRowContainers[key].answerText);

                  waterfallCallback();


                });
              });


            })
            .error(function (error) {
              console.log("Error on getting json data for return button...", error);

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

                    $scope.checkButton.visible = true;
                    $scope.restartButton.visible = false;

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
                      check();
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
                  $scope.nextButton.y = 630;
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

          console.log("There is no activity...Getting the json through get");


          console.log("$rootScope.selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("$rootScope.activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/draganddropWall.json")
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


        /********************************** FUNCTIONS ***********************************/


        /*Function that restarts the exercise*/
        function restart() {
          $scope.nextButton.alpha = 0.5;
          $scope.nextButton.gotoAndPlay("normal");

          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");

          $scope.activityData.completed = false;
          $scope.activityData.attempts += 1;

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          score("restart");
        }

        /*Function that checks the exercise*/
        function check() {

          if (_.findWhere($scope.activityData.questions, {
              "userAnswer": ""
            })) {
            console.log("Cannot check the answers... Please fill all the gaps!");
            Toast.show("Please fill all the gaps!");

          } else {

            console.log("Checking the answers! Please fill all the gaps!");

            $scope.checkButton.visible = false;
            $scope.restartButton.visible = true;

            $scope.nextButton.alpha = 1;
            $scope.nextButton.gotoAndPlay("onSelection");

            score("check");
            completedActivity();
          }
        }

        /*Function that calculates score for the completed activity*/
        function score(whereItsCalledFrom) {

          var rightAnswers = 0;

          _.each($scope.activityData.questions, function (question, key, value) {


            if (whereItsCalledFrom === "check") {

              var answerRowContainerIndex = _.findIndex($scope.activityData.answers, {
                "answer": $scope.activityData.questions[key].userAnswer
              });

              console.log("Index of answerRowContainer: ", answerRowContainerIndex);


              if (question.userAnswer === question.answer) {

                $scope.answerPieces[key].gotoAndPlay("onSelection");
                /*$scope.answerRowContainers[answerRowContainerIndex].answerText.color = "green";*/
                rightAnswers++;

              } else {
                $scope.answerPieces[key].gotoAndPlay("selected");
                /*$scope.answerRowContainers[answerRowContainerIndex].answerText.color = "red";*/
              }

              //Its called from "restart"
            } else {

              /*$scope.answerRowContainers[key].answerText.color = "white";*/
              $scope.answerPieces[key].gotoAndPlay("normal");

              $scope.activityData.questions[key].userAnswer = "";
              /*$scope.activityData.questions[key].userAnswerLabel = "";*/
              /*$scope.answerRowContainers[key].visible = true;*/
              createjs.Tween.get($scope.answerRowContainers[key], {loop: false})
                .to({
                  x: $scope.answerRowContainers[key].startingPointX,
                  y: $scope.answerRowContainers[key].startingPointY
                }, 200, createjs.Ease.getPowIn(2));
              rightAnswers = 0;
            }

            $scope.stage.update();

          });//End of each

          if (whereItsCalledFrom === "check") {
            placeAnswersOnRightQuestions();
          }


          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
          $scope.activityData.score = rightAnswers;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

          $scope.stage.update();
        }

        /*Placing answers on right question gaps*/
        function placeAnswersOnRightQuestions() {
          _.each($scope.activityData.questions, function (question, key, list) {

            //Find the right questionRowContainer to go

            var rightAnswerIndex = _.findIndex($scope.activityData.answers, {
              "answer": $scope.activityData.questions[key].answer
            });

            console.log("For question: " + (key + 1) + " the right answer index is: ", rightAnswerIndex);

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

          console.log("Placing answer, answerKey: ", answerKey);
          console.log("Placing answer, questionKey: ", questionKey);

          /*Old drag and drop implementation*/
          /*$scope.answerRowContainers[answerKey].visible = false;
           $scope.questionText[questionKey].text = $scope.activityData.answers[answerKey].text;*/

          /*New drag and drop implementation*/

          /*There is no answer*/
          if ($scope.activityData.questions[questionKey].userAnswer === "") {

            //Saving the user's answer
            $scope.activityData.questions[questionKey].userAnswer = $scope.activityData.answers[answerKey].answer;

            console.log("Placing answer X: ", $scope.questionRowContainers[questionKey].x + $scope.questionsContainer.x);
            console.log("Placing answer Y: ", $scope.questionRowContainers[questionKey].y + $scope.questionsContainer.y);
            $scope.answerRowContainers[answerKey].x = ($scope.questionRowContainers[questionKey].x + $scope.questionsContainer.x - $scope.answersContainer.x) + 93;
            $scope.answerRowContainers[answerKey].y = ($scope.questionRowContainers[questionKey].y + $scope.questionsContainer.y - $scope.answersContainer.y) + 20;

            $scope.questionText[questionKey].color = "black";
            /*$scope.questionText[questionKey].x = $scope.underlinedText[questionKey].getTransformedBounds().x + $scope.underlinedText[questionKey].getTransformedBounds().width / 2 - $scope.questionText[questionKey].getTransformedBounds().width / 2;*/
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

          console.log("Collision stageX: " + x + " stageY: " + y);
          console.log("0 QUESTION X: ", $scope.questionRowContainers[0].x + $scope.questionsContainer.x);
          console.log("0 QUESTION Y: ", $scope.questionRowContainers[0].y + $scope.questionsContainer.y);
          console.log("Secondary QUESTION X + Width: ", ($scope.questionRowContainers[0].x + $scope.questionsContainer.x) + $scope.questionRowContainers[0].width);
          console.log("Secondary QUESTION Y + Height: ", ($scope.questionRowContainers[0].y + $scope.questionsContainer.y) + $scope.questionRowContainers[0].height);

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
          console.log("Collision returns -1...");

          return -1;
        }

      });//end of image on complete
    }, 1500);//end of timeout
  });

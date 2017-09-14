angular.module("bookbuilder2")
  .controller("DraganddropController", function ($scope, $ionicPlatform, $rootScope, $timeout, $http, _, Toast) {

    console.log("Draganddrop loaded!");

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

        var userChoice = " ____________________ ";

        /****************************** Image Loader ******************************/
        var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: $scope.rootDir + "data/assets/background_image_for_draganddrop_blue.png"
        }));
        imageLoader.load();

        /*IMAGE LOADER COMPLETED*/
        imageLoader.on("complete", function (r) {

          $scope.background = new createjs.Bitmap($scope.rootDir + "data/assets/background_image_for_draganddrop_blue.png");
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

          $scope.background.scaleX = $scope.scale;
          $scope.background.scaleY = $scope.scale;
          $scope.background.regX = $scope.background.image.width / 2;
          $scope.background.regY = $scope.background.image.height / 2;
          $scope.background.x = $scope.stage.canvas.width / 2;
          $scope.background.y = $scope.stage.canvas.height / 2;
          $scope.stage.addChild($scope.background);
          $scope.backgroundPosition = $scope.background.getTransformedBounds();

          var init = function () {

            $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
              .success(function (response) {

                //Reassigning images with the rest of resource
                response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

                var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
                var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

                menuButton.addEventListener("mousedown", function (event) {
                  menuButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                menuButton.addEventListener("pressup", function (event) {
                  menuButton.gotoAndPlay("normal");
                  $scope.stage.update();
                  $rootScope.navigate("lesson");//This is a template only for E Like English B1
                });

                menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
                menuButton.x = 0;
                menuButton.y = -menuButton.getTransformedBounds().height / 5;
                $scope.stage.addChild(menuButton);
              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
              });//end of get menu button

            /*Adding page title and description $scope.activityData.title*/
            $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "26px Arial", "white");
            $scope.pageTitle.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 8);
            $scope.pageTitle.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.width / 25);
            $scope.pageTitle.textBaseline = "alphabetic";
            $scope.pageTitle.scaleX = $scope.pageTitle.scaleY = $scope.scale;
            $scope.pageTitle.maxWidth = $scope.backgroundPosition.width / 3 / $scope.scale;
            $scope.stage.addChild($scope.pageTitle);

            /*Adding page title and description $scope.activityData.title*/
            $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
                activityFolder: $scope.activityFolder
              }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : ""), "20px Arial", "white");
            $scope.pageActivity.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 4.5);
            $scope.pageActivity.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.10);
            $scope.pageActivity.scaleX = $scope.pageActivity.scaleY = $scope.scale;
            $scope.pageActivity.maxWidth = $scope.backgroundPosition.width / 4 / $scope.scale;
            $scope.stage.addChild($scope.pageActivity);

            /*Adding page title and description*/
            $scope.pageDescription = new createjs.Text($scope.activityData.description, "20px Arial", "white");
            $scope.pageDescription.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 4.5);
            $scope.pageDescription.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.06);
            $scope.pageDescription.scaleX = $scope.pageDescription.scaleY = $scope.scale;
            $scope.pageDescription.maxWidth = $scope.backgroundPosition.width / 4 / $scope.scale;
            $scope.stage.addChild($scope.pageDescription);

            $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "27px Arial", "white");
            $scope.scoreText.scaleX = $scope.scoreText.scaleY = $scope.scale;
            $scope.scoreText.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.3);
            $scope.scoreText.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 17);
            $scope.scoreText.textBaseline = "alphabetic";
            $scope.activityData.score = 0;
            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            $scope.stage.addChild($scope.scoreText);

            $scope.questionText = {};
            $scope.questionTextWrong = {};
            $scope.underlinedText = {};
            $scope.answerText = {};
            var waterfallFunctions = [];
            var questionHeight = 530 * $scope.scale / $scope.activityData.questions.length;
            var questionY = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 5);

            _.each($scope.activityData.questions, function (question, key, list) {

              waterfallFunctions.push(function (waterfallCallback) {

                var pretexts = question.pretext.split("\n");
                $scope.currentPretexts = {};
                var yPreText = questionHeight / 3;
                _.each(pretexts, function (text, l, li) {
                  if (!text) {
                    text = " ";
                  }
                  $scope.currentPretexts[l] = new createjs.Text(text, "23px Arial", "blue");
                  $scope.currentPretexts[l].scaleX = $scope.currentPretexts[l].scaleY = $scope.scale;
                  $scope.currentPretexts[l].x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 40);
                  $scope.currentPretexts[l].y = questionY + yPreText * l;
                  $scope.currentPretexts[l].textBaseline = "alphabetic";
                  $scope.currentPretexts[l].lineHeight = 30;
                  $scope.stage.addChild($scope.currentPretexts[l]);
                });

                $scope.questionText[key] = new createjs.Text(userChoice, "22px Arial", "blue");
                $scope.questionText[key].scaleX = $scope.questionText[key].scaleY = $scope.scale;
                $scope.questionText[key].x = $scope.currentPretexts[pretexts.length - 1].getTransformedBounds().x + $scope.currentPretexts[pretexts.length - 1].getTransformedBounds().width;
                $scope.questionText[key].y = $scope.currentPretexts[pretexts.length - 1].getTransformedBounds().y + $scope.currentPretexts[pretexts.length - 1].getTransformedBounds().height / 1.3;
                $scope.questionText[key].startingPointX = $scope.questionText[key].x;
                $scope.questionText[key].startingPointY = $scope.questionText[key].y;
                $scope.questionText[key].textBaseline = "alphabetic";
                $scope.questionText[key].lineHeight = 30;
                $scope.questionText[key].maxWidth = $scope.questionText[key].getBounds().width * 0.8;


                $scope.underlinedText[key] = $scope.questionText[key].clone();

                $scope.stage.addChild($scope.underlinedText[key]);
                $scope.stage.addChild($scope.questionText[key]);

                if (question.postext) {

                  var postexts = question.postext.split("\n");
                  console.log("postexts", postexts.length);
                  $scope.currentPostexts = {};

                  if (postexts.length > 1) {
                    if (!postexts[0]) {
                      postexts[0] = " ";
                    }
                    $scope.currentPostexts[0] = new createjs.Text(postexts[0], "23px Arial", "blue");
                    $scope.currentPostexts[0].scaleX = $scope.currentPostexts[0].scaleY = $scope.scale;
                    $scope.currentPostexts[0].x = $scope.questionText[key].getTransformedBounds().x + $scope.questionText[key].getTransformedBounds().width;
                    $scope.currentPostexts[0].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3;
                    $scope.currentPostexts[0].textBaseline = "alphabetic";
                    $scope.stage.addChild($scope.currentPostexts[0]);

                    $scope.currentPostexts[1] = new createjs.Text(postexts[1], "23px Arial", "blue");
                    $scope.currentPostexts[1].scaleX = $scope.currentPostexts[1].scaleY = $scope.scale;
                    $scope.currentPostexts[1].x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 40);
                    $scope.currentPostexts[1].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3 * 2.5;
                    $scope.currentPostexts[1].textBaseline = "alphabetic";
                    $scope.stage.addChild($scope.currentPostexts[1]);
                  } else {

                    $scope.currentPostexts[0] = new createjs.Text(postexts[0], "23px Arial", "blue");
                    $scope.currentPostexts[0].scaleX = $scope.currentPostexts[0].scaleY = $scope.scale;
                    $scope.currentPostexts[0].x = $scope.questionText[key].getTransformedBounds().x + $scope.questionText[key].getTransformedBounds().width;
                    $scope.currentPostexts[0].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3;
                    $scope.currentPostexts[0].textBaseline = "alphabetic";
                    $scope.stage.addChild($scope.currentPostexts[0]);
                  }
                }

                questionY += questionHeight;

                var hit = new createjs.Shape();
                var bounds = $scope.questionText[key].getBounds();
                hit.graphics.beginFill("yellow").drawRect(bounds.x, bounds.y, bounds.width * 1.5, bounds.height * 1.5);
                $scope.questionText[key].hitArea = hit;


                $scope.questionText[key].on("mousedown", function (evt) {

                  if (!$scope.activityData.newGame) {
                    return;
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
                });

                /*DRAG AND DROP EVENT*/
                $scope.questionText[key].on("pressmove", function (evt) {

                  if (!$scope.activityData.newGame) {
                    console.log("newGame false");
                    return;
                  }

                  if ($scope.questionText[key].text === userChoice) {
                    console.log("userchoice not made");
                    return;
                  }

                  var local = $scope.stage.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                  this.x = local.x;
                  this.y = local.y;
                  $scope.stage.update();
                });


                $scope.questionText[key].on("pressup", function (evt) {
                  console.log("up");

                  if (!$scope.activityData.newGame) {
                    console.log("newGame false");
                    return;
                  }

                  var collisionDetectedQuestion = collision(evt.stageX + this.offset.x, evt.stageY + this.offset.y);

                  if (collisionDetectedQuestion !== -1) {

                    $scope.questionText[key].x = $scope.questionText[key].startingPointX;
                    $scope.questionText[key].y = $scope.questionText[key].startingPointY;

                    placeAnswer(_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    }), collisionDetectedQuestion);

                    $scope.activityData.questions[key].userAnswer = "";
                    $scope.activityData.questions[key].userAnswerLabel = "";
                    $scope.questionText[key].text = userChoice;
                  } else {
                    $scope.answerText[_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    })].visible = true;

                    $scope.answerText[_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    })].x = $scope.answerText[_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    })].startingPointX;

                    $scope.answerText[_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    })].y = $scope.answerText[_.findIndex($scope.activityData.answers, {
                      "text": $scope.questionText[key].text
                    })].startingPointY;

                    $scope.activityData.questions[key].userAnswer = "";
                    $scope.activityData.questions[key].userAnswerLabel = "";
                    $scope.questionText[key].text = userChoice;
                    $scope.questionText[key].x = $scope.questionText[key].startingPointX;
                    $scope.questionText[key].y = $scope.questionText[key].startingPointY;
                  }


                  $scope.stage.update();
                });


                waterfallCallback();

              });

            });

            /******** ANSWERS ********/
            var answerWaterfallFunctions = [];
            var answerY = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 5);
            var answerHeight = 530 * $scope.scale / $scope.activityData.answers.length;

            $scope.activityData.answers = _.shuffle(JSON.parse(JSON.stringify($scope.activityData.answers)));

            _.each($scope.activityData.answers, function (answer, key, list) {
              //Filling the waterfall
              answerWaterfallFunctions.push(function (waterfallCallback) {

                $scope.answerText[key] = new createjs.Text(answer.text, "18px Arial", "blue");
                $scope.answerText[key].textBaseline = "alphabetic";
                $scope.answerText[key].capitalized = answer.capitalized;
                $scope.answerText[key].x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.13);
                $scope.answerText[key].y = answerY;
                $scope.answerText[key].startingPointX = $scope.answerText[key].x;
                $scope.answerText[key].startingPointY = $scope.answerText[key].y;
                $scope.answerText[key].scaleX = $scope.answerText[key].scaleY = $scope.scale;
                $scope.answerText[key].height = answerHeight;
                $scope.answerText[key].textAlign = "center";
                $scope.answerText[key].maxWidth = $scope.backgroundPosition.width / 5 / $scope.scale;

                $scope.questionTextWrong[key] = new createjs.Text("", "18px Arial", "red");
                $scope.questionTextWrong[key].textBaseline = "alphabetic";
                $scope.questionTextWrong[key].x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.13);
                $scope.questionTextWrong[key].y = answerY;
                $scope.questionTextWrong[key].scaleX = $scope.questionTextWrong[key].scaleY = $scope.scale;
                $scope.questionTextWrong[key].height = answerHeight;
                $scope.questionTextWrong[key].textAlign = "center";
                $scope.questionTextWrong[key].visible = false;
                $scope.questionTextWrong[key].maxWidth = $scope.backgroundPosition.width / 5 / $scope.scale;

                var hit = new createjs.Shape();
                var bounds = $scope.answerText[key].getBounds();
                hit.graphics.beginFill("yellow").drawRect(bounds.x, bounds.y, bounds.width * 1.5, bounds.height * 1.5);
                $scope.answerText[key].hitArea = hit;
                $scope.stage.addChild($scope.answerText[key]);
                $scope.stage.addChild($scope.questionTextWrong[key]);

                answerY += answerHeight;

                $scope.answerText[key].on("mousedown", function (evt) {

                  if (!$scope.activityData.newGame) {
                    return;
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
                });

                /*DRAG AND DROP EVENT*/
                $scope.answerText[key].on("pressmove", function (evt) {
                  if (!$scope.activityData.newGame) {
                    console.log("newGame false");
                    return;
                  }

                  var local = $scope.stage.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                  this.x = local.x;
                  this.y = local.y;
                  $scope.stage.update();
                });


                $scope.answerText[key].on("pressup", function (evt) {
                  console.log("up");

                  if (!$scope.activityData.newGame) {
                    console.log("newGame false");
                    return;
                  }
                  var collisionDetectedQuestion = collision(evt.stageX + this.offset.x, evt.stageY + this.offset.y);

                  if (collisionDetectedQuestion !== -1) {

                    placeAnswer(key, collisionDetectedQuestion);

                  } else {
                    createjs.Tween.get(this, {loop: false})
                      .to({x: this.startingPointX, y: this.startingPointY}, 200, createjs.Ease.getPowIn(2));
                    $scope.stage.update()
                  }
                });

                waterfallCallback();

              });
            });


            async.waterfall(waterfallFunctions, function (callback) {
              console.log("Questions Inserted!");

              /********************************** BUTTONS ***********************************/

              async.parallel([function (callback) {
                /*RESTART BUTTON*/
                $http.get($scope.rootDir + "data/assets/lesson_restart_button_sprite.json")
                  .success(function (response) {
                    //Reassigning images with the rest of resource
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");

                    $scope.returnButton.addEventListener("mousedown", function (event) {
                      console.log("Mouse down event on return button !");
                      $scope.returnButton.gotoAndPlay("onSelection");
                      $scope.stage.update();
                    });

                    $scope.returnButton.addEventListener("pressup", function (event) {
                      console.log("Press up on return event!");
                      $scope.returnButton.gotoAndPlay("normal");
                      $scope.stage.update();
                      //action
                      restart();

                    });
                    $scope.returnButton.scaleX = $scope.returnButton.scaleY = $scope.scale;
                    $scope.returnButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 12);
                    $scope.returnButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.05);
                    $scope.stage.addChild($scope.returnButton);
                    callback();
                  })
                  .error(function (error) {
                    callback();
                    console.log("Error on getting json data for return button...", error);

                  });
              },

                function (initWaterfallCallback) {

                  $http.get($scope.rootDir + "data/assets/lesson_results_button_sprite.json")
                    .success(function (response) {
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");

                      $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = $scope.scale * 0.6;
                      $scope.resultsButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.13);
                      $scope.resultsButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.05);
                      $scope.stage.addChild($scope.resultsButton);

                      $scope.resultsButton.visible = false;

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
                  /*CHECK BUTTON*/
                  $http.get($scope.rootDir + "data/assets/lesson_check_button_sprite.json")
                    .success(function (response) {
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                      if ($scope.activityData.newGame) {
                        $scope.checkButton.alpha = 1;
                      } else {
                        $scope.checkButton.alpha = 0.5;
                      }
                      $scope.stage.update();

                      $scope.checkButton.addEventListener("mousedown", function (event) {
                        console.log("mousedown event on a button !");
                        if ($scope.activityData.newGame) {
                          $scope.checkButton.gotoAndPlay("onSelection");
                        }
                        $scope.stage.update();
                      });
                      $scope.checkButton.addEventListener("pressup", function (event) {
                        console.log("pressup event!");

                        if ($scope.activityData.newGame) {
                          $scope.checkButton.gotoAndPlay("normal");
                          $scope.stage.update();
                          check();
                        }
                      });
                      $scope.checkButton.scaleX = $scope.checkButton.scaleY = $scope.scale;
                      $scope.checkButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.5);
                      $scope.checkButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.055);
                      $scope.stage.addChild($scope.checkButton);
                      callback();
                    })
                    .error(function (error) {

                      console.log("Error on getting json data for check button...", error);
                      callback();
                    });
                }, function (callback) {
                  /*NEXT BUTTON*/
                  $http.get($scope.rootDir + "data/assets/lesson_next_button_sprite.json")
                    .success(function (response) {
                      response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                      var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                      $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                      $scope.nextButton.addEventListener("mousedown", function (event) {
                        console.log("mousedown event on a button !", $scope.activityData.newGame);
                        if (!$scope.activityData.newGame) {
                          $scope.nextButton.gotoAndPlay("onSelection");
                          $scope.stage.update();
                        }
                      });
                      $scope.nextButton.addEventListener("pressup", function (event) {
                        console.log("pressup event!");

                        if (!$scope.activityData.newGame) {
                          $scope.nextButton.gotoAndPlay("normal");
                          $scope.stage.update();
                          $rootScope.nextActivity($scope.selectedLesson, $scope.activityFolder);
                        }

                      });
                      $scope.nextButton.scaleX = $scope.nextButton.scaleY = $scope.scale;
                      $scope.nextButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.18);
                      $scope.nextButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.09);
                      $scope.stage.addChild($scope.nextButton);
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
            $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/draganddrop.json")
              .success(function (response) {
                console.log("Success on getting json for the url. The response object is: ", response);

                //Assigning configured response to activityData
                $scope.activityData = response;
                $scope.activityData.attempts = 0;
                $scope.activityData.newGame = true;

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


          /********************************** FUNCTIONS ***********************************/
          /*Function that restarts the exercise*/
          function restart() {

            _.each($scope.activityData.questions, function (question, key, value) {
              $scope.activityData.questions[key].userAnswer = "";
              $scope.activityData.questions[key].userAnswerLabel = "";
              $scope.questionText[key].text = userChoice;
              $scope.answerText[key].visible = true;
              $scope.questionText[key].color = "blue";
              $scope.questionTextWrong[key].text = "";
              $scope.questionTextWrong[key].visible = false;
              $scope.questionText[key].x = $scope.underlinedText[key].getTransformedBounds().x + $scope.underlinedText[key].getTransformedBounds().width / 2 - $scope.questionText[key].getTransformedBounds().width / 2;
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
            $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;
            $scope.activityData.newGame = true;

            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
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
            }
          };

          /*Function that calculates score*/
          function score() {

            console.log("$scope.activityData", $scope.activityData);

            var rightAnswers = 0;
            _.each($scope.activityData.questions, function (question, key, value) {
              if (question.userAnswer === question.answer) {

                if (!question.userAnswerLabel) {
                  $scope.activityData.questions[key].userAnswerLabel = question.answer;
                  $scope.questionText[key].color = "green";
                  rightAnswers++;
                } else if (question.userAnswerLabel !== question.answer) {
                  console.log("question.userAnswerLabel", _.findWhere($scope.activityData.answers, {
                    "answer": question.userAnswerLabel
                  }).text);
                  $scope.questionTextWrong[key].text = _.findWhere($scope.activityData.answers, {
                    "answer": question.userAnswerLabel
                  }).text;
                  $scope.questionTextWrong[key].visible = true;
                } else {
                  $scope.questionText[key].color = "green";
                  rightAnswers++;
                }

              } else if (question.userAnswer) {
                if (!question.userAnswerLabel) {
                  $scope.activityData.questions[key].userAnswerLabel = question.userAnswer;
                }
                placeAnswer(_.findIndex($scope.activityData.answers, {
                  "answer": question.answer
                }), key);
                console.log("question.userAnswer", _.findWhere($scope.activityData.answers, {
                  "answer": question.userAnswer
                }).text);
                $scope.questionTextWrong[key].text = _.findWhere($scope.activityData.answers, {
                  "answer": $scope.activityData.questions[key].userAnswerLabel
                }).text;
                $scope.questionTextWrong[key].visible = true;
              }

            });

            //Capitalize first letter
            _.each($scope.answerText, function (answer, key, value) {
              console.log("answer", answer.text);
              if (answer.capitalized) {
                _.each($scope.questionText, function (question, k, value) {
                  if (question.text === answer.text) {
                    $scope.questionText[k].text = $scope.answerText[key].text[0].toUpperCase() + $scope.answerText[key].text.substr(1);
                    console.log("Letter should be capitalized", $scope.answerText[key].text);
                  }
                });
              }
            });

            $scope.activityData.score = rightAnswers;
            $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
            $scope.activityData.completed = true;
            $scope.nextButton.gotoAndPlay("onSelection");

            if (_.findIndex($scope.selectedLesson.activitiesMenu, {
                activityFolder: $scope.activityFolder
              }) + 1 === $scope.selectedLesson.activitiesMenu.length) {

              $scope.resultsButton.visible = true;
              $scope.nextButton.visible = false;
              $scope.checkButton.alpha = 0.5;

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

          function placeAnswer(answerKey, questionKey) {
            $scope.answerText[answerKey].visible = false;
            $scope.questionText[questionKey].text = $scope.activityData.answers[answerKey].text;
            $scope.activityData.questions[questionKey].userAnswer = $scope.activityData.answers[answerKey].answer;
            $scope.questionText[questionKey].color = "black";
            $scope.questionText[questionKey].x = $scope.underlinedText[questionKey].getTransformedBounds().x + $scope.underlinedText[questionKey].getTransformedBounds().width / 2 - $scope.questionText[questionKey].getTransformedBounds().width / 2;
            $scope.stage.update();
            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          }

          function collision(x, y) {
            for (var i = 0; i < $scope.activityData.questions.length; i++) {
              var bounds = $scope.questionText[i].getTransformedBounds();
              if (ionic.DomUtil.rectContains(x, y, bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height) && $scope.questionText[i].text === userChoice) {
                return i;
              }
            }
            return -1;
          }

        });//end of image on complete
      },
      1500
      )
      ;//end of timeout
  });

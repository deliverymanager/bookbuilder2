angular.module("bookbuilder2")
  .controller("DraganddropController", function (TypicalFunctions, $scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("Draganddrop loaded!");

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
        _.each(["drag", "drop", "check"], function (sound, key, list) {
          if (ionic.Platform.isIOS() && window.cordova) {
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

      var userChoice = " _________________________________ ";

      /****************************** Image Loader ******************************/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/background_image_for_draganddrop_blue.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/background_image_for_draganddrop_blue.png");
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

        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();

        $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              menuButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              menuButton.gotoAndPlay("normal");
              $scope.stage.update();
              _.each($scope.sounds, function (sound, key, list) {
                $scope.sounds[key].stop();
                $scope.sounds[key].release();
              });

              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });

              $ionicHistory.clearCache();
              createjs.Tween.removeAllTweens();
              $scope.stage.removeAllEventListeners();
              $scope.stage.removeAllChildren();
              $state.go("lesson", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;
            $scope.stage.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        var init = function () {

          var descriptionText = new createjs.Text($scope.activityData.description, "17px Arial", "white");
          descriptionText.scaleX = descriptionText.scaleY = scale;
          descriptionText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
          descriptionText.y = backgroundPosition.y + (backgroundPosition.height / 9.6);
          descriptionText.textBaseline = "alphabetic";
          $scope.stage.addChild(descriptionText);

          $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "27px Arial", "white");
          $scope.scoreText.scaleX = $scope.scoreText.scaleY = scale;
          $scope.scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
          $scope.scoreText.y = backgroundPosition.y + (backgroundPosition.height / 17);
          $scope.scoreText.textBaseline = "alphabetic";
          $scope.activityData.score = 0;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          $scope.stage.addChild($scope.scoreText);

          $scope.questionText = {};
          $scope.underlinedText = {};
          $scope.answerText = {};
          var waterfallFunctions = [];
          var questionHeight = 530 * scale / $scope.activityData.questions.length;
          var questionY = backgroundPosition.y + (backgroundPosition.height / 5);

          _.each($scope.activityData.questions, function (question, key, list) {

            waterfallFunctions.push(function (waterfallCallback) {

              var pretexts = question.pretext.split("\n");
              var currentPretexts = {};
              var yPreText = questionHeight / 3;
              _.each(pretexts, function (text, l, li) {
                if (!text) {
                  text = " ";
                }
                currentPretexts[l] = new createjs.Text(text, "23px Arial", "blue");
                currentPretexts[l].scaleX = currentPretexts[l].scaleY = scale;
                currentPretexts[l].x = backgroundPosition.x + (backgroundPosition.width / 40);
                currentPretexts[l].y = questionY + yPreText * l;
                currentPretexts[l].textBaseline = "alphabetic";
                currentPretexts[l].lineHeight = 30;
                $scope.stage.addChild(currentPretexts[l]);
              });

              $scope.questionText[key] = new createjs.Text(userChoice, "23px Arial", "blue");
              $scope.questionText[key].scaleX = $scope.questionText[key].scaleY = scale;
              $scope.questionText[key].x = currentPretexts[pretexts.length - 1].getTransformedBounds().x + currentPretexts[pretexts.length - 1].getTransformedBounds().width;
              $scope.questionText[key].y = currentPretexts[pretexts.length - 1].getTransformedBounds().y + currentPretexts[pretexts.length - 1].getTransformedBounds().height / 1.3;

              $scope.questionText[key].startingPointX = $scope.questionText[key].x;
              $scope.questionText[key].startingPointY = $scope.questionText[key].y;


              $scope.questionText[key].textBaseline = "alphabetic";
              $scope.questionText[key].lineHeight = 30;
              $scope.questionText[key].maxWidth = $scope.questionText[key].getTransformedBounds().width;


              $scope.underlinedText[key] = $scope.questionText[key].clone();

              $scope.stage.addChild($scope.underlinedText[key]);
              $scope.stage.addChild($scope.questionText[key]);


              if (question.postext) {

                var postexts = question.postext.split("\n");
                console.log("postexts", postexts.length);
                var currentPostexts = {};

                if (postexts.length > 1) {
                  if (!postexts[0]) {
                    postexts[0] = " ";
                  }
                  currentPostexts[0] = new createjs.Text(postexts[0], "23px Arial", "blue");
                  currentPostexts[0].scaleX = currentPostexts[0].scaleY = scale;
                  currentPostexts[0].x = $scope.questionText[key].getTransformedBounds().x + $scope.questionText[key].getTransformedBounds().width;
                  currentPostexts[0].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3;
                  currentPostexts[0].textBaseline = "alphabetic";
                  $scope.stage.addChild(currentPostexts[0]);

                  currentPostexts[1] = new createjs.Text(postexts[1], "23px Arial", "blue");
                  currentPostexts[1].scaleX = currentPostexts[1].scaleY = scale;
                  currentPostexts[1].x = backgroundPosition.x + (backgroundPosition.width / 40);
                  currentPostexts[1].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3 * 2.5;
                  currentPostexts[1].textBaseline = "alphabetic";
                  $scope.stage.addChild(currentPostexts[1]);
                } else {

                  currentPostexts[0] = new createjs.Text(postexts[0], "23px Arial", "blue");
                  currentPostexts[0].scaleX = currentPostexts[0].scaleY = scale;
                  currentPostexts[0].x = $scope.questionText[key].getTransformedBounds().x + $scope.questionText[key].getTransformedBounds().width;
                  currentPostexts[0].y = $scope.questionText[key].getTransformedBounds().y + $scope.questionText[key].getTransformedBounds().height / 1.3;
                  currentPostexts[0].textBaseline = "alphabetic";
                  $scope.stage.addChild(currentPostexts[0]);
                }
              }

              questionY += questionHeight;

              var hit = new createjs.Shape();
              var bounds = $scope.questionText[key].getBounds();
              hit.graphics.beginFill("yellow").drawRect(bounds.x, bounds.y, bounds.width * 1.5, bounds.height * 1.5);
              $scope.questionText[key].hitArea = hit;


              $scope.questionText[key].on("mousedown", function (evt) {

                if ($scope.activityData.completed) {
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
              });

              /*DRAG AND DROP EVENT*/
              $scope.questionText[key].on("pressmove", function (evt) {

                if ($scope.activityData.completed) {
                  return;
                }

                if ($scope.questionText[key].text === userChoice) {
                  return;
                }

                var local = $scope.stage.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                this.x = local.x;
                this.y = local.y;
                $scope.stage.update();
              });


              $scope.questionText[key].on("pressup", function (evt) {
                console.log("up");

                if ($scope.activityData.completed) {
                  return;
                }

                if (window.cordova && window.cordova.platformId !== "browser") {
                  $scope.sounds["drop"].play();
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
          var answerY = backgroundPosition.y + (backgroundPosition.height / 5);
          var answerHeight = 530 * scale / $scope.activityData.answers.length;

          _.each($scope.activityData.answers, function (answer, key, list) {
            //Filling the waterfall
            answerWaterfallFunctions.push(function (waterfallCallback) {

              $scope.answerText[key] = new createjs.Text(answer.text, "18px Arial", "blue");
              $scope.answerText[key].textBaseline = "alphabetic";
              $scope.answerText[key].x = backgroundPosition.x + (backgroundPosition.width / 1.13);
              $scope.answerText[key].y = answerY;

              $scope.answerText[key].startingPointX = $scope.answerText[key].x;
              $scope.answerText[key].startingPointY = $scope.answerText[key].y;

              $scope.answerText[key].scaleX = $scope.answerText[key].scaleY = scale;
              $scope.answerText[key].height = answerHeight;
              $scope.answerText[key].textAlign = "center";

              var hit = new createjs.Shape();
              var bounds = $scope.answerText[key].getBounds();
              hit.graphics.beginFill("yellow").drawRect(bounds.x, bounds.y, bounds.width * 1.5, bounds.height * 1.5);
              $scope.answerText[key].hitArea = hit;
              $scope.stage.addChild($scope.answerText[key]);

              answerY += answerHeight;

              $scope.answerText[key].on("mousedown", function (evt) {

                if ($scope.activityData.completed) {
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
              });

              /*DRAG AND DROP EVENT*/
              $scope.answerText[key].on("pressmove", function (evt) {
                if ($scope.activityData.completed) {
                  return;
                }

                var local = $scope.stage.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                this.x = local.x;
                this.y = local.y;
                $scope.stage.update();
              });


              $scope.answerText[key].on("pressup", function (evt) {
                console.log("up");

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
              });

              waterfallCallback();

            });
          });


          async.waterfall(waterfallFunctions, function (callback) {
            console.log("Questions Inserted!");

            /* ------------------------------------------ Lesson Title ---------------------------------------------- */

            var lessonTitle = new createjs.Text($rootScope.selectedLesson.lessonTitle, "27px Arial", "yellow");

            /*background.scaleX = background.scaleY = scale;*/
            lessonTitle.scaleX = lessonTitle.scaleY = scale;
            lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 27);
            lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 1.04);
            lessonTitle.textBaseline = "alphabetic";
            $scope.stage.addChild(lessonTitle);


            /********************************** BUTTONS ***********************************/

            async.parallel([function (callback) {
              /*RESTART BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/lesson_restart_button_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");

                  returnButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on return button !");
                    returnButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });

                  returnButton.addEventListener("pressup", function (event) {
                    console.log("Press up on return event!");
                    returnButton.gotoAndPlay("normal");
                    $scope.stage.update();
                    //action
                    restart();

                  });
                  returnButton.scaleX = returnButton.scaleY = scale;
                  returnButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                  returnButton.y = backgroundPosition.y + (backgroundPosition.height / 1.055);
                  $scope.stage.addChild(returnButton);
                  callback();
                })
                .error(function (error) {
                  callback();
                  console.log("Error on getting json data for return button...", error);

                });
            }, function (callback) {
              /*CHECK BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/lesson_check_button_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  if (!$scope.activityData.completed) {
                    $scope.checkButton.alpha = 1;
                  } else {
                    $scope.checkButton.alpha = 0.5;
                  }
                  $scope.stage.update();

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
                      $scope.stage.update();
                      check();
                    }
                  });
                  $scope.checkButton.scaleX = $scope.checkButton.scaleY = scale;
                  $scope.checkButton.x = backgroundPosition.x + (backgroundPosition.width / 1.5);
                  $scope.checkButton.y = backgroundPosition.y + (backgroundPosition.height / 1.055);
                  $scope.stage.addChild($scope.checkButton);
                  callback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  callback();
                });
            }, function (callback) {
              /*NEXT BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/lesson_next_button_sprite.json")
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
                      $scope.stage.update();
                      TypicalFunctions.nextActivity();
                    }

                  });
                  $scope.nextButton.scaleX = $scope.nextButton.scaleY = scale;
                  $scope.nextButton.x = backgroundPosition.x + (backgroundPosition.width / 1.18);
                  $scope.nextButton.y = backgroundPosition.y + (backgroundPosition.height / 1.085);
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
          $scope.stage.update();
        };

        /* ------------------------------------------ TITLE ---------------------------------------------- */

        var title = new createjs.Text($rootScope.activityName, "27px Arial", "white");

        /*background.scaleX = background.scaleY = scale;*/
        title.scaleX = title.scaleY = scale;
        title.x = backgroundPosition.x + (backgroundPosition.width / 10);
        title.y = backgroundPosition.y + (backgroundPosition.height / 15);
        title.textBaseline = "alphabetic";
        $scope.stage.addChild(title);


        /********************************** FUNCTIONS ***********************************/
        /*Function that restarts the exercise*/
        function restart() {
          $scope.nextButton.alpha = 0.5;
          $scope.nextButton.gotoAndPlay("normal");

          $scope.checkButton.alpha = 1;
          $scope.checkButton.gotoAndPlay("normal");
          $scope.stage.update();

          $scope.activityData.completed = false;
          $scope.activityData.attempts += +1;

          _.each($scope.activityData.questions, function (question, key, value) {
            $scope.activityData.questions[key].userAnswer = "";
            $scope.activityData.questions[key].userAnswerLabel = "";
            $scope.questionText[key].text = userChoice;
            $scope.answerText[key].visible = true;
            createjs.Tween.get($scope.answerText[key], {loop: false})
              .to({
                x: $scope.answerText[key].startingPointX,
                y: $scope.answerText[key].startingPointY
              }, 200, createjs.Ease.getPowIn(2));

            $scope.questionText[key].color = "blue";
            $scope.questionText[key].x = $scope.underlinedText[key].getTransformedBounds().x + $scope.underlinedText[key].getTransformedBounds().width / 2 - $scope.questionText[key].getTransformedBounds().width / 2;
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
        };

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

          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

          $scope.activityData.score = rightAnswers;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

        }

        function placeAnswer(answerKey, questionKey) {

          console.log("answerKey", answerKey);
          console.log("questionKey", questionKey);

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
    }, 1500);//end of timeout
  });

angular.module("bookbuilder2")
  .controller("DraganddropWithPositionsController", function ($scope, $rootScope, $ionicPlatform, $timeout, $http, _, Toast) {

    console.log("DraganddropWithPositionsController loaded!");
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


    function start() {
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/" + $scope.activityData.background
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

          console.log("Image Loaded...");

          /*Creating Bitmap Background for Canvas*/
          $scope.background = new createjs.Bitmap($scope.rootDir + "data/assets/" + $scope.activityData.background);

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
          //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE $scope.background IMAGE


          $scope.background.scaleX = $scope.scale;
          $scope.background.scaleY = $scope.scale;
          $scope.background.regX = $scope.background.image.width / 2;
          $scope.background.regY = $scope.background.image.height / 2;
          $scope.background.x = $scope.stage.canvas.width / 2;
          $scope.background.y = $scope.stage.canvas.height / 2;
          $scope.stage.addChild($scope.background);
          $scope.backgroundPosition = $scope.background.getTransformedBounds();
          console.log("$scope.backgroundPosition: ", $scope.backgroundPosition);

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
          $scope.mainContainer.addChild($scope.questionsContainer);

          async.parallel([

              function (callback) {

                var waterFallFunctions = [];
                var questionGroups = _.groupBy($scope.activityData.questions, function (question) {
                  return question.slide;
                });

                _.each(questionGroups, function (group, key, list) {

                  waterFallFunctions.push(function (waterFallCallback) {

                    var slide = new createjs.ImageLoader(new createjs.LoadItem().set({
                      src: $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/" + key + ".png"
                    }));
                    slide.load();
                    slide.on("complete", function (r) {

                      waterFallCallback();

                    });
                  });
                });

                async.waterfall(waterFallFunctions, function (err, response) {
                  callback();
                });

              }, function (callback) {

                var answerImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/" + $scope.activityData.answer_holder
                }));
                answerImageLoader.load();
                answerImageLoader.on("complete", function (r) {
                  callback();
                });

              }, function (callback) {

                var questionImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/" + $scope.activityData.question_holder
                }));
                questionImageLoader.load();
                questionImageLoader.on("complete", function (r) {
                  callback();
                });

              },

              function (initWaterfallCallback) {

                $http.get($scope.rootDir + "data/assets/lesson_end_button_sprite.json")
                  .success(function (response) {
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                    $scope.resultsButton.x = $scope.activityData.resultsPositionX ? $scope.activityData.resultsPositionX : 665;
                    $scope.resultsButton.y = $scope.activityData.resultsPositionY ? $scope.activityData.resultsPositionY : 630;
                    $scope.resultsButton.scaleX = $scope.resultsButton.scaleY = 0.6;
                    $scope.mainContainer.addChild($scope.resultsButton);

                    $scope.endText = new createjs.Text("RESULTS", "25px Arial", "white");
                    $scope.endText.x = $scope.activityData.resultsPositionX ? $scope.activityData.resultsPositionX + 35 : 700;
                    $scope.endText.y = $scope.activityData.resultsPositionY ? $scope.activityData.resultsPositionY - 10 : 620;
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

                var nextSlideButton = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $scope.rootDir + "data/assets/drag_and_drop_next_button.png"
                }));
                nextSlideButton.load();
                nextSlideButton.on("complete", function (r) {

                  $scope.nextButtonContainer = new createjs.Container();
                  $scope.nextButtonContainer.x = $scope.activityData.nextSlideX;
                  $scope.nextButtonContainer.y = $scope.activityData.nextSlideY;

                  var button = new createjs.Bitmap($scope.rootDir + "data/assets/drag_and_drop_next_button.png");
                  $scope.nextButtonText = new createjs.Text("Next", "20px Arial", "white");
                  $scope.nextButtonText.textAlign = "center";
                  $scope.nextButtonText.x = 90;
                  $scope.nextButtonText.y = 17;
                  $scope.nextButtonContainer.addChild(button);
                  $scope.nextButtonContainer.addChild($scope.nextButtonText);
                  $scope.nextButtonContainer.visible = false;
                  $scope.mainContainer.addChild($scope.nextButtonContainer);

                  var questionGroups = _.groupBy($scope.activityData.questions, function (question) {
                    return question.slide;
                  });

                  if (_.allKeys(questionGroups).length > 1) {
                    $scope.nextButtonContainer.visible = true;
                  }

                  /*Mouse down event*/
                  $scope.nextButtonContainer.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on restart button!");
                    $scope.nextButtonContainer.alpha = 0.5;
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.nextButtonContainer.addEventListener("pressup", function (event) {
                    console.log("Press up event on restart button!");
                    $scope.nextButtonContainer.alpha = 1;
                    $scope.stage.update();

                    if (_.allKeys(questionGroups)[0] === $scope.currentSlide) {
                      $scope.currentSlide = _.allKeys(questionGroups)[1];
                      $scope.nextButtonText.text = "Back";
                      loadSlide(function () {
                        _.each($scope.currentQuestions, function (question, key, value) {

                          if ($scope.activityData.newGame) {
                            if (question.userAnswer) {
                              console.log("question.userAnswer", question.userAnswer);
                              placeAnswer(_.findIndex($scope.currentAnswers, {
                                "answer": question.userAnswer
                              }), key);
                            }
                          } else {
                            placeAnswer(_.findIndex($scope.currentAnswers, {
                              "answer": question.answer
                            }), key);
                          }
                        });
                        if (!$scope.activityData.newGame) {
                          $timeout(function () {
                            score();
                          });
                        }
                      });

                    } else {

                      $scope.nextButtonText.text = "Next";
                      $scope.currentSlide = _.allKeys(questionGroups)[0];
                      loadSlide(function () {
                        _.each($scope.currentQuestions, function (question, key, value) {

                          if ($scope.activityData.newGame) {
                            if (question.userAnswer) {
                              console.log("question.userAnswer", question.userAnswer);
                              placeAnswer(_.findIndex($scope.currentAnswers, {
                                "answer": question.userAnswer
                              }), key);
                            }
                          } else {
                            placeAnswer(_.findIndex($scope.currentAnswers, {
                              "answer": question.answer
                            }), key);
                          }
                        });
                        if (!$scope.activityData.newGame) {
                          $timeout(function () {
                            score();
                          });
                        }
                      });
                    }

                  });
                  callback();
                });

              }, function (callback) {
                /*RESTART BUTTON*/
                $http.get($scope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                  .success(function (response) {
                    //Reassigning images with the rest of resource
                    response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                    var restartButtonSpriteSheet = new createjs.SpriteSheet(response);
                    $scope.restartButton = new createjs.Sprite(restartButtonSpriteSheet, "normal");

                    /*Press up event*/
                    $scope.restartButton.addEventListener("pressup", function (event) {
                      restart();
                    });

                    $scope.restartButton.x = $scope.activityData.checkButtonOnMainBackgroundPositionX + 220;
                    $scope.restartButton.y = $scope.activityData.checkButtonOnMainBackgroundPositionY + 15;
                    $scope.mainContainer.addChild($scope.restartButton);
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
                      $scope.checkButton.alpha = 1;
                    } else {
                      $scope.checkButton.alpha = 0.5;
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

                    $scope.checkButton.x = $scope.activityData.checkButtonOnMainBackgroundPositionX;
                    $scope.checkButton.y = $scope.activityData.checkButtonOnMainBackgroundPositionY;
                    $scope.mainContainer.addChild($scope.checkButton);
                    callback();
                  })
                  .error(function (error) {

                    console.log("Error on getting json data for check button...", error);
                    callback();
                  });
              }, function (callback) {

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

                    console.log("$scope.activityData.nextActivityButtonOnMainBackgroundPositionX", $scope.activityData);
                    console.log("X", $scope.activityData.nextActivityButtonOnMainBackgroundPositionX);
                    console.log("Y", $scope.activityData.nextActivityButtonOnMainBackgroundPositionY);
                    $scope.nextButton.x = $scope.activityData.nextActivityButtonOnMainBackgroundPositionX;
                    $scope.nextButton.y = $scope.activityData.nextActivityButtonOnMainBackgroundPositionY;
                    $scope.mainContainer.addChild($scope.nextButton);
                    $scope.stage.update();
                    callback();
                  })
                  .error(function (error) {

                    console.log("Error on getting json data for check button...", error);
                    callback();
                  });
              }, function (parallelCallback) {
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
                    menuButton.y = -menuButton.getTransformedBounds().height / 3;
                    $scope.stage.addChild(menuButton);
                    parallelCallback();
                  })
                  .error(function (error) {
                    console.error("Error on getting json for results button...", error);
                    parallelCallback();
                  });//end of get menu button
              }
            ],
            function (err, result) {
              init();
            });
        }
      );//end of image on complete
    };

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

      if (window.localStorage.getItem(activityNameInLocalStorage)) {

        $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
        start();

      } else {

        $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/draganddropWithPositions.json")
          .success(function (response) {
            $scope.activityData = response;
            $scope.activityData.attempts = 0;
            $scope.activityData.newGame = true;

            _.each($scope.activityData.questions, function (question, key, value) {
              $scope.activityData.questions[key].userAnswer = "";
            });
            start();
            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          })
          .error(function (error) {
            console.log("Error on getting json for the url...:", error);
          });
      }
    }, 1500);//end of timeout

    function shuffleAnswers() {
      _.each(_.shuffle(JSON.parse(JSON.stringify($scope.currentAnswers))), function (answer, key, list) {
        $scope.currentAnswers[key].xPosition = answer.xPosition;
        $scope.currentAnswers[key].yPosition = answer.yPosition;
      });
    };

    function loadSlide(generalCallback) {

      console.log("$scope.currentSlide", $scope.currentSlide);

      $scope.questionsContainer.removeAllChildren();
      $scope.currentQuestions = _.filter($scope.activityData.questions, {
        slide: $scope.currentSlide
      });

      $scope.unShuffledAnswers = JSON.parse(JSON.stringify(_.filter($scope.activityData.answers, {
        slide: $scope.currentSlide
      })));
      $scope.currentAnswers = JSON.parse(JSON.stringify(_.filter($scope.activityData.answers, {
        slide: $scope.currentSlide
      })));
      shuffleAnswers();

      console.log("$scope.unShuffledAnswers", $scope.unShuffledAnswers);
      console.log("$scope.currentAnswers", $scope.currentAnswers);

      /********************* QUESTIONS *********************/
      var waterfallFunctions = [];

      $scope.questionRowContainers = {};
      $scope.questionImages = {};
      $scope.currentPretexts = {};
      var slide = new createjs.Bitmap($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/" + $scope.activityFolder + "/" + $scope.currentSlide + ".png");

      $scope.questionsContainer.width = slide.image.width;
      $scope.questionsContainer.height = slide.image.height;
      $scope.questionsContainer.x = $scope.activityData.slidePositionX;
      $scope.questionsContainer.y = $scope.activityData.slidePositionY;
      $scope.questionsContainer.addChild(slide);

      _.each($scope.currentQuestions, function (question, key, list) {

        waterfallFunctions.push(function (waterfallCallback) {

          $scope.questionImages[key] = new createjs.Bitmap($scope.rootDir + "data/assets/" + $scope.activityData.answer_holder);

          $scope.questionRowContainers[key] = new createjs.Container();
          $scope.questionRowContainers[key].height = $scope.questionImages[key].image.height;
          $scope.questionRowContainers[key].width = $scope.questionImages[key].image.width;
          $scope.questionRowContainers[key].x = question.xPosition;
          $scope.questionRowContainers[key].y = question.yPosition;
          $scope.questionRowContainers[key].startingPointX = $scope.questionRowContainers[key].x;
          $scope.questionRowContainers[key].startingPointY = $scope.questionRowContainers[key].y;
          $scope.questionsContainer.addChild($scope.questionRowContainers[key]);
          $scope.questionRowContainers[key].addChild($scope.questionImages[key]);

          waterfallCallback();
        });
      });//end of each on activityData.questions

      /********************* ANSWERS *********************/
      _.each($scope.answerRowContainers, function (row, key, list) {
        $scope.mainContainer.removeChildAt($scope.mainContainer.getChildIndex($scope.answerRowContainers[key]));
      });

      _.each($scope.questionTextWrong, function (row, key, list) {
        $scope.mainContainer.removeChildAt($scope.mainContainer.getChildIndex($scope.questionTextWrong[key]));
      });

      $scope.questionTextWrong = {};
      $scope.answerRowContainers = {};
      $scope.answerPieces = {};

      _.each($scope.currentAnswers, function (answer, key, list) {

        console.log("answer.text", answer.text);
        waterfallFunctions.push(function (waterfallCallback) {

          $scope.answerPieces[key] = new createjs.Bitmap($scope.rootDir + "data/assets/" + $scope.activityData.answer_holder);
          $scope.answerRowContainers[key] = new createjs.Container();
          $scope.answerRowContainers[key].width = $scope.answerPieces[key].image.width;
          $scope.answerRowContainers[key].height = $scope.answerPieces[key].image.height;
          $scope.answerRowContainers[key].x = answer.xPosition;
          $scope.answerRowContainers[key].y = answer.yPosition;
          $scope.answerRowContainers[key].startingPointX = $scope.answerRowContainers[key].x;
          $scope.answerRowContainers[key].startingPointY = $scope.answerRowContainers[key].y;
          $scope.mainContainer.addChild($scope.answerRowContainers[key]);
          $scope.answerRowContainers[key].addChild($scope.answerPieces[key]);

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

            //Here I make the userAnswer null
            _.each($scope.currentQuestions, function (question, k, list) {
              if (parseInt($scope.currentQuestions[k].userAnswer) === key + 1) {
                $scope.currentQuestions[k].userAnswer = "";
              }
            });

          });
          $scope.answerRowContainers[key].on("pressmove", function (evt) {
            if (!$scope.activityData.newGame) {
              return;
            }
            var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
            this.x = local.x;
            this.y = local.y;
          });
          $scope.answerRowContainers[key].on("pressup", function (evt) {
            console.log("Press up event while dropping the answer!");

            if (!$scope.activityData.newGame) {
              return;
            }
            var collisionDetectedQuestion = collision(evt.stageX / $scope.scale - $scope.mainContainer.x / $scope.scale, evt.stageY / $scope.scale - $scope.mainContainer.y / $scope.scale);

            if (collisionDetectedQuestion !== -1) {
              placeAnswer(key, collisionDetectedQuestion);
            } else {
              createjs.Tween.get(this, {loop: false})
                .to({x: this.startingPointX, y: this.startingPointY}, 200, createjs.Ease.getPowIn(2));
              $scope.stage.update()
            }
          });//end of press up event

          $scope.answerRowContainers[key].answerText = new createjs.Text(answer.text, "18px Arial", $scope.activityData.colorText ? $scope.activityData.colorText : "black");
          $scope.answerRowContainers[key].answerText.x = $scope.answerPieces[key].image.width / 2;
          $scope.answerRowContainers[key].answerText.y = $scope.answerPieces[key].image.height / 10;
          $scope.answerRowContainers[key].answerText.textAlign = "center";
          $scope.answerRowContainers[key].answerText.capitalized = answer.capitalized;
          $scope.answerRowContainers[key].answerText.maxWidth = 120;
          $scope.answerRowContainers[key].addChild($scope.answerRowContainers[key].answerText);


          //I need to change the question text wrong x and y so that they are the ones from the unShuffledAnswers
          console.log(key + ". " + answer.yPosition, $scope.unShuffledAnswers[key].yPosition);
          $scope.questionTextWrong[key] = new createjs.Text("", "18px Arial", "red");
          $scope.questionTextWrong[key].x = $scope.unShuffledAnswers[key].xPosition + $scope.answerRowContainers[key].answerText.x + 20;
          $scope.questionTextWrong[key].y = $scope.unShuffledAnswers[key].yPosition + $scope.answerRowContainers[key].answerText.y;
          $scope.questionTextWrong[key].textAlign = "center";
          $scope.questionTextWrong[key].visible = false;
          $scope.questionTextWrong[key].maxWidth = 120;
          $scope.mainContainer.addChild($scope.questionTextWrong[key]);

          waterfallCallback();

        });
      });

      async.waterfall(waterfallFunctions, function (callback) {
        generalCallback();
      });
    }

    function init() {

      /*Adding Score Text*/
      $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "28px Arial", "white");
      $scope.scoreText.x = $scope.activityData.scoreOnMainBackgroundPositionX;
      $scope.scoreText.y = $scope.activityData.scoreOnMainBackgroundPositionY;
      $scope.activityData.score = 0;
      window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      $scope.mainContainer.addChild($scope.scoreText);

      $scope.pageTitle = new createjs.Text($scope.selectedLesson.lessonTitle + " - " + $scope.selectedLesson.title, "18px Arial", "white");
      $scope.pageTitle.x = $scope.activityData.titlePositionX ? $scope.activityData.titlePositionX : 120;
      $scope.pageTitle.y = $scope.activityData.titlePositionY ? $scope.activityData.titlePositionY : 10;
      $scope.pageTitle.maxWidth = 300;
      $scope.mainContainer.addChild($scope.pageTitle);

      /*Adding page title and description $scope.activityData.title*/
      $scope.pageActivity = new createjs.Text(_.findWhere($scope.selectedLesson.activitiesMenu, {
          activityFolder: $scope.activityFolder
        }).name + " " + ($scope.activityData.revision ? "- " + $scope.activityData.revision : ""), "18px Arial", "white");
      $scope.pageActivity.x = $scope.activityData.descriptionPositionX ? $scope.activityData.descriptionPositionX : 85;
      $scope.pageActivity.y = $scope.activityData.descriptionPositionY ? $scope.activityData.descriptionPositionY : 610;
      $scope.pageActivity.maxWidth = 300;
      $scope.mainContainer.addChild($scope.pageActivity);

      /*Adding page title and description*/
      $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
      $scope.pageDescription.x = $scope.activityData.descriptionPositionX ? $scope.activityData.descriptionPositionX : 85;
      $scope.pageDescription.y = $scope.activityData.descriptionPositionY ? $scope.activityData.descriptionPositionY + 20 : 630;
      $scope.pageDescription.maxWidth = 300;
      $scope.mainContainer.addChild($scope.pageDescription);

      async.waterfall([function (callback) {

        $scope.currentSlide = "slide_1";
        loadSlide(callback);

      }], function (err, response) {

        _.each($scope.currentQuestions, function (question, key, value) {
          console.log(key + " User Answer", question.userAnswer);
          if (question.userAnswer) {
            placeAnswer(_.findIndex($scope.currentAnswers, {
              "answer": question.userAnswer
            }), key);
          }
        });

        if (!$scope.activityData.newGame) {
          $timeout(function () {
            score();
          });
        }

      });
    }


    /*Function that restarts the exercise*/
    function restart() {

      console.log("$scope.currentQuestions", $scope.currentQuestions);
      console.log("$scope.currentAnswers", $scope.currentAnswers);

      _.each($scope.activityData.questions, function (question, key, value) {
        $scope.activityData.questions[key].userAnswer = "";
      });

      $scope.nextButton.gotoAndPlay("normal");
      $scope.checkButton.alpha = 1;
      $scope.checkButton.gotoAndPlay("normal");
      $scope.activityData.score = 0;
      $scope.resultsButton.visible = false;
      $scope.endText.visible = false;
      $scope.checkButton.visible = true;
      $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;
      $scope.activityData.newGame = true;

      $scope.stage.removeAllEventListeners();
      $scope.stage.removeAllChildren();
      start();
      saveCurrentActivity();

    }

    /*Placing answers on right question gaps*/
    function placeAnswersOnRightQuestions() {

      _.each($scope.currentQuestions, function (question, key, list) {

        var rightAnswerIndex = _.findIndex($scope.currentAnswers, {
          "answer": question.answer
        });

        createjs.Tween.get($scope.answerRowContainers[rightAnswerIndex], {loop: false})
          .to({
            x: ($scope.questionRowContainers[key].x + $scope.questionsContainer.x),
            y: ($scope.questionRowContainers[key].y + $scope.questionsContainer.y)
          }, 200, createjs.Ease.getPowIn(2));

        $scope.stage.update()
      });

    }

    function saveCurrentActivity() {

      _.each($scope.currentQuestions, function (question, key, list) {
        if (question.userAnswer) {
          $scope.activityData.questions[_.findIndex($scope.activityData.questions, {
            "answer": question.answer
          })].userAnswer = question.userAnswer;
        }
      });
      window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

    }

    /*Function that checks the exercise*/
    function score() {

      $scope.nextButton.gotoAndPlay("onSelection");

      placeAnswersOnRightQuestions();

      var rightAnswers = 0;
      _.each($scope.activityData.questions, function (question, key, value) {
        if (question.userAnswer === question.answer) {
          rightAnswers++;
        }
      });

      _.each($scope.currentQuestions, function (question, key, value) {
        if (question.userAnswer !== question.answer) {

          if (question.userAnswer) {
            console.log("key", key);
            console.log("question.userAnswer", question.userAnswer);
            console.log("$scope.questionTextWrong", $scope.questionTextWrong);
            console.log("$scope.questionTextWrong[key]", $scope.questionTextWrong[key]);
            $scope.questionTextWrong[key].text = (key + 1) + ". " + _.findWhere($scope.currentAnswers, {
                "answer": question.userAnswer
              }).text;

            $scope.questionTextWrong[key].visible = true;
          }

        } else {
          if (question.userAnswer) {
            $scope.answerRowContainers[_.findIndex($scope.currentAnswers, {
              "answer": question.userAnswer
            })].answerText.color = "green";
          }

        }
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

    /*Function for placing answer when there is collision*/
    function placeAnswer(answerKey, questionKey) {

      console.log(answerKey, questionKey);
      console.log($scope.currentQuestions[questionKey]);
      /*There is no answer*/
      if ($scope.activityData.newGame && !$scope.currentQuestions[questionKey].userAnswer) {
        $scope.currentQuestions[questionKey].userAnswer = $scope.currentAnswers[answerKey].answer;
      }

      createjs.Tween.get($scope.answerRowContainers[answerKey], {loop: false})
        .to({
          x: $scope.questionRowContainers[questionKey].x + $scope.questionsContainer.x,
          y: $scope.questionRowContainers[questionKey].y + $scope.questionsContainer.y
        }, 200, createjs.Ease.getPowIn(2));

      saveCurrentActivity();
    }

    function collision(x, y) {

      for (var i = 0; i < $scope.currentQuestions.length; i++) {

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

  })
;

angular.module("bookbuilder2")
  .controller("DraganddropWidthPositionsController", function (TypicalFunctions, $scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("DraganddropWidthPositionsController loaded!");
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

        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          start();

        } else {

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/draganddropWidthPositions.json")
            .success(function (response) {
              $scope.activityData = response;
              $scope.activityData.attempts = 1;
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


        function start() {
          var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/" + $scope.activityData.background
          }));
          imageLoader.load();

          /*IMAGE LOADER COMPLETED*/
          imageLoader.on("complete", function (r) {

              console.log("Image Loaded...");

              /*Creating Bitmap Background for Canvas*/
              var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/" + $scope.activityData.background);

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
              $scope.mainContainer.addChild($scope.questionsContainer);

              //mainContainer Background
              /*var questionsContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.questionsContainer.width, $scope.questionsContainer.height);
               var questionsContainerBackground = new createjs.Shape(questionsContainerGraphic);
               questionsContainerBackground.alpha = 0.5;

               $scope.questionsContainer.addChild(questionsContainerBackground);*/


              async.parallel([

                  function (callback) {

                    var waterFallFunctions = [];
                    var questionGroups = _.groupBy($scope.activityData.questions, function (question) {
                      return question.slide;
                    });

                    _.each(questionGroups, function (group, key, list) {

                      waterFallFunctions.push(function (waterFallCallback) {

                        var slide = new createjs.ImageLoader(new createjs.LoadItem().set({
                          src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/" + key + ".png"
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
                      src: $rootScope.rootDir + "data/assets/" + $scope.activityData.answer_holder
                    }));
                    answerImageLoader.load();
                    answerImageLoader.on("complete", function (r) {
                      callback();
                    });

                  }, function (callback) {

                    var questionImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                      src: $rootScope.rootDir + "data/assets/" + $scope.activityData.question_holder
                    }));
                    questionImageLoader.load();
                    questionImageLoader.on("complete", function (r) {
                      callback();
                    });

                  }, function (callback) {

                    var nextSlideButton = new createjs.ImageLoader(new createjs.LoadItem().set({
                      src: $rootScope.rootDir + "data/assets/drag_and_drop_next_button.png"
                    }));
                    nextSlideButton.load();
                    nextSlideButton.on("complete", function (r) {

                      $scope.nextButtonContainer = new createjs.Container();
                      $scope.nextButtonContainer.x = $scope.activityData.nextSlideX;
                      $scope.nextButtonContainer.y = $scope.activityData.nextSlideY;

                      var button = new createjs.Bitmap($rootScope.rootDir + "data/assets/drag_and_drop_next_button.png");
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
                              console.log(key + " User Answer", question.userAnswer);
                              if (question.userAnswer) {
                                placeAnswer(_.findIndex($scope.currentAnswers, {
                                  "answer": question.userAnswer
                                }), key);
                              }
                            });
                            check();
                          });
                        } else {
                          $scope.nextButtonText.text = "Next";
                          $scope.currentSlide = _.allKeys(questionGroups)[0];
                          loadSlide(function () {
                            _.each($scope.currentQuestions, function (question, key, value) {
                              console.log(key + " User Answer", question.userAnswer);
                              if (question.userAnswer) {
                                placeAnswer(_.findIndex($scope.currentAnswers, {
                                  "answer": question.userAnswer
                                }), key);
                              }
                            });
                            check();
                          });
                        }
                      });
                      callback();
                    });

                  }, function (callback) {
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
                        $scope.nextButton.x = 810;
                        $scope.nextButton.y = 655;
                        $scope.mainContainer.addChild($scope.nextButton);
                        $scope.stage.update();
                        callback();
                      })
                      .error(function (error) {

                        console.log("Error on getting json data for check button...", error);
                        callback();
                      });
                  }, function (parallelCallback) {
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

                        menuButton.scaleX = menuButton.scaleY = $scope.scale;
                        menuButton.x = 0;
                        menuButton.y = -menuButton.getTransformedBounds().height / 5;
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
                }
              )
              ;

            }
          );//end of image on complete
        };
      },
      1500
    );//end of timeout

    function saveCurrentActivity() {

      _.each($scope.currentQuestions, function (question, key, list) {
        if (question.userAnswer) {
          $scope.activityData.questions[_.findIndex($scope.activityData.questions, {
            "answer": question.answer
          })].userAnswer = question.userAnser;
        }
      });

      console.log("saveCurrentActivity");
      window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

    }

    function loadSlide(generalCallback) {

      $scope.questionsContainer.removeAllChildren();
      $scope.currentQuestions = _.filter($scope.activityData.questions, {
        slide: $scope.currentSlide
      });
      $scope.currentAnswers = _.filter($scope.activityData.answers, {
        slide: $scope.currentSlide
      });

      /********************* QUESTIONS *********************/
      var waterfallFunctions = [];

      $scope.questionRowContainers = {};
      $scope.questionImages = {};
      $scope.currentPretexts = {};

      var slide = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/" + $scope.currentSlide + ".png");

      $scope.questionsContainer.width = slide.image.width;
      $scope.questionsContainer.height = slide.image.height;
      $scope.questionsContainer.x = $scope.activityData.slidePositionX;
      $scope.questionsContainer.y = $scope.activityData.slidePositionY;
      $scope.questionsContainer.addChild(slide);

      _.each($scope.currentQuestions, function (question, key, list) {

        waterfallFunctions.push(function (waterfallCallback) {

          $scope.questionImages[key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/" + $scope.activityData.answer_holder);

          $scope.questionRowContainers[key] = new createjs.Container();
          $scope.questionRowContainers[key].height = $scope.questionImages[key].image.height;
          $scope.questionRowContainers[key].width = $scope.questionImages[key].image.width;
          $scope.questionRowContainers[key].x = question.xPosition;
          $scope.questionRowContainers[key].y = question.yPosition;
          $scope.questionRowContainers[key].startingPointX = $scope.questionRowContainers[key].x;
          $scope.questionRowContainers[key].startingPointY = $scope.questionRowContainers[key].y;
          $scope.questionsContainer.addChild($scope.questionRowContainers[key]);

          /*var questionRowContainersGraphics = new createjs.Graphics().beginFill("black").drawRect(0, 0, $scope.questionRowContainers[key].width, $scope.questionRowContainers[key].height);
           var questionRowContainersBackground = new createjs.Shape(questionRowContainersGraphics);
           questionRowContainersBackground.alpha = 0.5;
           $scope.questionRowContainers[key].addChild(questionRowContainersBackground);*/
          $scope.questionRowContainers[key].addChild($scope.questionImages[key]);

          waterfallCallback();
        });
      });//end of each on activityData.questions

      /********************* ANSWERS *********************/
      _.each($scope.answerRowContainers, function (row, key, list) {
        $scope.mainContainer.removeChildAt($scope.mainContainer.getChildIndex($scope.answerRowContainers[key]));
      });

      $scope.answerRowContainers = {};
      $scope.answerPieces = {};

      _.each($scope.currentAnswers, function (answer, key, list) {

        waterfallFunctions.push(function (waterfallCallback) {

          $scope.answerPieces[key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/" + $scope.activityData.answer_holder);
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
            _.each($scope.currentQuestions, function (question, k, list) {
              if (parseInt($scope.currentQuestions[k].userAnswer) === key + 1) {
                $scope.currentQuestions[k].userAnswer = "";
              }
            });

            /*Updating the index making it the element with the greatest index so it will not covered by other element*/
            /* var restIndexes = 3;
             _.each($scope.answerRowContainers, function (childElement, ke, list) {
             if ($scope.mainContainer.getChildAt($scope.mainContainer.getChildIndex(childElement)).id === $scope.answerRowContainers[key].id) {
             $scope.mainContainer.setChildIndex($scope.answerRowContainers[key], $scope.mainContainer.numChildren - 1);
             } else {
             $scope.mainContainer.setChildIndex($scope.answerRowContainers[ke], restIndexes -= 1);
             }
             });*/
          });
          $scope.answerRowContainers[key].on("pressmove", function (evt) {
            if ($scope.activityData.completed) {
              return;
            }
            var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
            this.x = local.x;
            this.y = local.y;
          });
          $scope.answerRowContainers[key].on("pressup", function (evt) {
            console.log("Press up event while dropping the answer!");

            if ($scope.activityData.completed) {
              return;
            }
            if (window.cordova && window.cordova.platformId !== "browser") {
              $scope.sounds["drop"].play();
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

          $scope.answerRowContainers[key].answerText = new createjs.Text(answer.text, "20px Arial", "black");
          $scope.answerRowContainers[key].answerText.x = $scope.answerPieces[key].image.width / 2;
          $scope.answerRowContainers[key].answerText.y = $scope.answerPieces[key].image.height / 10;
          $scope.answerRowContainers[key].answerText.textAlign = "center";
          $scope.answerRowContainers[key].answerText.maxWidth = $scope.answerPieces[key].image.width;
          $scope.answerRowContainers[key].addChild($scope.answerRowContainers[key].answerText);

          waterfallCallback();
        });
      });

      async.waterfall(waterfallFunctions, function (callback) {
        generalCallback();
      });

    };


    function init() {
      /*Adding Score Text*/
      $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
      $scope.scoreText.x = 700;
      $scope.scoreText.y = 20;
      $scope.mainContainer.addChild($scope.scoreText);

      var description = new createjs.Text($scope.activityData.title + " - " + $scope.activityData.description, "25px Arial", "white");
      description.x = 100;
      description.y = 635;
      $scope.mainContainer.addChild(description);

      async.parallel([function (callback) {
        $scope.currentSlide = "slide_1";
        loadSlide(callback)
      }], function (err, response) {

        _.each($scope.currentQuestions, function (question, key, value) {
          console.log(key + " User Answer", question.userAnswer);
          if (question.userAnswer) {
            placeAnswer(_.findIndex($scope.currentAnswers, {
              "answer": question.userAnswer
            }), key);
          }
        });
        check();
      });

    };

    function completedActivity() {
      console.log("Completed Activity!");
      $scope.nextButton.alpha = 1;
      $scope.checkButton.alpha = 0.5;
      $scope.activityData.completed = true;
      window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
    }

    /*Function that restarts the exercise*/
    function restart() {
      $scope.nextButton.alpha = 0.5;
      $scope.nextButton.gotoAndPlay("normal");
      $scope.checkButton.alpha = 1;
      $scope.checkButton.gotoAndPlay("normal");
      $scope.activityData.completed = false;
      $scope.activityData.attempts += 1;


      _.each($scope.activityData.questions, function (question, key, value) {
        $scope.activityData.questions[key].userAnswer = "";
      });

      $scope.currentSlide = "slide_1";
      loadSlide(function () {
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        $scope.scoreText.text = "Score: 0 / " + $scope.activityData.questions.length;
      });
    }

    /*Function that checks the exercise*/
    function check() {
      if (_.findWhere($scope.activityData.questions, {
          "userAnswer": ""
        })) {
        console.log("Please fill all the gaps!");
        Toast.show("Please fill all the gaps!");
      } else {
        console.log("Score Checks");
        $scope.checkButton.visible = false;
        $scope.restartButton.visible = true;
        $scope.nextButton.alpha = 1;
        $scope.nextButton.gotoAndPlay("onSelection");

        var rightAnswers = 0;
        _.each($scope.activityData.questions, function (question, key, value) {
          if (question.userAnswer === question.answer) {
            if (question.slide === $scope.currentSlide) {
              $scope.answerRowContainers[_.findIndex($scope.currentAnswers, {
                "answer": question.userAnswer
              })].answerText.color = "blue";
            }
            rightAnswers++;
          } else {
            if (question.slide === $scope.currentSlide) {
              $scope.answerRowContainers[_.findIndex($scope.currentAnswers, {
                "answer": question.userAnswer
              })].answerText.color = "red";
            }
          }
          $scope.stage.update();
        });//End of each

        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
        $scope.stage.update();

        completedActivity();
      }
    }

    /*Function for placing answer when there is collision*/
    function placeAnswer(answerKey, questionKey) {

      console.log(answerKey, questionKey);
      /*There is no answer*/
      if ($scope.currentQuestions[questionKey].userAnswer === "") {
        $scope.currentQuestions[questionKey].userAnswer = $scope.currentAnswers[answerKey].answer;
        $scope.answerRowContainers[answerKey].x = ($scope.questionRowContainers[questionKey].x + $scope.questionsContainer.x);
        $scope.answerRowContainers[answerKey].y = ($scope.questionRowContainers[questionKey].y + $scope.questionsContainer.y);
        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
      } else {
        console.log($scope.answerRowContainers[answerKey].startingPointX, $scope.answerRowContainers[answerKey].startingPointY);
        createjs.Tween.get($scope.answerRowContainers[answerKey], {loop: false})
          .to({
            x: $scope.questionRowContainers[questionKey].startingPointX + $scope.questionsContainer.x,
            y: $scope.questionRowContainers[questionKey].startingPointY + $scope.questionsContainer.y
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
      console.log("Collision returns -1...");

      return -1;
    }

  })
;

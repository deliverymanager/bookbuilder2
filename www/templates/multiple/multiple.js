angular.module("bookbuilder2")
  .controller("MultipleController", function (TypicalFunctions, $scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

    console.log("MultipleController loaded!");
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
        src: $rootScope.rootDir + "data/assets/background_image_for_lesson_activities_blue.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/background_image_for_lesson_activities_blue.png");

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

        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();

        $scope.activeQuestionIndex = 0;
        var noChoice = " _________________ ";

        async.waterfall([function (callback) {

            console.log("Waterfall loading images");
            var loadingBitmaps = [];

            _.each(["multiple_choice_text_bubble.png", "lesson_yellow_line.png", "multiple_choice_choice_button_sprite.png", "yellow_line_big_bubble.png"], function (file, key, list) {

              loadingBitmaps.push(function (seriesCallback) {
                var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                  src: $rootScope.rootDir + "data/assets/" + file
                }));

                imageLoader.load();

                imageLoader.on("complete", function (r) {
                  console.log("file", file);
                  $timeout(function () {
                    seriesCallback();
                  });
                });
              });
            });

            async.series(loadingBitmaps, function (err, response) {
              callback();
            });
          }, function (callback) {
            console.log("Waterfall loading activityData");

            if (window.localStorage.getItem(activityNameInLocalStorage)) {
              $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
              console.log("$scope.activityData from local Storage: ", $scope.activityData);
              callback();
            } else {
              $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/multiple.json")
                .success(function (response) {
                  /*Adding the userAnswer attribute to response object before assigning it to $scope.activityData*/
                  _.each(response.questions, function (question, key, value) {
                    question.userAnswer = "";
                  });
                  $scope.activityData = response;
                  $scope.activityData.attempts = 1;
                  window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                  console.log("$scope.activityData from local file: ", $scope.activityData);
                  callback();
                })
                .error(function (error) {
                  console.log("Error on getting json for the url...:", error);
                  callback();
                });
            }
          }, function (callback) {

            $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "27px Arial", "white");
            $scope.scoreText.scaleX = $scope.scoreText.scaleY = scale;
            $scope.scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
            $scope.scoreText.y = backgroundPosition.y + (backgroundPosition.height / 17);
            $scope.scoreText.textBaseline = "alphabetic";
            $scope.stage.addChild($scope.scoreText);

            /*RESTART BUTTON*/
            $http.get($rootScope.rootDir + "data/assets/lesson_restart_button_sprite.json")
              .success(function (response) {
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");
                returnButton.addEventListener("mousedown", function (event) {
                  console.log("Mousedown event on Restart button!");
                  returnButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                returnButton.addEventListener("pressup", function (event) {
                  console.log("Pressup event on Restart button!");
                  returnButton.gotoAndPlay("normal");
                  $scope.stage.update();
                  restart();
                });
                returnButton.scaleX = returnButton.scaleY = scale;
                returnButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                returnButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);
                $scope.stage.addChild(returnButton);
                callback();
              })
              .error(function (error) {
                console.log("Error on getting json data for return button...", error);
                callback();
              });
          }, function (callback) {

            console.log("Waterfall loading next button");

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
                  if ($scope.activityData.completed) {
                    $scope.nextButton.gotoAndPlay("normal");
                    $scope.stage.update();
                    TypicalFunctions.nextActivity();
                  }
                });
                $scope.nextButton.scaleX = $scope.nextButton.scaleY = scale;
                $scope.nextButton.x = backgroundPosition.x + (backgroundPosition.width / 1.18);
                $scope.nextButton.y = backgroundPosition.y + (backgroundPosition.height / 1.10);
                $scope.stage.addChild($scope.nextButton);
                callback();
              })
              .error(function (error) {

                console.log("Error on getting json data for check button...", error);
                callback();
              });
          }, function (callback) {
            /*CHECK BUTTON*/
            console.log("Waterfall loading check button");

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
                    $scope.stage.update();
                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["check"].play();
                    }
                    check();
                  }
                });
                $scope.checkButton.scaleX = $scope.checkButton.scaleY = scale;
                $scope.checkButton.x = backgroundPosition.x + (backgroundPosition.width / 1.5);
                $scope.checkButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);
                $scope.stage.addChild($scope.checkButton);
                callback();
              })
              .error(function (error) {

                console.log("Error on getting json data for check button...", error);
                callback();
              });
          }, function (callback) {

            $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
              .success(function (response) {

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
                  $state.go("lesson", {}, {reload: true});
                });

                menuButton.scaleX = menuButton.scaleY = scale;
                menuButton.x = 0;
                menuButton.y = -menuButton.getTransformedBounds().height / 5;

                $scope.stage.addChild(menuButton);
                callback();
              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
                callback();
              });

          }, function (callback) {

            console.log("Waterfall loading title");

            var title = new createjs.Text($scope.activityData.title, "27px Arial", "white");
            title.scaleX = title.scaleY = scale;
            title.x = backgroundPosition.x + (backgroundPosition.width / 10);
            title.y = backgroundPosition.y + (backgroundPosition.height / 15);
            title.textBaseline = "alphabetic";
            $scope.stage.addChild(title);
            callback();

          }, function (callback) {

            console.log("Waterfall loading activity name");

            var lessonTitle = new createjs.Text($rootScope.activityName, "27px Arial", "yellow");
            lessonTitle.scaleX = lessonTitle.scaleY = scale;
            lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 11);
            lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 1.05);
            lessonTitle.textBaseline = "alphabetic";
            lessonTitle.textAlign = "center";
            $scope.stage.addChild(lessonTitle);
            callback();

          }, function (callback) {

            console.log("Waterfall loading descriotion");

            var descriptionText = new createjs.Text($scope.activityData.description, "18px Arial", "white");
            descriptionText.scaleX = descriptionText.scaleY = scale;
            descriptionText.x = backgroundPosition.x + (backgroundPosition.width / 1.4);
            descriptionText.y = backgroundPosition.y + (backgroundPosition.height / 8.7);
            descriptionText.textBaseline = "alphabetic";
            $scope.stage.addChild(descriptionText);
            callback();


          }, function (callback) {

            $scope.questionsContainer = new createjs.Container();
            $scope.questionsContainer.width = background.image.width / 1.1;
            $scope.questionsContainer.height = background.image.height / 3;
            $scope.questionsContainer.scaleX = $scope.questionsContainer.scaleY = scale;
            $scope.questionsContainer.x = backgroundPosition.x + (backgroundPosition.height / 22);
            $scope.questionsContainer.y = -1500;
            $scope.stage.addChild($scope.questionsContainer);

            var questionBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/multiple_choice_text_bubble.png");
            //questionBackground.regY = questionBackground.image.height / 2;
            //questionBackground.regX = questionBackground.image.width / 2;
            questionBackground.x = 40;
            $scope.questionsContainer.addChild(questionBackground);

            $scope.questionNumber = new createjs.Text("1", "33px Arial", "#69B8C7");
            $scope.questionNumber.regX = $scope.questionNumber.getBounds().width / 2;
            $scope.questionNumber.regY = $scope.questionNumber.getBounds().height / 2;
            $scope.questionNumber.x = $scope.questionsContainer.width / 12.5;
            $scope.questionNumber.y = $scope.questionsContainer.height / 7.5;
            $scope.questionsContainer.addChild($scope.questionNumber);

            $scope.questionsTextContainer = new createjs.Container();
            $scope.questionsTextContainer.x = $scope.questionsContainer.width / 7;
            $scope.questionsTextContainer.y = $scope.questionsContainer.height / 5;
            $scope.questionsTextContainer.regX = $scope.questionsTextContainer.width / 2;
            $scope.questionsTextContainer.regY = $scope.questionsTextContainer.height / 2;
            $scope.questionsTextContainer.width = $scope.questionsContainer.width / 1.4;
            $scope.questionsTextContainer.height = $scope.questionsContainer.height / 1.5;
            $scope.questionsContainer.addChild($scope.questionsTextContainer);

            callback();

          }, function (callback) {

            $scope.answersContainer = new createjs.Container();
            $scope.answersContainer.width = background.image.width / 1.1;
            $scope.answersContainer.height = background.image.height / 3.2;
            $scope.answersContainer.scaleX = $scope.answersContainer.scaleY = scale;
            $scope.answersContainer.x = backgroundPosition.x + (backgroundPosition.width / 22);
            $scope.answersContainer.y = +1500;
            $scope.stage.addChild($scope.answersContainer);
            $scope.buttonContainers = {};

            $scope.buttonContainers["aChoice"] = new createjs.Container();
            $scope.buttonContainers["aChoice"].width = $scope.answersContainer.width / 2;
            $scope.buttonContainers["aChoice"].height = $scope.answersContainer.height / 2;
            $scope.buttonContainers["aChoice"].x = 0;
            $scope.buttonContainers["aChoice"].y = 0;
            $scope.buttonContainers["aChoice"].visible = false;
            $scope.answersContainer.addChild($scope.buttonContainers["aChoice"]);

            $scope.buttonContainers["bChoice"] = new createjs.Container();
            $scope.buttonContainers["bChoice"].width = $scope.answersContainer.width / 2;
            $scope.buttonContainers["bChoice"].height = $scope.answersContainer.height / 2;
            $scope.buttonContainers["bChoice"].x = $scope.buttonContainers["bChoice"].width;
            $scope.buttonContainers["bChoice"].y = 0;
            $scope.buttonContainers["bChoice"].visible = false;
            $scope.answersContainer.addChild($scope.buttonContainers["bChoice"]);

            $scope.buttonContainers["cChoice"] = new createjs.Container();
            $scope.buttonContainers["cChoice"].width = $scope.answersContainer.width / 2;
            $scope.buttonContainers["cChoice"].height = $scope.answersContainer.height / 2;
            $scope.buttonContainers["cChoice"].x = 0;
            $scope.buttonContainers["cChoice"].y = $scope.buttonContainers["cChoice"].height;
            $scope.buttonContainers["cChoice"].visible = false;
            $scope.answersContainer.addChild($scope.buttonContainers["cChoice"]);

            $scope.buttonContainers["dChoice"] = new createjs.Container();
            $scope.buttonContainers["dChoice"].width = $scope.answersContainer.width / 2;
            $scope.buttonContainers["dChoice"].height = $scope.answersContainer.height / 2;
            $scope.buttonContainers["dChoice"].x = $scope.buttonContainers["dChoice"].width;
            $scope.buttonContainers["dChoice"].y = $scope.buttonContainers["dChoice"].height;
            $scope.buttonContainers["dChoice"].visible = false;
            $scope.answersContainer.addChild($scope.buttonContainers["dChoice"]);

            $scope.buttonContainers["onlyCChoice"] = new createjs.Container();
            $scope.buttonContainers["onlyCChoice"].width = $scope.answersContainer.width;
            $scope.buttonContainers["onlyCChoice"].height = $scope.answersContainer.height / 2;
            $scope.buttonContainers["onlyCChoice"].x = 0;
            $scope.buttonContainers["onlyCChoice"].y = $scope.buttonContainers["onlyCChoice"].height;
            $scope.buttonContainers["onlyCChoice"].visible = false;
            $scope.answersContainer.addChild($scope.buttonContainers["onlyCChoice"]);

            $http.get($rootScope.rootDir + "data/assets/multiple_choice_choice_button_sprite.json")
              .success(function (response) {

                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                var answerButtonSpriteSheet = new createjs.SpriteSheet(response);

                $scope.buttonChoices = {};
                $scope.buttonChoicesText = {};

                $scope.buttonChoices["aChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                $scope.buttonChoices["aChoice"].regX = $scope.buttonChoices["aChoice"].getBounds().width / 2;
                $scope.buttonChoices["aChoice"].regY = $scope.buttonChoices["aChoice"].getBounds().height / 2;
                $scope.buttonChoices["aChoice"].x = $scope.buttonContainers["aChoice"].width / 2;
                $scope.buttonChoices["aChoice"].y = $scope.buttonContainers["aChoice"].height / 2;
                $scope.buttonContainers["aChoice"].addChild($scope.buttonChoices["aChoice"]);

                var answerAButtonLetter = new createjs.Text("a.", "33px Arial", "#69B8C7");
                answerAButtonLetter.regX = answerAButtonLetter.getBounds().width / 2;
                answerAButtonLetter.regY = answerAButtonLetter.getBounds().height / 2;
                answerAButtonLetter.x = $scope.buttonContainers["aChoice"].width / 6.5;
                answerAButtonLetter.y = $scope.buttonContainers["aChoice"].height / 2.3;
                answerAButtonLetter.maxWidth = $scope.buttonContainers["aChoice"].width * 0.9;
                $scope.buttonContainers["aChoice"].addChild(answerAButtonLetter);

                $scope.buttonChoicesText["aChoice"] = new createjs.Text("Answer A", "25px Arial", "#69B8C7");
                $scope.buttonChoicesText["aChoice"].regY = $scope.buttonChoicesText["aChoice"].getBounds().height / 2;
                $scope.buttonChoicesText["aChoice"].x = $scope.buttonContainers["aChoice"].width / 2;
                $scope.buttonChoicesText["aChoice"].y = $scope.buttonContainers["aChoice"].height / 2.3;
                $scope.buttonChoicesText["aChoice"].textAlign = "center";
                $scope.buttonContainers["aChoice"].addChild($scope.buttonChoicesText["aChoice"]);


                $scope.buttonChoices["aChoice"].addEventListener("pressup", function (event) {
                  console.log("answerAButton fires pressup event!");
                  if (!$scope.activityData.completed) {
                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["select"].play();
                    }
                    selectChoice("aChoice");
                  }
                });


                $scope.buttonChoices["bChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                $scope.buttonChoices["bChoice"].regX = $scope.buttonChoices["bChoice"].getBounds().width / 2;
                $scope.buttonChoices["bChoice"].regY = $scope.buttonChoices["bChoice"].getBounds().height / 2;
                $scope.buttonChoices["bChoice"].x = $scope.buttonContainers["bChoice"].width / 2;
                $scope.buttonChoices["bChoice"].y = $scope.buttonContainers["bChoice"].height / 2;
                $scope.buttonContainers["bChoice"].addChild($scope.buttonChoices["bChoice"]);

                var answerBButtonLetter = new createjs.Text("b.", "33px Arial", "#69B8C7");
                answerBButtonLetter.regX = answerBButtonLetter.getBounds().width / 2;
                answerBButtonLetter.regY = answerBButtonLetter.getBounds().height / 2;
                answerBButtonLetter.x = $scope.buttonContainers["bChoice"].width / 6.5;
                answerBButtonLetter.y = $scope.buttonContainers["bChoice"].height / 2.3;
                answerBButtonLetter.maxWidth = $scope.buttonContainers["bChoice"].width * 0.9;
                $scope.buttonContainers["bChoice"].addChild(answerBButtonLetter);

                $scope.buttonChoicesText["bChoice"] = new createjs.Text("Answer B", "25px Arial", "#69B8C7");
                $scope.buttonChoicesText["bChoice"].regY = $scope.buttonChoicesText["bChoice"].getBounds().height / 2;
                $scope.buttonChoicesText["bChoice"].x = $scope.buttonContainers["bChoice"].width / 2;
                $scope.buttonChoicesText["bChoice"].y = $scope.buttonContainers["bChoice"].height / 2.3;
                $scope.buttonChoicesText["bChoice"].textAlign = "center";
                $scope.buttonContainers["bChoice"].addChild($scope.buttonChoicesText["bChoice"]);

                $scope.buttonChoices["bChoice"].addEventListener("pressup", function (event) {
                  console.log("answerBButton fires pressup event!");
                  if (!$scope.activityData.completed) {

                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["select"].play();
                    }
                    selectChoice("bChoice");
                  }
                });

                $scope.buttonChoices["cChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                $scope.buttonChoices["cChoice"].regX = $scope.buttonChoices["cChoice"].getBounds().width / 2;
                $scope.buttonChoices["cChoice"].regY = $scope.buttonChoices["cChoice"].getBounds().height / 2;
                $scope.buttonChoices["cChoice"].x = $scope.buttonContainers["cChoice"].width / 2;
                $scope.buttonChoices["cChoice"].y = $scope.buttonContainers["cChoice"].height / 2;
                $scope.buttonContainers["cChoice"].addChild($scope.buttonChoices["cChoice"]);


                var answerCButtonLetter = new createjs.Text("c.", "33px Arial", "#69B8C7");
                answerCButtonLetter.regX = answerCButtonLetter.getBounds().width / 2;
                answerCButtonLetter.regY = answerCButtonLetter.getBounds().height / 2;
                answerCButtonLetter.x = $scope.buttonContainers["cChoice"].width / 6.5;
                answerCButtonLetter.y = $scope.buttonContainers["cChoice"].height / 2.3;
                answerCButtonLetter.maxWidth = $scope.buttonContainers["cChoice"].width * 0.9;
                $scope.buttonContainers["cChoice"].addChild(answerCButtonLetter);

                $scope.buttonChoicesText["cChoice"] = new createjs.Text("Answer C", "25px Arial", "#69B8C7");
                $scope.buttonChoicesText["cChoice"].regY = $scope.buttonChoicesText["cChoice"].getBounds().height / 2;
                $scope.buttonChoicesText["cChoice"].x = $scope.buttonContainers["cChoice"].width / 2;
                $scope.buttonChoicesText["cChoice"].y = $scope.buttonContainers["cChoice"].height / 2.3;
                $scope.buttonChoicesText["cChoice"].textAlign = "center";
                $scope.buttonContainers["cChoice"].addChild($scope.buttonChoicesText["cChoice"]);


                $scope.buttonChoices["cChoice"].addEventListener("pressup", function (event) {
                  console.log("answerCButton fires pressup event!");
                  if (!$scope.activityData.completed) {
                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["select"].play();
                    }
                    selectChoice("cChoice");
                  }
                });


                $scope.buttonChoices["dChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                $scope.buttonChoices["dChoice"].regX = $scope.buttonChoices["dChoice"].getBounds().width / 2;
                $scope.buttonChoices["dChoice"].regY = $scope.buttonChoices["dChoice"].getBounds().height / 2;
                $scope.buttonChoices["dChoice"].x = $scope.buttonContainers["dChoice"].width / 2;
                $scope.buttonChoices["dChoice"].y = $scope.buttonContainers["dChoice"].height / 2;
                $scope.buttonContainers["dChoice"].addChild($scope.buttonChoices["dChoice"]);

                var answerDButtonLetter = new createjs.Text("d.", "33px Arial", "#69B8C7");
                answerDButtonLetter.regX = answerDButtonLetter.getBounds().width / 2;
                answerDButtonLetter.regY = answerDButtonLetter.getBounds().height / 2;
                answerDButtonLetter.x = $scope.buttonContainers["dChoice"].width / 6.5;
                answerDButtonLetter.y = $scope.buttonContainers["dChoice"].height / 2.3;
                answerDButtonLetter.maxWidth = $scope.buttonContainers["dChoice"].width * 0.9;
                $scope.buttonContainers["dChoice"].addChild(answerDButtonLetter);

                $scope.buttonChoicesText["dChoice"] = new createjs.Text("Answer D", "25px Arial", "#69B8C7");
                $scope.buttonChoicesText["dChoice"].regY = $scope.buttonChoicesText["dChoice"].getBounds().height / 2;
                $scope.buttonChoicesText["dChoice"].x = $scope.buttonContainers["dChoice"].width / 2;
                $scope.buttonChoicesText["dChoice"].y = $scope.buttonContainers["dChoice"].height / 2.3;
                $scope.buttonChoicesText["dChoice"].textAlign = "center";
                $scope.buttonContainers["dChoice"].addChild($scope.buttonChoicesText["dChoice"]);

                $scope.buttonChoices["dChoice"].addEventListener("pressup", function (event) {
                  console.log("answerDButton fires pressup event!");
                  if (!$scope.activityData.completed) {
                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["select"].play();
                    }
                    selectChoice("dChoice");
                  }
                });


                $scope.buttonChoices["onlyCChoice"] = new createjs.Sprite(answerButtonSpriteSheet, "white");
                $scope.buttonChoices["onlyCChoice"].regX = $scope.buttonChoices["onlyCChoice"].getBounds().width / 2;
                $scope.buttonChoices["onlyCChoice"].regY = $scope.buttonChoices["onlyCChoice"].getBounds().height / 2;
                $scope.buttonChoices["onlyCChoice"].x = $scope.buttonContainers["onlyCChoice"].width / 2;
                $scope.buttonChoices["onlyCChoice"].y = $scope.buttonContainers["onlyCChoice"].height / 2;
                $scope.buttonContainers["onlyCChoice"].addChild($scope.buttonChoices["onlyCChoice"]);

                var answerOnlyCButtonLetter = new createjs.Text("c.", "33px Arial", "#69B8C7");
                answerOnlyCButtonLetter.regX = answerOnlyCButtonLetter.getBounds().width / 2;
                answerOnlyCButtonLetter.regY = answerOnlyCButtonLetter.getBounds().height / 2;
                answerOnlyCButtonLetter.x = $scope.buttonContainers["onlyCChoice"].width / 3.1;
                answerOnlyCButtonLetter.y = $scope.buttonContainers["onlyCChoice"].height / 2.3;
                answerOnlyCButtonLetter.maxWidth = $scope.buttonContainers["onlyCChoice"].width * 0.9;
                $scope.buttonContainers["onlyCChoice"].addChild(answerOnlyCButtonLetter);


                $scope.buttonChoicesText["onlyCChoice"] = new createjs.Text("Answer C", "25px Arial", "#69B8C7");
                $scope.buttonChoicesText["onlyCChoice"].regY = $scope.buttonChoicesText["onlyCChoice"].getBounds().height / 2;
                $scope.buttonChoicesText["onlyCChoice"].x = $scope.buttonContainers["onlyCChoice"].width / 2;
                $scope.buttonChoicesText["onlyCChoice"].y = $scope.buttonContainers["onlyCChoice"].height / 2.3;
                $scope.buttonChoicesText["onlyCChoice"].textAlign = "center";
                $scope.buttonContainers["onlyCChoice"].addChild($scope.buttonChoicesText["onlyCChoice"]);


                $scope.buttonChoices["onlyCChoice"].addEventListener("pressup", function (event) {
                  console.log("answerOnlyCContainer fires pressup event!");
                  if (!$scope.activityData.completed) {
                    if (window.cordova && window.cordova.platformId !== "browser") {
                      $scope.sounds["select"].play();
                    }
                    selectChoice("onlyCChoice");
                  }
                });


                callback();
              });


          }, function (callback) {

            $scope.navigatorContainer = new createjs.Container();
            $scope.navigatorContainer.width = background.image.width / 1.1;
            $scope.navigatorContainer.height = background.image.height / 8;
            $scope.navigatorContainer.scaleX = $scope.navigatorContainer.scaleY = scale;
            $scope.navigatorContainer.x = backgroundPosition.x + (backgroundPosition.width / 22);
            $scope.navigatorContainer.y = backgroundPosition.y + (backgroundPosition.height / 1.28);
            $scope.stage.addChild($scope.navigatorContainer);

            var yellowBar = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_yellow_line.png");
            yellowBar.scaleX = 1.4;
            //yellowBar.regX = yellowBar.image.width / 2;
            //yellowBar.regY = yellowBar.image.height / 2;
            yellowBar.x = 20;
            yellowBar.y = 30;
            $scope.navigatorContainer.addChild(yellowBar);

            /*Yellow bar button Sprite Button*/
            $http.get($rootScope.rootDir + "data/assets/yellow_line_big_bubble.json")
              .success(function (response) {

                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var yellowBarButtonSpriteSheet = new createjs.SpriteSheet(response);

                $scope.yellowBarContainers = {};
                var buttonWidth = $scope.navigatorContainer.width / ($scope.activityData.questions.length + 1);

                _.each($scope.activityData.questions, function (question, key, list) {

                  $scope.yellowBarContainers[key] = new createjs.Container();
                  $scope.yellowBarContainers[key].width = buttonWidth;
                  $scope.yellowBarContainers[key].height = $scope.navigatorContainer.height;
                  $scope.yellowBarContainers[key].regY = $scope.yellowBarContainers[key].height / 2;
                  $scope.yellowBarContainers[key].regX = $scope.yellowBarContainers[key].width / 2;
                  $scope.yellowBarContainers[key].x = $scope.yellowBarContainers[key].width + $scope.yellowBarContainers[key].width * key;
                  $scope.yellowBarContainers[key].y = $scope.yellowBarContainers[key].height / 2;
                  $scope.navigatorContainer.addChild($scope.yellowBarContainers[key]);

                  $scope.yellowBarContainers[key].yellowBarButtons = {};
                  $scope.yellowBarContainers[key].yellowBarButtons[key] = new createjs.Sprite(yellowBarButtonSpriteSheet, "white");
                  $scope.yellowBarContainers[key].yellowBarButtons[key].regX = $scope.yellowBarContainers[key].yellowBarButtons[key].getBounds().width / 2;
                  $scope.yellowBarContainers[key].yellowBarButtons[key].regY = $scope.yellowBarContainers[key].yellowBarButtons[key].getBounds().height / 2;
                  $scope.yellowBarContainers[key].yellowBarButtons[key].x = $scope.yellowBarContainers[key].width / 2;
                  $scope.yellowBarContainers[key].yellowBarButtons[key].y = $scope.yellowBarContainers[key].height / 2.3;


                  $scope.yellowBarContainers[key].yellowBarButtons[key].addEventListener("pressup", function (event) {

                    $scope.yellowBarContainers[key].scaleX = $scope.yellowBarContainers[key].scaleY = 1.4;
                    _.each($scope.activityData.questions, function (question, k, list) {
                      if (k !== key) {
                        $scope.yellowBarContainers[k].scaleX = $scope.yellowBarContainers[k].scaleY = 1;
                      }
                    });
                    $scope.stage.update();

                    async.parallel([function (parallelCallback) {

                      createjs.Tween.get($scope.answersContainer, {loop: false})
                        .to({
                          y: +1000 * scale
                        }, 300, createjs.Ease.getPowIn(2)).call(function () {
                        parallelCallback();
                      });

                    }, function (parallelCallback) {

                      createjs.Tween.get($scope.questionsContainer, {loop: false})
                        .to({
                          y: -1000 * scale
                        }, 300, createjs.Ease.getPowIn(2)).call(function () {
                        parallelCallback();
                      });
                    }], function (err, response) {
                      loadQuestion(key);
                    });

                  });

                  $scope.yellowBarContainers[key].addChild($scope.yellowBarContainers[key].yellowBarButtons[key]);
                  var yellowBarButtonIndex = new createjs.Text(key + 1, "15px Arial", "black");
                  yellowBarButtonIndex.regY = yellowBarButtonIndex.getBounds().height / 2;
                  yellowBarButtonIndex.x = $scope.yellowBarContainers[key].width / 2.15;
                  yellowBarButtonIndex.y = $scope.yellowBarContainers[key].height / 6;
                  yellowBarButtonIndex.textAlign = "center";
                  $scope.yellowBarContainers[key].addChild(yellowBarButtonIndex);

                });
                callback();

              })
              .error(function (error) {
                console.error("Error on getting json for answer button...", error);
                callback();
              });
          }
          ],
          function (err, response) {
            console.log("General Callback and init");

            init();
          });


        function selectChoice(choice) {
          console.log("choice", choice);

          $scope.buttonChoices[choice].gotoAndPlay("yellow");
          _.each($scope.buttonChoices, function (c, key, l) {
            if (key !== choice) {
              $scope.buttonChoices[key].gotoAndPlay("white");
            }
          });

          if (choice === "onlyCChoice") {
            $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer = "cChoice";
          } else {
            $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer = choice;
          }

          $scope.yellowBarContainers[$scope.activeQuestionIndex].yellowBarButtons[$scope.activeQuestionIndex].gotoAndPlay("yellow");

          if ($scope.activityData.questions[$scope.activeQuestionIndex].midtext) {
            var splittedText = $scope.buttonChoicesText[choice].text.split("...");
            $scope.firstGap.text = splittedText[0];
            $scope.secondGap.text = splittedText[1];
            $scope.firstGap.color = "black";
            $scope.secondGap.color = "black";
          } else {
            $scope.firstGap.text = $scope.buttonChoicesText[choice].text;
            $scope.firstGap.color = "black";
          }

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };

        function init() {
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          _.each($scope.activityData.questions, function (question, k, list) {
            if (k !== 0) {
              $scope.yellowBarContainers[k].scaleX = $scope.yellowBarContainers[k].scaleY = 1;
            }

            if (question.userAnswer) {
              if ($scope.activityData.completed) {
                if (question.userAnswer === question.answerChoice) {
                  $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("green");
                } else {
                  $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("red");
                }
              } else {
                $scope.yellowBarContainers[k].yellowBarButtons[k].gotoAndPlay("yellow");
              }
            }
          });
          loadQuestion(0);
          check();
        }


        function loadQuestion(key) {
          $scope.activeQuestionIndex = key;
          $scope.questionNumber.text = key + 1;
          console.log("numChildren", $scope.questionsTextContainer.numChildren);
          $scope.questionsTextContainer.removeAllChildren();
          console.log("question", $scope.activityData.questions[key]);
          var question = $scope.activityData.questions[key];

          _.each($scope.buttonChoices, function (c, k, l) {
            $scope.buttonChoices[k].gotoAndPlay("white");
            $scope.buttonChoicesText[k].color = "#69B8C7";
            $scope.buttonContainers[k].visible = false;
          });

          if (question.userAnswer) {
            if (question.userAnswer === "cChoice") {
              $scope.buttonChoices["cChoice"].gotoAndPlay("yellow");
              $scope.buttonChoices["onlyCChoice"].gotoAndPlay("yellow");
            } else {
              $scope.buttonChoices[question.userAnswer].gotoAndPlay("yellow");
            }
          }


          $scope.buttonContainers["aChoice"].visible = true;
          $scope.buttonContainers["bChoice"].visible = true;
          $scope.buttonChoicesText["aChoice"].text = question.aChoice;
          $scope.buttonChoicesText["bChoice"].text = question.bChoice;

          if (question.cChoice && question.dChoice) {
            $scope.buttonContainers["cChoice"].visible = true;
            $scope.buttonContainers["dChoice"].visible = true;
            $scope.buttonChoicesText["cChoice"].text = question.cChoice;
            $scope.buttonChoicesText["dChoice"].text = question.dChoice;
          } else if (question.cChoice && !question.dChoice) {
            $scope.buttonChoicesText["onlyCChoice"].text = question.cChoice;
            $scope.buttonContainers["onlyCChoice"].visible = true;
          }

          var pretexts = question.pretext.split("\n");
          console.log("pretexts", pretexts.length);
          var currentPretexts = {};
          var textHeight = 40;
          _.each(pretexts, function (text, l, li) {
            if (!text) {
              text = " ";
            }
            currentPretexts[l] = new createjs.Text(text, "25px Arial", "#69B8C7");
            currentPretexts[l].y = textHeight * l;
            $scope.questionsTextContainer.addChild(currentPretexts[l]);
          });

          $scope.firstGap = new createjs.Text(noChoice, "25px Arial", "#69B8C7");
          $scope.firstGap.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width;
          $scope.firstGap.y = currentPretexts[pretexts.length - 1].y;
          $scope.questionsTextContainer.addChild($scope.firstGap);

          var firstGapUnderlinedText = $scope.firstGap.clone();
          $scope.questionsTextContainer.addChild(firstGapUnderlinedText);
          $scope.firstGap.textAlign = "center";
          $scope.firstGap.maxWidth = firstGapUnderlinedText.getBounds().width * 0.9;
          $scope.firstGap.x = currentPretexts[pretexts.length - 1].x + currentPretexts[pretexts.length - 1].getBounds().width + firstGapUnderlinedText.getBounds().width / 2;

          if ($scope.activityData.questions[key].midtext) {

            var midtexts = question.midtext.split("\n");
            console.log("midtexts", midtexts.length);
            var currentMidtexts = {};

            _.each(midtexts, function (text, l, li) {
              if (!text) {
                text = " ";
              }
              currentMidtexts[l] = new createjs.Text(text, "25px Arial", "#69B8C7");
              currentMidtexts[l].y = pretexts.length * textHeight + textHeight * l;
              console.log("currentMidtexts[l].y ", currentMidtexts[l].y);
              $scope.questionsTextContainer.addChild(currentMidtexts[l]);
            });

            $scope.secondGap = new createjs.Text(noChoice, "25px Arial", "#69B8C7");
            $scope.secondGap.x = currentMidtexts[pretexts.length - 1].x + currentMidtexts[pretexts.length - 1].getBounds().width;
            $scope.secondGap.y = currentMidtexts[pretexts.length - 1].y;
            $scope.questionsTextContainer.addChild($scope.secondGap);

            var secondGapUnderlinedText = $scope.secondGap.clone();
            $scope.questionsTextContainer.addChild(secondGapUnderlinedText);

            $scope.secondGap.textAlign = "center";
            $scope.secondGap.maxWidth = secondGapUnderlinedText.getBounds().width * 0.9;
            $scope.secondGap.x = currentMidtexts[pretexts.length - 1].x + currentMidtexts[pretexts.length - 1].getBounds().width + secondGapUnderlinedText.getBounds().width / 2;

            if (question.postext) {
              var postexts = question.postext.split("\n");
              console.log("postexts", postexts.length);
              var currentPostexts = {};

              if (postexts.length > 1) {
                if (!postexts[0]) {
                  postexts[0] = " ";
                }
                currentPostexts[0] = new createjs.Text(postexts[0], "25px Arial", "#69B8C7");
                currentPostexts[0].x = secondGapUnderlinedText.x + secondGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = secondGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);

                currentPostexts[1] = new createjs.Text(postexts[1], "25px Arial", "#69B8C7");
                currentPostexts[1].y = currentPostexts[0].y + currentPostexts[0].getBounds().height;
                $scope.questionsTextContainer.addChild(currentPostexts[1]);
              } else {
                currentPostexts[0] = new createjs.Text(postexts[0], "25px Arial", "#69B8C7");
                currentPostexts[0].x = secondGapUnderlinedText.x + secondGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = secondGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);
              }

            }

          } else {
            if (question.postext) {

              var postexts = question.postext.split("\n");
              console.log("postexts", postexts.length);
              var currentPostexts = {};

              if (postexts.length > 1) {
                if (!postexts[0]) {
                  postexts[0] = " ";
                }
                currentPostexts[0] = new createjs.Text(postexts[0], "25px Arial", "#69B8C7");
                currentPostexts[0].x = firstGapUnderlinedText.x + firstGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = firstGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);

                currentPostexts[1] = new createjs.Text(postexts[1], "25px Arial", "#69B8C7");
                currentPostexts[1].y = currentPostexts[0].y + currentPostexts[0].getBounds().height;
                $scope.questionsTextContainer.addChild(currentPostexts[1]);
              } else {
                currentPostexts[0] = new createjs.Text(postexts[0], "25px Arial", "#69B8C7");
                currentPostexts[0].x = firstGapUnderlinedText.x + firstGapUnderlinedText.getBounds().width;
                currentPostexts[0].y = firstGapUnderlinedText.y;
                $scope.questionsTextContainer.addChild(currentPostexts[0]);
              }
            }

          }

          if (question.userAnswer) {
            if (!$scope.activityData.completed) {
              if (question.midtext) {
                var splittedText = question[question.userAnswer].split("...");
                $scope.firstGap.text = splittedText[0];
                $scope.secondGap.text = splittedText[1];
                $scope.firstGap.color = "black";
                $scope.secondGap.color = "black";
              } else {
                $scope.firstGap.text = question[question.userAnswer];
                $scope.firstGap.color = "black";
              }
            } else {
              if (question.midtext) {
                var splittedText = question[question.answerChoice].split("...");
                $scope.firstGap.text = splittedText[0];
                $scope.secondGap.text = splittedText[1];
                $scope.firstGap.color = "black";
                $scope.secondGap.color = "black";
              } else {
                $scope.firstGap.text = question[question.answerChoice];
                $scope.firstGap.color = "black";
              }
            }
          }


          if ($scope.activityData.completed) {

            console.log("UserAnswer", question.userAnswer);
            console.log("answerChoice", question.answerChoice);
            if (question.userAnswer === question.answerChoice) {
              if (question.userAnswer === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("green");
                $scope.buttonChoices["onlyCChoice"].gotoAndPlay("green");
                $scope.buttonChoicesText["cChoice"].color = "white";
                $scope.buttonChoicesText["onlyCChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.userAnswer].gotoAndPlay("green");
                $scope.buttonChoicesText[question.userAnswer].color = "white";
              }
            } else if (question.userAnswer) {

              if (question.answerChoice === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("green");
                $scope.buttonChoices["onlyCChoice"].gotoAndPlay("green");
                $scope.buttonChoicesText["cChoice"].color = "white";
                $scope.buttonChoicesText["onlyCChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.answerChoice].gotoAndPlay("green");
                $scope.buttonChoicesText[question.answerChoice].color = "white";
              }

              if (question.userAnswer === "cChoice") {
                $scope.buttonChoices["cChoice"].gotoAndPlay("red");
                $scope.buttonChoices["onlyCChoice"].gotoAndPlay("red");
                $scope.buttonChoicesText["cChoice"].color = "white";
                $scope.buttonChoicesText["onlyCChoice"].color = "white";
              } else {
                $scope.buttonChoices[question.userAnswer].gotoAndPlay("red");
                $scope.buttonChoicesText[question.userAnswer].color = "white";

              }
            }
          }

          createjs.Tween.get($scope.answersContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 2.1)
            }, 300, createjs.Ease.getPowIn(2)).call(function () {
          });

          createjs.Tween.get($scope.questionsContainer, {loop: false})
            .to({
              y: backgroundPosition.y + (backgroundPosition.height / 7)
            }, 300, createjs.Ease.getPowIn(2));

        };

        function completedActivity() {
          console.log("Completed Activity!");
          $scope.nextButton.alpha = 1;
          $scope.checkButton.alpha = 0.5;
          $scope.activityData.completed = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };

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
            $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("white");
            if (key !== 0) {
              $scope.yellowBarContainers[key].scaleX = $scope.yellowBarContainers[key].scaleY = 1;
            }
          });
          $scope.yellowBarContainers[0].scaleX = $scope.yellowBarContainers[0].scaleY = 1.4;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
          loadQuestion(0);
        }


        /*Function that checks user answers and calls score function and showAnswers function*/
        function check() {
          console.log("Checking Answers!");
          if (_.findWhere($scope.activityData.questions, {
              "userAnswer": ""
            })) {
            console.log("Please fill all the gaps!");
            Toast.show("Please fill all the gaps!");
            return;
          } else {
            score();
          }
        }


        /*Function that calculates score*/
        function score() {

          var rightAnswers = 0;
          _.each($scope.activityData.questions, function (question, key, value) {
            console.log("Question " + key + " answer", question.userAnswer);
            if (question.userAnswer === question.answerChoice) {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("green");
              rightAnswers++;
            } else {
              $scope.yellowBarContainers[key].yellowBarButtons[key].gotoAndPlay("red");
            }
          });
          console.log("rightAnswers", rightAnswers);
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

          if ($scope.activityData.questions[$scope.activeQuestionIndex].userAnswer === $scope.activityData.questions[$scope.activeQuestionIndex].answerChoice) {
            if ($scope.activityData.questions[$scope.activeQuestionIndex].userAnswer === "cChoice") {
              $scope.buttonChoices["cChoice"].gotoAndPlay("green");
              $scope.buttonChoices["onlyCChoice"].gotoAndPlay("green");
              $scope.buttonChoicesText["cChoice"].color = "white";
              $scope.buttonChoicesText["onlyCChoice"].color = "white";
            } else {
              $scope.buttonChoices[$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer].gotoAndPlay("green");
              $scope.buttonChoicesText[$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer].color = "white";
            }
          } else if ($scope.activityData.questions[$scope.activeQuestionIndex].userAnswer) {

            if ($scope.activityData.questions[$scope.activeQuestionIndex].answerChoice === "cChoice") {
              $scope.buttonChoices["cChoice"].gotoAndPlay("green");
              $scope.buttonChoices["onlyCChoice"].gotoAndPlay("green");
              $scope.buttonChoicesText["cChoice"].color = "white";
              $scope.buttonChoicesText["onlyCChoice"].color = "white";
            } else {
              $scope.buttonChoices[$scope.activityData.questions[$scope.activeQuestionIndex].answerChoice].gotoAndPlay("green");
              $scope.buttonChoicesText[$scope.activityData.questions[$scope.activeQuestionIndex].answerChoice].color = "white";
            }


            if ($scope.activityData.questions[$scope.activeQuestionIndex].userAnswer === "cChoice") {
              $scope.buttonChoices["cChoice"].gotoAndPlay("red");
              $scope.buttonChoices["onlyCChoice"].gotoAndPlay("red");
              $scope.buttonChoicesText["cChoice"].color = "white";
              $scope.buttonChoicesText["onlyCChoice"].color = "white";
            } else {
              $scope.buttonChoicesText[$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer].color = "white";
              $scope.buttonChoices[$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer].gotoAndPlay("red");
            }
          }

          completedActivity();
        }

      });//end of image on complete
    }, 1500);
//end of timeout
  })
;

angular.module("bookbuilder2")
  .controller("ResultsController", function (Email, $ionicLoading, $scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast, $ionicPopup) {

    console.log("ResultsController loaded!");

    //START OF DEVELOPMENT SNIPPET
    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }
    $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
    $rootScope.book = JSON.parse(window.localStorage.getItem("book"));

    //END OF DEVELOPMENT SNIPPET


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

      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/results_backgroung_image_blue.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/results_backgroung_image_blue.png");

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


        async.parallel([function (callback) {


            /**** MENU BUTTON ****/
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
              });//end of get menu button

          }, function (callback) {

            $http.get($rootScope.rootDir + "data/assets/lesson_restart_button_sprite.json")
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
                  $scope.stage.update();

                  var confirmPopup = $ionicPopup.confirm({
                    title: 'Restart all activities in ' + $rootScope.selectedLesson.lessonTitle,
                    template: 'This will reset all your activity in ' + $rootScope.selectedLesson.lessonTitle + "!"
                  });
                  confirmPopup.then(function (res) {
                    if (res) {
                      clearAllActivitiesLocalStorage();
                    }
                  });
                });
                returnButton.scaleX = returnButton.scaleY = scale;
                returnButton.x = backgroundPosition.x + (backgroundPosition.width / 1.15);
                returnButton.y = backgroundPosition.y + (backgroundPosition.height / 8);
                $scope.stage.addChild(returnButton);
                callback();
              })
              .error(function (error) {
                callback();
                console.log("Error on getting json data for return button...", error);

              });
          }, function (callback) {

            $http.get($rootScope.rootDir + "data/assets/results_activity_state.json")
              .success(function (response) {
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                $scope.activityState = new createjs.SpriteSheet(response);
                callback();
              })
              .error(function (error) {
                callback();
                console.log("Error on getting json data for return button...", error);

              });
          }, function (callback) {

            $http.get($rootScope.rootDir + "data/assets/results_exit_button_sprite.json")
              .success(function (response) {
                //Reassigning images with the rest of resource
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var resultsExitButtonSpriteSheet = new createjs.SpriteSheet(response);
                var resultsExitButton = new createjs.Sprite(resultsExitButtonSpriteSheet, "normal");

                resultsExitButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a button !");
                  resultsExitButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                resultsExitButton.addEventListener("pressup", function (event) {
                  console.log("pressup event!");
                  resultsExitButton.gotoAndPlay("normal");
                  $scope.stage.update();
                  if (ionic.Platform.isAndroid()) {
                    ionic.Platform.exitApp();
                  } else {
                    $ionicHistory.nextViewOptions({
                      historyRoot: true,
                      disableBack: true
                    });
                    $state.go("groups", {}, {reload: true});
                  }

                });
                resultsExitButton.scaleX = resultsExitButton.scaleY = scale;
                resultsExitButton.x = backgroundPosition.x + (backgroundPosition.width / 1.5);
                resultsExitButton.y = backgroundPosition.y + (backgroundPosition.height / 1.14);
                $scope.stage.addChild(resultsExitButton);
                $scope.stage.update();
                callback();
              })
              .error(function (error) {
                callback();
                console.log("Error on getting json data for return button...", error);

              });


          }, function (callback) {

            $http.get($rootScope.rootDir + "data/assets/results_email_button_sprite.json")
              .success(function (response) {
                //Reassigning images with the rest of resource
                response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                var resultsEmailButtonSpriteSheet = new createjs.SpriteSheet(response);
                var resultsEmailButton = new createjs.Sprite(resultsEmailButtonSpriteSheet, "normal");

                resultsEmailButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a button !");
                  resultsEmailButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                resultsEmailButton.addEventListener("pressup", function (event) {
                  console.log("pressup event!");
                  resultsEmailButton.gotoAndPlay("normal");
                  $scope.popEmail();

                });
                resultsEmailButton.scaleX = resultsEmailButton.scaleY = scale;
                resultsEmailButton.x = backgroundPosition.x + (backgroundPosition.width / 12);
                resultsEmailButton.y = backgroundPosition.y + (backgroundPosition.height / 1.14);
                $scope.stage.addChild(resultsEmailButton);
                callback();
              })
              .error(function (error) {
                callback();
                console.log("Error on getting json data for return button...", error);

              });

          }, function (callback) {


            $scope.vocReadContainer = new createjs.Container();
            $scope.vocReadContainer.scaleX = $scope.vocReadContainer.scaleY = scale;
            $scope.vocReadContainer.x = backgroundPosition.x + (backgroundPosition.width / 9);
            $scope.vocReadContainer.y = backgroundPosition.y + (backgroundPosition.height / 4);
            $scope.vocReadContainer.width = background.image.width / 2.7;
            $scope.vocReadContainer.height = background.image.height / 8;
            $scope.stage.addChild($scope.vocReadContainer);


            $scope.scoreContainer = new createjs.Container();
            $scope.scoreContainer.scaleX = $scope.scoreContainer.scaleY = scale;
            $scope.scoreContainer.x = backgroundPosition.x + (backgroundPosition.width / 2);
            $scope.scoreContainer.y = backgroundPosition.y + (backgroundPosition.height / 4);
            $scope.scoreContainer.width = background.image.width / 3.2;
            $scope.scoreContainer.height = background.image.height / 8;
            $scope.stage.addChild($scope.scoreContainer);


            $scope.activitiesContainer = new createjs.Container();
            $scope.activitiesContainer.scaleX = $scope.activitiesContainer.scaleY = scale;
            $scope.activitiesContainer.x = backgroundPosition.x + (backgroundPosition.width / 9);
            $scope.activitiesContainer.y = backgroundPosition.y + (backgroundPosition.height / 2.5);
            $scope.activitiesContainer.width = background.image.width / 1.44;
            $scope.activitiesContainer.height = background.image.height / 2.3;
            $scope.stage.addChild($scope.activitiesContainer);

            callback();
          }],


          /*** MAIN PARALLELS CALLBACK ***/
          function (err, results) {

            var lessonTitle = new createjs.Text($rootScope.selectedLesson.lessonTitle, "33px Arial", "white");
            lessonTitle.scaleX = lessonTitle.scaleY = scale;
            lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 10);
            lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 13);
            lessonTitle.rotation = -4;
            $scope.stage.addChild(lessonTitle);
            var title = new createjs.Text($rootScope.selectedLesson.title, "25px Arial", "white");
            title.scaleX = title.scaleY = scale;
            title.x = backgroundPosition.x + (backgroundPosition.width / 2.8);
            title.y = backgroundPosition.y + (backgroundPosition.height / 16);
            $scope.stage.addChild(title);
            showResults();
          });


        /*Showing results*/
        function showResults() {

          $scope.scoreContainer.removeAllChildren();
          $scope.vocReadContainer.removeAllChildren();
          $scope.activitiesContainer.removeAllChildren();

          var vocabularyReadingGraphics = new createjs.Graphics().beginFill(null);
          vocabularyReadingGraphics.setStrokeStyle(3).beginStroke("white");
          vocabularyReadingGraphics.drawRoundRect(0, 0, $scope.vocReadContainer.width, $scope.vocReadContainer.height, 15);
          var vocabularyReadingShape = new createjs.Shape(vocabularyReadingGraphics);
          $scope.vocReadContainer.addChild(vocabularyReadingShape);

          var graphics = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.scoreContainer.width, $scope.scoreContainer.height);
          var shape = new createjs.Shape(graphics);
          shape.alpha = 0.8;
          $scope.scoreContainer.addChild(shape);

          var activitiesGraphics = new createjs.Graphics().beginFill(null);
          activitiesGraphics.setStrokeStyle(3).beginStroke("white");
          activitiesGraphics.drawRoundRect(0, 0, $scope.activitiesContainer.width, $scope.activitiesContainer.height, 15);
          var activitiesShape = new createjs.Shape(activitiesGraphics);
          $scope.activitiesContainer.addChild(activitiesShape);

          $scope.calculatedActivityScores = {};

          _.each($rootScope.selectedLesson.lessonMenu, function (activity, key, list) {
            var activityData = JSON.parse(window.localStorage.getItem($rootScope.selectedLesson.id + "_" + activity.activityFolder));
            console.log("activity", activityData);

            if (activityData) {
              console.log("activity correct", calculateCorrectAnswers(activityData, activity.activityTemplate));
              $scope.calculatedActivityScores[activity.activityFolder] = {
                "activityFolder": activity.activityFolder,
                "title": activity.name,
                "completed": activityData.completed ? true : false,
                "attempts": activityData.attempts ? activityData.attempts : 0,
                "correct": calculateCorrectAnswers(activityData, activity.activityTemplate),
                "numberOfQuestions": activity.numberOfQuestions,
                "percentCorrectQuestions": parseInt(calculateCorrectAnswers(activityData, activity.activityTemplate) / activityData.questions.length * 100)
              }
            } else {
              $scope.calculatedActivityScores[activity.activityFolder] = {
                "activityFolder": activity.activityFolder,
                "title": activity.name,
                "completed": false,
                "attempts": 0,
                "correct": 0,
                "numberOfQuestions": activity.numberOfQuestions,
                "percentCorrectQuestions": 0
              }
            }
          });

          var vocabularyActivityData = JSON.parse(window.localStorage.getItem($rootScope.selectedLesson.id + "_vocabulary"));

          if (vocabularyActivityData) {
            $scope.calculatedActivityScores["vocabulary"] = {
              "activityFolder": "vocabulary",
              "title": "Vocabulary",
              "completed": vocabularyActivityData.completed,
              "attempts": vocabularyActivityData.attempts,
              "percentCorrectQuestions": 100
            };
          } else {
            $scope.calculatedActivityScores["vocabulary"] = {
              "activityFolder": "vocabulary",
              "title": "Vocabulary",
              "completed": false,
              "attempts": 0,
              "percentCorrectQuestions": 0
            };
          }
          var readingActivityData = JSON.parse(window.localStorage.getItem($rootScope.selectedLesson.id + "_reading"));
          if (readingActivityData) {
            $scope.calculatedActivityScores["reading"] = {
              "activityFolder": "reading",
              "title": "Reading",
              "completed": readingActivityData.completed,
              "attempts": readingActivityData.attempts,
              "percentCorrectQuestions": 100
            };
          } else {
            $scope.calculatedActivityScores["reading"] = {
              "activityFolder": "reading",
              "title": "Reading",
              "completed": false,
              "attempts": 0,
              "percentCorrectQuestions": 0
            };
          }

          $scope.totalScore = 0;
          var score = 0;
          var counter = 0;
          _.each($scope.calculatedActivityScores, function (activity, key, list) {
            if (activity.completed) {
              score += activity.percentCorrectQuestions;
            }
            counter++;

          });
          $scope.totalScore = score / counter;


          var scoreText = new createjs.Text("Total Score: " + $scope.totalScore.toFixed() + "%", "27px Arial", "white");
          scoreText.textAlign = "center";
          scoreText.x = $scope.scoreContainer.width / 2;
          scoreText.y = $scope.scoreContainer.height / 2;
          scoreText.regY = scoreText.getBounds().height / 2;
          $scope.scoreContainer.addChild(scoreText);


          var vocText = new createjs.Text($scope.calculatedActivityScores["vocabulary"].title, "21px Arial", "white");
          vocText.x = $scope.vocReadContainer.width / 20;
          vocText.y = $scope.vocReadContainer.height / 14;

          $scope.activityStateVoc = new createjs.Sprite($scope.activityState, $scope.calculatedActivityScores["vocabulary"].completed ? "completed" : "notCompleted");
          $scope.activityStateVoc.x = $scope.vocReadContainer.width / 2;
          $scope.activityStateVoc.y = vocText.y;
          $scope.vocReadContainer.addChild($scope.activityStateVoc);

          $scope.vocReadContainer.addChild(vocText);

          var vocAttempts = new createjs.Text(($scope.calculatedActivityScores["vocabulary"].attempts ? $scope.calculatedActivityScores["vocabulary"].attempts : 0) + " times", "25px Arial", "white");
          vocAttempts.x = $scope.vocReadContainer.width / 1.5;
          vocAttempts.y = vocText.y;
          $scope.vocReadContainer.addChild(vocAttempts);


          var readText = new createjs.Text($scope.calculatedActivityScores["reading"].title, "21px Arial", "white");
          readText.x = $scope.vocReadContainer.width / 20;
          readText.y = $scope.vocReadContainer.height / 1.9;
          $scope.vocReadContainer.addChild(readText);

          $scope.activityStateRead = new createjs.Sprite($scope.activityState, $scope.calculatedActivityScores["reading"].completed ? "completed" : "notCompleted");
          $scope.activityStateRead.x = $scope.vocReadContainer.width / 2;
          $scope.activityStateRead.y = readText.y;
          $scope.vocReadContainer.addChild($scope.activityStateRead);

          var readAttempts = new createjs.Text(($scope.calculatedActivityScores["reading"].attempts ? $scope.calculatedActivityScores["reading"].attempts : 0) + " times", "25px Arial", "white");
          readAttempts.x = $scope.vocReadContainer.width / 1.5;
          readAttempts.y = readText.y;
          $scope.vocReadContainer.addChild(readAttempts);


          var stepHeight = 15;
          _.each($scope.calculatedActivityScores, function (activity, key, list) {

            if (key === "reading" || key === "vocabulary") {
              return;
            }
            var vocText = new createjs.Text(activity.title, "21px Arial", "white");
            vocText.x = $scope.activitiesContainer.width / 40;
            vocText.y = stepHeight;

            $scope.activityStateVoc = new createjs.Sprite($scope.activityState, activity.completed ? "completed" : "notCompleted");
            $scope.activityStateVoc.x = $scope.vocReadContainer.width / 2;
            $scope.activityStateVoc.y = stepHeight;
            $scope.activitiesContainer.addChild($scope.activityStateVoc);

            $scope.activitiesContainer.addChild(vocText);

            var vocAttempts = new createjs.Text((activity.attempts ? activity.attempts : 0) + " attempts", "21px Arial", "white");
            vocAttempts.x = $scope.activitiesContainer.width / 3;
            vocAttempts.y = stepHeight;
            $scope.activitiesContainer.addChild(vocAttempts);

            var vocCorrect = new createjs.Text("correct : " + activity.correct + " / " + activity.numberOfQuestions, "21px Arial", "white");
            vocCorrect.x = $scope.activitiesContainer.width / 1.85;
            vocCorrect.y = stepHeight;
            $scope.activitiesContainer.addChild(vocCorrect);


            var vocPerCent = new createjs.Text("score : " + activity.percentCorrectQuestions.toFixed() + "%", "21px Arial", "white");
            vocPerCent.x = $scope.activitiesContainer.width / 1.25;
            vocPerCent.y = stepHeight;
            $scope.activitiesContainer.addChild(vocPerCent);

            stepHeight += 50;

          });
        }


        /*Calculating answers*/
        function calculateCorrectAnswers(activityData, activityTemplate) {
          if (activityTemplate === "draganddrop") {
            return _.filter(activityData.questions, function (question) {
              if (question.userAnswerLabel === question.answer) {
                return true;
              } else {
                return false;
              }
            }).length;
          } else if (activityTemplate === "multiple") {
            return _.filter(activityData.questions, function (question) {
              console.log("question.userAnswer: " + question.userAnswer + " question.answerChoice: " + question.answerChoice);
              if (question.userAnswer === question.answerChoice) {
                return true;
              } else {
                return false;
              }
            }).length;
          }

        }


        /*This function evokes when a lesson is downloaded for the first time*/
        function clearAllActivitiesLocalStorage() {

          _.each($scope.calculatedActivityScores, function (activity, key, list) {
            window.localStorage.removeItem($rootScope.selectedLesson.id + "_" + activity.activityFolder);
          });
          Toast.show($rootScope.selectedLesson.title + " is cleared successfully!");
          showResults();
        }


        /*Function that handles email process*/
        $scope.popEmail = function () {

          $scope.data = {};
          var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="data.firstName" placeholder="Όνομα μαθητή"><br><input type="email" ng-model="data.sendTo" placeholder="Email Καθηγητή">',
            title: 'Εισάγετε τα στοιχεία σας',
            scope: $scope,
            buttons: [{
              text: 'Cancel'
            }, {
              text: '<b>Send</b>',
              type: 'button-positive',
              onTap: function (e) {
                if (!$scope.data.sendTo || !$scope.data.firstName) {
                  //don't allow the user to close unless he enters wifi password
                  e.preventDefault();
                  $ionicLoading.show({
                    "template": "Παρακαλώ συμπληρώστε τα στοιχεία σας σωστά!"
                  });
                  $timeout(function () {
                    $ionicLoading.hide();
                  }, 3000);
                } else {
                  console.log("$scope.calculatedActivityScores", $scope.calculatedActivityScores);
                  console.log($scope.data.firstName + " " + $scope.data.sendTo);
                  $scope.data.bookTitle = $rootScope.book.bookTitle;
                  $scope.data.lessonTitle = $rootScope.selectedLesson.lessonTitle;
                  $scope.data.totalScore = $scope.totalScore.toFixed();

                  $scope.data.voc_check = $scope.calculatedActivityScores["vocabulary"].completed ? 1 : 2;
                  $scope.data.text1 = $scope.calculatedActivityScores["vocabulary"].title;
                  $scope.data.voc_attempt = $scope.calculatedActivityScores["vocabulary"].attempts;

                  $scope.data.read_check = $scope.calculatedActivityScores["reading"].completed ? 1 : 2;
                  $scope.data.text2 = $scope.calculatedActivityScores["reading"].title;
                  $scope.data.read_attempt = $scope.calculatedActivityScores["reading"].attempts;


                  $scope.data.voc1_check = $scope.calculatedActivityScores["vocabulary1"].completed ? 1 : 2;
                  $scope.data.text6 = $scope.calculatedActivityScores["vocabulary1"].title;
                  $scope.data.voc1_attempt = $scope.calculatedActivityScores["vocabulary1"].attempts;
                  $scope.data.answers1 = $scope.calculatedActivityScores["vocabulary1"].correct;
                  $scope.data.score1 = $scope.calculatedActivityScores["vocabulary1"].percentCorrectQuestions;
                  $scope.data.total1 = $scope.calculatedActivityScores["vocabulary1"].numberOfQuestions;


                  $scope.data.voc2_check = $scope.calculatedActivityScores["vocabulary2"].completed ? 1 : 2;
                  $scope.data.text7 = $scope.calculatedActivityScores["vocabulary2"].title;
                  $scope.data.voc2_attempt = $scope.calculatedActivityScores["vocabulary2"].attempts;
                  $scope.data.answers2 = $scope.calculatedActivityScores["vocabulary2"].correct;
                  $scope.data.score2 = $scope.calculatedActivityScores["vocabulary2"].percentCorrectQuestions;
                  $scope.data.total2 = $scope.calculatedActivityScores["vocabulary2"].numberOfQuestions;

                  /*$scope.data.voc3_check = $scope.calculatedActivityScores["vocabulary3"].completed ? 1 : 2;
                   $scope.data.text11 = $scope.calculatedActivityScores["vocabulary3"].title;
                   $scope.data.voc3_attempt = $scope.calculatedActivityScores["vocabulary3"].attempts;
                   $scope.data.answers6 = $scope.calculatedActivityScores["vocabulary3"].correct;
                   $scope.data.score6 = $scope.calculatedActivityScores["vocabulary3"].percentCorrectQuestions;
                   $scope.data.total6 = $scope.calculatedActivityScores["vocabulary3"].numberOfQuestions;*/


                  $scope.data.gram1_check = $scope.calculatedActivityScores["grammar1"].completed ? 1 : 2;
                  $scope.data.text8 = $scope.calculatedActivityScores["grammar1"].title;
                  $scope.data.gram1_attempt = $scope.calculatedActivityScores["grammar1"].attempts;
                  $scope.data.answers3 = $scope.calculatedActivityScores["grammar1"].correct;
                  $scope.data.score3 = $scope.calculatedActivityScores["grammar1"].percentCorrectQuestions;
                  $scope.data.total3 = $scope.calculatedActivityScores["grammar1"].numberOfQuestions;

                  $scope.data.gram2_check = $scope.calculatedActivityScores["grammar2"].completed ? 1 : 2;
                  $scope.data.text9 = $scope.calculatedActivityScores["grammar2"].title;
                  $scope.data.gram2_attempt = $scope.calculatedActivityScores["grammar2"].attempts;
                  $scope.data.answers4 = $scope.calculatedActivityScores["grammar2"].correct;
                  $scope.data.score4 = $scope.calculatedActivityScores["grammar2"].percentCorrectQuestions;
                  $scope.data.total4 = $scope.calculatedActivityScores["grammar2"].numberOfQuestions;


                  console.log($scope.data);
                  Email.send($scope.data).success(function (response) {
                    $ionicLoading.show({
                      "template": "Το email εστάλη επιτυχώς!"
                    });
                    $timeout(function () {
                      $ionicLoading.hide();
                    }, 3000);
                  }).error(function () {
                    $ionicLoading.show({
                      "template": "Υπήρξε κάποιο σφάλμα κατά την αποστολή! Παρακαλώ ξαναπροσπαθήστε!"
                    });
                    $timeout(function () {
                      $ionicLoading.hide();
                    }, 3000);
                  });


                }
              }
            }]
          });


        };


      });//end of image on complete
    }, 500);
//end of timeout
  })
;

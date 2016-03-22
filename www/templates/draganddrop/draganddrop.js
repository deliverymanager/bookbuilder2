angular.module("bookbuilder2")
    .controller("DraganddropController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, LocalStorage) {

        console.log("Draganddrop loaded!");


        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/

        $rootScope.selectedLessonId = "lesson1";
        $rootScope.activityFolder = "vocabulary2";

        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/


        /*Each activity projected to activityData and application retrieves it from localStorage
         if it's not located in localStorage controller initializes an object */
        var activityData = {};

        /*Name of activity in localStorage*/
        var activityNameInLocalStorage = $rootScope.selectedLesson.lessonId + "_" + $rootScope.activityFolder;
        console.log("Name of activity in localStorage: ", activityNameInLocalStorage);

        $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("draganddropCanvas"));
      var ctx = document.getElementById("draganddropCanvas").getContext("2d");
      stage.canvas.height = window.innerHeight;
      stage.canvas.width = window.innerWidth;
      stage.enableDOMEvents(false);
      ctx.mozImageSmoothingEnabled = true;
      ctx.webkitImageSmoothingEnabled = true;
      ctx.msImageSmoothingEnabled = true;
      ctx.imageSmoothingEnabled = true;
      stage.regX = stage.width / 2;
      stage.regY = stage.height / 2;
      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable(stage);
      stage.enableMouseOver(0);
      stage.mouseMoveOutside = false;

            createjs.Ticker.framerate = 20;
            var handleTick = function () {
                $scope.fps = createjs.Ticker.getMeasuredFPS().toFixed(2);
                $scope.$apply();
                stage.update();
            };
            createjs.Ticker.addEventListener("tick", handleTick);

      //EVENTS THAT SHOULD BE USED TO CONTROL THE APP
      $scope.$on('$destroy', function () {
        console.log('destroy');
        createjs.Ticker.framerate = 0;
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

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();


            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

                /**** CALCULATING SCALING ****/
                var scaleY = stage.canvas.height / background.image.height;
                scaleY = scaleY.toFixed(2);
                var scaleX = stage.canvas.width / background.image.width;
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
                background.x = stage.canvas.width / 2;
                background.y = stage.canvas.height / 2;
                stage.addChild(background);
                stage.update();
                var backgroundPosition = background.getTransformedBounds();

                /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

                $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
                    .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                        //Reassigning animations
                        response.animations = {
                            normal: 0,
                            pressed: 1,
                            tap: {
                                frames: [1],
                                next: "normal"
                            }
                        };

                        var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

                        menuButton.addEventListener("mousedown", function (event) {
                            console.log("mousedown event on a button !");
                            menuButton.gotoAndPlay("pressed");
                            stage.update();
                        });

                        menuButton.addEventListener("pressup", function (event) {
                            console.log("pressup event!");
                            menuButton.gotoAndPlay("normal");
                            $ionicHistory.goBack();
                        });

                        menuButton.scaleX = menuButton.scaleY = scale;
                        menuButton.x = 0;
                        menuButton.y = -menuButton.getTransformedBounds().height / 5;

                        stage.addChild(menuButton);
                        stage.update();
                    })
                    .error(function (error) {
                        console.error("Error on getting json for results button...", error);
                    });//end of get menu button


                /************************************** Initializing Page **************************************/

                init();
                function init() {

                    console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
                    if (LocalStorage.get(activityNameInLocalStorage)) {
                        activityData = JSON.parse(LocalStorage.get(activityNameInLocalStorage));
                        console.log("Activity data exist in localStorage and its: ", activityData);
                    } else {
                        var activityUrl = $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.lessonId + "/" + $rootScope.activityFolder + "/draganddrop.json";
                        console.log("trying to get json for the url: ", activityUrl);
                        $http.get(activityUrl)
                            .success(function (response) {
                                console.log("Success on getting json for the url. The response object is: ", response);

                                /*Adding the userAnswer attribute to response object before assigning it to activityData*/
                                _.each(response.questions, function (question, key, value) {
                                    question.userAnswer = "";
                                });

                                //Assigning configured response to activityData
                                activityData = response;

                                //Saving it to localStorage
                                LocalStorage.set(activityNameInLocalStorage, JSON.stringify(activityData));

                                console.log("Newly created activityData with userAnswer attribute: ", activityData);

                            })
                            .error(function (error) {
                                console.log("Error on getting json for the url...", error);
                            });
                    }
                }

                /*Function that restarts the exercise*/
                function restart() {

                    _.each(activityData.questions, function (question, key, value) {
                        question.userAnswer = "";
                    });

                    //Saving to localStorage
                    LocalStorage.set(activityNameInLocalStorage, JSON.stringify(activityData));
                }

                /*Function that checks user answers and calls score function and showAnswers function*/
                function check() {
                    score();
                    showAnswers()
                }


                /*Function that calculates score*/
                function score() {

                    var rightAnswers = 0;
                    _.each(activityData.questions, function (question, key, value) {
                        if (question.userAnswer === question.answer) {
                            rightAnswers++;
                        }
                    });

                    return rightAnswers + " / " + activityData.questions.length;
                }


                /*Function that fills activity questions with the right answers*/
                function showAnswers() {
                    _.each(activityData.questions, function (question, key, value) {
                        question.userAnswer = question.answer;
                    });
                }


                /*Function that goes to the next activity*/
                function next() {



                }


                function collision() {
                }


                function playSound() {

                }

            });//end of image on complete
        }, 500);//end of timeout
    });

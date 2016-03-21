angular.module("bookbuilder2")
    .controller("DraganddropController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, LocalStorage) {

        console.log("Draganddrop loaded!");


        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/

        $rootScope.selectedLesson = {
            "lessonTitle": "Lesson 1",
            "title": "Family shopping",
            "lessonId": "lesson1",
            "lessonMenu": [
                {
                    "name": "Vocabulary 1",
                    "buttonFileName": "first_menu_lesson_1_button_sprite.json",
                    "activityFolder": "vocabulary1",
                    "activityTemplate": "multiple",
                    "numberOfQuestions": 10
                },
                {
                    "name": "Vocabulary 2",
                    "buttonFileName": "first_menu_lesson_1_button_sprite.json",
                    "activityFolder": "vocabulary2",
                    "activityTemplate": "draganddrop",
                    "numberOfQuestions": 5
                },
                {
                    "name": "Vocabulary 3",
                    "buttonFileName": "first_menu_lesson_1_button_sprite.json",
                    "activityFolder": "vocabulary3",
                    "activityTemplate": "multiple",
                    "numberOfQuestions": 5
                },
                {
                    "name": "Grammar 1",
                    "buttonFileName": "first_menu_lesson_1_button_sprite.json",
                    "activityFolder": "grammar1",
                    "activityTemplate": "multiple",
                    "numberOfQuestions": 15
                },
                {
                    "name": "Grammar 2",
                    "buttonFileName": "first_menu_lesson_1_button_sprite.json",
                    "activityFolder": "grammar2",
                    "activityTemplate": "multiple",
                    "numberOfQuestions": 15
                }
            ],
            "lessonButtons": {
                "resultsButtonFileName": "lesson_results_button_sprite.json",
                "vocabularyButtonFileName": "lesson_results_button_sprite.json",
                "readingButtonFileName": "lesson_results_button_sprite.json"
            }
        };
        $rootScope.activityFolder = "vocabulary2";
        $rootScope.rootDir = "";

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
                src: $rootScope.rootDir + "data/assets/vocabulary_background_image_blue.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/vocabulary_background_image_blue.png");

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

                $http.get("data/assets/head_menu_button_sprite.json")
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


                /************************************** Initializing Page & Functions**************************************/

                init();
                function init() {

                    console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
                    if (LocalStorage.get(activityNameInLocalStorage)) {
                        activityData = JSON.parse(LocalStorage.get(activityNameInLocalStorage));
                        console.log("Activity data exist in localStorage and its: ", activityData);
                    } else {
                        var activityUrl = "data/lessons/" + $rootScope.selectedLesson.lessonId + "/" + $rootScope.activityFolder + "/draganddrop.json";
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

                    return "Score: " + rightAnswers + " / " + activityData.questions.length;
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


                /* ------------------------------------------ TITLE ---------------------------------------------- */

                console.log("Title: ", activityData.title);
                var title = new createjs.Text(activityData.title, "27px Arial", "white");

                /*background.scaleX = background.scaleY = scale;*/
                title.scaleX = title.scaleY = scale;
                title.x = backgroundPosition.x + (backgroundPosition.width / 10);
                title.y = backgroundPosition.y + (backgroundPosition.height / 15);
                title.textBaseline = "alphabetic";

                stage.addChild(title);
                stage.update();

                /* ------------------------------------------ SCORE ---------------------------------------------- */


                console.log("Title: ", score());
                var scoreText = new createjs.Text(score(), "27px Arial", "white");

                /*background.scaleX = background.scaleY = scale;*/
                scoreText.scaleX = scoreText.scaleY = scale;
                scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
                scoreText.y = backgroundPosition.y + (backgroundPosition.height / 15);
                scoreText.textBaseline = "alphabetic";

                stage.addChild(scoreText);
                stage.update();


                /* ------------------------------------------ Lesson Title ---------------------------------------------- */


                var lessonTitle = new createjs.Text($rootScope.selectedLesson.lessonTitle, "27px Arial", "yellow");

                /*background.scaleX = background.scaleY = scale;*/
                lessonTitle.scaleX = lessonTitle.scaleY = scale;
                lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 10);
                lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 1.05);
                lessonTitle.textBaseline = "alphabetic";

                stage.addChild(lessonTitle);
                stage.update();


                /* ------------------------------------------ DESCRIPTION SHAPE AND TITLE ---------------------------------------------- */

                //Starting and making it transparent
                var descriptionGraphics = new createjs.Graphics().beginFill("#69B8C7");


                //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                descriptionGraphics.drawRoundRect(0, 0, 280, 30, 1);

                var descriptionShape = new createjs.Shape(descriptionGraphics);
                descriptionShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 1.43), backgroundPosition.y
                    + (backgroundPosition.height / 12), scale, scale, 0, 0, 0, 0, 0);
                stage.addChild(descriptionShape);
                stage.update();


                console.log(activityData.description);
                var descriptionText = new createjs.Text(activityData.description, "20px Arial", "white");

                /*background.scaleX = background.scaleY = scale;*/
                descriptionText.scaleX = descriptionText.scaleY = scale;
                descriptionText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
                descriptionText.y = backgroundPosition.y + (backgroundPosition.height / 9);
                descriptionText.textBaseline = "alphabetic";

                stage.addChild(descriptionText);
                stage.update();


                /* ------------------------------------------ QUESTIONS & ANSWERS ---------------------------------------------- */

                /*Populating template with questions*/

                //QUESTIONS
                var questionsContainer = new createjs.Container();
                /*It's important too define containers height before start calculating buttons*/
                questionsContainer.width = 700;
                questionsContainer.height = 530;

                questionsContainer.scaleX = questionsContainer.scaleY = scale;

                questionsContainer.x = backgroundPosition.x + (backgroundPosition.width / 30);
                questionsContainer.y = backgroundPosition.y + (backgroundPosition.height / 30);

                stage.addChild(questionsContainer);
                stage.update();


                //Starting and making it transparent
                var testGraphics = new createjs.Graphics().beginFill("red");


                //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                testGraphics.drawRoundRect(0, 0, questionsContainer.width, questionsContainer.height, 1);

                var testShape = new createjs.Shape(testGraphics);
                testShape.setTransform(questionsContainer.x, questionsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                questionsContainer.addChild(testShape);
                stage.update();

                var someGap = "__________";

                /*Starting to filling questions*/

                var questionY = 0;

                _.each(activityData.questions, function (question, key, list) {
                    var formattedQuestion = question.pretext + someGap + question.postext;
                    console.log("Question that it will be added: ", formattedQuestion);

                    var questionText = new createjs.Text(formattedQuestion, "20px Arial", "black");

                    /*background.scaleX = background.scaleY = scale;*/
                    questionText.scaleX = questionText.scaleY = scale;
                    questionText.x = backgroundPosition.x + (backgroundPosition.width / 30);
                    questionText.y = backgroundPosition.y + (backgroundPosition.height / (questionY += 1));
                    questionText.textBaseline = "alphabetic";

                    questionsContainer.addChild(questionText);
                    stage.update();
                });


                //ANSWERS
                var answersContainer = new createjs.Container();
                /*It's important too define containers height before start calculating buttons*/
                answersContainer.width = 270;
                answersContainer.height = 530;

                answersContainer.scaleX = answersContainer.scaleY = scale;

                answersContainer.x = backgroundPosition.x + (backgroundPosition.width / 2.75);
                answersContainer.y = backgroundPosition.y + (backgroundPosition.height / 30);

                stage.addChild(answersContainer);
                stage.update();


                //Starting and making it transparent
                var test2Graphics = new createjs.Graphics().beginFill("orange");


                //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                test2Graphics.drawRoundRect(0, 0, answersContainer.width, answersContainer.height, 1);

                var test2Shape = new createjs.Shape(test2Graphics);
                test2Shape.setTransform(answersContainer.x, answersContainer.y, scale, scale, 0, 0, 0, 0, 0);
                answersContainer.addChild(test2Shape);
                stage.update();


                /* ------------------------------------------ BUTTONS ---------------------------------------------- */

                /*RESTART BUTTON*/
                $http.get($rootScope.rootDir + "data/assets/lesson_restart_button_sprite.json")
                    .success(function (response) {

                        console.log("Success on getting data for restartButton!");

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

                        var returnButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var returnButton = new createjs.Sprite(returnButtonSpriteSheet, "normal");

                        returnButton.addEventListener("mousedown", function (event) {
                            console.log("mousedown event on a button !");
                            returnButton.gotoAndPlay("pressed");
                            stage.update();
                        });

                        returnButton.addEventListener("pressup", function (event) {
                            console.log("pressup event!");
                            returnButton.gotoAndPlay("normal");

                            //action

                        });
                        returnButton.scaleX = returnButton.scaleY = scale;
                        returnButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                        returnButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);
                        stage.addChild(returnButton);
                        stage.update();
                    })
                    .error(function (error) {

                        console.log("Error on getting json data for return button...", error);

                    });


                /*CHECK BUTTON*/
                $http.get($rootScope.rootDir + "data/assets/lesson_check_button_sprite.json")
                    .success(function (response) {

                        console.log("Success on getting data for checkButton!");

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

                        var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                        checkButton.addEventListener("mousedown", function (event) {
                            console.log("mousedown event on a button !");
                            checkButton.gotoAndPlay("pressed");
                            stage.update();
                        });

                        checkButton.addEventListener("pressup", function (event) {
                            console.log("pressup event!");
                            checkButton.gotoAndPlay("normal");

                            //action

                        });
                        checkButton.scaleX = checkButton.scaleY = scale;
                        checkButton.x = backgroundPosition.x + (backgroundPosition.width / 1.5);
                        checkButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);
                        stage.addChild(checkButton);
                        stage.update();
                    })
                    .error(function (error) {

                        console.log("Error on getting json data for check button...", error);

                    });


                /*NEXT BUTTON*/
                $http.get($rootScope.rootDir + "data/assets/lesson_next_button_sprite.json")
                    .success(function (response) {

                        console.log("Success on getting data for checkButton!");

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

                        var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                        nextButton.addEventListener("mousedown", function (event) {
                            console.log("mousedown event on a button !");
                            nextButton.gotoAndPlay("pressed");
                            stage.update();
                        });

                        nextButton.addEventListener("pressup", function (event) {
                            console.log("pressup event!");
                            nextButton.gotoAndPlay("normal");

                            //action

                        });
                        nextButton.scaleX = nextButton.scaleY = scale;
                        nextButton.x = backgroundPosition.x + (backgroundPosition.width / 1.13);
                        nextButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);
                        stage.addChild(nextButton);
                        stage.update();
                    })
                    .error(function (error) {

                        console.log("Error on getting json data for check button...", error);

                    });


            });//end of image on complete
        }, 500);//end of timeout
    });

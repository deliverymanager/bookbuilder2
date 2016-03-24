angular.module("bookbuilder2")
    .controller("MultipleController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, LocalStorage) {

        console.log("MultipleController loaded!");


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

        $rootScope.activityFolder = "vocabulary1";
        $rootScope.rootDir = "";


        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/

        /*Page Initializations*/
        $scope.activeQuestionIndex = 0;

        /*Each activity projected to activityData and application retrieves it from localStorage
         if it's not located in localStorage controller initializes an object */
        $scope.activityData = {};

        /*Name of activity in localStorage*/
        var activityNameInLocalStorage = $rootScope.selectedLesson.lessonId + "_" + $rootScope.activityFolder;
        console.log("Name of activity in localStorage: ", activityNameInLocalStorage);

        $timeout(function () {

            var stage = new createjs.Stage(document.getElementById("multipleCanvas"));
            var ctx = document.getElementById("multipleCanvas").getContext("2d");
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
                src: $rootScope.rootDir + "data/assets/background_image_for_lesson_activities_blue.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/background_image_for_lesson_activities_blue.png");

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

                /************************************** Initializing Page & Functions **************************************/

                init();
                function init() {

                    console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
                    if (LocalStorage.get(activityNameInLocalStorage)) {
                        $scope.activityData = JSON.parse(LocalStorage.get(activityNameInLocalStorage));
                        addScoreText();
                        questionsConfiguration();
                        console.log("Activity data exist in localStorage and its: ", $scope.activityData);
                    } else {
                        var activityUrl = "data/lessons/" + $rootScope.selectedLesson.lessonId + "/" + $rootScope.activityFolder + "/multiple.json";
                        console.log("Trying to get json for the url: ", activityUrl);
                        $http.get(activityUrl)
                            .success(function (response) {
                                console.log("Success on getting json for the url. The response object is: ", response);

                                /*Adding the userAnswer attribute to response object before assigning it to $scope.activityData*/
                                _.each(response.questions, function (question, key, value) {
                                    question.userAnswer = "";
                                });

                                //Assigning configured response to $scope.activityData
                                $scope.activityData = response;

                                addScoreText();
                                questionsConfiguration();

                                //Saving it to localStorage
                                LocalStorage.set(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                                console.log("Newly created $scope.activityData with userAnswer attribute: ", $scope.activityData);

                            })
                            .error(function (error) {
                                console.log("Error on getting json for the url...:", error);
                            });
                    }
                }


                /* ------------------------------------------ TITLE ---------------------------------------------- */

                console.log("Title: ", $scope.activityData.title);
                var title = new createjs.Text($scope.activityData.title, "27px Arial", "white");

                /*background.scaleX = background.scaleY = scale;*/
                title.scaleX = title.scaleY = scale;
                title.x = backgroundPosition.x + (backgroundPosition.width / 10);
                title.y = backgroundPosition.y + (backgroundPosition.height / 15);
                title.textBaseline = "alphabetic";

                stage.addChild(title);
                stage.update();

                /* ------------------------------------------ SCORE ---------------------------------------------- */

                function addScoreText() {
                    console.log("Title: ", score());
                    var scoreText = new createjs.Text(score(), "27px Arial", "white");

                    /*background.scaleX = background.scaleY = scale;*/
                    scoreText.scaleX = scoreText.scaleY = scale;
                    scoreText.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
                    scoreText.y = backgroundPosition.y + (backgroundPosition.height / 15);
                    scoreText.textBaseline = "alphabetic";

                    stage.addChild(scoreText);
                    stage.update();
                }


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


                console.info("Description of activity: ", $scope.activityData.description);
                var descriptionText = new createjs.Text($scope.activityData.description, "18px Arial", "white");

                /*background.scaleX = background.scaleY = scale;*/
                descriptionText.scaleX = descriptionText.scaleY = scale;
                descriptionText.x = backgroundPosition.x + (backgroundPosition.width / 1.4);
                descriptionText.y = backgroundPosition.y + (backgroundPosition.height / 8.7);
                descriptionText.textBaseline = "alphabetic";

                stage.addChild(descriptionText);
                stage.update();


                /* ------------------------------------------ QUESTIONS & ANSWERS ---------------------------------------------- */

                /***----------------------------------- QUESTIONS -----------------------------------***/
                //Container
                var questionsContainer = new createjs.Container();
                /*It's important too define containers height before start calculating buttons*/
                questionsContainer.width = 975;
                questionsContainer.height = 265;

                questionsContainer.scaleX = questionsContainer.scaleY = scale;

                questionsContainer.x = backgroundPosition.x + (backgroundPosition.width / 30);
                questionsContainer.y = backgroundPosition.y + (backgroundPosition.height / 30);

                stage.addChild(questionsContainer);
                stage.update();

                /*//Starting and making it transparent
                 var testGraphics = new createjs.Graphics().beginFill("red");


                 //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                 testGraphics.drawRoundRect(0, 0, questionsContainer.width, questionsContainer.height, 1);

                 var testShape = new createjs.Shape(testGraphics);
                 testShape.setTransform(questionsContainer.x, questionsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                 questionsContainer.addChild(testShape);
                 stage.update();*/

                //backgroundPage
                var questionBackground = new createjs.Bitmap("data/assets/multiple_choice_text_bubble.png");

                questionBackground.regX = questionsContainer.regX;
                questionBackground.regY = questionsContainer.regY;
                questionBackground.x = questionsContainer.x;
                questionBackground.y = questionsContainer.y;
                questionsContainer.addChild(questionBackground);
                stage.update();


                updateQuestionIndexAndText();
                function updateQuestionIndexAndText() {

                    console.log("$scope.activityData: ", $scope.activityData);
                    console.log("$scope.activityData.questions: ", $scope.activityData.questions);
                    console.log("$scope.activeQuestionIndex: ", $scope.activeQuestionIndex);

                    var emptyString = "__________";
                    var formattedQuestion = $scope.activityData.questions[$scope.activeQuestionIndex].pretext
                        + emptyString
                        + $scope.activityData.questions[$scope.activeQuestionIndex].midtext
                        + ($scope.activityData.questions[$scope.activeQuestionIndex].midtext === '' ? '' : emptyString)
                        + $scope.activityData.questions[$scope.activeQuestionIndex].postext;
                    $scope.questionText = new createjs.Text(formattedQuestion, "23px Arial", "#69B8C7");

                    $scope.questionText.x = backgroundPosition.x + (backgroundPosition.width / 5);
                    $scope.questionText.y = backgroundPosition.y + (backgroundPosition.height / 5);
                    $scope.questionText.textBaseline = "alphabetic";
                    $scope.questionText.maxWidth = questionsContainer.width;
                    $scope.questionText.lineHeight = 30;

                    questionsContainer.addChild($scope.questionText);
                    stage.update();

                    //Index
                    $scope.indexText = new createjs.Text($scope.activeQuestionIndex + 1, "33px Arial", "orange");

                    $scope.indexText.x = backgroundPosition.x + (backgroundPosition.width / 16.5);
                    $scope.indexText.y = backgroundPosition.y + (backgroundPosition.height / 9.5);
                    $scope.indexText.textBaseline = "alphabetic";
                    $scope.indexText.maxWidth = questionsContainer.width;

                    questionsContainer.addChild($scope.indexText);
                    stage.update();

                    questionsContainer.addChild($scope.questionText);
                    stage.update();
                }


                /***----------------------------------- ANSWERS -----------------------------------***/
                //Container
                var answersContainer = new createjs.Container();
                /*It's important too define containers height before start calculating buttons*/
                answersContainer.width = 975;
                answersContainer.height = 185;

                answersContainer.scaleX = answersContainer.scaleY = scale;

                answersContainer.x = backgroundPosition.x + (backgroundPosition.width / 30);
                answersContainer.y = backgroundPosition.y + (backgroundPosition.height / 4.45);

                stage.addChild(answersContainer);
                stage.update();

                /*Populating answers*/

                $http.get("data/assets/multiple_choice_choice_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                        var answerButtonSpriteSheet = new createjs.SpriteSheet(response);


                        /**------------- A -------------**/
                        var answerAButton = new createjs.Sprite(answerButtonSpriteSheet, "white");


                        /*Button event when it's clicked*/
                        answerAButton.addEventListener("pressup", function (event) {
                            console.log("Answer button fires pressup event!");

                            console.log("Event information: ", event);

                            /*Updating the properties regarding question after user selected an answer*/
                            $scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer = true;
                            $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer
                                = $scope.activityData.questions[$scope.activeQuestionIndex].aChoice;

                            console.log("Has user answered the selected question? : ",$scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer);
                            if($scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer){
                                console.log("The user's choice is :",$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer);
                            }

                            /*Before the button goes and plays "grey" animation all buttons have to play "white" animation*/
                            _.each(answersContainer.children, function(child, key, list){
                                if(child.currentAnimation){
                                    child.gotoAndPlay("white");
                                }
                            });
                            /*Button plays the grey animation indicating that is the user's choice*/
                            answerAButton.gotoAndPlay("grey");
                            $ionicHistory.goBack();
                        });

                        answerAButton.x = answersContainer.x + 10 * scale;
                        answerAButton.y = answersContainer.y + 10 * scale;

                        answersContainer.addChild(answerAButton);
                        stage.update();

                        //Answer button Letter + Text

                        var answerAButtonLetter = new createjs.Text("a.", "33px Arial", "#69B8C7");

                        answerAButtonLetter.x = backgroundPosition.x + (backgroundPosition.width / 15);
                        answerAButtonLetter.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                        answerAButtonLetter.textBaseline = "alphabetic";
                        answerAButtonLetter.maxWidth = questionsContainer.width;

                        answersContainer.addChild(answerAButtonLetter);
                        stage.update();

                        //


                        /**------------- B -------------**/
                        var answerBButton = new createjs.Sprite(answerButtonSpriteSheet, "white");


                        /*Button event when it's clicked*/
                        answerBButton.addEventListener("pressup", function (event) {
                            console.log("Answer button fires pressup event!");

                            console.log("Event information: ", event);

                            /*Updating the properties regarding question after user selected an answer*/
                            $scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer = true;
                            $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer
                                = $scope.activityData.questions[$scope.activeQuestionIndex].bChoice;

                            console.log("Has user answered the selected question? : ",$scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer);
                            if($scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer){
                                console.log("The user's choice is :",$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer);
                            }

                            /*Before the button goes and plays "grey" animation all buttons have to play "white" animation*/
                            _.each(answersContainer.children, function(child, key, list){
                                if(child.currentAnimation){
                                    child.gotoAndPlay("white");
                                }
                            });

                            /*Button plays the grey animation indicating that is the user's choice*/
                            answerBButton.gotoAndPlay("grey");
                            $ionicHistory.goBack();
                        });

                        answerBButton.x = answersContainer.x + 470 * scale;
                        answerBButton.y = answersContainer.y + 10 * scale;

                        answersContainer.addChild(answerBButton);
                        stage.update();


                        //Answer button Letter + Text
                        var answerBButtonLetter = new createjs.Text("b.", "33px Arial", "#69B8C7");

                        answerBButtonLetter.x = backgroundPosition.x + (backgroundPosition.width / 2);
                        answerBButtonLetter.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                        answerBButtonLetter.textBaseline = "alphabetic";
                        answersContainer.addChild(answerBButtonLetter);
                        stage.update();

                        //

                        /**------------- C1 -------------**/

                        if ($scope.activityData.questions[$scope.activeQuestionIndex].cChoice !== "" && $scope.activityData.questions[$scope.activeQuestionIndex].dChoice !== "") {
                            var answerC1Button = new createjs.Sprite(answerButtonSpriteSheet, "white");

                            /*Button event when it's clicked*/
                            answerC1Button.addEventListener("pressup", function (event) {
                                console.log("Answer button fires pressup event!");

                                console.log("Event information: ", event);

                                /*Updating the properties regarding question after user selected an answer*/
                                $scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer = true;
                                $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer
                                    = $scope.activityData.questions[$scope.activeQuestionIndex].cChoice;

                                console.log("Has user answered the selected question? : ",$scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer);
                                if($scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer){
                                    console.log("The user's choice is :",$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer);
                                }

                                /*Before the button goes and plays "grey" animation all buttons have to play "white" animation*/
                                _.each(answersContainer.children, function(child, key, list){
                                    if(child.currentAnimation){
                                        child.gotoAndPlay("white");
                                    }
                                });

                                /*Button plays the grey animation indicating that is the user's choice*/
                                answerC1Button.gotoAndPlay("grey");
                                $ionicHistory.goBack();
                            });
                            answerC1Button.x = answersContainer.x + 10 * scale;
                            answerC1Button.y = answersContainer.y + 100 * scale;

                            answersContainer.addChild(answerC1Button);
                            stage.update();


                            //Answer button Letter + Text
                            var answerC1ButtonLetter = new createjs.Text("c.", "33px Arial", "#69B8C7");

                            answerC1ButtonLetter.x = backgroundPosition.x + (backgroundPosition.width / 2);
                            answerC1ButtonLetter.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                            answerC1ButtonLetter.textBaseline = "alphabetic";
                            answerC1ButtonLetter.maxWidth = questionsContainer.width;

                            answersContainer.addChild(answerC1ButtonLetter);
                            stage.update();

                            //Text of the button updates dynamically

                        }//End of if


                        /**------------- C2 -------------**/

                        if ($scope.activityData.questions[$scope.activeQuestionIndex].cChoice !== "" && $scope.activityData.questions[$scope.activeQuestionIndex].dChoice === "") {
                            var answerC2Button = new createjs.Sprite(answerButtonSpriteSheet, "white");

                            /*Button event when it's clicked*/
                            answerC2Button.addEventListener("pressup", function (event) {
                                console.log("Answer button fires pressup event!");

                                console.log("Event information: ", event);

                                /*Updating the properties regarding question after user selected an answer*/
                                $scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer = true;
                                $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer
                                    = $scope.activityData.questions[$scope.activeQuestionIndex].cChoice;

                                console.log("Has user answered the selected question? : ",$scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer);
                                if($scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer){
                                    console.log("The user's choice is :",$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer);
                                }

                                /*Before the button goes and plays "grey" animation all buttons have to play "white" animation*/
                                _.each(answersContainer.children, function(child, key, list){
                                    if(child.currentAnimation){
                                        child.gotoAndPlay("white");
                                    }
                                });

                                /*Button plays the grey animation indicating that is the user's choice*/
                                answerC2Button.gotoAndPlay("grey");
                                $ionicHistory.goBack();
                            });

                            answerC2Button.x = answersContainer.x + 235 * scale;
                            answerC2Button.y = answersContainer.y + 100 * scale;

                            answersContainer.addChild(answerC2Button);
                            stage.update();

                            //Answer button Letter + Text
                            var answerC2ButtonLetter = new createjs.Text("c.", "33px Arial", "#69B8C7");

                            answerC2ButtonLetter.x = backgroundPosition.x + (backgroundPosition.width / 3.5);
                            answerC2ButtonLetter.y = backgroundPosition.y + (backgroundPosition.height / 2.3);

                            answerC2ButtonLetter.textBaseline = "alphabetic";
                            answerC2ButtonLetter.maxWidth = questionsContainer.width;

                            answersContainer.addChild(answerC2ButtonLetter);
                            stage.update();

                            //Text of the button updates dynamically

                        }//end of if


                        /**------------- D -------------**/
                        if ($scope.activityData.questions[$scope.activeQuestionIndex].dChoice !== "") {
                            var answerDButton = new createjs.Sprite(answerButtonSpriteSheet, "white");

                            /*Button event when it's clicked*/
                            answerDButton.addEventListener("pressup", function (event) {
                                console.log("Answer button fires pressup event!");

                                console.log("Event information: ", event);

                                /*Updating the properties regarding question after user selected an answer*/
                                $scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer = true;
                                $scope.activityData.questions[$scope.activeQuestionIndex].userAnswer
                                    = $scope.activityData.questions[$scope.activeQuestionIndex].dChoice;

                                console.log("Has user answered the selected question? : ",$scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer);
                                if($scope.activityData.questions[$scope.activeQuestionIndex].hasAnswer){
                                    console.log("The user's choice is :",$scope.activityData.questions[$scope.activeQuestionIndex].userAnswer);
                                }

                                /*Before the button goes and plays "grey" animation all buttons have to play "white" animation*/
                                _.each(answersContainer.children, function(child, key, list){
                                    if(child.currentAnimation){
                                        child.gotoAndPlay("white");
                                    }
                                });

                                /*Button plays the grey animation indicating that is the user's choice*/
                                answerDButton.gotoAndPlay("grey");
                                $ionicHistory.goBack();
                            });
                            answerDButton.x = answersContainer.x + 470 * scale;
                            answerDButton.y = answersContainer.y + 100 * scale;

                            answersContainer.addChild(answerDButton);
                            stage.update();


                            //Answer button Letter + Text
                            var answerDButtonLetter = new createjs.Text("d.", "33px Arial", "#69B8C7");

                            answerDButtonLetter.x = backgroundPosition.x + (backgroundPosition.width / 2);
                            answerDButtonLetter.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                            answerDButtonLetter.textBaseline = "alphabetic";
                            answerDButtonLetter.maxWidth = questionsContainer.width;

                            answersContainer.addChild(answerDButtonLetter);
                            stage.update();

                            var answerDButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].dChoice, "25px Arial", "#69B8C7");

                            answerDButtonText.x = backgroundPosition.x + (backgroundPosition.width / 3);
                            answerDButtonText.y = backgroundPosition.y + (backgroundPosition.height / 2.5);

                            answerDButtonText.textBaseline = "alphabetic";
                            answerDButtonText.maxWidth = questionsContainer.width;

                            answersContainer.addChild(answerDButtonText);
                            stage.update();

                            //Text of the button updates dynamically

                        }//end of if

                        /*Calling the updateQuestionAnswersTexts() function to fill the buttons with the choices of the first question*/
                        updateQuestionAnswersTexts();
                    })
                    .error(function (error) {
                        console.error("Error on getting json for answer button...", error);
                    });//end of get menu button


                /******* Function that dynamically updates the text of buttons *********/
                function updateQuestionAnswersTexts() {

                    //For A button
                    $scope.answerAButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].aChoice, "25px Arial", "#69B8C7");

                    $scope.answerAButtonText.x = backgroundPosition.x + (backgroundPosition.width / 9);
                    $scope.answerAButtonText.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                    $scope.answerAButtonText.textBaseline = "alphabetic";

                    answersContainer.addChild($scope.answerAButtonText);
                    stage.update();

                    //For B button
                    $scope.answerBButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].bChoice, "25px Arial", "#69B8C7");

                    $scope.answerBButtonText.x = backgroundPosition.x + (backgroundPosition.width / 1.8);
                    $scope.answerBButtonText.y = backgroundPosition.y + (backgroundPosition.height / 3.3);

                    $scope.answerBButtonText.textBaseline = "alphabetic";
                    $scope.answerBButtonText.maxWidth = questionsContainer.width;

                    answersContainer.addChild($scope.answerBButtonText);
                    stage.update();

                    //For C1 button
                    if ($scope.activityData.questions[$scope.activeQuestionIndex].cChoice !== "" && $scope.activityData.questions[$scope.activeQuestionIndex].dChoice !== "") {
                        $scope.answerC1ButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].cChoice, "25px Arial", "#69B8C7");

                        $scope.answerC1ButtonText.x = backgroundPosition.x + (backgroundPosition.width / 3);
                        $scope.answerC1ButtonText.y = backgroundPosition.y + (backgroundPosition.height / 2.5);

                        $scope.answerC1ButtonText.textBaseline = "alphabetic";
                        $scope.answerC1ButtonText.maxWidth = questionsContainer.width;

                        answersContainer.addChild($scope.answerC1ButtonText);
                        stage.update();
                    }


                    //For C2 button
                    if ($scope.activityData.questions[$scope.activeQuestionIndex].cChoice !== "" && $scope.activityData.questions[$scope.activeQuestionIndex].dChoice === "") {

                        $scope.answerC2ButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].cChoice, "25px Arial", "#69B8C7");

                        $scope.answerC2ButtonText.x = backgroundPosition.x + (backgroundPosition.width / 3);
                        $scope.answerC2ButtonText.y = backgroundPosition.y + (backgroundPosition.height / 2.3);

                        $scope.answerC2ButtonText.textBaseline = "alphabetic";
                        $scope.answerC2ButtonText.maxWidth = questionsContainer.width;

                        answersContainer.addChild($scope.answerC2ButtonText);
                        stage.update();

                    }


                    //For D button
                    if ($scope.activityData.questions[$scope.activeQuestionIndex].dChoice !== "") {
                        $scope.answerDButtonText = new createjs.Text($scope.activityData.questions[$scope.activeQuestionIndex].dChoice, "25px Arial", "#69B8C7");

                        $scope.answerDButtonText.x = backgroundPosition.x + (backgroundPosition.width / 3);
                        $scope.answerDButtonText.y = backgroundPosition.y + (backgroundPosition.height / 2.5);

                        $scope.answerDButtonText.textBaseline = "alphabetic";
                        $scope.answerDButtonText.maxWidth = questionsContainer.width;

                        answersContainer.addChild($scope.answerDButtonText);
                        stage.update();
                    }
                }


                /***----------------------------------- BOTTOM BAR -----------------------------------***/
                //Container
                var bottomBarContainer = new createjs.Container();
                /*It's important too define containers height before start calculating buttons*/
                bottomBarContainer.width = 975;
                bottomBarContainer.height = 80;

                bottomBarContainer.scaleX = bottomBarContainer.scaleY = scale;

                bottomBarContainer.x = backgroundPosition.x + (backgroundPosition.width / 30);
                bottomBarContainer.y = backgroundPosition.y + (backgroundPosition.height / 2.78);
                stage.addChild(bottomBarContainer);
                stage.update();


                //Creating Yellow Bar
                var yellowBar = new createjs.Bitmap("data/assets/lesson_yellow_line.png");

                yellowBar.regX = yellowBar.image.width / 2;
                yellowBar.regY = yellowBar.image.height / 2;
                yellowBar.x = bottomBarContainer.x / 0.2;
                yellowBar.y = bottomBarContainer.y / 0.95;
                bottomBarContainer.addChild(yellowBar);
                stage.update();


                /*Yellow bar button Sprite Button*/
                $http.get("data/assets/yellow_line_big_bubble.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                        var yellowBarButtonSpriteSheet = new createjs.SpriteSheet(response);

                        var yellowBarButtonX = bottomBarContainer.x + 180 * scale;

                        /*Populating yellow bar*/
                        _.each($scope.activityData.questions, function (question, key, list) {

                            var yellowBarButton = new createjs.Sprite(yellowBarButtonSpriteSheet, "white");

                            //Button event for pressing the button and selecting new question
                            yellowBarButton.addEventListener("pressup", function (event) {
                                console.log("Button fires a pressup event!");

                                //Reinitializing scale for all yellowBar buttons
                                _.each(bottomBarContainer.children, function(button, key, list){
                                    button.scaleX = button.scaleY = scale;
                                });

                                console.log("Getting question for index: ", key);
                                loadNewQuestion(key);
                                yellowBarButton.scaleX = yellowBarButton.scaleY = scale * 1.2;
                            });

                            //Checking if user has answered
                            if (question.hasAnswer) {
                                yellowBarButton.gotoAndPlay("grey");
                            }

                            /*Initializing first yellowBarButton as selected*/
                            key === 0 ? yellowBarButton.scaleX = yellowBarButton.scaleY = scale * 1.2
                                : yellowBarButton.scaleX = yellowBarButton.scaleY = scale;

                            yellowBarButton.x = yellowBarButtonX;
                            yellowBarButton.y = bottomBarContainer.y - 15 * scale;
                            yellowBarButtonX += 58;

                            bottomBarContainer.addChild(yellowBarButton);
                            stage.update();

                            /*Adding the text index*/
                            var yellowBarButtonIndex = new createjs.Text(key + 1, "20px Arial", "black");

                            yellowBarButtonIndex.x = yellowBarButton.x + 21 * scale;
                            yellowBarButtonIndex.y = backgroundPosition.y + (backgroundPosition.height / 2.7);
                            yellowBarButtonIndex.textBaseline = "alphabetic";
                            yellowBarButtonIndex.textAlign = "center";
                            yellowBarButtonIndex.maxWidth = questionsContainer.width;

                            bottomBarContainer.addChild(yellowBarButtonIndex);
                            stage.update();

                        });


                    })
                    .error(function (error) {
                        console.error("Error on getting json for answer button...", error);
                    });//end of get menu button


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


                /************************************************************************************************
                 **                                  | APPLICATION FUNCTIONS |                                 **
                 ************************************************************************************************/

                /*Function for changing question by clicking to a yellow bar button*/
                function changeQuestion() {

                }

                /*Function for loading new question*/
                function loadNewQuestion(index) {
                    $scope.activeQuestionIndex = index;
                    questionsContainer.removeChild($scope.questionText);
                    questionsContainer.removeChild($scope.indexText);
                    updateQuestionIndexAndText();

                    answersContainer.removeChild($scope.answerAButtonText);
                    answersContainer.removeChild($scope.answerBButtonText);
                    if ($scope.answerC1ButtonText) {
                        answersContainer.removeChild($scope.answerC1ButtonText);
                    }
                    if ($scope.answerC2ButtonText) {
                        answersContainer.removeChild($scope.answerC2ButtonText);
                    }
                    if ($scope.answerDButtonText) {
                        answersContainer.removeChild($scope.answerDButtonText);
                    }

                    updateQuestionAnswersTexts();
                }


                /*Function for filling questions with the attribute hasAnswer */
                function questionsConfiguration() {
                    _.each($scope.activityData.questions, function (question, key, list) {
                        $scope.activityData.questions[key].hasAnswer = false;
                        console.info("Updated question in $scope.activityData.questions: ", $scope.activityData.questions);
                    })
                }


                /*Function that restarts the exercise*/
                function restart() {

                    _.each($scope.activityData.questions, function (question, key, value) {
                        question.userAnswer = "";
                    });

                    //Saving to localStorage
                    LocalStorage.set(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                }

                /*Function that checks user answers and calls score function and showAnswers function*/
                function check() {
                    score();
                    showAnswers()
                }


                /*Function that calculates score*/
                function score() {

                    var rightAnswers = 0;
                    _.each($scope.activityData.questions, function (question, key, value) {
                        if (question.userAnswer === question.answer) {
                            rightAnswers++;
                        }
                    });

                    return "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
                }


                /*Function that fills activity questions with the right answers*/
                function showAnswers() {
                    _.each($scope.activityData.questions, function (question, key, value) {
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

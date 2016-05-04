angular.module("bookbuilder2")
    .controller("educationController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

        console.log("educationController loaded!");
        //START OF DEVELOPMENT SNIPPET
        if (window.cordova && window.cordova.platformId !== "browser") {
            $rootScope.rootDir = window.cordova.file.dataDirectory;
        } else {
            $rootScope.rootDir = "";
        }
        $rootScope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
        $rootScope.activityFolder = window.localStorage.getItem("activityFolder");
        $rootScope.activityName = window.localStorage.getItem("activityName");
        //END OF DEVELOPMENT SNIPPET

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
                src: $rootScope.rootDir + "data/assets/education_background_image.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/education_background_image.png");

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
                console.log("GENERAL SCALING FACTOR: ", scale);

                background.scaleX = scale;
                background.scaleY = scale;
                background.regX = background.image.width / 2;
                background.regY = background.image.height / 2;
                background.x = $scope.stage.canvas.width / 2;
                background.y = $scope.stage.canvas.height / 2;
                $scope.stage.addChild(background);
                var backgroundPosition = background.getTransformedBounds();
                console.log("backgroundPosition: ", backgroundPosition);


                /* ------------------------------------------ GENERAL INITIALIZATION ---------------------------------------------- */

                /*Every time the user selects a letter, it will be added to the following array*/
                $scope.selectedLettersArray = [];
                $scope.questionIndex = 0;

                /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
                $scope.mainContainer = new createjs.Container();
                $scope.mainContainer.width = background.image.width;
                $scope.mainContainer.height = background.image.height;
                $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
                $scope.mainContainer.x = backgroundPosition.x;
                $scope.mainContainer.y = backgroundPosition.y;
                $scope.stage.addChild($scope.mainContainer);

                //mainContainer Background
                var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
                var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
                mainContainerBackground.alpha = 0.5;

                $scope.mainContainer.addChild(mainContainerBackground);


                /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

                $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                        var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

                        menuButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on Menu button !");
                            menuButton.gotoAndPlay("onSelection");
                        });

                        menuButton.addEventListener("pressup", function (event) {

                            createjs.Tween.removeAllTweens();

                            console.log("Press up event on Menu event!");
                            menuButton.gotoAndPlay("normal");
                            $ionicHistory.nextViewOptions({
                                historyRoot: true,
                                disableBack: true
                            });
                            $state.go("lessonNew", {}, {reload: true});
                        });

                        menuButton.scaleX = menuButton.scaleY = scale;
                        menuButton.x = 0;
                        menuButton.y = -menuButton.getTransformedBounds().height / 5;

                        $scope.stage.addChild(menuButton);
                    })
                    .error(function (error) {
                        console.error("Error on getting json for results button...", error);
                    });//end of get menu button


                /************************************** Initializing Page **************************************/

                console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
                if (window.localStorage.getItem(activityNameInLocalStorage)) {

                    $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
                    console.log("activityData: ", $scope.activityData);

                    /*Adding page title and description*/
                    $scope.pageTitleAndDescription = new createjs.Text($scope.activityData.title + " - " + $scope.activityData.description, "23px Arial", "white");
                    $scope.pageTitleAndDescription.x = 85;
                    $scope.pageTitleAndDescription.y = 623;
                    $scope.mainContainer.addChild($scope.pageTitleAndDescription);

                    init();
                    updateScore();

                } else {

                    console.warn("There is no activity...Getting the json through $http.get()");

                    console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
                    console.log("activityFolder: ", $rootScope.activityFolder);

                    $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/education.json")
                        .success(function (response) {
                            console.log("Success on getting json for the url. The response object is: ", response);

                            //Assigning configured response to activityData
                            $scope.activityData = response;
                            $scope.activityData.attempts = 1;

                            /*Adding the userAnswer attribute to response object before assigning it to activityData*/
                            _.each($scope.activityData.questions, function (question, key, value) {
                                $scope.activityData.questions[key].userAnswer = "";
                            });

                            init();

                            //Saving it to localStorage
                            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                        })
                        .error(function (error) {
                            console.error("Error on getting json for the url...:", error);
                        });
                }

                /******************************************* INIT *****************************************/
                function init() {

                    //1. Finding the length of question and divide game into questions/2 steps
                    console.log("Number of questions: ", $scope.activityData.questions.length);
                    console.log("Questions: ", $scope.activityData.questions);

                    //2. Building the questionWords sprites

                    async.waterfall([

                            //Creating the backgrounds
                            function (questionWaterfallCallback) {
                                var questionWordImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/education_question_background.png"
                                }));
                                questionWordImageLoader.load();

                                questionWordImageLoader.on("complete", function (r) {

                                    /*Creating Image background for word A*/
                                    $scope.questionWordBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/education_question_background.png");
                                    $scope.questionWordBackground.x = 70;
                                    $scope.questionWordBackground.y = 80;
                                    $scope.mainContainer.addChild($scope.questionWordBackground);

                                    questionWaterfallCallback(null);

                                });

                            },

                            //Creating the question texts
                            function (questionWaterfallCallback) {

                                /*Adding the first question text*/
                                $scope.questionText = new createjs.Text("", "30px Arial", "white");
                                $scope.questionText.x = 100;
                                $scope.questionText.y = 100;
                                $scope.mainContainer.addChild($scope.questionText);

                                questionWaterfallCallback(null);

                            },

                            //Creating Help button
                            function (questionWaterfallCallback) {

                                $http.get($rootScope.rootDir + "data/assets/education_help.json")
                                    .success(function (response) {

                                        //Reassigning images with the rest of resource
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var helpButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        var helpButton = new createjs.Sprite(helpButtonSpriteSheet, "normal");

                                        helpButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Help button event!");
                                            helpButton.gotoAndPlay("onSelection");
                                        });

                                        helpButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Help button event!");
                                            helpButton.gotoAndPlay("normal");
                                        });

                                        helpButton.x = 500;
                                        helpButton.y = 110;

                                        $scope.mainContainer.addChild(helpButton);
                                        questionWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json for Help button...", error);
                                        questionWaterfallCallback(true, error);
                                    });

                            },

                            //Creating Restart button
                            function (questionWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_restart.json")
                                    .success(function (response) {

                                        //Reassigning images with the rest of resource
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var restartButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        var restartButton = new createjs.Sprite(restartButtonSpriteSheet, "normal");

                                        restartButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Menu event!");
                                            restartButton.gotoAndPlay("onSelection");
                                        });

                                        restartButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Menu event!");
                                            restartButton.gotoAndPlay("normal");
                                        });

                                        restartButton.x = 600;
                                        restartButton.y = 115;

                                        $scope.mainContainer.addChild(restartButton);
                                        questionWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json for Restart button...", error);
                                        questionWaterfallCallback(true, error);
                                    });
                            },

                            //Creating Check button
                            function (questionWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_check.json")
                                    .success(function (response) {

                                        //Reassigning images with the rest of resource
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        var checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                                        checkButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Menu event!");
                                            checkButton.gotoAndPlay("onSelection");
                                        });

                                        checkButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Menu event!");
                                            checkButton.gotoAndPlay("normal");
                                        });

                                        checkButton.x = 700;
                                        checkButton.y = 115;

                                        $scope.mainContainer.addChild(checkButton);
                                        questionWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json for check button...", error);
                                        questionWaterfallCallback(true, error);
                                    });
                            },

                            //Loading the puzzle sprite for each letter
                            function (questionWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_puzzle.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for the letter's puzzle sprite!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        //Exposing letter puzzle spriteSheet to $scope so it can be accessible by the next function
                                        $scope.letterPuzzleSpriteSheet = new createjs.SpriteSheet(response);

                                        questionWaterfallCallback(null);
                                    })
                                    .error(function (error) {

                                        console.error("Error on getting json data for the letter's puzzle sprite: ", error);
                                        questionWaterfallCallback(true, error);
                                    });
                            },

                            //Next button
                            function (questionWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_next_questions.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for the next question button sprite!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        //Exposing letter puzzle spriteSheet to $scope so it can be accessible by the next function
                                        var nextButtonSpriteSheet = new createjs.SpriteSheet(response);

                                        $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");

                                        $scope.nextButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Menu button !");
                                            $scope.nextButton.gotoAndPlay("onSelection");
                                        });

                                        $scope.nextButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Menu event!");
                                            $scope.nextButton.gotoAndPlay("normal");
                                            nextQuestion();
                                            buildQuestion();
                                        });

                                        $scope.nextButton.x = 840;
                                        $scope.nextButton.y = 505;
                                        $scope.mainContainer.addChild($scope.nextButton);
                                        questionWaterfallCallback(null);
                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json data for the next button sprite: ", error);
                                        questionWaterfallCallback(true, error);
                                    });
                            },

                            //Previous button
                            function (questionWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_previous_questions.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for the previous question button sprite!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        //Exposing letter puzzle spriteSheet to $scope so it can be accessible by the previous function
                                        var previousButtonSpriteSheet = new createjs.SpriteSheet(response);

                                        $scope.previousButton = new createjs.Sprite(previousButtonSpriteSheet, "normal");

                                        $scope.previousButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Menu button !");
                                            $scope.previousButton.gotoAndPlay("onSelection");
                                        });

                                        $scope.previousButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Menu event!");
                                            $scope.previousButton.gotoAndPlay("normal");
                                            previousQuestion();
                                            buildQuestion();
                                        });

                                        $scope.previousButton.x = 780;
                                        $scope.previousButton.y = 505;
                                        $scope.mainContainer.addChild($scope.previousButton);
                                        questionWaterfallCallback(null);
                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json data for the previous button sprite: ", error);
                                        questionWaterfallCallback(true, error);
                                    });
                            },

                            //Building the scrambled english word arrays
                            function (questionWaterfallCallback) {

                                //Each array will be 2-dimensional and fixed sized to 16 letters
                                //Despite being 2-dimensional.
                                var scrambledEnglishLetterIndex = 0;
                                //Containers for each letter
                                $scope.scrambledEnglishLetterContainers = {};
                                //Puzzle sprites for each letter
                                $scope.scrambledEnglishLetterSprites = {};
                                //Text for each letter
                                $scope.scrambledEnglishLetterTexts = {};

                                for (var i = 0; i < 3; i++) {
                                    for (var j = 0; j < 6; j++) {

                                        //Adding a sprite for the letter
                                        $scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex] = new createjs.Sprite($scope.letterPuzzleSpriteSheet, "normal");
                                        $scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex].x = 0;
                                        $scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex].y = 0;

                                        //Creating a container for the letter
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex] = new createjs.Container();
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].width = $scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex].getBounds().width;
                                        console.log("bounds: ",$scope.scrambledEnglishLetterSprites[0].getBounds());
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].height = $scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex].getBounds().height;
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].x = scrambledEnglishLetterIndex === 0 ? 60
                                            : $scope.scrambledEnglishLetterContainers[0].x + j * 53;
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].y = scrambledEnglishLetterIndex === 0 ? 300
                                            : $scope.scrambledEnglishLetterContainers[0].y + i * 53;
                                        $scope.mainContainer.addChild($scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex]);


                                        //Make it invisible
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].visible = false;

                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].addChild($scope.scrambledEnglishLetterSprites[scrambledEnglishLetterIndex]);

                                        //Finally adding text for the letter
                                        $scope.scrambledEnglishLetterTexts[scrambledEnglishLetterIndex] = new createjs.Text("", "30px Arial", "white");
                                        $scope.scrambledEnglishLetterTexts[scrambledEnglishLetterIndex].x = $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].width/2.3;
                                        $scope.scrambledEnglishLetterTexts[scrambledEnglishLetterIndex].y = $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].height/3.5;
                                        $scope.scrambledEnglishLetterContainers[scrambledEnglishLetterIndex].addChild($scope.scrambledEnglishLetterTexts[scrambledEnglishLetterIndex]);

                                        //Incrementing Letter index after an iteration
                                        scrambledEnglishLetterIndex++;

                                    }
                                }

                                questionWaterfallCallback(null);
                            },

                            //Building the user answers array
                            function (questionWaterfallCallback) {

                                $scope.answerWordLettersContainers = {};
                                $scope.answerWordBackgroundImages = {};

                                async.waterfall([

                                        //First loading the background image of each container
                                        function (answerWordWaterfallCallback) {
                                            var answerWordBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                                src: $rootScope.rootDir + "data/assets/education_letter_placeholder.png"
                                            }));

                                            answerWordBackgroundImageLoader.load();
                                            answerWordBackgroundImageLoader.on("complete", function (r) {

                                                /*Creating Bitmap Background for continue button*/
                                                $scope.answerWordBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/education_letter_placeholder.png");
                                                $scope.answerWordBackground.x = 0;
                                                $scope.answerWordBackground.y = 0;

                                                answerWordWaterfallCallback(null);
                                            });
                                        },

                                        //Next populating the answerWordLetters
                                        function (answerWordWaterfallCallback) {

                                            //It will be a 18 sized pre-build word
                                            for (var i = 0; i < 16; i++) {

                                                //Creating a letter container
                                                $scope.answerWordLettersContainers[i] = new createjs.Container();
                                                $scope.answerWordLettersContainers[i].width = 30;
                                                $scope.answerWordLettersContainers[i].height = 30;
                                                $scope.answerWordLettersContainers[i].x = i === 0 ? 60
                                                    : $scope.answerWordLettersContainers[0].x + i * 53;
                                                $scope.answerWordLettersContainers[i].y = 145;
                                                $scope.mainContainer.addChild($scope.answerWordLettersContainers[i]);



                                                //Make it invisible
                                                $scope.answerWordLettersContainers[i].visible = false;



                                                //Adding the background
                                                $scope.answerWordBackgroundImages[i] = $scope.answerWordBackground.clone();
                                                $scope.answerWordBackgroundImages[i].scaleX = $scope.answerWordBackgroundImages[i].scaleY = 1.2;
                                                $scope.answerWordLettersContainers[i].addChild($scope.answerWordBackgroundImages[i]);

                                                // var answerWordLettersContainersGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.answerWordLettersContainers[i].width, $scope.answerWordLettersContainers[i].height);
                                                // var answerWordLettersContainersBackground = new createjs.Shape(answerWordLettersContainersGraphic);
                                                // answerWordLettersContainersBackground.alpha = 0.5;
                                                //
                                                // $scope.answerWordLettersContainers[i].addChild(answerWordLettersContainersBackground);
                                            }

                                            answerWordWaterfallCallback(null);
                                        }
                                    ],
                                    //General callback
                                    function (error, result) {
                                        if (error) {
                                            console.error("There was an error on building answers array...");
                                            questionWaterfallCallback(true, result);
                                        } else {
                                            console.log("Success on building answers array!");
                                            questionWaterfallCallback(null);
                                        }
                                    });
                            }
                        ],
                        //General callback
                        function (error, result) {

                            if (error) {
                                console.error("There was an error on building waterfall during init(): ", error);
                            } else {
                                console.log("Success on building waterfall during init() process!");
                                buildQuestion($scope.questionIndex);
                            }

                        });

                }//end of function init()


                /******************************************* PLAYING GAME - LOADING QUESTIONS *****************************************/

                /*Function that build the questions according to the question step*/
                function buildQuestion() {
                    console.warn("Building question for index: ", $scope.questionIndex);
                    console.log("Question word (greek): ", $scope.activityData.questions[$scope.questionIndex]);
                    console.log("English word the user has to find: ", $scope.activityData.questions[$scope.questionIndex].englishWord);

                    //Updating the question texts. Index that is printed along with question text has to be index + 1 to avoid 0
                    $scope.questionText.text = $scope.questionIndex + 1 + "." + $scope.activityData.questions[$scope.questionIndex].greekWord;

                    //Creating the scrambled english word for the current question
                    $scope.englishWordArray = $scope.activityData.questions[$scope.questionIndex].englishWord.split("");

                    //English word letters array
                    console.log("English word: ", $scope.englishWordArray);

                    //English scrambled word letters array
                    $scope.englishWordArray = _.shuffle($scope.englishWordArray);
                    console.log("Scrambled english word: ", $scope.englishWordArray);

                    //Building the question
                    _.each($scope.englishWordArray, function(letter, key, list){
                        $scope.answerWordLettersContainers[key].visible = true;
                    });

                    //Building the scrambled letters
                    _.each($scope.englishWordArray, function(letter, key, list){
                        $scope.scrambledEnglishLetterContainers[key].visible = true;
                        $scope.scrambledEnglishLetterTexts[key].text = $scope.englishWordArray[key];
                    });
                }



                //Function that increments the question step
                function nextQuestion() {
                    if ($scope.questionIndex < $scope.activityData.questions.length - 1) {
                        $scope.questionIndex++;
                    } else {
                        console.warn("Maximum question index reached!");
                    }
                }


                //Function that decrements the question step
                function previousQuestion() {
                    if ($scope.questionIndex > 0) {
                        $scope.questionIndex--;
                    } else {
                        console.warn("Minimum question index reached!");
                    }
                }


                /*Function that updates the score*/
                function updateScore() {
                    // /*Check how many correct answers exist*/
                    // var completedWords = 0;
                    // _.each($scope.activityData.questions, function (word, key, list) {
                    //     if ($scope.activityData.questions[key].completedWordLetters && $scope.activityData.questions[key].completedWordLetters.length > 0) {
                    //         completedWords++;
                    //     }
                    // });
                    //
                    // //Updating score
                    // $scope.scoreText.text = "Score: " + completedWords + " / " + $scope.activityData.questions.length;
                    // $scope.stage.update();
                }

                /*Function that handles navigation to next activity*/
                // function next() {
                //     console.log("Going to next activity!");
                //     var index = _.findIndex($rootScope.selectedLesson.lessonMenu, {
                //         "activityFolder": $rootScope.activityFolder
                //     });
                //     console.log("Lessons Index: ", index);
                //
                //     if (index < $rootScope.selectedLesson.lessonMenu.length - 1) {
                //         $rootScope.activityFolder = $rootScope.selectedLesson.lessonMenu[index + 1].activityFolder;
                //         $rootScope.activityName = $rootScope.selectedLesson.lessonMenu[index + 1].name;
                //         window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
                //         window.localStorage.setItem("activityName", $rootScope.activityName);
                //         console.log("Next $rootScope.activityFolder: " + $rootScope.activityFolder + " $rootScope.activityName" + $rootScope.activityName);
                //         $ionicHistory.nextViewOptions({
                //             historyRoot: true,
                //             disableBack: true
                //         });
                //         $state.go($rootScope.selectedLesson.lessonMenu[index + 1].activityTemplate, {}, {reload: true});
                //     } else {
                //         $ionicHistory.nextViewOptions({
                //             historyRoot: true,
                //             disableBack: true
                //         });
                //         $state.go("results", {}, {reload: true});
                //     }
                // }

            });//end of image on complete
        }, 500);//end of timeout
    });

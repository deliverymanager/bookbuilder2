angular.module("bookbuilder2")
    .controller("chooseDucksController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

        console.log("chooseDucksController loaded!");

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
                src: $rootScope.rootDir + "data/assets/chooseDucks_background.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/chooseDucks_background.png");

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


                /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
                $scope.mainContainer = new createjs.Container();
                $scope.mainContainer.width = background.image.width;
                $scope.mainContainer.height = background.image.height;
                $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
                $scope.mainContainer.x = backgroundPosition.x;
                $scope.mainContainer.y = backgroundPosition.y;
                $scope.stage.addChild($scope.mainContainer);

                // var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
                // var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
                // mainContainerBackground.alpha = 0.5;
                //
                // $scope.mainContainer.addChild(mainContainerBackground);

                // var maskGraphics = new createjs.Graphics().beginFill("red").drawRect(162, 136, 533, 210);
                // var mask = new createjs.Shape(maskGraphics);
                // $scope.mainContainer.mask = mask;

                //$scope.mainContainer.addChild(maskShape);


                /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

                $http.get($rootScope.rootDir + "data/assets/head_menu_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                        var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

                        menuButton.on("mousedown", function (event) {
                            console.log("Mouse down event on Menu button !");
                            menuButton.gotoAndPlay("onSelection");
                        });

                        menuButton.on("pressup", function (event) {
                            console.log("Press up event on Menu event!");
                            menuButton.gotoAndPlay("normal");
                            $ionicHistory.nextViewOptions({
                                historyRoot: true,
                                disableBack: true
                            });

                            /*Removing all tween before navigating back*/
                            createjs.Tween.removeAllTweens();

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

                /*Getting the activityData from the local storage*/
                if (window.localStorage.getItem(activityNameInLocalStorage)) {

                    $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
                    console.log("Getting activityData from local storage: ", $scope.activityData);

                    /*Adding page title and description*/
                    $scope.pageTitle = new createjs.Text($scope.activityData.title, "18px Arial", "white");
                    $scope.pageTitle.x = 85;
                    $scope.pageTitle.y = 610;
                    $scope.mainContainer.addChild($scope.pageTitle);

                    /*Adding page title and description*/
                    $scope.pageDescription = new createjs.Text($scope.activityData.description, "18px Arial", "white");
                    $scope.pageDescription.x = 120;
                    $scope.pageDescription.y = 630;
                    $scope.mainContainer.addChild($scope.pageDescription);

                    console.warn("Starting init()...");
                    init();

                } else {

                    /*Getting the activityData from http.get request*/
                    console.warn("There is no activity in local storage...Getting the json through $http.get()");
                    console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
                    console.log("activityFolder: ", $rootScope.activityFolder);

                    $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/chooseDucks.json")
                        .success(function (response) {
                            console.log("Success on getting json for the url. The response object is: ", response);
                            //Assigning configured response to activityData
                            $scope.activityData = response;
                            $scope.activityData.attempts = 1;

                            console.log("Building activity's logic");

                            //Populating questions with the userChoice property
                            _.each($scope.activityData.questions, function (question, key, list) {
                                $scope.activityData.questions[key].userChoice = "";
                            });

                            //Setting a global index indicating which question is currently active
                            $scope.activityData.activeQuestionIndex = 0;

                            //Saving to localStorage
                            save();

                            //Initializing
                            console.warn("Starting init()...");
                            init();

                        })
                        .error(function (error) {
                            console.error("Error on getting json for the url...:", error);
                        });
                }

                /*Function init() that initializes everything*/
                function init() {

                    $scope.ducksSprites = {};
                    $scope.ducksTexts = {};
                    $scope.ducksIndexImages = {};
                    $scope.ducksIndexes = {};
                    $scope.userAnswersTexts = {};
                    $scope.rightAnswersTexts = {};

                    async.waterfall([

                            //Creating the mask container
                            function (initWaterfallCallback) {

                                $scope.maskContainer = new createjs.Container();
                                $scope.maskContainer.width = 533;
                                $scope.maskContainer.height = 210;
                                $scope.maskContainer.x = 162;
                                $scope.maskContainer.y = 136;
                                $scope.mainContainer.addChild($scope.maskContainer);

                                var maskGraphics = new createjs.Graphics().beginFill("red").drawRect(162, 136, 533, 210);
                                var mask = new createjs.Shape(maskGraphics);
                                $scope.maskContainer.mask = mask;

                                initWaterfallCallback(null);
                            },

                            //Creating the internal container
                            function (initWaterfallCallback) {
                                $scope.internalContainer = new createjs.Container();
                                $scope.internalContainer.width = 2221;
                                $scope.internalContainer.height = 210;
                                $scope.internalContainer.x = 0;
                                $scope.internalContainer.y = 0;
                                $scope.internalContainer.startingPointX = $scope.internalContainer.x;
                                $scope.internalContainer.startingPointY = $scope.internalContainer.y;
                                $scope.maskContainer.addChild($scope.internalContainer);

                                var internalContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.internalContainer.width, $scope.internalContainer.height);
                                var internalContainerBackground = new createjs.Shape(internalContainerGraphic);
                                internalContainerBackground.alpha = 0.5;

                                $scope.internalContainer.addChild(internalContainerBackground);

                                initWaterfallCallback(null);
                            },

                            //Loading the internalBar image
                            function (initWaterfallCallback) {
                                var internalBarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/chooseDucks_bar.png"
                                }));

                                internalBarImageLoader.load();
                                internalBarImageLoader.on("complete", function (r) {
                                    $scope.internalBarImage = new createjs.Bitmap($rootScope.rootDir + "data/assets/chooseDucks_bar.png");
                                    $scope.internalBarImage.x = -18;
                                    $scope.internalBarImage.y = $scope.internalContainer.height - 44;
                                    $scope.internalContainer.addChild($scope.internalBarImage);
                                    initWaterfallCallback(null);
                                });
                            },

                            //Loading the ducks sprites and texts
                            function (initWaterfallCallback) {

                                $http.get($rootScope.rootDir + "data/assets/chooseDucks_duck.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for duck sprite!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var duckSpriteSheet = new createjs.SpriteSheet(response);

                                        //Calculating the positions
                                        var intervalBarXStep = $scope.internalContainer.width / 11;
                                        console.warn("intervalBarXStep: ", intervalBarXStep);
                                        var intervalBarXPositions = new Array(11);
                                        _.each(intervalBarXPositions, function (step, key, list) {
                                            intervalBarXPositions[key] = key * intervalBarXStep;
                                        });
                                        console.warn("intervalBarXPositions: ", intervalBarXPositions);

                                        _.each($scope.activityData.questions, function (question, key, list) {
                                            $scope.ducksSprites[key] = new createjs.Sprite(duckSpriteSheet, "normal");
                                            $scope.ducksSprites[key].x = intervalBarXPositions[key + 1];
                                            $scope.ducksSprites[key].y = 50;
                                            $scope.ducksSprites[key].startingPointX = $scope.ducksSprites[key].x;
                                            $scope.ducksSprites[key].startingPointY = $scope.ducksSprites[key].y;

                                            $scope.internalContainer.addChild($scope.ducksSprites[key]);
                                            /*Mouse down event*/
                                            $scope.ducksSprites[key].on("mousedown", function (event) {
                                                console.log("Mouse down event on duck!");
                                            });

                                            /*Press up event*/
                                            $scope.ducksSprites[key].on("pressup", function (event) {
                                                console.log("Press up event on duck!");
                                                selectDuck(key);
                                            });

                                            //Adding the text
                                            $scope.ducksTexts[key] = new createjs.Text($scope.activityData.questions[key].englishWord, "20px Arial", "black");
                                            $scope.ducksTexts[key].x = $scope.ducksSprites[key].x + 73;
                                            $scope.ducksTexts[key].y = 137;
                                            $scope.ducksTexts[key].textAlign = "center";
                                            $scope.ducksTexts[key].maxWidth = $scope.ducksSprites[key].width - 20;
                                            $scope.internalContainer.addChild($scope.ducksTexts[key]);
                                        });

                                        initWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for check button: ", error);
                                        initWaterfallCallback(true, error);
                                    });

                            },

                            //Loading the ducks indexes images and texts
                            function (initWaterfallCallback) {

                                //Getting the image
                                var duckIndexImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/chooseDucks_number.png"
                                }));

                                duckIndexImageLoader.load();
                                duckIndexImageLoader.on("complete", function (r) {

                                    _.each($scope.ducksSprites, function (indexImage, key, list) {

                                        //Creating the image
                                        $scope.ducksIndexImages[key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/chooseDucks_number.png");
                                        $scope.ducksIndexImages[key].x = $scope.ducksSprites[key].x + 36;
                                        $scope.ducksIndexImages[key].y = $scope.internalBarImage.y;
                                        $scope.internalContainer.addChild($scope.ducksIndexImages[key]);

                                        //Creating the index
                                        $scope.ducksIndexes[key] = new createjs.Text((parseInt(key) + 1), "24px Arial", "white");
                                        $scope.ducksIndexes[key].x = $scope.ducksIndexImages[key].x + $scope.ducksIndexImages[key].getBounds().width / 2;
                                        $scope.ducksIndexes[key].y = $scope.ducksIndexImages[key].y + 10;
                                        $scope.ducksIndexes[key].textAlign = "center";
                                        $scope.internalContainer.addChild($scope.ducksIndexes[key]);
                                    });
                                    initWaterfallCallback(null);
                                });


                                initWaterfallCallback(null);
                            },

                            //Creating the greekWord Text
                            function (initWaterfallCallback) {
                                //Creating the index
                                $scope.greekWordText = new createjs.Text("", "24px Arial", "black");
                                $scope.greekWordText.x = 150;
                                $scope.greekWordText.y = 522;
                                $scope.greekWordText.textAlign = "center";
                                $scope.mainContainer.addChild($scope.greekWordText);

                                initWaterfallCallback(null);
                            },

                            //Move the ducks right
                            function (initWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_next_questions.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for moveRight button!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var moveRightButtonSpriteSheet = new createjs.SpriteSheet(response);

                                        $scope.moveRightButton = new createjs.Sprite(moveRightButtonSpriteSheet, "normal");
                                        $scope.moveRightButton.x = 560;
                                        $scope.moveRightButton.y = 400;
                                        /*Mouse down event*/
                                        $scope.moveRightButton.on("mousedown", function (event) {
                                            console.log("Mouse down event on moveRightButton!");
                                            $scope.moveRightButton.gotoAndPlay("onSelection");
                                            moveInternalContainerRight();
                                        });

                                        /*Press up event*/
                                        $scope.moveRightButton.on("pressup", function (event) {
                                            console.log("Press up event on moveRightButton!");
                                            $scope.moveRightButton.gotoAndPlay("normal");
                                            internalContainerMoving();
                                        });
                                        $scope.mainContainer.addChild($scope.moveRightButton);
                                        initWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for moveRight button: ", error);
                                        initWaterfallCallback(true, error);
                                    });

                            },

                            //Move the ducks left
                            function (initWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/education_previous_questions.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for moveLeft button!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var moveLeftButtonSpriteSheet = new createjs.SpriteSheet(response);

                                        $scope.moveLeftButton = new createjs.Sprite(moveLeftButtonSpriteSheet, "normal");
                                        $scope.moveLeftButton.x = 260;
                                        $scope.moveLeftButton.y = 400;
                                        /*Mouse down event*/
                                        $scope.moveLeftButton.on("mousedown", function (event) {
                                            console.log("Mouse down event on moveLeftButton!");
                                            $scope.moveLeftButton.gotoAndPlay("onSelection");
                                            moveInternalContainerLeft();
                                        });

                                        /*Press up event*/
                                        $scope.moveLeftButton.on("pressup", function (event) {
                                            console.log("Press up event on moveLeftButton!");
                                            $scope.moveLeftButton.gotoAndPlay("normal");
                                            internalContainerMoving();
                                        });
                                        $scope.mainContainer.addChild($scope.moveLeftButton);
                                        initWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for moveLeft button: ", error);
                                        initWaterfallCallback(true, error);
                                    });

                            },

                            //Creating the questionResult Container, Background, Text
                            function (initWaterfallCallback) {

                                //Creating question result background
                                var questionResultImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/bombs_results_table.png"
                                }));
                                questionResultImageLoader.load();
                                questionResultImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for questionResultBackground*/
                                    $scope.questionResultBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/bombs_results_table.png");
                                    $scope.questionResultBackground.x = 0;
                                    $scope.questionResultBackground.y = 0;

                                    //Creating a letter container
                                    $scope.questionResultContainer = new createjs.Container();
                                    $scope.questionResultContainer.width = 697;
                                    $scope.questionResultContainer.height = 427;
                                    $scope.questionResultContainer.x = 100;
                                    $scope.questionResultContainer.y = 100;

                                    //Creating the questionResult text
                                    $scope.questionResultText = new createjs.Text("", "30px Arial", "black");
                                    $scope.questionResultText.x = $scope.questionResultContainer.width / 2;
                                    $scope.questionResultText.textAlign = "center";
                                    $scope.questionResultText.y = 140;

                                    //Make it invisible
                                    $scope.questionResultContainer.visible = false;

                                    //Adding the background
                                    $scope.questionResultContainer.addChild($scope.questionResultBackground);
                                    $scope.questionResultContainer.addChild($scope.questionResultText);
                                    $scope.mainContainer.addChild($scope.questionResultContainer);

                                    initWaterfallCallback(null);
                                });
                            },

                            //Creating the Continue button
                            function (initWaterfallCallback) {
                                //Getting the sprite for Continue button
                                var continueButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/soccer_results_continue.png"
                                }));
                                continueButtonImageLoader.load();

                                continueButtonImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for continue button*/
                                    $scope.continueButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_continue.png");
                                    $scope.continueButton.x = 40;
                                    $scope.continueButton.y = 270;
                                    $scope.questionResultContainer.addChild($scope.continueButton);

                                    /*Mouse down event*/
                                    $scope.continueButton.addEventListener("mousedown", function (event) {
                                        console.log("Mouse down event on continue button!");
                                        $scope.continueButton.alpha = 0.5;
                                        $scope.stage.update();
                                    });

                                    /*Press up event*/
                                    $scope.continueButton.addEventListener("pressup", function (event) {
                                        console.log("Press up event on continue button!");
                                        $scope.continueButton.alpha = 1;
                                        $scope.stage.update();

                                        var thereIsUnansweredQuestion = _.findWhere($scope.activityData.questions, {"userChoice": ""});

                                        if (!thereIsUnansweredQuestion) {
                                            console.warn("All questions answered, opening resultsTotal window! -->", $scope.activityData.questions);
                                            //Opening resultsTotalContainer
                                            openResultsTotalContainer();
                                            return;
                                        } else {
                                            console.warn("Incrementing question index inside Continue button!");
                                            $scope.activityData.activeQuestionIndex += 1;
                                            console.warn("Current question index: ", $scope.activityData.activeQuestionIndex);
                                            console.warn("Saving...");
                                            save();
                                            console.log("Loading question...");
                                            loadQuestion();
                                        }

                                        console.log("Calling closeQuestionResults();");
                                        closeQuestionResults();

                                    });

                                    initWaterfallCallback(null);
                                });//end of continueButtonImageLoader


                            },

                            /*Creating the Restart button*/
                            function (initWaterfallCallback) {
                                var restartButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/soccer_results_restart.png"
                                }));
                                restartButtonImageLoader.load();

                                restartButtonImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for restart button*/
                                    $scope.restartButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_restart.png");
                                    $scope.restartButton.x = 385;
                                    $scope.restartButton.y = 270;
                                    $scope.questionResultContainer.addChild($scope.restartButton);

                                    /*Mouse down event*/
                                    $scope.restartButton.addEventListener("mousedown", function (event) {
                                        console.log("Mouse down event on restart button!");
                                        $scope.restartButton.alpha = 0.5;
                                        $scope.stage.update();
                                    });

                                    /*Press up event*/
                                    $scope.restartButton.addEventListener("pressup", function (event) {
                                        console.log("Press up event on restart button!");
                                        $scope.restartButton.alpha = 1;
                                        $scope.stage.update();
                                        restartQuestion();
                                        closeQuestionResults();
                                    });

                                    initWaterfallCallback(null);
                                });//end of restartButtonImageLoader

                            },

                            //Creation resultsTotal
                            function (initWaterfallCallback) {

                                $scope.resultsTotalContainer = new createjs.Container();
                                $scope.resultsTotalContainer.width = $scope.mainContainer.width;
                                $scope.resultsTotalContainer.height = $scope.mainContainer.height;
                                $scope.resultsTotalContainer.x = 0;
                                $scope.resultsTotalContainer.y = -50;
                                $scope.resultsTotalContainer.visible = false;
                                $scope.mainContainer.addChild($scope.resultsTotalContainer);

                                console.log("Adding results background...");
                                /*Creating the questionTextBackground bitmap*/
                                var resultsTotalBackgroundImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/results_table_image.png"
                                }));
                                resultsTotalBackgroundImageLoader.load();

                                resultsTotalBackgroundImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for answerHolder background image*/
                                    $scope.resultsTotalBackground = new createjs.Bitmap($rootScope.rootDir + "data/assets/results_table_image.png");
                                    $scope.resultsTotalBackground.x = 10;
                                    $scope.resultsTotalBackground.y = 0;
                                    $scope.resultsTotalContainer.addChild($scope.resultsTotalBackground);

                                    /*Adding Score Text*/
                                    $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
                                    $scope.scoreText.x = 590;
                                    $scope.scoreText.y = 580;
                                    $scope.resultsTotalContainer.addChild($scope.scoreText);

                                    //Adding two additional containers with white backgrounds
                                    $scope.userAnswersContainer = new createjs.Container();
                                    $scope.userAnswersContainer.width = 385;
                                    $scope.userAnswersContainer.height = 460;
                                    $scope.userAnswersContainer.x = 38;
                                    $scope.userAnswersContainer.y = 110;
                                    $scope.resultsTotalContainer.addChild($scope.userAnswersContainer);

                                    var userAnswersContainerGraphic = new createjs.Graphics().beginFill("white").drawRect(0, 0, $scope.userAnswersContainer.width, $scope.userAnswersContainer.height);
                                    var userAnswersContainerBackground = new createjs.Shape(userAnswersContainerGraphic);
                                    $scope.userAnswersContainer.addChild(userAnswersContainerBackground);

                                    //Adding two additional containers with white backgrounds
                                    $scope.rightAnswersContainer = new createjs.Container();
                                    $scope.rightAnswersContainer.width = 385;
                                    $scope.rightAnswersContainer.height = 460;
                                    $scope.rightAnswersContainer.x = $scope.userAnswersContainer.x + $scope.userAnswersContainer.width + 20;
                                    $scope.rightAnswersContainer.y = $scope.userAnswersContainer.y;
                                    $scope.resultsTotalContainer.addChild($scope.rightAnswersContainer);

                                    var rightAnswersContainerGraphic = new createjs.Graphics().beginFill("white").drawRect(0, 0, $scope.rightAnswersContainer.width, $scope.rightAnswersContainer.height);
                                    var rightAnswersContainerBackground = new createjs.Shape(rightAnswersContainerGraphic);
                                    $scope.rightAnswersContainer.addChild(rightAnswersContainerBackground);

                                    //Adding the texts for right answers and for user answers
                                    _.each($scope.activityData.questions, function (question, key, list) {

                                        $scope.userAnswersTexts[key] = new createjs.Text("", "25px Arial", "black");
                                        $scope.userAnswersTexts[key].x = 10;
                                        $scope.userAnswersTexts[key].y = key === 0 ? 45 : $scope.userAnswersTexts[key - 1].y + 37;
                                        $scope.userAnswersTexts[key].maxWidth = $scope.userAnswersContainer.width - 10;
                                        $scope.userAnswersContainer.addChild($scope.userAnswersTexts[key]);

                                        $scope.rightAnswersTexts[key] = new createjs.Text("", "25px Arial", "green");
                                        $scope.rightAnswersTexts[key].x = 10;
                                        $scope.rightAnswersTexts[key].y = key === 0 ? 45 : $scope.rightAnswersTexts[key - 1].y + 37;
                                        $scope.rightAnswersTexts[key].maxWidth = $scope.rightAnswersContainer.width - 10;
                                        $scope.rightAnswersTexts[key].visible = false;

                                        var rightAnswersContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.rightAnswersContainer.width, 40);
                                        var rightAnswersContainerBackground = new createjs.Shape(rightAnswersContainerGraphic);
                                        $scope.rightAnswersContainer.addChild(rightAnswersContainerBackground);
                                        var correctAnswersTitle = new createjs.Text("Correct", "30px Arial", "white");
                                        correctAnswersTitle.x = $scope.rightAnswersContainer.width / 2;
                                        correctAnswersTitle.textAlign = "center";
                                        correctAnswersTitle.y = 3;
                                        $scope.rightAnswersContainer.addChild(correctAnswersTitle);
                                        $scope.rightAnswersContainer.addChild($scope.rightAnswersTexts[key]);
                                    });

                                    initWaterfallCallback(null);
                                });

                            },

                            //Creation of Check button
                            function (initWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for check button!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                                        /*Mouse down event*/
                                        $scope.checkButton.addEventListener("mousedown", function (event) {
                                            $scope.checkButton.alpha = 0.5;
                                            $scope.stage.update();
                                        });

                                        /*Press up event*/
                                        $scope.checkButton.addEventListener("pressup", function (event) {
                                            console.log("Click on Check Answers button!");
                                            $scope.checkButton.alpha = 1;
                                            console.log("Checking the answers...");
                                            updateScore();

                                            console.warn("Activity completed!");
                                            $scope.activityData.completed = true;
                                            save();

                                            //nextActivity play onSelection
                                            $scope.nextButton.gotoAndPlay("onSelection");
                                        });

                                        $scope.checkButton.x = 45;
                                        $scope.checkButton.y = 575;
                                        $scope.checkButton.gotoAndPlay("normal");
                                        $scope.resultsTotalContainer.addChild($scope.checkButton);
                                        initWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for check button: ", error);
                                        initWaterfallCallback(true, error);
                                    });
                            },

                            //Creation of restartTotal button
                            function (initWaterfallCallback) {
                                $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for restart button!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var restartTotalButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        $scope.restartTotalButton = new createjs.Sprite(restartTotalButtonSpriteSheet, "normal");

                                        /*Mouse down event*/
                                        $scope.restartTotalButton.addEventListener("mousedown", function (event) {
                                            $scope.restartTotalButton.alpha = 0.5;
                                            $scope.stage.update();
                                        });

                                        /*Press up event*/
                                        $scope.restartTotalButton.addEventListener("pressup", function (event) {
                                            console.log("Click on Restart button!");
                                            $scope.restartTotalButton.alpha = 1;

                                            console.warn("Restarting Activity!");
                                            $scope.stage.update();
                                            restartActivity();

                                        });//End of press up element

                                        $scope.restartTotalButton.x = 280;
                                        $scope.restartTotalButton.y = 590;
                                        $scope.restartTotalButton.gotoAndPlay("normal");
                                        $scope.resultsTotalContainer.addChild($scope.restartTotalButton);
                                        initWaterfallCallback(null);

                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for check button: ", error);
                                        initWaterfallCallback(true, error);
                                    });
                            },

                            /*Next Activity Button*/
                            function (initWaterfallCallback) {
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
                                        $scope.nextButton.x = 720;
                                        $scope.nextButton.y = 645;
                                        $scope.mainContainer.addChild($scope.nextButton);
                                        initWaterfallCallback();
                                    })
                                    .error(function (error) {

                                        console.log("Error on getting json data for check button...", error);
                                        initWaterfallCallback();
                                    });
                            }
                        ],

                        //General callback
                        function (error, result) {
                            if (error) {
                                console.error("There was an error during init waterfall process...:", result);
                            } else {
                                console.log("Success during init waterfall process!");
                                //Loading game
                                loadQuestion();
                            }
                        });
                }

                /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

                //Function for saving
                function save() {
                    //Saving it to localStorage
                    window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                }

                //Function that loads the question for the current index
                function loadQuestion() {

                    //Checking if activity completed
                    if ($scope.activityData.completed) {
                        console.warn("Loading question: Activity completed!");
                        openResultsTotalContainer();
                        //If the activity is completed it means it checked by the user
                        updateScore();
                        return;
                    }

                    //Checking if all questions have answer, if it's true resultsTotal opens
                    if (_.findWhere($scope.activityData.questions, {"userChoice": ""})) {
                        console.warn("Loading question: The are questions that need to be answered. Loading the game normally...");
                    } else {
                        console.warn("Loading question: All questions have answers...");
                        openResultsTotalContainer();
                        return;
                    }


                    //Checking for unanswered questions
                    _.each($scope.activityData.questions, function (question, key, list) {
                        if ($scope.activityData.questions[key].userChoice === "") {
                            var unansweredDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[key].englishWord});
                            console.warn("Incomplete question with index: " + key + " Incomplete duckText: ", unansweredDuckIndex);
                            $scope.ducksTexts[unansweredDuckIndex].visible = true;
                            $scope.ducksSprites[unansweredDuckIndex].visible = true;
                            $scope.ducksSprites[unansweredDuckIndex].y = $scope.ducksSprites[unansweredDuckIndex].startingPointY;
                            $scope.ducksSprites[unansweredDuckIndex].gotoAndPlay("normal");

                        }
                    });


                    //Checking if there are already answered questions
                    _.each($scope.activityData.questions, function (question, key, list) {
                        if ($scope.activityData.questions[key].userChoice !== "") {
                            var selectedDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[key].userChoice});
                            console.warn("Filled question index: " + key + " -Filled duckText index: " + selectedDuckIndex);
                            $scope.ducksTexts[selectedDuckIndex].visible = false;
                            $scope.ducksSprites[selectedDuckIndex].visible = false;
                        }
                        // }else{
                        //     var unansweredDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[key].englishWord});
                        //     console.warn("Incomplete question with index: "+ key + " Incomplete duckText: ", unansweredDuckIndex);
                        //     $scope.ducksTexts[unansweredDuckIndex].visible = true;
                        //     $scope.ducksSprites[unansweredDuckIndex].gotoAndPlay("normal");
                        //     $scope.ducksSprites[unansweredDuckIndex].visible = true;
                        // }

                    });

                    $scope.stage.update();

                    //Load the next question
                    $scope.greekWordText.text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].greekWord;
                    internalContainerMoving();
                }

                //Function that restarts the current question
                function restartQuestion() {

                    console.log("Restarting question...");

                    //Find which duck selected for the current question
                    var selectedDuckIndex = _.findKey($scope.ducksTexts, {"text": $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice});
                    console.log("Restoring duck with index: ", selectedDuckIndex);
                    $scope.ducksTexts[selectedDuckIndex].visible = true;
                    $scope.ducksSprites[selectedDuckIndex].gotoAndPlay("normal");
                    $scope.ducksSprites[selectedDuckIndex].y = $scope.ducksSprites[selectedDuckIndex].startingPointY;
                    $scope.ducksSprites[selectedDuckIndex].visible = true;

                    //Erase user answer from activityData and localStorage
                    $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice = "";
                    save();

                    loadQuestion();

                }

                //Function that moves the bar
                function internalContainerMoving() {
                    createjs.Tween.removeAllTweens($scope.internalContainer);
                    $scope.stage.update();

                    createjs.Tween.get($scope.internalContainer, {loop: false})
                        .to({
                            x: $scope.internalContainer.x > -1000 ? -1670 : -150,
                            y: $scope.internalContainer.y
                        }, 17000, createjs.Ease.getPowInOut(1))
                        .call(function () {
                            console.log("Moving Tween completed!");
                            internalContainerMoving();
                        });
                }

                //Function for moving internal bar right
                function moveInternalContainerRight() {
                    createjs.Tween.removeAllTweens($scope.internalContainer);
                    $scope.stage.update();

                    createjs.Tween.get($scope.internalContainer, {loop: false})
                        .to({
                            x: -1670,
                            y: $scope.internalContainer.y
                        }, -(-1670 - ($scope.internalContainer.x)) * 4, createjs.Ease.getPowInOut(1));

                }

                //Function for selecting duck
                function moveInternalContainerLeft() {
                    createjs.Tween.removeAllTweens($scope.internalContainer);
                    $scope.stage.update();

                    createjs.Tween.get($scope.internalContainer, {loop: false})
                        .to({
                            x: -150,
                            y: $scope.internalContainer.y
                        }, -(($scope.internalContainer.x) + 150 ) * 4, createjs.Ease.getPowInOut(1));
                }


                //Function for checking activity
                function selectDuck(key) {

                    if ($scope.selectionInProgress) {
                        console.warn("Selection in progress!");
                        return;
                    }

                    $scope.selectionInProgress = true;

                    console.log("Selecting the duck with key: ", key);
                    //Stopping the internalContainer Tween
                    createjs.Tween.removeAllTweens($scope.internalContainer);
                    $scope.stage.update();

                    //Saving the user selection
                    $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice = $scope.ducksTexts[key].text;
                    console.log("Save answer: ", $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice);
                    save();

                    $scope.ducksTexts[key].visible = false;

                    //Play the selection animation
                    $timeout(function () {
                        $scope.ducksSprites[key].gotoAndPlay("selected");
                        createjs.Tween.get($scope.ducksSprites[key], {loop: false})
                            .to({
                                x: $scope.ducksSprites[key].x,
                                y: -200
                            }, 1000, createjs.Ease.getPowInOut(2)).call(
                            function () {
                                $scope.ducksSprites[key].visible = false;
                                //Opening the question results window
                                console.warn("Questions in activityData -->", $scope.activityData.questions);
                                openQuestionResults();
                            }
                        );
                    }, 200);
                }


                //Function that opens questionResults window
                function openQuestionResults() {

                    console.log("Opening questionResults!");
                    $scope.greekWordText.text = "";
                    $scope.stage.update();

                    //Building the choice user made
                    $scope.questionResultText.text = $scope.activityData.questions[$scope.activityData.activeQuestionIndex].greekWord + " = "
                        + $scope.activityData.questions[$scope.activityData.activeQuestionIndex].userChoice;

                    //Opening the questionResultContainer
                    $scope.questionResultContainer.visible = true;

                }

                function closeQuestionResults() {
                    console.log("Closing questionResults!");
                    $scope.questionResultContainer.visible = false;
                    $scope.questionResultText.text = "";

                    //Initializing selectionInProgress again
                    $scope.selectionInProgress = false;
                }


                //Function used for opening resultsTotalContainer
                function openResultsTotalContainer() {
                    $scope.resultsTotalContainer.visible = true;
                    //Populating with user choices
                    _.each($scope.activityData.questions, function (question, key, list) {
                        $scope.userAnswersTexts[key].text = key + 1 + ". " + $scope.activityData.questions[key].greekWord + " = " + $scope.activityData.questions[key].userChoice;
                    })

                }

                //Function used for closing resultsTotalContainer
                function closeResultsTotalContainer() {
                    $scope.resultsTotalContainer.visible = false;
                    closeQuestionResults();
                    //Erasing all texts from resultsTotalContainer
                    _.each($scope.activityData.questions, function (question, key, list) {
                        $scope.userAnswersTexts[key].text = "";
                        $scope.userAnswersTexts[key].color = "black";
                        $scope.rightAnswersTexts[key].text = "";
                        $scope.rightAnswersTexts[key].visible = false;
                    })
                }

                //Function for restarting activity
                function restartActivity() {
                    console.log("Restarting activity...");
                    //Erasing all answers
                    _.each($scope.activityData.questions, function (word, key, list) {
                        $scope.activityData.questions[key].userChoice = "";
                    });

                    //Make index 0 again
                    $scope.activityData.completed = false;
                    $scope.activityData.activeQuestionIndex = 0;
                    save();

                    console.warn("Questions in activityData -->", $scope.activityData.questions);
                    closeResultsTotalContainer();
                    loadQuestion();
                }

                //Function that updates the score

                function updateScore() {

                    $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;

                    var rightAnswers = 0;
                    _.each($scope.activityData.questions, function (question, key, list) {

                        $scope.userAnswersTexts[key].text = $scope.activityData.questions[key].greekWord + " = " + $scope.activityData.questions[key].userChoice;
                        $scope.rightAnswersTexts[key].text = $scope.activityData.questions[key].englishWord;
                        if ($scope.activityData.questions[key].userChoice === $scope.activityData.questions[key].englishWord) {
                            rightAnswers++;
                            $scope.userAnswersTexts[key].color = "green";
                        } else {
                            $scope.userAnswersTexts[key].color = "red";
                            $scope.rightAnswersTexts[key].visible = true;
                            $scope.stage.update();
                        }
                    });
                    $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;
                }

            });//end of image on complete
        }, 500);//end of timeout
    })
;

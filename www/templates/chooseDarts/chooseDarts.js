angular.module("bookbuilder2")
    .controller("chooseDartsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

        console.log("chooseDartsController loaded!");

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
                src: $rootScope.rootDir + "data/assets/chooseDarts_background.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                //var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/chooseDarts_background.png");
                var background = new createjs.Bitmap($rootScope.rootDir  + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/background.png");

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
                        menuButton.y = -menuButton.getTransformedBounds().height / 5 - 30;

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
                    $scope.pageDescription = new createjs.Text($scope.activityData.description, "15px Arial", "white");
                    $scope.pageDescription.x = 75;
                    $scope.pageDescription.y = 630;
                    $scope.mainContainer.addChild($scope.pageDescription);

                    console.warn("Starting init()...");
                    init();

                } else {

                    /*Getting the activityData from http.get request*/
                    console.warn("There is no activity in local storage...Getting the json through $http.get()");
                    console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
                    console.log("activityFolder: ", $rootScope.activityFolder);

                    $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/chooseDarts.json")
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

                    $scope.answersTexts = {};
                    $scope.answersButtons = {};
                    $scope.answersButtonsTexts = {};
                    $scope.answersIndexes = {};
                    $scope.answersIndexesTexts = {};
                    $scope.answersResults = {};


                    async.waterfall([
                        //Creating the mask container
                        function (initWaterfallCallback) {

                            $scope.maskContainer = new createjs.Container();
                            $scope.maskContainer.width = 305;
                            $scope.maskContainer.height = 570;
                            $scope.maskContainer.x = 520;
                            $scope.maskContainer.y = 37;
                            $scope.mainContainer.addChild($scope.maskContainer);

                            var maskGraphics = new createjs.Graphics().beginFill("red").drawRect($scope.maskContainer.x, $scope.maskContainer.y, $scope.maskContainer.width, $scope.maskContainer.height);
                            // var maskBackground = new createjs.Shape(maskGraphics);
                            // $scope.mainContainer.addChild(maskBackground);

                            var mask = new createjs.Shape(maskGraphics);
                            $scope.maskContainer.mask = mask;
                            initWaterfallCallback(null);
                        },
                        //Creating the answers container
                        function (initWaterfallCallback) {
                            $scope.answersContainer = new createjs.Container();
                            $scope.answersContainer.width = 305;
                            $scope.answersContainer.height = 240 * $scope.activityData.questions.length;
                            console.warn("answersContainer's height: ", $scope.answersContainer.height);
                            $scope.answersContainer.x = 0;
                            $scope.answersContainer.y = 0;
                            $scope.answersContainer.startingPointX = $scope.answersContainer.x;
                            $scope.answersContainer.startingPointY = $scope.answersContainer.y;
                            $scope.maskContainer.addChild($scope.answersContainer);

                            // var answersContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.answersContainer.width, $scope.answersContainer.height);
                            // var answersContainerBackground = new createjs.Shape(answersContainerGraphic);
                            // answersContainerBackground.alpha = 0.5;
                            // $scope.answersContainer.addChild(answersContainerBackground);

                            initWaterfallCallback(null);
                        },
                        //Creating the up button
                        function (initWaterfallCallback) {

                            $http.get($rootScope.rootDir + "data/assets/animals_arrow_up_scroll_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json for Up button sprite!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                    var upButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    $scope.upButton = new createjs.Sprite(upButtonSpriteSheet, "normal");
                                    $scope.upButton.x = 250;
                                    $scope.upButton.y = 10;

                                    /*Mouse down event*/
                                    $scope.upButton.on("mousedown", function (event) {
                                        console.log("Mouse down event on Up upButton!");
                                        $scope.upButton.gotoAndPlay("selected");
                                        moveUp();
                                    });

                                    /*Press up event*/
                                    $scope.upButton.on("pressup", function (event) {
                                        console.log("Press up event on Up Button!");
                                        $scope.upButton.gotoAndPlay("normal");
                                        createjs.Tween.removeAllTweens($scope.answersContainer);
                                    });
                                    $scope.maskContainer.addChild($scope.upButton);

                                    initWaterfallCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for Up button: ", error);
                                    initWaterfallCallback(true, error);
                                });
                        },

                        //Creating the down button
                        function (initWaterfallCallback) {

                            $http.get($rootScope.rootDir + "data/assets/animals_arrow_down_scroll_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json for Down button sprite!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                    var downButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    $scope.downButton = new createjs.Sprite(downButtonSpriteSheet, "normal");
                                    $scope.downButton.x = 278;
                                    $scope.downButton.y = 557;

                                    /*Mouse down event*/
                                    $scope.downButton.on("mousedown", function (event) {
                                        console.log("Mouse down event on Down upButton!");
                                        $scope.downButton.gotoAndPlay("selected");
                                        moveDown();
                                    });

                                    /*Press up event*/
                                    $scope.downButton.on("pressup", function (event) {
                                        console.log("Press up event on Down Button!");
                                        $scope.downButton.gotoAndPlay("normal");
                                        createjs.Tween.removeAllTweens($scope.answersContainer);
                                    });
                                    $scope.maskContainer.addChild($scope.downButton);

                                    initWaterfallCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for Down button: ", error);
                                    initWaterfallCallback(true, error);
                                });
                        },

                        //getting the sprite for the answers
                        function (initWaterfallCallback) {
                            $http.get($rootScope.rootDir + "data/assets/chooseDarts_answerbtn.json")
                                .success(function (response) {
                                    console.log("Success on getting json for answer button sprite!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                    $scope.answerButtonSpriteSheet = new createjs.SpriteSheet(response);
                                    initWaterfallCallback(null);
                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for answer button: ", error);
                                    initWaterfallCallback(true, error);
                                });
                        },

                        //Getting the answers Indexes icon
                        function (initWaterfallCallback) {
                            //Getting the image
                            $scope.answerIndexImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                src: $rootScope.rootDir + "data/assets/chooseDarts_index.png"
                            }));

                            $scope.answerIndexImageLoader.load();
                            $scope.answerIndexImageLoader.on("complete", function (r) {
                                console.log("Success on loading th answers index image!");
                                initWaterfallCallback(null);
                            });
                        },

                        //Getting the answers Results icon
                        function (initWaterfallCallback) {
                            $http.get($rootScope.rootDir + "data/assets/chooseDarts_result_bubble_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json for chooseDarts result sprite!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                    $scope.answersResultsSpriteSheet = new createjs.SpriteSheet(response);

                                    initWaterfallCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for chooseDarts result button: ", error);
                                    initWaterfallCallback(true, error);
                                });
                        },
                        //Function that creates the answers buttons
                        function (initWaterfallCallback) {

                            _.each($scope.activityData.questions, function (question, key, list) {

                                $scope.answersButtons[key] = {};
                                $scope.answersButtonsTexts[key] = {};

                                //Creating the sprite for the answer A
                                $scope.answersButtons[key]["a"] = new createjs.Sprite($scope.answerButtonSpriteSheet, "blue");
                                $scope.answersButtons[key]["a"].x = 0;
                                $scope.answersButtons[key]["a"].y = key === 0 ? 70 : $scope.answersButtons[key - 1]["a"].y + 290;
                                $scope.answersButtons[key]["a"].scaleX = 0.8;
                                $scope.answersButtons[key]["a"].scaleY = 0.8;
                                /*Mouse down event*/
                                $scope.answersButtons[key]["a"].on("mousedown", function (event) {
                                    console.log("Mouse down event on answer button!");
                                });
                                /*Press up event*/
                                $scope.answersButtons[key]["a"].on("pressup", function (event) {
                                    console.log("Press up event on answer button!");
                                    selectAnswer(key, "a");
                                });
                                $scope.answersContainer.addChild($scope.answersButtons[key]["a"]);

                                //Adding the text to the answer A
                                $scope.answersButtonsTexts[key]["a"] = new createjs.Text($scope.activityData.questions[key].aChoice, "27px Arial", "white");
                                $scope.answersButtonsTexts[key]["a"].x = $scope.answersButtons[key]["a"].x + 160;
                                $scope.answersButtonsTexts[key]["a"].y = $scope.answersButtons[key]["a"].y+ 31;
                                $scope.answersButtonsTexts[key]["a"].textAlign = "center";
                                $scope.answersButtonsTexts[key]["a"].maxWidth = $scope.answersButtons[key]["a"].getBounds().width - 20;
                                $scope.answersContainer.addChild($scope.answersButtonsTexts[key]["a"]);


                                //Creating the sprite for the answer B
                                $scope.answersButtons[key]["b"] = new createjs.Sprite($scope.answerButtonSpriteSheet, "blue");
                                $scope.answersButtons[key]["b"].x = 0;
                                $scope.answersButtons[key]["b"].y = $scope.answersButtons[key]["a"].y + $scope.answersButtons[key]["a"].getBounds().height - 13;
                                $scope.answersButtons[key]["b"].scaleX = 0.8;
                                $scope.answersButtons[key]["b"].scaleY = 0.8;
                                /*Mouse down event*/
                                $scope.answersButtons[key]["b"].on("mousedown", function (event) {
                                    console.log("Mouse down event on answer button!");

                                });
                                /*Press up event*/
                                $scope.answersButtons[key]["b"].on("pressup", function (event) {
                                    console.log("Press up event on answer button!");
                                    selectAnswer(key, "b");
                                });
                                $scope.answersContainer.addChild($scope.answersButtons[key]["b"]);

                                //Adding the text to the answer B
                                $scope.answersButtonsTexts[key]["b"] = new createjs.Text($scope.activityData.questions[key].bChoice, "27px Arial", "white");
                                $scope.answersButtonsTexts[key]["b"].x = $scope.answersButtons[key]["b"].x + 160;
                                $scope.answersButtonsTexts[key]["b"].y = $scope.answersButtons[key]["b"].y+ 31;
                                $scope.answersButtonsTexts[key]["b"].textAlign = "center";
                                $scope.answersButtonsTexts[key]["b"].maxWidth = $scope.answersButtons[key]["b"].getBounds().width - 20;
                                $scope.answersContainer.addChild($scope.answersButtonsTexts[key]["b"]);


                                //Creating the image for the answers index
                                $scope.answersIndexes[key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/chooseDarts_index.png");
                                $scope.answersIndexes[key].scaleX = 0.8;
                                $scope.answersIndexes[key].scaleY = 0.8;
                                $scope.answersIndexes[key].x = 5;
                                $scope.answersIndexes[key].y = $scope.answersButtons[key]["a"].y - 50;
                                $scope.answersContainer.addChild($scope.answersIndexes[key]);//Creating the image for the answers index

                                //Loading result image
                                $scope.answersResults[key] = new createjs.Sprite($scope.answersResultsSpriteSheet, "normal");
                                $scope.answersResults[key].x = 60;
                                $scope.answersResults[key].y = $scope.answersButtons[key]["a"].y - 45;
                                $scope.answersResults[key].gotoAndPlay("normal");
                                $scope.answersContainer.addChild($scope.answersResults[key]);


                                //Adding the index text
                                $scope.answersIndexesTexts[key] = new createjs.Text(parseInt(key)+1, "24px Arial", "white");
                                $scope.answersIndexesTexts[key].x = $scope.answersIndexes[key].x + 22;
                                $scope.answersIndexesTexts[key].y = $scope.answersIndexes[key].y+ 7;
                                $scope.answersIndexesTexts[key].textAlign = "center";
                                $scope.answersContainer.addChild($scope.answersIndexesTexts[key]);
                            });

                            console.log($scope.answersContainer);
                            initWaterfallCallback(null);
                        },

                        //Adding the answersTexts
                        function (initWaterfallCallback) {
                            _.each($scope.activityData.questionsReceivers, function(questionReceiver, key, list){
                                $scope.answersTexts[key] = new createjs.Text("", "18px Arial", "black");
                                $scope.answersTexts[key].x = $scope.activityData.questionsReceivers[key].xPosition;
                                $scope.answersTexts[key].y = $scope.activityData.questionsReceivers[key].yPosition;
                                $scope.answersTexts[key].textAlign = "center";
                                $scope.mainContainer.addChild($scope.answersTexts[key]);
                            });
                            initWaterfallCallback(null);
                        },

                        /*Check Button*/
                        function (initWaterfallCallback) {
                            $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                                .success(function (response) {
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                    var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                                    $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

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
                                            checkAnswers();
                                        }
                                    });

                                    $scope.checkButton.x = 360;
                                    $scope.checkButton.y = 613;
                                    $scope.mainContainer.addChild($scope.checkButton);
                                    initWaterfallCallback(null);
                                })
                                .error(function (error) {

                                    console.log("Error on getting json data for check button...", error);
                                    initWaterfallCallback(true, error);
                                });
                        },

                        /*Restart Button*/
                        function (initWaterfallCallback) {
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
                                        restartActivity();
                                    });
                                    $scope.restartButton.x = 580;
                                    $scope.restartButton.y = 627;
                                    $scope.mainContainer.addChild($scope.restartButton);
                                    initWaterfallCallback(null);
                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for return button...", error);
                                    initWaterfallCallback(true, error);
                                });
                        },

                        /*Score Text*/
                        function (initWaterfallCallback) {

                            $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "black");
                            $scope.scoreText.x = 130;
                            $scope.scoreText.y = 560;
                            $scope.mainContainer.addChild($scope.scoreText);

                            initWaterfallCallback(null);
                        },

                        /*Next Activity Button*/
                        function (initCallback) {
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
                                    $scope.nextButton.x = 730;
                                    $scope.nextButton.y = 640;
                                    $scope.mainContainer.addChild($scope.nextButton);
                                    $scope.stage.update();
                                    initCallback();
                                })
                                .error(function (error) {

                                    console.log("Error on getting json data for check button...", error);
                                    initCallback();
                                });
                        }

                            //General callback
                    ], function (error, result) {
                        if (error) {
                            console.error("There was an error during init waterfall process...:", result);
                        } else {
                            console.log("Success during init waterfall process!");
                            buildGame();
                        }
                    });

                }

                /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

                //Function for saving
                function save() {
                    //Saving it to localStorage
                    window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                }


                //Function for building game
                function buildGame(){

                    //Filling any completed answer
                    _.each($scope.activityData.questions, function(question, key, list){
                        if($scope.activityData.questions[key].userChoice !== ""){

                            //Filling the answer key
                            $scope.answersTexts[key].text = $scope.answersButtonsTexts[key][$scope.activityData.questions[key].userChoice === "aChoice" ? "a" : "b"].text;

                            //Marking the right sprite
                            $scope.answersButtons[key][$scope.activityData.questions[key].userChoice === "aChoice" ? "a" : "b"].gotoAndPlay("orange");

                        }
                    });

                    //Checking for already answered questions
                    if($scope.activityData.completed){
                        checkAnswers();
                    }
                }

                //Function for moving up
                function moveUp() {
                    createjs.Tween.removeAllTweens($scope.answersContainer);
                    $scope.stage.update();

                    createjs.Tween.get($scope.answersContainer, {loop: false})
                        .to({
                            x: $scope.answersContainer.x,
                            y: 0
                        }, 4000, createjs.Ease.getPowInOut(1));
                }

                //Function for moving down
                function moveDown() {
                    createjs.Tween.removeAllTweens($scope.answersContainer);
                    $scope.stage.update();

                    createjs.Tween.get($scope.answersContainer, {loop: false})
                        .to({
                            x: $scope.answersContainer.x,
                            y: -($scope.answersIndexes[$scope.activityData.questions.length - 2].y)
                        }, 4000, createjs.Ease.getPowInOut(1));
                }

                //Function for restarting activity
                function restartActivity(){

                    console.warn("Restarting activity!");
                    
                    //Initializing userChoices
                    _.each($scope.activityData.questions, function(question, key, list){
                        $scope.activityData.questions[key].userChoice = "";
                        //All buttons go and play "blue"
                        $scope.answersButtons[key]["a"].gotoAndPlay("blue");
                        $scope.answersButtons[key]["b"].gotoAndPlay("blue");

                        //Empty all answersTexts
                        $scope.answersTexts[key].text = "";

                        //Mark all questions as normal
                        $scope.answersResults[key].gotoAndPlay("normal");
                    });
                    
                    save();
                    
                    //Initializing score
                    $scope.scoreText.text = "Score: " + 0 + " / " + $scope.activityData.questions.length;

                    //Mark activity as incomplete
                    $scope.activityData.completed = false;
                    save();

                    //Restarting Next activity
                    $scope.nextButton.gotoAndPlay("normal");
                }

                //Function for checking the user answers and updating the score
                function checkAnswers(){

                    console.warn("Checking activities!");
                    
                    var rightAnswers = 0;
                    _.each($scope.activityData.questions, function(question, key, list){
                        if($scope.activityData.questions[key].userChoice === $scope.activityData.questions[key].answerChoice){
                            
                            //Incrementing right answers
                            rightAnswers++;

                            //Mark it as right
                            $scope.answersResults[key].gotoAndPlay("right");
                        }else if($scope.activityData.questions[key].userChoice === ""){
                            $scope.answersResults[key].gotoAndPlay("empty");
                        }else{
                            $scope.answersResults[key].gotoAndPlay("wrong");
                        }

                        //Right buttons play the "green animation"
                        $scope.answersButtons[key][$scope.activityData.questions[key].answerChoice === "aChoice" ? "a" : "b"].gotoAndPlay("green");
                    });

                    //Updating score
                    $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

                    //Mark activity as completed
                    $scope.activityData.completed = true;
                    save();

                    $scope.nextButton.gotoAndPlay("selected");
                }

                //Function for selecting answer
                function selectAnswer(answerKey, answerChoice){
                    /**
                     * answerKey = 1,2,3...
                     * answerChoice = a or b
                     * **/

                    //Initializing the buttons again
                    $scope.answersButtons[answerKey]["a"].gotoAndPlay("blue");
                    $scope.answersButtons[answerKey]["b"].gotoAndPlay("blue");


                    console.warn("Selecting answer for the question with index: ", answerKey);
                    console.log("Answer selected: ", answerChoice);

                    $scope.activityData.questions[answerKey].userChoice = answerChoice === "a" ? "aChoice" : "bChoice";
                    save();

                    $scope.answersButtons[answerKey][answerChoice].gotoAndPlay("orange");

                    $scope.answersTexts[answerKey].text = $scope.answersButtonsTexts[answerKey][answerChoice].text;
                }


            });//end of image on complete
        }, 500);//end of timeout
    })
;

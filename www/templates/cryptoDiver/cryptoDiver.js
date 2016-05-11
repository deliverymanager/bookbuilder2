angular.module("bookbuilder2")
    .controller("cryptoDiverController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

        console.log("cryptoDiverController loaded!");
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
                src: $rootScope.rootDir + "data/assets/diver_background_image.png"
            }));

            imageLoader.load();

            /*IMAGE LOADER COMPLETED*/
            imageLoader.on("complete", function (r) {

                console.log("Image Loaded...");

                /*Creating Bitmap Background for Canvas*/
                var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/diver_background_image.png");

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

                /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
                $scope.mainContainer = new createjs.Container();
                $scope.mainContainer.width = background.image.width;
                $scope.mainContainer.height = background.image.height;
                $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
                $scope.mainContainer.x = backgroundPosition.x;
                $scope.mainContainer.y = backgroundPosition.y;
                $scope.stage.addChild($scope.mainContainer);

                //mainContainer Background
                /*var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
                 var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
                 mainContainerBackground.alpha = 0.5;

                 $scope.mainContainer.addChild(mainContainerBackground);*/


                /* ------------------------------------------ CRYPTO CONTAINER ---------------------------------------------- */
                $scope.cryptoContainer = new createjs.Container();
                $scope.cryptoContainer.width = 500;
                $scope.cryptoContainer.height = 500;
                $scope.cryptoContainer.x = 20;
                $scope.cryptoContainer.y = 70;
                $scope.mainContainer.addChild($scope.cryptoContainer);

                //cryptoContainer Background
                /*var cryptoContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.cryptoContainer.width, $scope.cryptoContainer.height);
                 var cryptoContainerBackground = new createjs.Shape(cryptoContainerGraphic);
                 cryptoContainerBackground.alpha = 0.5;
                 $scope.cryptoContainer.addChild(cryptoContainerBackground);*/

                /*Mouse down event*/
                $scope.cryptoContainer.addEventListener("mousedown", function (event) {
                    console.log("Mousedown event in cryptoContainer");
                    console.log("X:", event.stageX / scale - $scope.mainContainer.x / scale - $scope.cryptoContainer.x);
                    console.log("Y:", event.stageY / scale - $scope.mainContainer.y / scale - $scope.cryptoContainer.y);
                    selectingLetters(event.stageX / scale - $scope.mainContainer.x / scale - $scope.cryptoContainer.x, event.stageY / scale - $scope.mainContainer.y / scale - $scope.cryptoContainer.y);
                    $scope.selectedWord.text = getSelectedWord();
                });

                /*Press Move event*/
                $scope.cryptoContainer.addEventListener("pressmove", function (event) {
                    console.log("Pressmove event in cryptoContainer");
                    console.log("X:", event.stageX / scale - $scope.mainContainer.x / scale - $scope.cryptoContainer.x);
                    console.log("Y:", event.stageY / scale - $scope.mainContainer.y / scale - $scope.cryptoContainer.y);
                    selectingLetters(event.stageX / scale - $scope.mainContainer.x / scale - $scope.cryptoContainer.x, event.stageY / scale - $scope.mainContainer.y / scale - $scope.cryptoContainer.y);
                    $scope.selectedWord.text = getSelectedWord();
                });

                /*Press up event*/
                $scope.cryptoContainer.addEventListener("pressup", function (event) {

                    console.log("Selected word when the pressup event occurred: ", getSelectedWord());
                    //Checking if the word exist in answers, if it's not the selected word disappears and the game restarts
                    if (_.findWhere($scope.activityData.questions, {"englishWord": getSelectedWord()})) {
                        console.log("Success, there is a word that matches the selection!");

                        /* 1. Making the letters black indicating the selection has confirmed*/
                        _.each($scope.selectedLettersArray, function (letter, key, list) {
                            $scope.letterTexts[$scope.selectedLettersArray[key].index].color = "black";
                        });

                        /* 2. Saving the selection */
                        var foundWordIndex = _.findIndex($scope.activityData.questions, {"englishWord": getSelectedWord()});
                        $scope.activityData.questions[foundWordIndex].completedWordLetters = $scope.selectedLettersArray;
                        window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                        /*Mark the greek word as completed*/
                        $scope.greekWords[foundWordIndex].color = "blue";
                        $scope.greekWords[foundWordIndex].alpha = 0.1;

                        /*Restarting game*/
                        $scope.selectedLettersArray = [];
                        $scope.selectedWord.text = "";

                        /*Loading completed words*/
                        loadCompletedWords();
                        updateScore();

                        //Diving
                        $scope.diverSwimming.gotoAndPlay("swimming");
                        updateDiverAndChain();

                        $scope.stage.update();

                    } else {
                        console.log("Fail, there is no word that matches the selection...");

                        _.each($scope.selectedLettersArray, function (letter, key, list) {

                            /* 1A. Making the background azure again*/
                            $scope.letterBackgrounds[$scope.selectedLettersArray[key].index].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[$scope.selectedLettersArray[key].index].width, $scope.letterContainers[$scope.selectedLettersArray[key].index].height);

                            /*1B. Making the text black again */
                            $scope.letterTexts[$scope.selectedLettersArray[key].index].color = "black";
                        });

                        /*Restarting game*/
                        $scope.selectedLettersArray = [];
                        $scope.selectedWord.text = "";

                        /*Loading completed words*/
                        loadCompletedWords();
                        updateScore();

                    }
                });

                /* ------------------------------------------ WORDS CONTAINER ---------------------------------------------- */
                $scope.wordsContainer = new createjs.Container();
                $scope.wordsContainer.width = 180;
                $scope.wordsContainer.height = 500;
                $scope.wordsContainer.x = $scope.cryptoContainer.x + $scope.cryptoContainer.width + 5;
                $scope.wordsContainer.y = $scope.cryptoContainer.y;
                $scope.mainContainer.addChild($scope.wordsContainer);

                //wordsContainer Background
                /*var wordsContainerGraphic = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.wordsContainer.width, $scope.wordsContainer.height);
                 var wordsContainerBackground = new createjs.Shape(wordsContainerGraphic);
                 wordsContainerBackground.alpha = 0.5;

                 $scope.wordsContainer.addChild(wordsContainerBackground);*/

                /* ------------------------------------------ DIVER CONTAINER ---------------------------------------------- */
                $scope.diverContainer = new createjs.Container();
                $scope.diverContainer.width = 130;
                $scope.diverContainer.height = 600;
                $scope.diverContainer.x = $scope.wordsContainer.x + $scope.wordsContainer.width + 5;
                $scope.diverContainer.y = 0;
                $scope.mainContainer.addChild($scope.diverContainer);

                //diverContainer Background
                /*var diverContainerGraphic = new createjs.Graphics().beginFill("darkred").drawRect(0, 0, $scope.diverContainer.width, $scope.diverContainer.height);
                 var diverContainerBackground = new createjs.Shape(diverContainerGraphic);
                 diverContainerBackground.alpha = 0.5;

                 $scope.diverContainer.addChild(diverContainerBackground);*/

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

                    $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/cryptoDiver.json")
                        .success(function (response) {
                            console.log("Success on getting json for the url. The response object is: ", response);

                            //Assigning configured response to activityData
                            $scope.activityData = response;
                            $scope.activityData.attempts = 1;

                            /*Adding the userAnswer attribute to response object before assigning it to activityData*/
                            /* _.each($scope.activityData.questions, function (question, key, value) {
                             $scope.activityData.questions[key].userAnswer = "";
                             });*/

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


                    /*Calculations for finding the height and width of each letterContainer element*/
                    console.log("Length of each row in lettersArray: ", $scope.activityData.lettersArray[0].length);
                    var letterContainerWidth = 500 / $scope.activityData.lettersArray[0].length;
                    var letterContainerHeight = 500 / $scope.activityData.lettersArray.length;

                    console.log("letterContainer's Width: ", letterContainerWidth);
                    console.log("letterContainer's Height: ", letterContainerHeight);

                    /*Initializing letterContainers*/
                    $scope.letterContainers = {};
                    $scope.letterBackgrounds = {};
                    $scope.letterTexts = {};


                    /*Creating the Score Text element*/
                    /*Adding the score Text element*/
                    $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
                    $scope.scoreText.x = 540;
                    $scope.scoreText.y = 570;
                    $scope.activityData.score = 0;
                    $scope.mainContainer.addChild($scope.scoreText);


                    /*** 1. Creating the letters array ***/
                    _.each($scope.activityData.lettersArray, function (lettersArrayRow, rowKey, list) {
                        _.each($scope.activityData.lettersArray[rowKey], function (letter, columnKey, secondList) {

                            var letterIndex = rowKey + "_" + columnKey;

                            /*A. Creating the letterContainer*/
                            $scope.letterContainers[letterIndex] = new createjs.Container();
                            $scope.letterContainers[letterIndex].width = letterContainerWidth;
                            $scope.letterContainers[letterIndex].height = letterContainerHeight;
                            $scope.letterContainers[letterIndex].x = columnKey * letterContainerWidth;
                            $scope.letterContainers[letterIndex].y = rowKey * letterContainerHeight;
                            $scope.cryptoContainer.addChild($scope.letterContainers[letterIndex]);

                            /*B. Creating the letterBackground*/
                            var letterContainerGraphic = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.letterContainers[letterIndex].width, $scope.letterContainers[letterIndex].height);
                            $scope.letterBackgrounds[letterIndex] = new createjs.Shape(letterContainerGraphic);
                            $scope.letterContainers[letterIndex].addChild($scope.letterBackgrounds[letterIndex]);

                            /*C. Adding text*/
                            $scope.letterTexts[letterIndex] = new createjs.Text(letter, "20px Arial", "black");
                            /*$scope.letterTexts[letterIndex].regX = $scope.letterContainers[letterIndex].width / 2;
                             $scope.letterTexts[letterIndex].regY = $scope.letterContainers[letterIndex].height / 2;*/
                            $scope.letterTexts[letterIndex].x = $scope.letterContainers[letterIndex].width / 2;
                            $scope.letterTexts[letterIndex].y = $scope.letterContainers[letterIndex].height / 2;
                            $scope.letterTexts[letterIndex].textAlign = "center";
                            $scope.letterTexts[letterIndex].textBaseline = "middle";
                            $scope.letterContainers[letterIndex].addChild($scope.letterTexts[letterIndex]);

                        });
                    });


                    /*** 1.5 Creating the completedActivity container shape ***/
                    $scope.completedActivityContainer = new createjs.Container();
                    $scope.completedActivityContainer.width = $scope.cryptoContainer.width;
                    $scope.completedActivityContainer.height = $scope.cryptoContainer.height;
                    $scope.completedActivityContainer.x = 0;
                    $scope.completedActivityContainer.y = 0;
                    $scope.cryptoContainer.addChild($scope.completedActivityContainer);

                    var completedActivityGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.completedActivityContainer.width, $scope.completedActivityContainer.height);
                    var completedActivityBackground = new createjs.Shape(completedActivityGraphic);
                    completedActivityBackground.alpha = 1;
                    $scope.completedActivityContainer.addChild(completedActivityBackground);

                    //Calculating the y according to the number of questions, cryptoContainer's y is 500
                    var completedActivityAnswerY = 470 / $scope.activityData.questions.length;

                    //Iterating through activity's questions
                    $scope.activityQuestions = {};
                    _.each($scope.activityData.questions, function (word, key, list) {

                        /*Adding the texts*/
                        $scope.activityQuestions[key] = new createjs.Text($scope.activityData.questions[key].englishWord + " = " + $scope.activityData.questions[key].greekWord, "30px Arial", "white");
                        $scope.activityQuestions[key].x = $scope.cryptoContainer.width / 2;
                        $scope.activityQuestions[key].y = key === 0 ? completedActivityAnswerY / 3 : $scope.activityQuestions[key - 1].y + completedActivityAnswerY;
                        $scope.activityQuestions[key].textAlign = "center";
                        $scope.activityQuestions[key].textBaseline = "middle";
                        $scope.completedActivityContainer.addChild($scope.activityQuestions[key]);

                    });
                    $scope.completedActivityContainer.visible = false;


                    /*** 2. Creating the words list ***/
                    /*The greek equivalents of the missing words*/
                    $scope.greekWords = {};

                    console.log("Words to be found: ", $scope.activityData.questions);

                    _.each($scope.activityData.questions, function (word, key, list) {
                        $scope.greekWords[key] = new createjs.Text($scope.activityData.questions[key].greekWord, "30px Arial", "white");
                        $scope.greekWords[key].x = $scope.wordsContainer.width / 2;
                        $scope.greekWords[key].y = key * 44;
                        $scope.greekWords[key].textAlign = "center";
                        $scope.greekWords[key].maxWidth = $scope.wordsContainer.width;
                        $scope.wordsContainer.addChild($scope.greekWords[key]);
                    });


                    /*Loading completed words during startup AND updating completed greek words*/
                    loadCompletedWords();


                    /*** 2.5 Creating the text for the selectedWord ***/
                    $scope.selectedWord = new createjs.Text("", "26px Arial", "white");
                    $scope.selectedWord.x = 280;
                    $scope.selectedWord.y = 575;
                    $scope.selectedWord.textAlign = "center";
                    $scope.mainContainer.addChild($scope.selectedWord);

                    /*** 3. Creating the game ***/
                    async.waterfall([
                            /*Creating Chain*/
                            function (gameCreationCallback) {

                                var diverChainImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/diver_chain.png"
                                }));
                                diverChainImageLoader.load();

                                diverChainImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for continue button*/
                                    $scope.diverChain = new createjs.Bitmap($rootScope.rootDir + "data/assets/diver_chain.png");
                                    $scope.diverChain.x = 75;
                                    $scope.diverChain.y = -465;
                                    $scope.diverContainer.addChild($scope.diverChain);
                                    /*chainFloating();*/

                                    gameCreationCallback(null);

                                });
                            },
                            /*Creating diver that swims*/
                            function (gameCreationCallback) {
                                $http.get($rootScope.rootDir + "data/assets/diver_diver_swim_sprite.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for diverSwimming!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var diverSwimmingSpriteSheet = new createjs.SpriteSheet(response);
                                        $scope.diverSwimming = new createjs.Sprite(diverSwimmingSpriteSheet, "normal");

                                        /*Mouse down event*/
                                        $scope.diverSwimming.addEventListener("mousedown", function (event) {
                                        });

                                        /*Press up event*/
                                        $scope.diverSwimming.addEventListener("pressup", function (event) {
                                            $scope.diverSwimming.gotoAndPlay("swimming");
                                        });

                                        $scope.diverSwimming.scaleX = 0.4;
                                        $scope.diverSwimming.scaleY = 0.45;
                                        $scope.diverSwimming.x = 65;
                                        $scope.diverSwimming.y = 85;
                                        $scope.diverContainer.addChild($scope.diverSwimming);
                                        /*diverFloating();*/

                                        gameCreationCallback(null);
                                    })
                                    .error(function (error) {

                                        console.error("Error on getting json data for diverSwimming: ", error);
                                        gameCreationCallback(true, error);
                                    });
                            },

                            /*Creating diver reaching bottom*/
                            function (gameCreationCallback) {
                                $http.get($rootScope.rootDir + "data/assets/diver_bottom_sprite.json")
                                    .success(function (response) {
                                        console.log("Success on getting json for diverBottom button!");
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var diverBottomSpriteSheet = new createjs.SpriteSheet(response);
                                        $scope.diverBottom = new createjs.Sprite(diverBottomSpriteSheet, "normal");
                                        $scope.diverBottom.scaleX = 0.5;
                                        $scope.diverBottom.scaleY = 0.6;
                                        $scope.diverBottom.visible = false;
                                        $scope.diverBottom.x = $scope.diverSwimming.x;
                                        $scope.diverBottom.y = $scope.diverSwimming.y;

                                        $scope.diverContainer.addChild($scope.diverBottom);

                                        gameCreationCallback(null);
                                    })
                                    .error(function (error) {

                                        console.error("Error on getting json data for diver bottom button: ", error);
                                        gameCreationCallback(true, error);
                                    });
                            },

                            /*Creating Tube*/
                            function (gameCreationCallback) {

                                var diverTubeImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                                    src: $rootScope.rootDir + "data/assets/diver_tube.png"
                                }));

                                diverTubeImageLoader.load();

                                diverTubeImageLoader.on("complete", function (r) {

                                    /*Creating Bitmap Background for continue button*/
                                    $scope.diverTube = new createjs.Bitmap($rootScope.rootDir + "data/assets/diver_tube.png");
                                    $scope.diverTube.x = 10;
                                    $scope.diverTube.y = -90;
                                    $scope.diverContainer.addChild($scope.diverTube);

                                    gameCreationCallback(null);
                                });
                            },

                            /*Adding Restart Button*/
                            function (gameCreationCallback) {
                                $http.get($rootScope.rootDir + "data/assets/diver_restart_button_sprite.json")
                                    .success(function (response) {

                                        //Reassigning images with the rest of resource
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                        var restartButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        var restartButton = new createjs.Sprite(restartButtonSpriteSheet, "normal");

                                        restartButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on Menu event!");
                                            restartButton.gotoAndPlay("onSelection");

                                            /* 1. Erasing all completed words*/
                                            _.each($scope.activityData.questions, function (question, key, list) {

                                                /* 2. Iterating through letters of the completed word and apply initial format*/
                                                _.each($scope.activityData.questions[key].completedWordLetters, function (letter, letterKey, list) {
                                                    $scope.letterBackgrounds[$scope.activityData.questions[key].completedWordLetters[letterKey].index].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[$scope.activityData.questions[key].completedWordLetters[letterKey].index].width, $scope.letterContainers[$scope.activityData.questions[key].completedWordLetters[letterKey].index].height);
                                                    $scope.letterTexts[$scope.activityData.questions[key].completedWordLetters[letterKey].index].color = "black";
                                                });
                                                //Deleting the saved letters for completed words
                                                $scope.activityData.questions[key].completedWordLetters = [];
                                                window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

                                                /* 3. Additionally iterating through greek words and apply the default format*/
                                                $scope.greekWords[key].color = "white";
                                                $scope.greekWords[key].alpha = 1;

                                            });

                                            /*Restarting the game*/
                                            $scope.selectedLettersArray = [];
                                            $scope.selectedWord.text = "";
                                            updateScore();
                                            restartDiverAndChain();
                                            $scope.stage.update();
                                        });

                                        restartButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event on Menu event!");
                                            restartButton.gotoAndPlay("normal");
                                        });

                                        /*restartButton.scaleX = restartButton.scaleY = scale;*/
                                        restartButton.x = 770;
                                        restartButton.y = 580;

                                        $scope.mainContainer.addChild(restartButton);
                                        gameCreationCallback(null);

                                    })
                                    .error(function (error) {
                                        console.error("Error on getting json for results button...", error);
                                        gameCreationCallback(true, error);
                                    });
                            },

                            /*Adding Next Activity Button*/
                            function (gameCreationCallback) {

                                console.warn("Adding nextActivity button");

                                $http.get($rootScope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                                    .success(function (response) {
                                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                                        var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                                        $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");
                                        $scope.nextButton.alpha = 0.5;

                                        $scope.nextButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on a button !", $scope.activityData.completed);
                                            if ($scope.activityData.completed) {
                                                $scope.nextButton.gotoAndPlay("selected");
                                            }
                                            $scope.stage.update();
                                        });
                                        $scope.nextButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event!");

                                            if ($scope.activityData.completed) {
                                                $scope.nextButton.gotoAndPlay("onSelection");
                                                /*Calling next function!*/
                                                TypicalFunctions.nextActivity();
                                            }
                                        });
                                        $scope.nextButton.x = 730;
                                        $scope.nextButton.y = 650;
                                        $scope.mainContainer.addChild($scope.nextButton);
                                        $scope.stage.update();
                                        gameCreationCallback(null);
                                    })
                                    .error(function (error) {
                                        console.log("Error on getting json data for check button...", error);
                                        gameCreationCallback(true, error);
                                    });
                            }

                        ],
                        /*General callback for creating the diver sprites*/
                        function (error, result) {
                            if (error) {
                                console.log("Error on creating the diver sprites...: ", result);
                            } else {
                                console.log("Success on creating the diver sprites!");
                                //Updating diver and chain positions
                                updateDiverAndChain();
                            }
                        })
                }//end of function init()


                /*Function that creates the diver animation*/
                function diverFloating() {
                    createjs.Tween.get($scope.diverSwimming, {loop: false})
                        .to({
                            x: $scope.diverSwimming.x < 65 ? 70 : 60,
                            y: $scope.diverSwimming.y
                        }, 2000, createjs.Ease.getPowInOut(1))
                        .call(function () {
                            console.log("Diver floating Tween completed!");
                            diverFloating();
                        });
                }

                /*Function that creates the chain animation*/
                function chainFloating() {
                    createjs.Tween.get($scope.diverChain, {loop: false})
                        .to({
                            x: $scope.diverChain.x < 75 ? 80 : 70,
                            y: $scope.diverChain.y
                        }, 2000, createjs.Ease.getPowInOut(1))
                        .call(function () {
                            console.log("Chain floating Tween completed!");
                            chainFloating();
                        });
                }

                /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

                /*Function that handles letters selection*/
                function selectingLetters(selectedLetterX, selectedLetterY) {

                    /*Checking if the length is 1*/
                    if ($scope.selectedLettersArray.length === 1) {
                        /*The length is 1 and it's the second selection, trying to block single backwards selection*/

                        if (selectedLetterX < $scope.letterContainers[$scope.selectedLettersArray[0].index].x || selectedLetterY < $scope.letterContainers[$scope.selectedLettersArray[0].index].y) {
                            console.warn("Single invalid selection!");
                            return;
                        }
                    }

                    for (var rowKey = 0; rowKey < $scope.activityData.lettersArray.length; rowKey++) {
                        for (var columnKey = 0; columnKey < $scope.activityData.lettersArray[rowKey].length; columnKey++) {

                            var letterIndex = rowKey + "_" + columnKey;


                            if (ionic.DomUtil.rectContains(
                                    selectedLetterX,
                                    selectedLetterY,
                                    $scope.letterContainers[letterIndex].x,
                                    $scope.letterContainers[letterIndex].y,
                                    $scope.letterContainers[letterIndex].x + $scope.letterContainers[letterIndex].width,
                                    $scope.letterContainers[letterIndex].y + $scope.letterContainers[letterIndex].height)) {

                                console.log("Letter selected: ", $scope.letterTexts[letterIndex].text);

                                /* 1.Checking if the selected letter has already been added! */
                                if (_.findWhere($scope.selectedLettersArray, {"index": letterIndex})) {
                                    console.warn("The selected letter has already been added...");

                                    /*2. The selected letter has been added. Checking if the selected letter is the last letter that selected*/
                                    if ($scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index === letterIndex) {
                                        /*3.a The letter is the last that selected*/
                                        console.log("The letter is the last that selected. Probably repeated pressmove event on the same letterContainer...");

                                    } else {
                                        /*3.a The letter is not the last one!*/
                                        console.warn("The letter is not the last one! Selection has gone backwards!");

                                        /*4. Checking the distance between the last selected letter and the current selection*/
                                        //First checking if the selection is on vertically or horizontally


                                        /** STARTING POINT FOR UNDO **/


                                        if ($scope.letterContainers[letterIndex].x < $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].x) {

                                            /** CALCULATIONS FOR COLUMNS (REMOVE)**/
                                            /*The index in this case is like this: 0_3, splitting to retrieve columnKey*/
                                            var selectedBackwardsLetterColumnKey = letterIndex.split("_");
                                            console.log("selectedBackwardsLetterColumnKey: ", selectedBackwardsLetterColumnKey);

                                            var lastBackwardsLetterColumnKey = $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index.split("_");
                                            console.log("lastBackwardsLetterColumnKey: ", lastBackwardsLetterColumnKey);

                                            var backwardsDistance = parseInt(parseInt(lastBackwardsLetterColumnKey[1] - selectedBackwardsLetterColumnKey[1]));
                                            console.log("Calculated distance: ", backwardsDistance);

                                            //Checking the distance
                                            if (backwardsDistance > 1) {
                                                console.warn("Distance is greater than 1. Erasing the missing letters!");

                                                for (var missingBackwardsLetterColumnKey = parseInt(selectedBackwardsLetterColumnKey[1]) + 1; missingBackwardsLetterColumnKey <= parseInt(lastBackwardsLetterColumnKey[1]); missingBackwardsLetterColumnKey++) {

                                                    /*Creating the new letterIndex for the missing letters*/
                                                    var missingBackwardsLetterIndex = selectedBackwardsLetterColumnKey[0] + "_" + missingBackwardsLetterColumnKey;
                                                    console.log("Erasing letter with index: ", missingBackwardsLetterIndex);


                                                    var removingMultipleLetterIndex = _.findIndex($scope.selectedLettersArray, {"index": missingBackwardsLetterIndex});

                                                    if (removingMultipleLetterIndex > -1) {
                                                        $scope.selectedLettersArray.splice(removingMultipleLetterIndex, 1);
                                                    } else {
                                                        console.error("Error on finding index for removing multiple letters during backwards selection. Index: ", removingMultipleLetterIndex);
                                                        console.log({
                                                            "index": missingBackwardsLetterIndex,
                                                            "letter": $scope.letterTexts[missingBackwardsLetterIndex].text
                                                        });
                                                    }

                                                    //Resetting erased letter style to default
                                                    $scope.letterBackgrounds[missingBackwardsLetterIndex].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[missingBackwardsLetterIndex].width, $scope.letterContainers[missingBackwardsLetterIndex].height);
                                                    $scope.letterTexts[missingBackwardsLetterIndex].color = "black";
                                                }

                                            } else {

                                                /*Erasing the selected letter when the distance is < 1 */
                                                var removingLetterIndex = _.findIndex($scope.selectedLettersArray, {"index": $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index});

                                                if (removingLetterIndex > -1) {
                                                    $scope.selectedLettersArray.splice(removingLetterIndex, 1);
                                                } else {
                                                    console.error("Error on finding index for removing letter during backwards selection. Index: ", removingLetterIndex);
                                                }


                                                /*Finding the key of the deselected letter! */
                                                var deselectedLetterKey = "";

                                                deselectedLetterKey = selectedBackwardsLetterColumnKey[0] + "_" + (parseInt(selectedBackwardsLetterColumnKey[1]) + 1);

                                                console.warn("Deselected letter key: ", deselectedLetterKey);

                                                /*Changing the color of the selected letter container and text*/
                                                $scope.letterBackgrounds[deselectedLetterKey].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[deselectedLetterKey].width, $scope.letterContainers[deselectedLetterKey].height);
                                                $scope.letterTexts[deselectedLetterKey].color = "black";

                                            }
                                        }


                                        /** CALCULATIONS FOR ROWS (REMOVE)**/
                                        else if ($scope.letterContainers[letterIndex].y < $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].y) {

                                            /*The index in this case is like this: 0_3, splitting to retrieve columnKey*/
                                            var selectedBackwardsLetterRowKey = letterIndex.split("_");
                                            console.log("selectedLetterRowKey: ", selectedBackwardsLetterRowKey);

                                            var lastBackwardsLetterRowKey = $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index.split("_");
                                            console.log("lastBackwardsLetterRowKey: ", lastBackwardsLetterRowKey);

                                            var backwardsDistanceOnRows = parseInt(parseInt(lastBackwardsLetterRowKey[0] - selectedBackwardsLetterRowKey[0]));
                                            console.log("Calculated distance: ", backwardsDistanceOnRows);

                                            //Checking the distance
                                            if (backwardsDistanceOnRows > 1) {
                                                console.warn("Distance is greater than 1. Erasing the missing letters!");

                                                for (var missingBackwardsLetterRowKey = parseInt(selectedBackwardsLetterRowKey[0]) + 1; missingBackwardsLetterRowKey <= parseInt(lastBackwardsLetterRowKey[0]); missingBackwardsLetterRowKey++) {

                                                    /*Creating the new letterIndex for the missing letters*/
                                                    var missingBackwardsLetterForRowsIndex = missingBackwardsLetterRowKey + "_" + lastBackwardsLetterRowKey[1];
                                                    console.log("Erasing letter with index: ", missingBackwardsLetterForRowsIndex);

                                                    var removingMultipleLetterForIndex = _.findIndex($scope.selectedLettersArray, {"index": missingBackwardsLetterForRowsIndex});

                                                    if (removingMultipleLetterForIndex > -1) {
                                                        $scope.selectedLettersArray.splice(removingMultipleLetterForIndex, 1);
                                                    } else {
                                                        console.error("Error on finding index for removing multiple letters during backwards selection. Index: ", removingMultipleLetterForIndex);
                                                        console.log({
                                                            "index": missingBackwardsLetterForRowsIndex,
                                                            "letter": $scope.letterTexts[missingBackwardsLetterForRowsIndex].text
                                                        });
                                                    }

                                                    $scope.letterBackgrounds[missingBackwardsLetterForRowsIndex].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[missingBackwardsLetterForRowsIndex].width, $scope.letterContainers[missingBackwardsLetterForRowsIndex].height);
                                                    $scope.letterTexts[missingBackwardsLetterForRowsIndex].color = "black";
                                                }

                                            } else {
                                                console.log("Distance is lower than 1...");

                                                /*Erasing the selected letter when the distance is < 1 */
                                                var removingLetterForRowsIndex = _.findIndex($scope.selectedLettersArray, {"index": $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index});
                                                if (removingLetterForRowsIndex > -1) {
                                                    $scope.selectedLettersArray.splice(removingLetterForRowsIndex, 1);
                                                } else {
                                                    console.error("Error on finding index for removing letter during backwards selection. Index: ", removingLetterForRowsIndex);
                                                }


                                                /*Finding the key of the deselected letter! */
                                                var deselectedLetterForRowsKey = "";

                                                deselectedLetterForRowsKey = (parseInt(selectedBackwardsLetterRowKey[0]) + 1) + "_" + selectedBackwardsLetterRowKey[1];

                                                console.warn("Deselected letter key: ", deselectedLetterForRowsKey);

                                                /*Changing the color of the selected letter container and text*/
                                                $scope.letterBackgrounds[deselectedLetterForRowsKey].graphics.beginFill("azure").drawRect(0, 0, $scope.letterContainers[deselectedLetterForRowsKey].width, $scope.letterContainers[deselectedLetterForRowsKey].height);
                                                $scope.letterTexts[deselectedLetterForRowsKey].color = "black";
                                            }
                                        }
                                    }

                                } else {

                                    console.warn("The selected letter has not added...");

                                    /*Make sure that letter is going to the right direction*/
                                    console.log("Selection is valid!!!");
                                    if ($scope.selectedLettersArray.length > 1) {
                                        if (($scope.letterContainers[letterIndex].x === $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 2].index].x
                                            || $scope.letterContainers[letterIndex].y === $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 2].index].y)
                                            && ($scope.letterContainers[letterIndex].x === $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].x
                                            || $scope.letterContainers[letterIndex].y === $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].y)
                                            && (($scope.letterContainers[letterIndex].x > $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].x)
                                            || ($scope.letterContainers[letterIndex].y > $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].y))) {
                                            console.log("Going to the right direction!");

                                            /*Checking for distant selection, if there is one checks if it's valid and selects the valid letters between the selections*/
                                            //First checking if the selection is on vertically or horizontally
                                            if ($scope.letterContainers[letterIndex].x > $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].x) {

                                                /** CALCULATIONS FOR COLUMNS (ADD) **/
                                                /*The index in this case is like this: 0_3, splitting to retrieve columnKey*/
                                                var selectedLetterColumnKey = letterIndex.split("_");
                                                console.log("selectedLetterColumnKey: ", selectedLetterColumnKey);

                                                var lastLetterColumnKey = $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index.split("_");
                                                console.log("lastLetterColumnKey: ", lastLetterColumnKey);

                                                var distance = parseInt(selectedLetterColumnKey[1]) - parseInt(lastLetterColumnKey[1]);
                                                console.log("Calculated distance: ", distance);

                                                //Checking the distance
                                                if (distance > 1) {
                                                    console.warn("Distance is greater than 1. Filling the missing letters!");

                                                    for (var missingLetterColumnKey = parseInt(lastLetterColumnKey[1]) + 1; missingLetterColumnKey <= parseInt(selectedLetterColumnKey[1]); missingLetterColumnKey++) {

                                                        /*Creating the new letterIndex for the missing letters*/
                                                        var missingLetterIndex = selectedLetterColumnKey[0] + "_" + missingLetterColumnKey;
                                                        console.log("Inserting letter with index: ", missingLetterIndex);

                                                        /*---------------------------------------SUCCESS----------------------------------*/
                                                        /*Inserting the selected letter into selectedLettersArray*/
                                                        $scope.selectedLettersArray.push({
                                                            "index": missingLetterIndex,
                                                            "letter": $scope.letterTexts[missingLetterIndex].text
                                                        });
                                                        /*Changing the color of the selected letter container and text*/
                                                        $scope.letterBackgrounds[missingLetterIndex].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[missingLetterIndex].width, $scope.letterContainers[missingLetterIndex].height);
                                                        $scope.letterTexts[missingLetterIndex].color = "white";
                                                        /*---------------------------------------SUCCESS----------------------------------*/
                                                    }

                                                } else {
                                                    console.log("Distance is lower than 1...");

                                                    /*---------------------------------------SUCCESS----------------------------------*/
                                                    /*Inserting the selected letter into selectedLettersArray*/
                                                    $scope.selectedLettersArray.push({
                                                        "index": letterIndex,
                                                        "letter": $scope.letterTexts[letterIndex].text
                                                    });
                                                    /*Changing the color of the selected letter container and text*/
                                                    $scope.letterBackgrounds[letterIndex].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[letterIndex].width, $scope.letterContainers[letterIndex].height);
                                                    $scope.letterTexts[letterIndex].color = "white";
                                                    /*---------------------------------------SUCCESS----------------------------------*/
                                                }

                                            }
                                            /** CALCULATIONS FOR ROWS (ADD)**/
                                            else if ($scope.letterContainers[letterIndex].y > $scope.letterContainers[$scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index].y) {

                                                /*The index in this case is like this: 0_3, splitting to retrieve columnKey*/
                                                var selectedLetterRowKey = letterIndex.split("_");
                                                console.log("selectedLetterColumnKey: ", selectedLetterColumnKey);

                                                var lastLetterRowKey = $scope.selectedLettersArray[$scope.selectedLettersArray.length - 1].index.split("_");
                                                console.log("lastLetterColumnKey: ", lastLetterRowKey);

                                                var distanceOnRows = parseInt(selectedLetterRowKey[0]) - parseInt(lastLetterRowKey[0]);
                                                console.log("Calculated distance: ", distanceOnRows);

                                                //Checking the distance
                                                if (distanceOnRows > 1) {
                                                    console.warn("Distance is greater than 1. Filling the missing letters!");

                                                    for (var missingLetterRowKey = parseInt(lastLetterRowKey[0]) + 1; missingLetterRowKey <= parseInt(selectedLetterRowKey[0]); missingLetterRowKey++) {

                                                        /*Creating the new letterIndex for the missing letters*/
                                                        var missingLetterForRowsIndex = missingLetterRowKey + "_" + selectedLetterRowKey[1];
                                                        console.log("Inserting letter with index: ", missingLetterForRowsIndex);

                                                        /*---------------------------------------SUCCESS----------------------------------*/
                                                        /*Inserting the selected letter into selectedLettersArray*/
                                                        $scope.selectedLettersArray.push({
                                                            "index": missingLetterForRowsIndex,
                                                            "letter": $scope.letterTexts[missingLetterForRowsIndex].text
                                                        });
                                                        /*Changing the color of the selected letter container and text*/
                                                        $scope.letterBackgrounds[missingLetterForRowsIndex].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[missingLetterForRowsIndex].width, $scope.letterContainers[missingLetterForRowsIndex].height);
                                                        $scope.letterTexts[missingLetterForRowsIndex].color = "white";
                                                        /*---------------------------------------SUCCESS----------------------------------*/
                                                    }

                                                } else {
                                                    console.log("Distance is lower than 1...");

                                                    /*---------------------------------------SUCCESS----------------------------------*/
                                                    /*Inserting the selected letter into selectedLettersArray*/
                                                    $scope.selectedLettersArray.push({
                                                        "index": letterIndex,
                                                        "letter": $scope.letterTexts[letterIndex].text
                                                    });
                                                    /*Changing the color of the selected letter container and text*/
                                                    $scope.letterBackgrounds[letterIndex].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[letterIndex].width, $scope.letterContainers[letterIndex].height);
                                                    $scope.letterTexts[letterIndex].color = "white";
                                                    /*---------------------------------------SUCCESS----------------------------------*/
                                                }
                                            }

                                        } else {
                                            console.warn("Going to wrong direction...");
                                        }


                                    } else {
                                        /*Adding the element with no restrictions*/
                                        console.log("Less than 1< letters selected. Adding the element with no restrictions...");

                                        /*Inserting the selected letter into selectedLettersArray*/
                                        $scope.selectedLettersArray.push({
                                            "index": letterIndex,
                                            "letter": $scope.letterTexts[letterIndex].text
                                        });

                                        /*Changing the color of the selected letter container and text*/
                                        $scope.letterBackgrounds[letterIndex].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[letterIndex].width, $scope.letterContainers[letterIndex].height);
                                        $scope.letterTexts[letterIndex].color = "white";
                                    }
                                }

                            }//end of if there is collision...
                        }//end of second for loop for columns

                    }//end of first for loop for rows
                }//end of selectingLetters() function


                /*Function that returns the full word currently the user selects*/
                function getSelectedWord() {
                    var currentlySelectedWord = "";
                    _.each($scope.selectedLettersArray, function (letter, key, list) {
                        currentlySelectedWord += $scope.selectedLettersArray[key].letter;
                    });
                    /*console.log("Currently selected word: ", currentlySelectedWord);*/
                    return currentlySelectedWord;
                }


                /*Function for loading completed words*/
                function loadCompletedWords() {
                    _.each($scope.activityData.questions, function (question, key, list) {

                        /*Checking if the word is completed*/
                        if ($scope.activityData.questions[key].completedWordLetters && $scope.activityData.questions[key].completedWordLetters.length > 0) {
                            console.log("Found a save word!");

                            /*Iterating through letters of the saved word and apply selected layout*/
                            _.each($scope.activityData.questions[key].completedWordLetters, function (letter, letterKey, list) {
                                $scope.letterBackgrounds[$scope.activityData.questions[key].completedWordLetters[letterKey].index].graphics.beginFill("#A8CBFE").drawRect(0, 0, $scope.letterContainers[$scope.activityData.questions[key].completedWordLetters[letterKey].index].width, $scope.letterContainers[$scope.activityData.questions[key].completedWordLetters[letterKey].index].height);
                                $scope.letterTexts[$scope.activityData.questions[key].completedWordLetters[letterKey].index].color = "black";
                            });
                            /*Update the completed greek words during startup*/
                            $scope.greekWords[key].color = "blue";
                            $scope.greekWords[key].alpha = 0.1;
                        }
                    });
                }


                /*Function that updates the score*/
                function updateScore() {
                    /*Check how many correct answers exist*/
                    var completedWords = 0;
                    _.each($scope.activityData.questions, function (word, key, list) {
                        if ($scope.activityData.questions[key].completedWordLetters && $scope.activityData.questions[key].completedWordLetters.length > 0) {
                            completedWords++;
                        }
                    });

                    //Updating score
                    $scope.scoreText.text = "Score: " + completedWords + " / " + $scope.activityData.questions.length;
                    $scope.activityData.score = completedWords;
                    $scope.stage.update();
                }

                /*Function that resolves how much the step has to be according to the number of questions*/
                function getDiverStep() {
                    /**
                     * The available length of rope is 540 (The full length is 550)
                     * Rope's initial Y is -465
                     * Diver's initial Y is 85
                     * */
                    console.warn("Step: ", 370 / $scope.activityData.questions.length);
                    return 370 / $scope.activityData.questions.length;
                }


                /*Function that updates the position of diver and chain*/
                function updateDiverAndChain() {
                    //Remove tween
                    createjs.Tween.removeTweens($scope.diverSwimming);
                    createjs.Tween.removeTweens($scope.diverChain);

                    //Making diverBottom invisible and reloading diverSwimming
                    $scope.diverBottom.visible = false;
                    $scope.diverBottom.gotoAndPlay("normal");
                    $scope.diverSwimming.visible = true;
                    //Make completed property false
                    $scope.activityData.completed = false;
                    $scope.nextButton.gotoAndPlay("normal");
                    $scope.completedActivityContainer.visible = false;

                    var completedWords = 0;
                    var diverSwimmingY = 85;
                    var diverChainY = -465;

                    _.each($scope.activityData.questions, function (word, key, list) {
                        if ($scope.activityData.questions[key].completedWordLetters && $scope.activityData.questions[key].completedWordLetters.length > 0) {
                            //Updating diver and chain positions
                            diverSwimmingY += getDiverStep();
                            diverChainY += getDiverStep();

                            completedWords++;
                        }
                    });

                    async.parallel([function (callback) {

                        createjs.Tween.get($scope.diverSwimming, {loop: false})
                            .to({
                                y: diverSwimmingY
                            }, 2000, createjs.Ease.getPowInOut(1))
                            .call(function () {
                                callback();
                            });


                    }, function (callback) {


                        createjs.Tween.get($scope.diverChain, {loop: false})
                            .to({
                                y: diverChainY
                            }, 2000, createjs.Ease.getPowInOut(1))
                            .call(function () {
                                callback();
                            });

                    }], function (err, result) {
                        /*Re-animate diver and chain*/
                        chainFloating();
                        diverFloating();

                        /*Resolving if the diver has reached bottom*/
                        if (completedWords === $scope.activityData.questions.length) {
                            $scope.diverSwimming.visible = false;
                            $scope.diverBottom.y = $scope.diverSwimming.y;
                            $scope.diverBottom.visible = true;
                            createjs.Tween.removeTweens($scope.diverChain);
                            createjs.Tween.removeTweens($scope.diverSwimming);
                            $scope.diverBottom.gotoAndPlay("bottom");
                            //Activity has completed
                            $scope.activityData.completed = true;
                            $scope.completedActivityContainer.visible = true;
                            $scope.nextButton.gotoAndPlay("onSelection");
                        }
                    });
                }


                /*Function that positions diver and chain to initial positions*/
                function restartDiverAndChain() {
                    $scope.diverSwimming.y = 85;
                    $scope.diverChain.y = -465;
                    updateDiverAndChain();
                }

            });//end of image on complete
        }, 500);//end of timeout
    });

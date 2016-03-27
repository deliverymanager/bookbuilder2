angular.module("bookbuilder2")
    .controller("VocabularyController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

        console.log("VocabularyController loaded!");


        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/

        $rootScope.selectedLesson = {
            "lessonTitle": "Lesson 1",
            "title": "Family shopping",
            "id": "lesson1",
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
        $rootScope.rootDir = "";


        /*- TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST - - TEST -*/

        $timeout(function () {

            var stage = new createjs.Stage(document.getElementById("vocabularyCanvas"));
            var ctx = document.getElementById("vocabularyCanvas").getContext("2d");
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
                $scope.$apply();
                stage.update();
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


                        $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/vocabulary.json")
                            .success(function (response) {

                                $scope.activityData = response;

                                //Creating the containers
                                createSingleColumnWordsContainers();
                                createSingleColumnPhrasesContainers();
                                createMultiColumnContainers();

                                /*Starting page and populating the containers*/

                                // 1)Populating Words containers
                                loadButtons();
                                loadIndexes();
                                loadEnglishWords();
                                loadEquals();
                                loadGreekWords();

                                // 2)Populating Phrases containers

                                loadPhrasesButtons();
                                loadPhrasesIndexes();
                                loadEnglishPhrases();
                                loadPhrasesEquals();
                                loadGreekPhrases();

                                // 3)Populating Derivatives containers


                                //Finally loading page initialized for "words" section...
                                loadPage("words");


                                $scope.sounds = {};
                                var assetPath = $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/";
                                console.log("$scope.activityData: ", $scope.activityData);

                                var waterFallFunctions = [];
                                _.each($scope.activityData, function (tabWords, tab, list) {
                                    _.each(tabWords, function (word, key, list) {

                                        waterFallFunctions.push(function (waterfallCallback) {
                                            console.log("Sound", word.name);
                                            if (ionic.Platform.isIOS() && window.cordova) {
                                                console.log("Else iOS");
                                                resolveLocalFileSystemURL(assetPath + word.name + ".mp3", function (entry) {
                                                    console.log(entry);
                                                    $scope.sounds[word.name] = new Media(entry.toInternalURL(), function () {
                                                        console.log("Sound success");
                                                    }, function (err) {
                                                        console.log("Sound error", err);
                                                    }, function (status) {
                                                        console.log("Sound status", status);
                                                    });
                                                    $timeout(function () {
                                                        waterfallCallback();
                                                    }, 100);
                                                });
                                            } else {
                                                console.log("Else Android");
                                                /*$scope.sounds[word.name] = new Media(assetPath + word.name + ".mp3", function () {
                                                 console.log("Sound success");
                                                 }, function (err) {
                                                 console.log("Sound error", err);
                                                 }, function (status) {
                                                 console.log("Sound status", status);
                                                 });*/

                                                $timeout(function () {
                                                    waterfallCallback();
                                                }, 100);

                                            }

                                        });
                                    });
                                });

                                console.log(waterFallFunctions.length);
                                async.waterfall(waterFallFunctions, function (err, response) {
                                    console.log($scope.sounds);
                                });
                            })
                            .error(function (error) {
                                console.error("Error on getting json for menu button...", error);
                            });//end of get menu button
                    })
                    .error(function (error) {
                        console.error("Error on getting json for menu button...", error);
                    });//end of get menu button


                /********************************** CREATION OF CONTAINERS **********************************/

                function createSingleColumnWordsContainers() {
                    $scope.buttonsContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.buttonsContainer.width = 120;
                    $scope.buttonsContainer.height = backgroundPosition.height / 1.15;
                    $scope.buttonsContainer.scaleX = $scope.buttonsContainer.scaleY = scale;
                    $scope.buttonsContainer.x = backgroundPosition.x + 30;
                    $scope.buttonsContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /* var testGraphics = new createjs.Graphics().beginFill("red");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics.drawRoundRect(0, 0, $scope.buttonsContainer.width, $scope.buttonsContainer.height, 1);

                     var testShape = new createjs.Shape(testGraphics);
                     testShape.setTransform($scope.buttonsContainer.x, $scope.buttonsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.buttonsContainer.addChild(testShape);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.buttonsContainer);
                    stage.update();


                    /*INDEX CONTAINER*/
                    $scope.indexContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.indexContainer.width = 40;
                    $scope.indexContainer.height = backgroundPosition.height / 1.15;
                    $scope.indexContainer.scaleX = $scope.indexContainer.scaleY = scale;
                    $scope.indexContainer.x = backgroundPosition.x + 85;
                    $scope.indexContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics2 = new createjs.Graphics().beginFill("orangered");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics2.drawRoundRect(0, 0, $scope.indexContainer.width, $scope.indexContainer.height, 1);

                     var testShape2 = new createjs.Shape(testGraphics2);
                     testShape2.setTransform($scope.indexContainer.x, $scope.indexContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.indexContainer.addChild(testShape2);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.indexContainer);
                    stage.update();


                    /*ENGLISH WORDS CONTAINER*/
                    $scope.englishWordsContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.englishWordsContainer.width = 300;
                    $scope.englishWordsContainer.height = backgroundPosition.height / 1.15;
                    $scope.englishWordsContainer.scaleX = $scope.englishWordsContainer.scaleY = scale;
                    $scope.englishWordsContainer.x = backgroundPosition.x + 105;
                    $scope.englishWordsContainer.y = backgroundPosition.y + 5;


                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics3 = new createjs.Graphics().beginFill("darkred");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics3.drawRoundRect(0, 0, $scope.englishWordsContainer.width, $scope.englishWordsContainer.height, 1);

                     var testShape3 = new createjs.Shape(testGraphics3);
                     testShape3.setTransform($scope.englishWordsContainer.x, $scope.englishWordsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.englishWordsContainer.addChild(testShape3);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.englishWordsContainer);
                    stage.update();


                    /*EQUALS SIGN CONTAINER*/
                    $scope.equalsSignContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.equalsSignContainer.width = 30;
                    $scope.equalsSignContainer.height = backgroundPosition.height / 1.15;
                    $scope.equalsSignContainer.scaleX = $scope.equalsSignContainer.scaleY = scale;
                    $scope.equalsSignContainer.x = backgroundPosition.x + 330;
                    $scope.equalsSignContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics4 = new createjs.Graphics().beginFill("yellow");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics4.drawRoundRect(0, 0, $scope.equalsSignContainer.width, $scope.equalsSignContainer.height, 1);

                     var testShape4 = new createjs.Shape(testGraphics4);
                     testShape4.setTransform($scope.equalsSignContainer.x, $scope.equalsSignContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.equalsSignContainer.addChild(testShape4);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.equalsSignContainer);
                    stage.update();


                    /*GREEK WORDS CONTAINER*/
                    $scope.greekWordsContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.greekWordsContainer.width = 300;
                    $scope.greekWordsContainer.height = backgroundPosition.height / 1.15;
                    $scope.greekWordsContainer.scaleX = $scope.greekWordsContainer.scaleY = scale;
                    $scope.greekWordsContainer.x = backgroundPosition.x + 260;
                    $scope.greekWordsContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics5 = new createjs.Graphics().beginFill("blue");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics5.drawRoundRect(0, 0, $scope.greekWordsContainer.width, $scope.greekWordsContainer.height, 1);

                     var testShape5 = new createjs.Shape(testGraphics5);
                     testShape5.setTransform($scope.greekWordsContainer.x, $scope.greekWordsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.greekWordsContainer.addChild(testShape5);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.greekWordsContainer);
                    stage.update();

                }//End of creating single column words containers function

                function createSingleColumnPhrasesContainers() {
                    $scope.buttonsPhrasesContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.buttonsPhrasesContainer.width = 120;
                    $scope.buttonsPhrasesContainer.height = backgroundPosition.height / 1.15;
                    $scope.buttonsPhrasesContainer.scaleX = $scope.buttonsPhrasesContainer.scaleY = scale;
                    $scope.buttonsPhrasesContainer.x = backgroundPosition.x + 30;
                    $scope.buttonsPhrasesContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /* var testGraphics = new createjs.Graphics().beginFill("red");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics.drawRoundRect(0, 0, $scope.buttonsPhrasesContainer.width, $scope.buttonsPhrasesContainer.height, 1);

                     var testShape = new createjs.Shape(testGraphics);
                     testShape.setTransform($scope.buttonsPhrasesContainer.x, $scope.buttonsPhrasesContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.buttonsPhrasesContainer.addChild(testShape);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.buttonsPhrasesContainer);
                    stage.update();


                    /*INDEX CONTAINER*/
                    $scope.indexPhrasesContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.indexPhrasesContainer.width = 40;
                    $scope.indexPhrasesContainer.height = backgroundPosition.height / 1.15;
                    $scope.indexPhrasesContainer.scaleX = $scope.indexPhrasesContainer.scaleY = scale;
                    $scope.indexPhrasesContainer.x = backgroundPosition.x + 85;
                    $scope.indexPhrasesContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics2 = new createjs.Graphics().beginFill("orangered");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics2.drawRoundRect(0, 0, $scope.indexPhrasesContainer.width, $scope.indexPhrasesContainer.height, 1);

                     var testShape2 = new createjs.Shape(testGraphics2);
                     testShape2.setTransform($scope.indexPhrasesContainer.x, $scope.indexPhrasesContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.indexPhrasesContainer.addChild(testShape2);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.indexPhrasesContainer);
                    stage.update();


                    /*ENGLISH WORDS CONTAINER*/
                    $scope.englishPhrasesContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.englishPhrasesContainer.width = 300;
                    $scope.englishPhrasesContainer.height = backgroundPosition.height / 1.15;
                    $scope.englishPhrasesContainer.scaleX = $scope.englishPhrasesContainer.scaleY = scale;
                    $scope.englishPhrasesContainer.x = backgroundPosition.x + 105;
                    $scope.englishPhrasesContainer.y = backgroundPosition.y + 5;


                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics3 = new createjs.Graphics().beginFill("darkred");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics3.drawRoundRect(0, 0, $scope.englishPhrasesContainer.width, $scope.englishPhrasesContainer.height, 1);

                     var testShape3 = new createjs.Shape(testGraphics3);
                     testShape3.setTransform($scope.englishPhrasesContainer.x, $scope.englishPhrasesContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.englishPhrasesContainer.addChild(testShape3);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.englishPhrasesContainer);
                    stage.update();


                    /*EQUALS SIGN CONTAINER*/
                    $scope.equalsSignPhrasesContainer = new createjs.Container();

                    console.log("Creating equals phrases container...");

                    $scope.equalsSignPhrasesContainer.width = 30;
                    $scope.equalsSignPhrasesContainer.height = backgroundPosition.height / 1.15;
                    $scope.equalsSignPhrasesContainer.scaleX = $scope.equalsSignPhrasesContainer.scaleY = scale;
                    $scope.equalsSignPhrasesContainer.x = backgroundPosition.x + 330;
                    $scope.equalsSignPhrasesContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics4 = new createjs.Graphics().beginFill("yellow");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics4.drawRoundRect(0, 0, $scope.equalsSignPhrasesContainer.width, $scope.equalsSignPhrasesContainer.height, 1);

                     var testShape4 = new createjs.Shape(testGraphics4);
                     testShape4.setTransform($scope.equalsSignPhrasesContainer.x, $scope.equalsSignPhrasesContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.equalsSignPhrasesContainer.addChild(testShape4);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.equalsSignPhrasesContainer);
                    stage.update();


                    /*GREEK WORDS CONTAINER*/
                    $scope.greekPhrasesContainer = new createjs.Container();

                    console.log("Creating buttons container...");

                    $scope.greekPhrasesContainer.width = 300;
                    $scope.greekPhrasesContainer.height = backgroundPosition.height / 1.15;
                    $scope.greekPhrasesContainer.scaleX = $scope.greekPhrasesContainer.scaleY = scale;
                    $scope.greekPhrasesContainer.x = backgroundPosition.x + 260;
                    $scope.greekPhrasesContainer.y = backgroundPosition.y + 5;

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    /*var testGraphics5 = new createjs.Graphics().beginFill("blue");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics5.drawRoundRect(0, 0, $scope.greekPhrasesContainer.width, $scope.greekPhrasesContainer.height, 1);

                     var testShape5 = new createjs.Shape(testGraphics5);
                     testShape5.setTransform($scope.greekPhrasesContainer.x, $scope.greekPhrasesContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.greekPhrasesContainer.addChild(testShape5);
                     stage.update();*/
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.greekPhrasesContainer);
                    stage.update();

                }//End of creating single column phrases containers function

                /*CREATION OF MULTI COLUMN CONTAINERS*/
                function createMultiColumnContainers() {

                    $scope.verbsContainer = new createjs.Container();

                    console.log("Creating  $scope.verbsContainer...");

                    $scope.verbsContainer.width = backgroundPosition.width / 2.6;
                    $scope.verbsContainer.height = backgroundPosition.height / 2.5;
                    $scope.verbsContainer.scaleX = $scope.verbsContainer.scaleY = scale;
                    $scope.verbsContainer.x = backgroundPosition.x + (backgroundPosition.width / 33);
                    $scope.verbsContainer.y = backgroundPosition.y + (backgroundPosition.height / 50);

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    var testGraphics4 = new createjs.Graphics().beginFill("darkred");
                    //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                    testGraphics4.drawRoundRect(0, 0, $scope.verbsContainer.width, $scope.verbsContainer.height, 1);

                    var testShape4 = new createjs.Shape(testGraphics4);
                    testShape4.setTransform($scope.verbsContainer.x, $scope.verbsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                    $scope.verbsContainer.addChild(testShape4);
                    stage.update();
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.verbsContainer);
                    stage.update();



                    /*NOUNS CONTAINER*/
                    $scope.nounsContainer = new createjs.Container();

                    console.log("Creating  $scope.nounsContainer...");

                    $scope.nounsContainer.width = backgroundPosition.width / 2.6;
                    $scope.nounsContainer.height = backgroundPosition.height / 2.5;
                    $scope.nounsContainer.scaleX = $scope.nounsContainer.scaleY = scale;
                    $scope.nounsContainer.x = backgroundPosition.x + (backgroundPosition.width / 4.5);
                    $scope.nounsContainer.y = backgroundPosition.y + (backgroundPosition.height / 50);

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    var testGraphics3 = new createjs.Graphics().beginFill("orange");
                    //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                    testGraphics3.drawRoundRect(0, 0, $scope.nounsContainer.width, $scope.nounsContainer.height, 1);

                    var testShape3 = new createjs.Shape(testGraphics3);
                    testShape3.setTransform($scope.nounsContainer.x, $scope.nounsContainer.y, scale, scale, 0, 0, 0, 0, 0);
                    $scope.nounsContainer.addChild(testShape3);
                    stage.update();
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.nounsContainer);
                    stage.update();



                    /*NOUN CONTAINER*/
                    $scope.nounContainer = new createjs.Container();

                    console.log("Creating  $scope.nounContainer...");

                    $scope.nounContainer.width = backgroundPosition.width / 2.6;
                    $scope.nounContainer.height = backgroundPosition.height / 2.5;
                    $scope.nounContainer.scaleX = $scope.nounContainer.scaleY = scale;
                    $scope.nounContainer.x = backgroundPosition.x + (backgroundPosition.width / 33);
                    $scope.nounContainer.y = backgroundPosition.y + (backgroundPosition.height / 4.5);

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    var testGraphics1 = new createjs.Graphics().beginFill("yellow");
                    //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                    testGraphics1.drawRoundRect(0, 0, $scope.nounContainer.width, $scope.nounContainer.height, 1);

                    var testShape1 = new createjs.Shape(testGraphics1);
                    testShape1.setTransform($scope.nounContainer.x, $scope.nounContainer.y, scale, scale, 0, 0, 0, 0, 0);
                    $scope.nounContainer.addChild(testShape1);
                    stage.update();
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.nounContainer);
                    stage.update();



                    /*ADJECTIVE CONTAINER*/
                    $scope.adjectiveContainer = new createjs.Container();

                    console.log("Creating  $scope.adjectiveContainer...");

                    $scope.adjectiveContainer.width = backgroundPosition.width / 2.6;
                    $scope.adjectiveContainer.height = backgroundPosition.height / 2.5;
                    $scope.adjectiveContainer.scaleX = $scope.adjectiveContainer.scaleY = scale;
                    $scope.adjectiveContainer.x = backgroundPosition.x + (backgroundPosition.width / 4.5);
                    $scope.adjectiveContainer.y = backgroundPosition.y + (backgroundPosition.height / 4.5);

                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
                    var testGraphics2 = new createjs.Graphics().beginFill("orangered");
                     //Drawing the shape !!!NOTE Every optimization before drawRoundRect
                     testGraphics2.drawRoundRect(0, 0, $scope.adjectiveContainer.width, $scope.adjectiveContainer.height, 1);

                     var testShape2 = new createjs.Shape(testGraphics2);
                     testShape2.setTransform($scope.adjectiveContainer.x, $scope.adjectiveContainer.y, scale, scale, 0, 0, 0, 0, 0);
                     $scope.adjectiveContainer.addChild(testShape2);
                     stage.update();
                    /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

                    stage.addChild($scope.adjectiveContainer);
                    stage.update();

                }//End of creating multiple column containers function


                /******************************** MAIN FUNCTION CREATION OF PAGE ********************************
                 *
                 * Constructs the page according to the parameter (vocabularySection) that it will be passed
                 * Possible parameters: "words", "phrases", "derivatives"
                 *
                 ************************************************************************************************/

                $scope.selectedVocabularySection = '';
                function loadPage(vocabularySection) {

                    $scope.selectedVocabularySection = vocabularySection;

                    /*Hides containers of other templates, and make selectedTemplate*/

                    if (vocabularySection === "words") {

                        console.log("Loading Vocabulary's Words!");

                        $scope.buttonsPhrasesContainer.visible = false;
                        $scope.indexPhrasesContainer.visible = false;
                        $scope.greekPhrasesContainer.visible = false;
                        $scope.equalsSignPhrasesContainer.visible = false;
                        $scope.englishPhrasesContainer.visible = false;

                        $scope.verbsContainer.visible = false;
                        $scope.nounsContainer.visible = false;
                        $scope.nounContainer.visible = false;
                        $scope.adjectiveContainer.visible = false;

                        $scope.buttonsContainer.visible = true;
                        $scope.indexContainer.visible = true;
                        $scope.greekWordsContainer.visible = true;
                        $scope.equalsSignContainer.visible = true;
                        $scope.englishWordsContainer.visible = true;

                    } else if (vocabularySection === "phrases") {

                        console.log("Loading Vocabulary's Phrases!");

                        $scope.buttonsContainer.visible = false;
                        $scope.indexContainer.visible = false;
                        $scope.greekWordsContainer.visible = false;
                        $scope.equalsSignContainer.visible = false;
                        $scope.englishWordsContainer.visible = false;

                        $scope.verbsContainer.visible = false;
                        $scope.nounsContainer.visible = false;
                        $scope.nounContainer.visible = false;
                        $scope.adjectiveContainer.visible = false;

                        $scope.buttonsPhrasesContainer.visible = true;
                        $scope.indexPhrasesContainer.visible = true;
                        $scope.greekPhrasesContainer.visible = true;
                        $scope.equalsSignPhrasesContainer.visible = true;
                        $scope.englishPhrasesContainer.visible = true;

                    } else {

                        console.log("Loading Derivatives' Phrases!");

                        $scope.buttonsContainer.visible = false;
                        $scope.indexContainer.visible = false;
                        $scope.greekWordsContainer.visible = false;
                        $scope.equalsSignContainer.visible = false;
                        $scope.englishWordsContainer.visible = false;

                        $scope.buttonsPhrasesContainer.visible = false;
                        $scope.indexPhrasesContainer.visible = false;
                        $scope.greekPhrasesContainer.visible = false;
                        $scope.equalsSignPhrasesContainer.visible = false;
                        $scope.englishPhrasesContainer.visible = false;

                        $scope.verbsContainer.visible = true;
                        $scope.nounsContainer.visible = true;
                        $scope.nounContainer.visible = true;
                        $scope.adjectiveContainer.visible = true;

                    }

                }//end of loadPage function()


                /********************************** POPULATING WORD CONTAINERS **********************************/

                /*LOAD BUTTONS*/
                function loadButtons() {

                    /*Initializing y that will change dynamically for every button*/
                    var buttonsY = 80;

                    /*Initializing SpriteSheet instances using waterfall*/
                    async.waterfall([
                        function (buttonsSpriteSheetCallback) {

                            /*English Button*/
                            $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for english button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the ccontainer*/
                                    _.each($scope.activityData.words, function (word, key, list) {


                                        /********************* Creating English button *********************/
                                        var enSmallButton = new createjs.Sprite(enSmallButtonSpriteSheet, "normal");

                                        enSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("mousedown event on a button !");
                                            enSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        enSmallButton.addEventListener("pressup", function (event) {
                                            console.log("pressup event!");
                                            enSmallButton.gotoAndPlay("normal");
                                            $scope.englishWordsBitmaps[word.name].visible = !$scope.englishWordsBitmaps[word.name].visible;
                                        });
                                        enSmallButton.x = $scope.buttonsContainer.x + 20;
                                        enSmallButton.y = buttonsY;
                                        $scope.buttonsContainer.addChild(enSmallButton);
                                        /*stage.update();*/

                                        /*** Updting stage and adding more Y before iterating again ***/
                                        stage.update();
                                        buttonsY += 20;

                                    });

                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for english button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Greek Button*/
                            $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for greek button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the ccontainer*/
                                    _.each($scope.activityData.words, function (word, key, list) {

                                        /******************** Creating Greek button ********************/
                                        var grSmallButton = new createjs.Sprite(grSmallButtonSpriteSheet, "normal");

                                        grSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("mousedown event on a button !");
                                            grSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        grSmallButton.addEventListener("pressup", function (event) {
                                            console.log("pressup event!");
                                            grSmallButton.gotoAndPlay("normal");
                                            $scope.greekWordsBitmaps[word.name].visible = !$scope.greekWordsBitmaps[word.name].visible;

                                        });
                                        grSmallButton.x = $scope.buttonsContainer.x + 50;
                                        grSmallButton.y = buttonsY;
                                        $scope.buttonsContainer.addChild(grSmallButton);
                                        /*stage.update();*/

                                        /*** Updting stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for greek button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Play Button*/
                            $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                                .success(function (response) {

                                    console.log("Success on getting json data for play button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the ccontainer*/
                                    _.each($scope.activityData.words, function (word, key, list) {

                                        /*********************Creating Play button*********************/
                                        var playSmallButton = new createjs.Sprite(playSmallButtonSpriteSheet, "normal");
                                        playSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("mousedown event on a button !");
                                            playSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        playSmallButton.addEventListener("pressup", function (event) {
                                            console.log("pressup event!");
                                            playSmallButton.gotoAndPlay("normal");

                                        });
                                        playSmallButton.x = $scope.buttonsContainer.x + 80;
                                        playSmallButton.y = buttonsY;
                                        /*playSmallButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                                         playSmallButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);*/
                                        $scope.buttonsContainer.addChild(playSmallButton);

                                        /*** Updting stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for play button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.error("Error on waterfall process for getting buttons spriteSheets...");
                        } else {
                            console.log("Success on waterfall process for getting buttons spriteSheets! Result: ", result);
                        }
                    });//End of waterfall
                }//End of loadButtons function


                /*LOAD INDEXES*/
                function loadIndexes() {

                    /*Initializing y that will change dynamically for every button*/
                    var indexesY = 80;

                    _.each($scope.activityData.words, function (word, key, list) {

                        var wordIndex = new createjs.Text(key + 1 + ".", "15px Arial", "black");

                        wordIndex.x = $scope.indexContainer.x + 20;
                        wordIndex.y = indexesY;
                        wordIndex.textBaseline = "alphabetic";
                        wordIndex.textAlign = "center";
                        wordIndex.maxWidth = $scope.indexContainer.width;

                        $scope.indexContainer.addChild(wordIndex);
                        /*stage.update();*/

                        /*** Updating stage and adding more Y before iterating again ***/
                        stage.update();
                        indexesY += 20;

                    });

                }//End of loadIndexes function


                /*LOAD ENGLISH WORDS*/
                function loadEnglishWords() {

                    /*Initializing y that will change dynamically for every button*/
                    var englishWordY = 70;
                    $scope.englishWordsBitmaps = {};

                    /*Iterating and populating the container*/
                    _.each($scope.activityData.words, function (word, key, list) {

                        $scope.englishWordsBitmaps[word.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + ".png");

                        $scope.englishWordsBitmaps[word.name].regX = $scope.englishWordsBitmaps[word.name].image.width / 2;
                        $scope.englishWordsBitmaps[word.name].regY = $scope.englishWordsBitmaps[word.name].image.height / 2;
                        $scope.englishWordsBitmaps[word.name].x = $scope.englishWordsContainer.x + 20;
                        $scope.englishWordsBitmaps[word.name].y = englishWordY;
                        /*$scope.englishWordsBitmaps[key].snapToPixel = false;*/
                        $scope.englishWordsContainer.addChild($scope.englishWordsBitmaps[word.name]);
                        stage.update();

                        englishWordY += 20;
                    });
                }//End of loadEnglishWords function


                /*LOAD EQUALS*/
                function loadEquals() {

                    /*Initializing y that will change dynamically for every button*/
                    var equalsY = 80;

                    _.each($scope.activityData.words, function (word, key, list) {

                        var equals = new createjs.Text("=", "15px Arial", "black");

                        equals.x = backgroundPosition.x + (backgroundPosition.width / 8);
                        equals.y = equalsY;
                        equals.textBaseline = "alphabetic";
                        equals.textAlign = "center";
                        equals.maxWidth = $scope.equalsSignContainer.width;

                        $scope.equalsSignContainer.addChild(equals);
                        /*stage.update();*/

                        /*** Updating stage and adding more Y before iterating again ***/
                        stage.update();
                        equalsY += 20;

                    });

                }//End of loadIndexes function


                /*LOAD GREEK WORDS*/
                function loadGreekWords() {

                    /*Initializing y that will change dynamically for every button*/
                    var greekWordY = 70;
                    $scope.greekWordsBitmaps = {};

                    /*Iterating and populating the container*/
                    _.each($scope.activityData.words, function (word, key, list) {

                        $scope.greekWordsBitmaps[word.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + "_gr.png");

                        $scope.greekWordsBitmaps[word.name].regX = $scope.greekWordsBitmaps[word.name].image.width / 2;
                        $scope.greekWordsBitmaps[word.name].regY = $scope.greekWordsBitmaps[word.name].image.height / 2;
                        $scope.greekWordsBitmaps[word.name].x = $scope.greekWordsContainer.x + 20;
                        $scope.greekWordsBitmaps[word.name].y = greekWordY;
                        $scope.greekWordsContainer.addChild($scope.greekWordsBitmaps[word.name]);
                        stage.update();

                        greekWordY += 20;
                    });
                }//End of loadGreekWords function


                /********************************** POPULATING PHRASES CONTAINERS **********************************/

                /*LOAD PHRASES BUTTONS*/
                function loadPhrasesButtons() {

                    /*Initializing y that will change dynamically for every button*/
                    var buttonsY = 80;

                    /*Initializing SpriteSheet instances using waterfall*/
                    async.waterfall([
                        function (buttonsSpriteSheetCallback) {

                            /*English Button*/
                            $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for english button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the container*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {


                                        /********************* Creating English button *********************/
                                        var enSmallButton = new createjs.Sprite(enSmallButtonSpriteSheet, "normal");

                                        enSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on a button !");
                                            enSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        enSmallButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event!");
                                            enSmallButton.gotoAndPlay("normal");
                                            $scope.englishPhrasesBitmaps[phrase.name].visible = !$scope.englishPhrasesBitmaps[phrase.name].visible;
                                        });
                                        enSmallButton.x = $scope.buttonsPhrasesContainer.x + 20;
                                        enSmallButton.y = buttonsY;

                                        $scope.buttonsPhrasesContainer.addChild(enSmallButton);
                                        /*stage.update();*/

                                        /*** Updating stage and adding more Y before iterating again ***/
                                        stage.update();
                                        buttonsY += 20;

                                    });

                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for english button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Greek Button*/
                            $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for greek button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the container*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        /******************** Creating Greek button ********************/
                                        var grSmallButton = new createjs.Sprite(grSmallButtonSpriteSheet, "normal");

                                        grSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("mousedown event on a button !");
                                            grSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        grSmallButton.addEventListener("pressup", function (event) {
                                            console.log("pressup event!");
                                            grSmallButton.gotoAndPlay("normal");
                                            $scope.greekPhrasesBitmaps[phrase.name].visible = !$scope.greekPhrasesBitmaps[phrase.name].visible;

                                        });
                                        grSmallButton.x = $scope.buttonsPhrasesContainer.x + 50;
                                        grSmallButton.y = buttonsY;
                                        $scope.buttonsPhrasesContainer.addChild(grSmallButton);
                                        /*stage.update();*/

                                        /*** Updating stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for greek button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Play Button*/
                            $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                                .success(function (response) {

                                    console.log("Success on getting json data for play button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the ccontainer*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        /*********************Creating Play button*********************/
                                        var playSmallButton = new createjs.Sprite(playSmallButtonSpriteSheet, "normal");
                                        playSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on a button !");
                                            playSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        playSmallButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event!");
                                            playSmallButton.gotoAndPlay("normal");

                                        });
                                        playSmallButton.x = $scope.buttonsPhrasesContainer.x + 80;
                                        playSmallButton.y = buttonsY;
                                        /*playSmallButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                                         playSmallButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);*/
                                        $scope.buttonsPhrasesContainer.addChild(playSmallButton);

                                        /*** Updting stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for play button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.error("Error on waterfall process for getting buttons spriteSheets...");
                        } else {
                            console.log("Success on waterfall process for getting buttons spriteSheets! Result: ", result);
                        }
                    });//End of waterfall
                }//End of loadPhrasesButtons function


                /*LOAD PHRASES INDEXES*/
                function loadPhrasesIndexes() {

                    /*Initializing y that will change dynamically for every button*/
                    var indexesY = 80;

                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                        var phraseIndex = new createjs.Text(key + 1 + ".", "15px Arial", "black");

                        phraseIndex.x = $scope.indexPhrasesContainer.x + 20;
                        phraseIndex.y = indexesY;
                        phraseIndex.textBaseline = "alphabetic";
                        phraseIndex.textAlign = "center";
                        phraseIndex.maxWidth = $scope.indexPhrasesContainer.width;

                        $scope.indexPhrasesContainer.addChild(phraseIndex);
                        /*stage.update();*/

                        /*** Updating stage and adding more Y before iterating again ***/
                        stage.update();
                        indexesY += 20;

                    });

                }//End of loadPhrasesIndexes function


                /*LOAD ENGLISH PHRASES*/
                function loadEnglishPhrases() {

                    /*Initializing y that will change dynamically for every button*/
                    var englishPhraseY = 70;
                    $scope.englishPhrasesBitmaps = {};

                    /*Iterating and populating the container*/
                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                        $scope.englishPhrasesBitmaps[phrase.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + phrase.name + ".png");

                        $scope.englishPhrasesBitmaps[phrase.name].regX = $scope.englishPhrasesBitmaps[phrase.name].image.width / 2;
                        $scope.englishPhrasesBitmaps[phrase.name].regY = $scope.englishPhrasesBitmaps[phrase.name].image.height / 2;
                        $scope.englishPhrasesBitmaps[phrase.name].x = $scope.englishWordsContainer.x + 20;
                        $scope.englishPhrasesBitmaps[phrase.name].y = englishPhraseY;
                        /*$scope.englishPhrasesBitmaps[key].snapToPixel = false;*/
                        $scope.englishPhrasesContainer.addChild($scope.englishPhrasesBitmaps[phrase.name]);
                        stage.update();

                        englishPhraseY += 20;
                    });
                }//End of loadEnglishPhrases function


                /*LOAD PHRASES EQUALS*/
                function loadPhrasesEquals() {

                    /*Initializing y that will change dynamically for every button*/
                    var equalsY = 80;

                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                        var equals = new createjs.Text("=", "15px Arial", "black");

                        equals.x = backgroundPosition.x + (backgroundPosition.width / 8);
                        equals.y = equalsY;
                        equals.textBaseline = "alphabetic";
                        equals.textAlign = "center";
                        equals.maxWidth = $scope.equalsSignPhrasesContainer.width;

                        $scope.equalsSignPhrasesContainer.addChild(equals);
                        /*stage.update();*/

                        /*** Updating stage and adding more Y before iterating again ***/
                        stage.update();
                        equalsY += 20;

                    });

                }//End of loadPhrasesEquals function


                /*LOAD GREEK PHRASES*/
                function loadGreekPhrases() {

                    /*Initializing y that will change dynamically for every button*/
                    var greekPhraseY = 70;
                    $scope.greekPhrasesBitmaps = {};

                    /*Iterating and populating the container*/
                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                        $scope.greekPhrasesBitmaps[phrase.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + phrase.name + "_gr.png");

                        $scope.greekPhrasesBitmaps[phrase.name].regX = $scope.greekPhrasesBitmaps[phrase.name].image.width / 2;
                        $scope.greekPhrasesBitmaps[phrase.name].regY = $scope.greekPhrasesBitmaps[phrase.name].image.height / 2;
                        $scope.greekPhrasesBitmaps[phrase.name].x = $scope.greekWordsContainer.x + 20;
                        $scope.greekPhrasesBitmaps[phrase.name].y = greekPhraseY;
                        $scope.greekPhrasesContainer.addChild($scope.greekPhrasesBitmaps[phrase.name]);
                        stage.update();

                        greekPhraseY += 20;
                    });
                }//End of loadGreekPhrases function




                /********************************** POPULATING DERIVATIVES CONTAINERS **********************************/

                /*LOAD PHRASES BUTTONS*/
                function loadPhrasesButtons() {

                    /*Initializing y that will change dynamically for every button*/
                    var buttonsY = 80;

                    /*Initializing SpriteSheet instances using waterfall*/
                    async.waterfall([
                        function (buttonsSpriteSheetCallback) {

                            /*English Button*/
                            $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for english button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the container*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {


                                        /********************* Creating English button *********************/
                                        var enSmallButton = new createjs.Sprite(enSmallButtonSpriteSheet, "normal");

                                        enSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on a button !");
                                            enSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        enSmallButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event!");
                                            enSmallButton.gotoAndPlay("normal");
                                            $scope.englishPhrasesBitmaps[phrase.name].visible = !$scope.englishPhrasesBitmaps[phrase.name].visible;
                                        });
                                        enSmallButton.x = $scope.buttonsPhrasesContainer.x + 20;
                                        enSmallButton.y = buttonsY;

                                        $scope.buttonsPhrasesContainer.addChild(enSmallButton);
                                        /*stage.update();*/

                                        /*** Updating stage and adding more Y before iterating again ***/
                                        stage.update();
                                        buttonsY += 20;

                                    });

                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for english button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Greek Button*/
                            $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                                .success(function (response) {
                                    console.log("Success on getting json data for greek button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the container*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        /******************** Creating Greek button ********************/
                                        var grSmallButton = new createjs.Sprite(grSmallButtonSpriteSheet, "normal");

                                        grSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("mousedown event on a button !");
                                            grSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        grSmallButton.addEventListener("pressup", function (event) {
                                            console.log("pressup event!");
                                            grSmallButton.gotoAndPlay("normal");
                                            $scope.greekPhrasesBitmaps[phrase.name].visible = !$scope.greekPhrasesBitmaps[phrase.name].visible;

                                        });
                                        grSmallButton.x = $scope.buttonsPhrasesContainer.x + 50;
                                        grSmallButton.y = buttonsY;
                                        $scope.buttonsPhrasesContainer.addChild(grSmallButton);
                                        /*stage.update();*/

                                        /*** Updating stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for greek button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });

                        },
                        function (buttonsSpriteSheetCallback) {

                            var buttonsY = 80;
                            /*Play Button*/
                            $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                                .success(function (response) {

                                    console.log("Success on getting json data for play button!");
                                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                                    var playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                                    /*Iterating and populating the ccontainer*/
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        /*********************Creating Play button*********************/
                                        var playSmallButton = new createjs.Sprite(playSmallButtonSpriteSheet, "normal");
                                        playSmallButton.addEventListener("mousedown", function (event) {
                                            console.log("Mouse down event on a button !");
                                            playSmallButton.gotoAndPlay("onSelection");
                                            stage.update();
                                        });

                                        playSmallButton.addEventListener("pressup", function (event) {
                                            console.log("Press up event!");
                                            playSmallButton.gotoAndPlay("normal");

                                        });
                                        playSmallButton.x = $scope.buttonsPhrasesContainer.x + 80;
                                        playSmallButton.y = buttonsY;
                                        /*playSmallButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                                         playSmallButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);*/
                                        $scope.buttonsPhrasesContainer.addChild(playSmallButton);

                                        /*** Updting stage and adding more Y before iterating again ***/

                                        buttonsY += 20;

                                    });
                                    stage.update();
                                    return buttonsSpriteSheetCallback(null);

                                })
                                .error(function (error) {
                                    console.log("Error on getting json data for play button...", error);
                                    return buttonsSpriteSheetCallback(true, error);
                                });
                        }
                    ], function (err, result) {
                        if (err) {
                            console.error("Error on waterfall process for getting buttons spriteSheets...");
                        } else {
                            console.log("Success on waterfall process for getting buttons spriteSheets! Result: ", result);
                        }
                    });//End of waterfall
                }//End of loadPhrasesButtons function




                /********************************** Adding Page Buttons **********************************/

                /* WORDS BUTTON */
                $http.get($rootScope.rootDir + "data/assets/words_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        var wordsButtonSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.wordsButton = new createjs.Sprite(wordsButtonSpriteSheet, "normal");

                        $scope.wordsButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on a button !");
                            $scope.wordsButton.gotoAndPlay("onSelection");
                            stage.update();
                        });

                        $scope.wordsButton.addEventListener("pressup", function (event) {
                            console.log("Press up event!");
                            $scope.phrasesButton.gotoAndPlay("normal");
                            $scope.derivativesButton.gotoAndPlay("normal");
                            $scope.wordsButton.gotoAndPlay("selected");
                            loadPage("words");
                        });

                        $scope.wordsButton.scaleX = $scope.wordsButton.scaleY = scale;
                        $scope.wordsButton.x = backgroundPosition.x + (backgroundPosition.width / 1.11);
                        $scope.wordsButton.y = backgroundPosition.y + (backgroundPosition.height / 5.2);
                        /*$scope.wordsButton.y = -$scope.wordsButton.getTransformedBounds().height / 5;*/

                        stage.addChild($scope.wordsButton);
                        stage.update();

                    })
                    .error(function (error) {
                        console.error("Error on getting json for words button...", error);
                    });//end of get words button


                /* PHRASES BUTTON */
                $http.get($rootScope.rootDir + "data/assets/phrases_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        var phrasesButtonSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.phrasesButton = new createjs.Sprite(phrasesButtonSpriteSheet, "normal");

                        $scope.phrasesButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on a button !");
                            $scope.phrasesButton.gotoAndPlay("onSelection");
                            stage.update();
                        });

                        $scope.phrasesButton.addEventListener("pressup", function (event) {
                            console.log("Press up event!");
                            $scope.phrasesButton.gotoAndPlay("selected");
                            $scope.wordsButton.gotoAndPlay("normal");
                            $scope.derivativesButton.gotoAndPlay("normal");
                            loadPage("phrases");
                        });

                        $scope.phrasesButton.scaleX = $scope.phrasesButton.scaleY = scale;
                        $scope.phrasesButton.x = backgroundPosition.x + (backgroundPosition.width / 1.11);
                        $scope.phrasesButton.y = backgroundPosition.y + (backgroundPosition.height / 2.1);
                        /*$scope.phrasesButton.y = -$scope.phrasesButton.getTransformedBounds().height / 5;*/

                        stage.addChild($scope.phrasesButton);
                        stage.update();

                    })
                    .error(function (error) {
                        console.error("Error on getting json for phrases button...", error);
                    });//end of get phrases button


                /* DERIVATIVES BUTTON */
                $http.get($rootScope.rootDir + "data/assets/derivatives_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        var derivativesButtonSpriteSheet = new createjs.SpriteSheet(response);
                        $scope.derivativesButton = new createjs.Sprite(derivativesButtonSpriteSheet, "normal");

                        $scope.derivativesButton.addEventListener("mousedown", function (event) {
                            console.log("mousedown event on a button !");
                            $scope.derivativesButton.gotoAndPlay("onSelection");
                            stage.update();
                        });

                        $scope.derivativesButton.addEventListener("pressup", function (event) {
                            console.log("pressup event!");
                            $scope.derivativesButton.gotoAndPlay("selected");
                            $scope.wordsButton.gotoAndPlay("normal");
                            $scope.phrasesButton.gotoAndPlay("normal");
                            loadPage("derivatives");
                        });

                        $scope.derivativesButton.scaleX = $scope.derivativesButton.scaleY = scale;
                        $scope.derivativesButton.x = backgroundPosition.x + (backgroundPosition.width / 1.11);
                        $scope.derivativesButton.y = backgroundPosition.y + (backgroundPosition.height / 1.35);
                        /*$scope.derivativesButton.y = -$scope.derivativesButton.getTransformedBounds().height / 5;*/

                        stage.addChild($scope.derivativesButton);
                        stage.update();

                    })
                    .error(function (error) {
                        console.error("Error on getting json for derivatives button...", error);
                    });//end of get derivatives button


                /* BIG ENGLISH BUTTON */
                $http.get($rootScope.rootDir + "data/assets/english_big_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        var englishBigButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var englishBigButton = new createjs.Sprite(englishBigButtonSpriteSheet, "normal");

                        englishBigButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on big English button!");
                            englishBigButton.gotoAndPlay("onSelection");
                            stage.update();
                        });

                        englishBigButton.addEventListener("pressup", function (event) {
                            console.log("Press up event!");

                            if ($scope.selectedVocabularySection === 'words') {
                                if ($scope.englishWordsBitmaps[$scope.activityData.words[0].name].visible === true) {

                                    console.log("Hiding all english words...");
                                    _.each($scope.activityData.words, function (word, key, list) {

                                        $scope.englishWordsBitmaps[word.name].visible = false;
                                    });

                                    englishBigButton.gotoAndPlay("selected");
                                    stage.update();

                                } else {

                                    console.log("Making all english words visible again...");
                                    _.each($scope.activityData.words, function (word, key, list) {
                                        $scope.englishWordsBitmaps[word.name].visible = true;
                                    });
                                    englishBigButton.gotoAndPlay("normal");
                                    stage.update();
                                }
                            } else if ($scope.selectedVocabularySection === 'phrases') {
                                if ($scope.englishPhrasesBitmaps[$scope.activityData.phrases[0].name].visible === true) {

                                    console.log("Hiding all english phrases...");
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        $scope.englishPhrasesBitmaps[phrase.name].visible = false;
                                    });

                                    englishBigButton.gotoAndPlay("selected");
                                    stage.update();

                                } else {

                                    console.log("Making all english phrases visible again...");
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {
                                        $scope.englishPhrasesBitmaps[phrase.name].visible = true;
                                    });
                                    englishBigButton.gotoAndPlay("normal");
                                    stage.update();
                                }
                            } else {

                            }

                        });

                        englishBigButton.scaleX = englishBigButton.scaleY = scale;
                        englishBigButton.x = backgroundPosition.x + (backgroundPosition.width / 1.17);
                        englishBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                        /*englishBigButton.y = -englishBigButton.getTransformedBounds().height / 5;*/

                        stage.addChild(englishBigButton);
                        stage.update();

                    })
                    .error(function (error) {
                        console.error("Error on getting json for english big button...", error);
                    });//end of get english big button


                /* BIG GREEK BUTTON */
                $http.get($rootScope.rootDir + "data/assets/greek_big_button_sprite.json")
                    .success(function (response) {

                        //Reassigning images with the rest of resource
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        var greekBigButtonSpriteSheet = new createjs.SpriteSheet(response);
                        var greekBigButton = new createjs.Sprite(greekBigButtonSpriteSheet, "normal");

                        greekBigButton.addEventListener("mousedown", function (event) {
                            console.log("Mouse down event on a button !");
                            greekBigButton.gotoAndPlay("onSelection");
                            stage.update();
                        });

                        greekBigButton.addEventListener("pressup", function (event) {
                            console.log("Press up event!");


                            if ($scope.selectedVocabularySection === 'words') {
                                if ($scope.greekWordsBitmaps[$scope.activityData.words[0].name].visible === true) {

                                    console.log("Hiding all greek words...");
                                    _.each($scope.activityData.words, function (word, key, list) {

                                        $scope.greekWordsBitmaps[word.name].visible = false;
                                    });

                                    greekBigButton.gotoAndPlay("selected");
                                    stage.update();

                                } else {

                                    console.log("Making all greek words visible again...");
                                    _.each($scope.activityData.words, function (word, key, list) {
                                        $scope.greekWordsBitmaps[word.name].visible = true;
                                    });
                                    greekBigButton.gotoAndPlay("normal");
                                    stage.update();
                                }
                            } else if ($scope.selectedVocabularySection === 'phrases') {
                                if ($scope.greekPhrasesBitmaps[$scope.activityData.phrases[0].name].visible === true) {

                                    console.log("Hiding all english phrases...");
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {

                                        $scope.greekPhrasesBitmaps[phrase.name].visible = false;
                                    });

                                    greekBigButton.gotoAndPlay("selected");
                                    stage.update();

                                } else {

                                    console.log("Making all english phrases visible again...");
                                    _.each($scope.activityData.phrases, function (phrase, key, list) {
                                        $scope.greekPhrasesBitmaps[phrase.name].visible = true;
                                    });
                                    greekBigButton.gotoAndPlay("normal");
                                    stage.update();
                                }
                            } else {

                            }


                        });

                        greekBigButton.scaleX = greekBigButton.scaleY = scale;
                        greekBigButton.x = backgroundPosition.x + (backgroundPosition.width / 1.08);
                        greekBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                        /*greekBigButton.y = -greekBigButton.getTransformedBounds().height / 5;*/

                        stage.addChild(greekBigButton);
                        stage.update();

                    })
                    .error(function (error) {
                        console.error("Error on getting json for greek big button...", error);
                    });//end of get greek button


            });//end of image on complete
        }, 500);//end of timeout
    });

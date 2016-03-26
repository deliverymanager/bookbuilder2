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


        /*BUTTONS CONTAINER*/
        var buttonsContainer = new createjs.Container();

        console.log("Creating buttons container...");

        buttonsContainer.width = 120;
        buttonsContainer.height = backgroundPosition.height/1.15;
        buttonsContainer.scaleX = buttonsContainer.scaleY = scale;
        buttonsContainer.x = backgroundPosition.x+30;
        buttonsContainer.y = backgroundPosition.y+2;

        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
        /*var testGraphics = new createjs.Graphics().beginFill("red");
        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        testGraphics.drawRoundRect(0, 0, buttonsContainer.width, buttonsContainer.height, 1);

        var testShape = new createjs.Shape(testGraphics);
        testShape.setTransform(buttonsContainer.x, buttonsContainer.y, scale, scale, 0, 0, 0, 0, 0);
        buttonsContainer.addChild(testShape);
        stage.update();*/
        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

        stage.addChild(buttonsContainer);
        stage.update();



        /*INDEX CONTAINER*/
        var indexContainer = new createjs.Container();

        console.log("Creating buttons container...");

        indexContainer.width = 40;
        indexContainer.height = backgroundPosition.height/1.15;
        indexContainer.scaleX = indexContainer.scaleY = scale;
        indexContainer.x = backgroundPosition.x+85;
        indexContainer.y = backgroundPosition.y+2;

        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
        /*var testGraphics2 = new createjs.Graphics().beginFill("orangered");
        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        testGraphics2.drawRoundRect(0, 0, indexContainer.width, indexContainer.height, 1);

        var testShape2 = new createjs.Shape(testGraphics2);
        testShape2.setTransform(indexContainer.x, indexContainer.y, scale, scale, 0, 0, 0, 0, 0);
        indexContainer.addChild(testShape2);
        stage.update();*/
        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

        stage.addChild(indexContainer);
        stage.update();


        /*ENGLISH WORDS CONTAINER*/
        var englishWordsContainer = new createjs.Container();

        console.log("Creating buttons container...");

        englishWordsContainer.width = 300;
        englishWordsContainer.height = backgroundPosition.height/1.15;
        englishWordsContainer.scaleX = englishWordsContainer.scaleY = scale;
        englishWordsContainer.x = backgroundPosition.x+105;
        englishWordsContainer.y = backgroundPosition.y+2;

        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
        /*var testGraphics3 = new createjs.Graphics().beginFill("darkred");
        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        testGraphics3.drawRoundRect(0, 0, englishWordsContainer.width, englishWordsContainer.height, 1);

        var testShape3 = new createjs.Shape(testGraphics3);
        testShape3.setTransform(englishWordsContainer.x, englishWordsContainer.y, scale, scale, 0, 0, 0, 0, 0);
        englishWordsContainer.addChild(testShape3);
        stage.update();*/
        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

        stage.addChild(englishWordsContainer);
        stage.update();



        /*EQUALS SIGN CONTAINER*/
        var equalsSignContainer = new createjs.Container();

        console.log("Creating buttons container...");

        equalsSignContainer.width = 30;
        equalsSignContainer.height = backgroundPosition.height/1.15;
        equalsSignContainer.scaleX = equalsSignContainer.scaleY = scale;
        equalsSignContainer.x = backgroundPosition.x+245;
        equalsSignContainer.y = backgroundPosition.y+2;

        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
        /*var testGraphics4 = new createjs.Graphics().beginFill("yellow");
        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        testGraphics4.drawRoundRect(0, 0, equalsSignContainer.width, equalsSignContainer.height, 1);

        var testShape4 = new createjs.Shape(testGraphics4);
        testShape4.setTransform(equalsSignContainer.x, equalsSignContainer.y, scale, scale, 0, 0, 0, 0, 0);
        equalsSignContainer.addChild(testShape4);
        stage.update();*/
        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

        stage.addChild(equalsSignContainer);
        stage.update();



        /*GREEK WORDS CONTAINER*/
        var greekWordsContainer = new createjs.Container();

        console.log("Creating buttons container...");

        greekWordsContainer.width = 300;
        greekWordsContainer.height = backgroundPosition.height/1.15;
        greekWordsContainer.scaleX = greekWordsContainer.scaleY = scale;
        greekWordsContainer.x = backgroundPosition.x+260;
        greekWordsContainer.y = backgroundPosition.y+2;

        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
       /* var testGraphics5 = new createjs.Graphics().beginFill("blue");
        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        testGraphics5.drawRoundRect(0, 0, greekWordsContainer.width, greekWordsContainer.height, 1);

        var testShape5 = new createjs.Shape(testGraphics5);
        testShape5.setTransform(greekWordsContainer.x, greekWordsContainer.y, scale, scale, 0, 0, 0, 0, 0);
        greekWordsContainer.addChild(testShape5);
        stage.update();*/
        /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

        stage.addChild(greekWordsContainer);
        stage.update();


        /********************************** POPULATING CONTAINERS **********************************/

        /*LOAD BUTTONS*/
        loadButtons();
        function loadButtons(){

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
              function(buttonsSpriteSheetCallback){

                /*English Button*/
                $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json data for english button!");
                      response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                      var enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                      return buttonsSpriteSheetCallback(null, enSmallButtonSpriteSheet);

                    })
                    .error(function (error) {
                      console.log("Error on getting json data for english button...", error);
                      return buttonsSpriteSheetCallback(true, error);
                    });

              },
              function(enSmallButtonSpriteSheet, buttonsSpriteSheetCallback){

                /*Greek Button*/
                $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                    .success(function (response) {
                      console.log("Success on getting json data for greek button!");
                      response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                      var grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                      return buttonsSpriteSheetCallback(null, enSmallButtonSpriteSheet, grSmallButtonSpriteSheet);

                    })
                    .error(function (error) {
                      console.log("Error on getting json data for greek button...", error);
                      return buttonsSpriteSheetCallback(true, error);
                    });

              },
              function(enSmallButtonSpriteSheet, grSmallButtonSpriteSheet, buttonsSpriteSheetCallback){

                /*Play Button*/
                $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                    .success(function (response) {

                      console.log("Success on getting json data for play button!");
                      response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                      var playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                      //Creation of result object
                      var resultObject = {
                        "enSmallButtonSpriteSheet":enSmallButtonSpriteSheet,
                        "grSmallButtonSpriteSheet":grSmallButtonSpriteSheet,
                        "playSmallButtonSpriteSheet":playSmallButtonSpriteSheet
                      };

                      return buttonsSpriteSheetCallback(null, resultObject);

                    })
                    .error(function (error) {
                      console.log("Error on getting json data for play button...", error);
                      return buttonsSpriteSheetCallback(true, error);
                    });
              }
          ],function(err, result){

            if(err){
              console.error("Error on waterfall process for getting buttons spriteSheets...");
            }else{
              console.log("Success on waterfall process for getting buttons spriteSheets! Result: ", result);

              var enSmallButtonSpriteSheet = result.enSmallButtonSpriteSheet;
              var grSmallButtonSpriteSheet = result.grSmallButtonSpriteSheet;
              var playSmallButtonSpriteSheet = result.playSmallButtonSpriteSheet;

              /*Initializing y that will change dynamically for every button*/
              var buttonsY = 100;

              /*Iterating and populating the ccontainer*/
              _.each($scope.activityData.words, function(word, key, list){


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

                });
                enSmallButton.x = buttonsContainer.x+ 15;
                enSmallButton.y = buttonsY;
                buttonsContainer.addChild(enSmallButton);
                /*stage.update();*/


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

                });
                grSmallButton.x = buttonsContainer.x+ 30;
                grSmallButton.y = buttonsY;
                buttonsContainer.addChild(grSmallButton);
                /*stage.update();*/


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
                playSmallButton.x = buttonsContainer.x+ 45;
                playSmallButton.y = buttonsY;
                /*playSmallButton.x = backgroundPosition.x + (backgroundPosition.width / 3.1);
                playSmallButton.y = backgroundPosition.y + (backgroundPosition.height / 1.063);*/
                buttonsContainer.addChild(playSmallButton);

                stage.update();
                buttonsY+=20;


              });
            }

          });//End of waterfall
        }//End of loadButtons function



      });//end of image on complete
    }, 500);//end of timeout
  });

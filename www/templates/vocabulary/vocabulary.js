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
        /*var backgroundPositionOriginal = background.getBounds();*/

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
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lesson", {}, { reload: true });
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

                loadDerivativesButtons();
                loadDerivativesIndexes();
                loadEnglishDerivatives();
                loadGreekDerivatives();

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
          $scope.buttonsPhrasesContainer.width = background.image.width / 10;
          $scope.buttonsPhrasesContainer.height = background.image.height / 1.3;
          $scope.buttonsPhrasesContainer.scaleX = $scope.buttonsPhrasesContainer.scaleY = scale;
          $scope.buttonsPhrasesContainer.x = backgroundPosition.x;
          /*backgroundPosition.x + (backgroundPosition.width / 60);*/
          $scope.buttonsPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 17);

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          var graphics = new createjs.Graphics().beginFill("#BFBF3C").drawRect($scope.buttonsPhrasesContainer.x, $scope.buttonsPhrasesContainer.y, $scope.buttonsPhrasesContainer.width, $scope.buttonsPhrasesContainer.height);
          var shape = new createjs.Shape(graphics);
          $scope.buttonsPhrasesContainer.addChild(shape);
          stage.update();
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          stage.addChild($scope.buttonsPhrasesContainer);
          stage.update();

          //Adding subContainers to buttonsPhrasesSubContainer
          $scope.buttonsPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            console.log("Adding a sub container to buttonsPhrasesContainer with index: ", key);
            $scope.buttonsPhrasesSubContainers[phrase.name] = new createjs.Container();
            console.log("Creating buttons container...");
            $scope.buttonsPhrasesSubContainers[phrase.name].width = $scope.buttonsPhrasesContainer.width;
            $scope.buttonsPhrasesSubContainers[phrase.name].height = 30;
            $scope.buttonsPhrasesSubContainers[phrase.name].x = 0;
            /*backgroundPosition.x + (backgroundPosition.width / 60);*/
            $scope.buttonsPhrasesSubContainers[phrase.name].y = key * 30;

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            var buttonsPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("grey").drawRect($scope.buttonsPhrasesSubContainers[phrase.name].x, $scope.buttonsPhrasesSubContainers[phrase.name].y, $scope.buttonsPhrasesSubContainers[phrase.name].width, $scope.buttonsPhrasesSubContainers[phrase.name].height);
            var buttonsPhrasesSubContainerShape = new createjs.Shape(buttonsPhrasesSubContainerGraphics);
            $scope.buttonsPhrasesSubContainers[phrase.name].addChild(buttonsPhrasesSubContainerShape);
            stage.update();
            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

            $scope.buttonsPhrasesContainer.addChild($scope.buttonsPhrasesSubContainers[phrase.name]);
            stage.update();
          });
          console.log("buttonsPhrasesSubContainers: ", $scope.buttonsPhrasesSubContainers);


          /*INDEX CONTAINER*/
          $scope.indexPhrasesContainer = new createjs.Container();
          console.log("Creating index container...");
          $scope.indexPhrasesContainer.width = background.image.width / 28;
          $scope.indexPhrasesContainer.height = background.image.height / 1.3;
          $scope.indexPhrasesContainer.scaleX = $scope.indexPhrasesContainer.scaleY = scale;
          $scope.indexPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 15);
          $scope.indexPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 17);

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          var graphicsPhraseIndex = new createjs.Graphics().beginFill("#A0A037").drawRect($scope.indexPhrasesContainer.x, $scope.indexPhrasesContainer.y, $scope.indexPhrasesContainer.width, $scope.indexPhrasesContainer.height);
          var shapePhraseIndex = new createjs.Shape(graphicsPhraseIndex);
          $scope.indexPhrasesContainer.addChild(shapePhraseIndex);
          stage.update();
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          stage.addChild($scope.indexPhrasesContainer);
          stage.update();

          //Adding subContainers to indexPhrasesSubContainer
          $scope.indexPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            console.log("Adding a sub container to indexPhrasesContainer with index: ", key);
            $scope.indexPhrasesSubContainers[phrase.name] = new createjs.Container();
            console.log("Creating index container...");
            $scope.indexPhrasesSubContainers[phrase.name].width = $scope.indexPhrasesContainer.width;
            $scope.indexPhrasesSubContainers[phrase.name].height = 30;
            $scope.indexPhrasesSubContainers[phrase.name].x = 0;
            /*backgroundPosition.x + (backgroundPosition.width / 60);*/
            $scope.indexPhrasesSubContainers[phrase.name].y = key * 30;

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            var indexPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("grey").drawRect($scope.indexPhrasesSubContainers[phrase.name].x, $scope.indexPhrasesSubContainers[phrase.name].y, $scope.indexPhrasesSubContainers[phrase.name].width, $scope.indexPhrasesSubContainers[phrase.name].height);
            var indexPhrasesSubContainerShape = new createjs.Shape(indexPhrasesSubContainerGraphics);
            $scope.indexPhrasesSubContainers[phrase.name].addChild(indexPhrasesSubContainerShape);
            stage.update();
            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

            $scope.indexPhrasesContainer.addChild($scope.indexPhrasesSubContainers[phrase.name]);
            stage.update();
          });



          /*ENGLISH WORDS CONTAINER*/
          $scope.englishPhrasesContainer = new createjs.Container();
          console.log("Creating english words container...");
          $scope.englishPhrasesContainer.width = background.image.width / 4;
          $scope.englishPhrasesContainer.height = background.image.height / 1.3;
          $scope.englishPhrasesContainer.scaleX = $scope.englishPhrasesContainer.scaleY = scale;
          $scope.englishPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 11);
          $scope.englishPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 17);

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          var graphicsPhraseEnglish = new createjs.Graphics().beginFill("#AAAA39").drawRect($scope.englishPhrasesContainer.x, $scope.englishPhrasesContainer.y, $scope.englishPhrasesContainer.width, $scope.englishPhrasesContainer.height);
          var shapePhraseEnglish = new createjs.Shape(graphicsPhraseEnglish);
          $scope.englishPhrasesContainer.addChild(shapePhraseEnglish);
          stage.update();
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          stage.addChild($scope.englishPhrasesContainer);
          stage.update();

          //Adding subContainers to englishPhrasesSubContainer
          $scope.englishPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            console.log("Adding a sub container to englishPhrasesContainer with index: ", key);
            $scope.englishPhrasesSubContainers[phrase.name] = new createjs.Container();
            console.log("Creating english container...");
            $scope.englishPhrasesSubContainers[phrase.name].width = $scope.englishPhrasesContainer.width;
            $scope.englishPhrasesSubContainers[phrase.name].height = 30;
            $scope.englishPhrasesSubContainers[phrase.name].x = 0;
            /*backgroundPosition.x + (backgroundPosition.width / 60);*/
            $scope.englishPhrasesSubContainers[phrase.name].y = key * 30;

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            var englishPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("grey").drawRect($scope.englishPhrasesSubContainers[phrase.name].x, $scope.englishPhrasesSubContainers[phrase.name].y, $scope.englishPhrasesSubContainers[phrase.name].width, $scope.englishPhrasesSubContainers[phrase.name].height);
            var englishPhrasesSubContainerShape = new createjs.Shape(englishPhrasesSubContainerGraphics);
            $scope.englishPhrasesSubContainers[phrase.name].addChild(englishPhrasesSubContainerShape);
            stage.update();
            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

            $scope.englishPhrasesContainer.addChild($scope.englishPhrasesSubContainers[phrase.name]);
            stage.update();
          });
          console.log("englishPhrasesSubContainers: ", $scope.englishPhrasesSubContainers);




          /*EQUALS SIGN CONTAINER*/
          $scope.equalsSignPhrasesContainer = new createjs.Container();

          console.log("Creating equals phrases container...");

          $scope.equalsSignPhrasesContainer.width = background.image.width / 28;
          $scope.equalsSignPhrasesContainer.height = backgroundPosition.height / 1.15;
          $scope.equalsSignPhrasesContainer.scaleX = $scope.equalsSignPhrasesContainer.scaleY = scale;
          $scope.equalsSignPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 11);
          $scope.equalsSignPhrasesContainer.y = backgroundPosition.y + 5;

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          var graphicsPhraseEquals = new createjs.Graphics().beginFill("#BFBF3C").drawRect($scope.equalsSignPhrasesContainer.x, $scope.equalsSignPhrasesContainer.y, $scope.equalsSignPhrasesContainer.width, $scope.equalsSignPhrasesContainer.height);
          var shapePhraseEquals = new createjs.Shape(graphicsPhraseEquals);
          $scope.equalsSignPhrasesContainer.addChild(shapePhraseEquals);
          stage.update();
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          stage.addChild($scope.equalsSignPhrasesContainer);
          stage.update();

          //Adding subContainers to equalsPhrasesSubContainer
          $scope.equalsPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            console.log("Adding a sub container to equalsPhrasesContainer with index: ", key);
            $scope.equalsPhrasesSubContainers[phrase.name] = new createjs.Container();
            console.log("Creating equals container...");
            $scope.equalsPhrasesSubContainers[phrase.name].width = $scope.equalsSignPhrasesContainer.width;
            $scope.equalsPhrasesSubContainers[phrase.name].height = 30;
            $scope.equalsPhrasesSubContainers[phrase.name].x = 0;
            /*backgroundPosition.x + (backgroundPosition.width / 60);*/
            $scope.equalsPhrasesSubContainers[phrase.name].y = key * 30;

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            var equalsPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("grey").drawRect($scope.equalsPhrasesSubContainers[phrase.name].x, $scope.equalsPhrasesSubContainers[phrase.name].y, $scope.equalsPhrasesSubContainers[phrase.name].width, $scope.equalsPhrasesSubContainers[phrase.name].height);
            var equalsPhrasesSubContainerShape = new createjs.Shape(equalsPhrasesSubContainerGraphics);
            $scope.equalsPhrasesSubContainers[phrase.name].addChild(equalsPhrasesSubContainerShape);
            stage.update();
            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

            $scope.equalsSignPhrasesContainer.addChild($scope.equalsPhrasesSubContainers[phrase.name]);
            stage.update();
          });
          console.log("equalsPhrasesSubContainers: ", $scope.equalsPhrasesSubContainers);




          /*GREEK WORDS CONTAINER*/
          $scope.greekPhrasesContainer = new createjs.Container();

          console.log("Creating greek container...");

          $scope.greekPhrasesContainer.width = 300;
          $scope.greekPhrasesContainer.height = backgroundPosition.height / 1.15;
          $scope.greekPhrasesContainer.scaleX = $scope.greekPhrasesContainer.scaleY = scale;
          $scope.greekPhrasesContainer.x = backgroundPosition.x + 260;
          $scope.greekPhrasesContainer.y = backgroundPosition.y + 5;

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          var graphicsPhraseGreek = new createjs.Graphics().beginFill("#BFBF3C").drawRect($scope.greekPhrasesContainer.x, $scope.greekPhrasesContainer.y, $scope.greekPhrasesContainer.width, $scope.greekPhrasesContainer.height);
          var shapePhraseGreek = new createjs.Shape(graphicsPhraseGreek);
          $scope.greekPhrasesContainer.addChild(shapePhraseGreek);
          stage.update();
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          stage.addChild($scope.greekPhrasesContainer);
          stage.update();

          //Adding subContainers to greekPhrasesSubContainer
          $scope.greekPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            console.log("Adding a sub container to greekPhrasesContainer with index: ", key);
            $scope.greekPhrasesSubContainers[phrase.name] = new createjs.Container();
            console.log("Creating greek container...");
            $scope.greekPhrasesSubContainers[phrase.name].width = $scope.greekPhrasesContainer.width;
            $scope.greekPhrasesSubContainers[phrase.name].height = 30;
            $scope.greekPhrasesSubContainers[phrase.name].x = 0;
            /*backgroundPosition.x + (backgroundPosition.width / 60);*/
            $scope.greekPhrasesSubContainers[phrase.name].y = key * 30;

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            var greekPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("grey").drawRect($scope.greekPhrasesSubContainers[phrase.name].x, $scope.greekPhrasesSubContainers[phrase.name].y, $scope.greekPhrasesSubContainers[phrase.name].width, $scope.greekPhrasesSubContainers[phrase.name].height);
            var greekPhrasesSubContainerShape = new createjs.Shape(greekPhrasesSubContainerGraphics);
            $scope.greekPhrasesSubContainers[phrase.name].addChild(greekPhrasesSubContainerShape);
            stage.update();
            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

            $scope.greekPhrasesContainer.addChild($scope.greekPhrasesSubContainers[phrase.name]);
            stage.update();
          });
          console.log("greekPhrasesSubContainers: ", $scope.greekPhrasesSubContainers);

        }//End of creating single column phrases containers function


        /*Creating multi-column template containers mainly for the Derivatives section*/
        function createMultiColumnContainers() {

          $scope.derivativeContainers = {};

          $scope.derivativeContainers["verbs"] = new createjs.Container();
          console.log("Creating $scope.derivativeContainers['verbs']...");
          $scope.derivativeContainers["verbs"].width = background.image.width / 2.6;
          $scope.derivativeContainers["verbs"].height = background.image.height / 2.5;
          $scope.derivativeContainers["verbs"].scaleX = $scope.derivativeContainers["verbs"].scaleY = scale;
          $scope.derivativeContainers["verbs"].x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.derivativeContainers["verbs"].y = backgroundPosition.y + (backgroundPosition.height / 10);
          stage.addChild($scope.derivativeContainers["verbs"]);
          stage.update();

          $scope.derivativeContainers["verbs"].subContainers = {};

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          /*var graphics = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.derivativeContainers["verbs"].width, $scope.derivativeContainers["verbs"].height);
           var shape = new createjs.Shape(graphics);
           $scope.derivativeContainers["verbs"].addChild(shape);
           stage.update();*/

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          //Adding Title for Verbs
          var verbsTitle = new createjs.Text("VERBS", "17px Arial", "red");
          verbsTitle.x = $scope.derivativeContainers["verbs"].width / 2;
          verbsTitle.y = 0;
          verbsTitle.textBaseline = "top";
          verbsTitle.textAlign = "center";
          $scope.derivativeContainers["verbs"].addChild(verbsTitle);
          stage.update();


          /*NOUNS CONTAINER*/
          $scope.derivativeContainers["nouns"] = new createjs.Container();

          console.log("Creating $scope.nounsContainer...");

          $scope.derivativeContainers["nouns"].width = background.image.width / 2.6;
          $scope.derivativeContainers["nouns"].height = background.image.height / 2.5;
          $scope.derivativeContainers["nouns"].scaleX = $scope.derivativeContainers["nouns"].scaleY = scale;
          $scope.derivativeContainers["nouns"].x = backgroundPosition.x + (backgroundPosition.width / 2.3);
          $scope.derivativeContainers["nouns"].y = backgroundPosition.y + (backgroundPosition.height / 10);

          stage.addChild($scope.derivativeContainers["nouns"]);
          stage.update();

          $scope.derivativeContainers["nouns"].subContainers = {};

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          /*var graphics1 = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.derivativeContainers["nouns"].width, $scope.derivativeContainers["nouns"].height);
           var shape1 = new createjs.Shape(graphics1);
           $scope.derivativeContainers["nouns"].addChild(shape1);
           stage.update();*/
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          //Adding Title for Verbs
          var nounsTitle = new createjs.Text("NOUNS", "17px Arial", "red");
          nounsTitle.x = $scope.derivativeContainers["nouns"].width / 2;
          nounsTitle.y = 0;
          nounsTitle.textBaseline = "top";
          nounsTitle.textAlign = "center";
          $scope.derivativeContainers["nouns"].addChild(nounsTitle);
          stage.update();


          /*NOUN CONTAINER*/
          $scope.derivativeContainers["noun"] = new createjs.Container();

          console.log("Creating $scope.nounContainer...");

          $scope.derivativeContainers["noun"].width = background.image.width / 2.6;
          $scope.derivativeContainers["noun"].height = background.image.height / 2.5;
          $scope.derivativeContainers["noun"].scaleX = $scope.derivativeContainers["noun"].scaleY = scale;
          $scope.derivativeContainers["noun"].x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.derivativeContainers["noun"].y = backgroundPosition.y + (backgroundPosition.height / 2);

          stage.addChild($scope.derivativeContainers["noun"]);
          stage.update();

          $scope.derivativeContainers["noun"].subContainers = {};

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          /*var graphics3 = new createjs.Graphics().beginFill("yellow").drawRect(0, 0, $scope.derivativeContainers["noun"].width, $scope.derivativeContainers["noun"].height);
           var shape3 = new createjs.Shape(graphics3);
           $scope.derivativeContainers["noun"].addChild(shape3);
           stage.update();*/
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          //Adding Title for Verbs
          var nounTitle = new createjs.Text("NOUN", "17px Arial", "red");
          nounTitle.x = $scope.derivativeContainers["noun"].width / 2;
          nounTitle.y = 0;
          nounTitle.textBaseline = "top";
          nounTitle.textAlign = "center";
          $scope.derivativeContainers["noun"].addChild(nounTitle);
          stage.update();


          /*ADJECTIVE CONTAINER*/
          $scope.derivativeContainers["adjective"] = new createjs.Container();

          console.log("Creating $scope.adjectiveContainer...");

          $scope.derivativeContainers["adjective"].width = background.image.width / 2.6;
          $scope.derivativeContainers["adjective"].height = background.image.height / 2.5;
          $scope.derivativeContainers["adjective"].scaleX = $scope.derivativeContainers["adjective"].scaleY = scale;
          $scope.derivativeContainers["adjective"].x = backgroundPosition.x + (backgroundPosition.width / 2.3);
          $scope.derivativeContainers["adjective"].y = backgroundPosition.y + (backgroundPosition.height / 2);

          stage.addChild($scope.derivativeContainers["adjective"]);
          stage.update();

          $scope.derivativeContainers["adjective"].subContainers = {};

          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
          /*var graphics4 = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.derivativeContainers["adjective"].width, $scope.derivativeContainers["adjective"].height);
           var shape4 = new createjs.Shape(graphics4);
           $scope.derivativeContainers["adjective"].addChild(shape4);
           stage.update();*/
          /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/

          //Adding Title for Verbs
          var adjectiveTitle = new createjs.Text("ADJECTIVE", "17px Arial", "red");
          adjectiveTitle.x = $scope.derivativeContainers["adjective"].width / 2;
          adjectiveTitle.y = 0;
          adjectiveTitle.textBaseline = "top";
          adjectiveTitle.textAlign = "center";
          $scope.derivativeContainers["adjective"].addChild(adjectiveTitle);
          stage.update();


          /*Initialization of row containers*/
          $scope.derivativesBackgrounds = {};


          /*Populating each derivatives container with sub categories*/
          _.each($scope.derivativeContainers, function (container, key, list) {
            console.log("Adding sub containers to container: ", key);

            /*Buttons*/
            $scope.derivativeContainers[key].subContainers["buttons"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["buttons"].width = $scope.derivativeContainers[key].width / 5;
            $scope.derivativeContainers[key].subContainers["buttons"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["buttons"].x = 0;
            $scope.derivativeContainers[key].subContainers["buttons"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["buttons"]);
            stage.update();

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            /* var graphics = new createjs.Graphics().beginFill("darkgrey").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["buttons"].width, $scope.derivativeContainers[key].subContainers["buttons"].height);
             var shape = new createjs.Shape(graphics);
             $scope.derivativeContainers[key].subContainers["buttons"].addChild(shape);
             stage.update();*/

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/


            /*Index*/
            $scope.derivativeContainers[key].subContainers["index"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["index"].width = $scope.derivativeContainers[key].width / 11;
            $scope.derivativeContainers[key].subContainers["index"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["index"].x = $scope.derivativeContainers[key].subContainers["buttons"].width;

            $scope.derivativeContainers[key].subContainers["index"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["index"]);
            stage.update();

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            /*var graphics1 = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["index"].width, $scope.derivativeContainers[key].subContainers["index"].height);
             var shape1 = new createjs.Shape(graphics1);
             $scope.derivativeContainers[key].subContainers["index"].addChild(shape1);
             stage.update();*/

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/


            /*English*/
            $scope.derivativeContainers[key].subContainers["english"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["english"].width = $scope.derivativeContainers[key].width / 3;
            $scope.derivativeContainers[key].subContainers["english"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["english"].x = $scope.derivativeContainers[key].subContainers["buttons"].width + $scope.derivativeContainers[key].subContainers["index"].width;

            $scope.derivativeContainers[key].subContainers["english"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["english"]);
            stage.update();

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            /* var graphics2 = new createjs.Graphics().beginFill("lightgrey").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["english"].width, $scope.derivativeContainers[key].subContainers["english"].height);
             var shape2 = new createjs.Shape(graphics2);
             $scope.derivativeContainers[key].subContainers["english"].addChild(shape2);
             stage.update();*/

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/


            /*Greek*/
            $scope.derivativeContainers[key].subContainers["greek"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["greek"].width = $scope.derivativeContainers[key].width / 3;
            $scope.derivativeContainers[key].subContainers["greek"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["greek"].x = $scope.derivativeContainers[key].subContainers["buttons"].width
              + $scope.derivativeContainers[key].subContainers["index"].width + $scope.derivativeContainers[key].subContainers["english"].width;

            $scope.derivativeContainers[key].subContainers["greek"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["greek"]);
            stage.update();

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/
            /* var graphics3 = new createjs.Graphics().beginFill("azure").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["greek"].width, $scope.derivativeContainers[key].subContainers["greek"].height);
             var shape3 = new createjs.Shape(graphics3);
             $scope.derivativeContainers[key].subContainers["greek"].addChild(shape3);
             stage.update();*/

            /*- - - - - - - - - - - TEST SHAPE - - - - - - - - - - -*/


            $scope.derivativeContainers[key].subContainers["buttons"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["index"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["english"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["greek"].rowContainers = {};

            $scope.derivativesBackgrounds[key] = {};
            $scope.derivativesBackgrounds[key].indexBackground = {};
            $scope.derivativesBackgrounds[key].englishBackground = {};
            $scope.derivativesBackgrounds[key].greekBackground = {};

            /*FILLING ROW CONTAINERS*/
            _.each(_.filter($scope.activityData.derivatives, {type: key}), function (derivative, k, list) {

              //Initialization of shape-backgrounds array


              console.log("Populating row containers --------> k: ", k);
              console.log("Populating row containers --------> key: ", key);
              console.log("Populating row containers --------> derivative.type: ", derivative.type);

              /*Row container for Buttons*/
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["buttons"].width;
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].x = 0;

              console.log("Y for the element " + k + ": ", $scope.derivativeContainers[key].subContainers["buttons"].children.length * 30);
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].y = (k + 1) * 30;

              //Adding new container
              $scope.derivativeContainers[key].subContainers["buttons"].addChild($scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k]);

              /* var graphics1 = new createjs.Graphics().beginFill("grey").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].width, 30);
               var shape1 = new createjs.Shape(graphics1);
               $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].addChild(shape1);
               stage.update();*/


              /*Row container for Index*/
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["index"].width;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].x = 0;

              console.log("Y for the element " + k + ": ", $scope.derivativeContainers[key].subContainers["index"].children.length * 30);
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].y = (k + 1) * 30;

              //Adding new container
              $scope.derivativeContainers[key].subContainers["index"].addChild($scope.derivativeContainers[key].subContainers["index"].rowContainers[k]);


              var graphicsIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].indexBackground[k] = new createjs.Shape(graphicsIndex);
              $scope.derivativesBackgrounds[key].indexBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].indexBackground[k]);
              stage.update();
              $scope.derivativesBackgrounds[key].indexBackground[k].visible = false;


              /*Row container for English*/
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["english"].width;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].x = 0;

              console.log("Y for the element " + k + ": ", $scope.derivativeContainers[key].subContainers["english"].children.length * 30);
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].y = (k + 1) * 30;

              //Adding new container
              $scope.derivativeContainers[key].subContainers["english"].addChild($scope.derivativeContainers[key].subContainers["english"].rowContainers[k]);

              var englishIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].englishBackground[k] = new createjs.Shape(englishIndex);
              $scope.derivativesBackgrounds[key].englishBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].englishBackground[k]);
              stage.update();
              $scope.derivativesBackgrounds[key].englishBackground[k].visible = false;

              /*Row container for Greek*/
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["greek"].width;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].x = 0;

              console.log("Y for the element " + k + ": ", $scope.derivativeContainers[key].subContainers["greek"].children.length * 30);
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].y = (k + 1) * 30;

              //Adding new container
              $scope.derivativeContainers[key].subContainers["greek"].addChild($scope.derivativeContainers[key].subContainers["greek"].rowContainers[k]);

              var greekIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].greekBackground[k] = new createjs.Shape(greekIndex);
              $scope.derivativesBackgrounds[key].greekBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].greekBackground[k]);
              stage.update();
              $scope.derivativesBackgrounds[key].greekBackground[k].visible = false;

            });

            console.log("************************** Row Containers Results **************************");
            console.log("ROW CONTAINERS FOR: " + key + ": ", $scope.derivativeContainers[key].subContainers["buttons"].rowContainers);
            console.log("****************************************************************************");

          });//end of each for creating derivatives container

          console.log("Calculated Backgrounds: ", $scope.derivativesBackgrounds);

        }//End of creating multiple column containers function


        /**************************** SOUNDS FUNCTIONS *****************************/
        //Playing sound and adding background
        function playingSound(element) {

        }

        //Stop playing sound
        function stopPlayingSound() {

        }

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

            $scope.derivativeContainers["verbs"].visible = false;
            $scope.derivativeContainers["nouns"].visible = false;
            $scope.derivativeContainers["noun"].visible = false;
            $scope.derivativeContainers["adjective"].visible = false;

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

            $scope.derivativeContainers["verbs"].visible = false;
            $scope.derivativeContainers["nouns"].visible = false;
            $scope.derivativeContainers["noun"].visible = false;
            $scope.derivativeContainers["adjective"].visible = false;

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

            $scope.derivativeContainers["verbs"].visible = true;
            $scope.derivativeContainers["nouns"].visible = true;
            $scope.derivativeContainers["noun"].visible = true;
            $scope.derivativeContainers["adjective"].visible = true;

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

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
            function (buttonsSpriteSheetCallback) {

              /*English Button*/
              $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json data for english button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);
                  return buttonsSpriteSheetCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for english button...", error);
                  return buttonsSpriteSheetCallback(true, error);
                });

            },
            function (buttonsSpriteSheetCallback) {

              /*Greek Button*/
              $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json data for greek button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                  return buttonsSpriteSheetCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for greek button...", error);
                  return buttonsSpriteSheetCallback(true, error);
                });

            },
            function (buttonsSpriteSheetCallback) {

              /*Play Button*/
              $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                .success(function (response) {

                  console.log("Success on getting json data for play button!");

                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

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

              var verbsIndex = 0;
              var nounsIndex = 0;
              var nounIndex = 0;
              var adjectiveIndex = 0;

              /*Iterating and populating the container*/
              _.each($scope.activityData.derivatives, function (derivative, key, list) {

                /********************* Creating English button *********************/
                var enSmallButton = new createjs.Sprite($scope.enSmallButtonSpriteSheet, "normal");

                enSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  enSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                enSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  enSmallButton.gotoAndPlay("normal");
                  $scope.englishDerivativesBitmaps[derivative.name].visible = !$scope.englishDerivativesBitmaps[derivative.name].visible;
                });

                enSmallButton.x = enSmallButton.getBounds().width / 2;
                enSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                console.log("getBounds: ", enSmallButton.getBounds());

                /*********************Creating Greek button*********************/
                var grSmallButton = new createjs.Sprite($scope.grSmallButtonSpriteSheet, "normal");

                grSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  grSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                grSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  grSmallButton.gotoAndPlay("normal");
                  $scope.greekDerivativesBitmaps[derivative.name].visible = !$scope.greekDerivativesBitmaps[derivative.name].visible;

                });

                grSmallButton.x = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].width / 2;
                grSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                /********************* Creating Play button *********************/
                var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
                playSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  playSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                playSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  playSmallButton.gotoAndPlay("normal");
                  console.log("Playing sound: ", event);
                  /*playingSound()*/
                  console.log("Playing sound for element with derivative.type: " + derivative.type + " and key:", key);

                  var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: derivative.type}), {name: $scope.activityData.derivatives[key].name});
                  console.log("Formatted activityData.derivatives: ", _.filter($scope.activityData.derivatives, {type: derivative.type}));
                  console.log("The selected element index: ", elementIndex);

                  $scope.derivativesBackgrounds[derivative.type].indexBackground[elementIndex].visible = true;
                  $scope.derivativesBackgrounds[derivative.type].englishBackground[elementIndex].visible = true;
                  $scope.derivativesBackgrounds[derivative.type].greekBackground[elementIndex].visible = true;
                });

                playSmallButton.x = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].width - playSmallButton.getBounds().width / 2;
                playSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                if (derivative.type === 'verbs') {
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(playSmallButton);
                  stage.update();
                  verbsIndex++;
                } else if (derivative.type === 'nouns') {
                  console.log("$scope.derivativeContainers['nouns'].subContainers.rowContainers: ", $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(playSmallButton);
                  stage.update();
                  nounsIndex++;
                } else if (derivative.type === 'noun') {
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(playSmallButton);
                  stage.update();
                  nounIndex++;
                } else {
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(playSmallButton);
                  stage.update();
                  adjectiveIndex++;
                }
              });
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

        /*LOAD DERIVATIVES BUTTONS*/
        function loadDerivativesButtons() {

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
            function (buttonsSpriteSheetCallback) {

              /*English Button*/
              $http.get($rootScope.rootDir + "data/assets/english_small_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json data for english button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);
                  return buttonsSpriteSheetCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for english button...", error);
                  return buttonsSpriteSheetCallback(true, error);
                });

            },
            function (buttonsSpriteSheetCallback) {

              /*Greek Button*/
              $http.get($rootScope.rootDir + "data/assets/greek_small_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json data for greek button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                  return buttonsSpriteSheetCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for greek button...", error);
                  return buttonsSpriteSheetCallback(true, error);
                });

            },
            function (buttonsSpriteSheetCallback) {

              /*Play Button*/
              $http.get($rootScope.rootDir + "data/assets/play_small_button_sprite.json")
                .success(function (response) {

                  console.log("Success on getting json data for play button!");

                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  $scope.playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

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

              var verbsIndex = 0;
              var nounsIndex = 0;
              var nounIndex = 0;
              var adjectiveIndex = 0;

              /*Iterating and populating the container*/
              _.each($scope.activityData.derivatives, function (derivative, key, list) {

                /********************* Creating English button *********************/
                var enSmallButton = new createjs.Sprite($scope.enSmallButtonSpriteSheet, "normal");

                enSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  enSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                enSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  enSmallButton.gotoAndPlay("normal");
                  $scope.englishDerivativesBitmaps[derivative.name].visible = !$scope.englishDerivativesBitmaps[derivative.name].visible;
                });

                enSmallButton.x = enSmallButton.getBounds().width / 2;
                enSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                console.log("getBounds: ", enSmallButton.getBounds());

                /*********************Creating Greek button*********************/
                var grSmallButton = new createjs.Sprite($scope.grSmallButtonSpriteSheet, "normal");

                grSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  grSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                grSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  grSmallButton.gotoAndPlay("normal");
                  $scope.greekDerivativesBitmaps[derivative.name].visible = !$scope.greekDerivativesBitmaps[derivative.name].visible;

                });

                grSmallButton.x = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].width / 2;
                grSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                /********************* Creating Play button *********************/
                var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
                playSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  playSmallButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                playSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  playSmallButton.gotoAndPlay("normal");
                  console.log("Playing sound: ", event);
                  /*playingSound()*/
                  console.log("Playing sound for element with derivative.type: " + derivative.type + " and key:", key);

                  var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: derivative.type}), {name: $scope.activityData.derivatives[key].name});
                  console.log("Formatted activityData.derivatives: ", _.filter($scope.activityData.derivatives, {type: derivative.type}));
                  console.log("The selected element index: ", elementIndex);

                  $scope.derivativesBackgrounds[derivative.type].indexBackground[elementIndex].visible = true;
                  $scope.derivativesBackgrounds[derivative.type].englishBackground[elementIndex].visible = true;
                  $scope.derivativesBackgrounds[derivative.type].greekBackground[elementIndex].visible = true;
                });

                playSmallButton.x = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].width - playSmallButton.getBounds().width / 2;
                playSmallButton.y = $scope.derivativeContainers[derivative.type].subContainers["buttons"].rowContainers[0].height / 2;

                if (derivative.type === 'verbs') {
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['verbs'].subContainers["buttons"].rowContainers[verbsIndex].addChild(playSmallButton);
                  stage.update();
                  verbsIndex++;
                } else if (derivative.type === 'nouns') {
                  console.log("$scope.derivativeContainers['nouns'].subContainers.rowContainers: ", $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(playSmallButton);
                  stage.update();
                  nounsIndex++;
                } else if (derivative.type === 'noun') {
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(playSmallButton);
                  stage.update();
                  nounIndex++;
                } else {
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(playSmallButton);
                  stage.update();
                  adjectiveIndex++;
                }

              });

            }
          });//End of waterfall
        }//End of loadDerivativesButtons function


        /*LOAD DERIVATIVES INDEXES*/
        function loadDerivativesIndexes() {

          var verbsIndex = 0;
          var nounsIndex = 0;
          var nounIndex = 0;
          var adjectiveIndex = 0;

          _.each($scope.activityData.derivatives, function (derivative, key, list) {

            var derivativeIndex = new createjs.Text(key + 1 + ".", "20px Arial", "black");

            derivativeIndex.x = $scope.derivativeContainers['verbs'].subContainers["index"].rowContainers[0].width / 2;
            derivativeIndex.y = $scope.derivativeContainers['verbs'].subContainers["index"].rowContainers[0].height / 2;
            derivativeIndex.textAlign = "center";
            derivativeIndex.textBaseline = "middle";

            /*Resolving on which container should be added*/
            if (derivative.type === 'verbs') {
              $scope.derivativeContainers['verbs'].subContainers["index"].rowContainers[verbsIndex].addChild(derivativeIndex);
              stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["index"].rowContainers[nounsIndex].addChild(derivativeIndex);
              stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["index"].rowContainers[nounIndex].addChild(derivativeIndex);
              stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["index"].rowContainers[adjectiveIndex].addChild(derivativeIndex);
              stage.update();
              adjectiveIndex++;
            }

          });
        }//End of loadDerivativesIndexes function


        /*LOAD ENGLISH DERIVATIVES*/
        function loadEnglishDerivatives() {

          /*Initializing y that will change dynamically for every button*/
          $scope.englishDerivativesBitmaps = {};
          var verbsIndex = 0;
          var nounsIndex = 0;
          var nounIndex = 0;
          var adjectiveIndex = 0;


          /*Iterating and populating the container*/
          _.each($scope.activityData.derivatives, function (derivative, key, list) {

            $scope.englishDerivativesBitmaps[derivative.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + ".png");

            $scope.englishDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[0].height / 2;
            $scope.englishDerivativesBitmaps[derivative.name].x = 0;
            $scope.englishDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[0].height / 1.5;

            /*Resolving on which container should be added*/
            if (derivative.type === 'verbs') {
              $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[verbsIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["english"].rowContainers[nounsIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["english"].rowContainers[nounIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["english"].rowContainers[adjectiveIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              stage.update();
              adjectiveIndex++;
            }


          });
        }//End of loadEnglishDerivatives function


        /*LOAD GREEK DERIVATIVES*/
        function loadGreekDerivatives() {

          /*Initializing y that will change dynamically for every button*/
          var verbsIndex = 0;
          var nounsIndex = 0;
          var nounIndex = 0;
          var adjectiveIndex = 0;

          $scope.greekDerivativesBitmaps = {};

          /*Iterating and populating the container*/
          _.each($scope.activityData.derivatives, function (derivative, key, list) {

            $scope.greekDerivativesBitmaps[derivative.name] = new createjs.Bitmap("data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + "_gr.png");

            $scope.greekDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[0].height / 2;
            $scope.greekDerivativesBitmaps[derivative.name].x = 0;
            $scope.greekDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[0].height / 1.5;

            /*Resolving on which container should be added*/
            if (derivative.type === 'verbs') {
              $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[verbsIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["greek"].rowContainers[nounsIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["greek"].rowContainers[nounIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["greek"].rowContainers[adjectiveIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              stage.update();
              adjectiveIndex++;
            }

          });

        }//End of loadGreekDerivatives function


        /******************************************* Adding Page Buttons *******************************************/


        /*BIG PAUSE BUTTON*/
        $http.get($rootScope.rootDir + "data/assets/vocabulary_pause_button_sprite.json")
          .success(function (response) {
            console.log("Success on getting json for the big pause button");

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var bigPauseButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.bigPauseButton = new createjs.Sprite(bigPauseButtonSpriteSheet, "normal");

            $scope.bigPauseButton.visible = false;

            $scope.bigPauseButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.bigPauseButton.gotoAndPlay("onSelection");
              stage.update();
            });

            $scope.bigPauseButton.addEventListener("pressup", function (event) {
              console.log("Press up event!");
              $scope.bigPlayButtonPressed = false;
              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = true;
              $scope.bigPauseButton.gotoAndPlay("normal");
            });

            $scope.bigPauseButton.scaleX = $scope.bigPauseButton.scaleY = scale;
            $scope.bigPauseButton.x = backgroundPosition.x + (backgroundPosition.width / 9);
            $scope.bigPauseButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);

            stage.addChild($scope.bigPauseButton);
            stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for bigPauseButton button...", error);
          });//end of get bigPause button

        /*BIG STOP BUTTON*/
        $http.get($rootScope.rootDir + "data/assets/vocabulary_stop_button_sprite.json")
          .success(function (response) {
            console.log("Success on getting json for the big pause button");

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var bigStopButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.bigStopButton = new createjs.Sprite(bigStopButtonSpriteSheet, "normal");

            $scope.bigStopButton.visible = false;

            $scope.bigStopButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.bigStopButton.gotoAndPlay("onSelection");
              stage.update();
            });

            $scope.bigStopButton.addEventListener("pressup", function (event) {
              console.log("Press up event!");
              $scope.bigPlayButtonPressed = false;
              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = true;
              $scope.bigStopButton.gotoAndPlay("normal");
            });

            $scope.bigStopButton.scaleX = $scope.bigStopButton.scaleY = scale;
            $scope.bigStopButton.x = backgroundPosition.x + (backgroundPosition.width / 6);
            $scope.bigStopButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);

            stage.addChild($scope.bigStopButton);
            stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for bigStopButton button...", error);
          });//end of get bigStop button

        /*BIG PLAY BUTTON*/
        $http.get($rootScope.rootDir + "data/assets/vocabulary_play_big_button_sprite.json")
          .success(function (response) {
            console.log("Success on getting json for the big play button");

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var bigPlayButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.bigPlayButton = new createjs.Sprite(bigPlayButtonSpriteSheet, "normal");

            $scope.bigPlayButton.visible = true;

            $scope.bigPlayButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.bigPlayButton.gotoAndPlay("onSelection");
              stage.update();
            });

            $scope.bigPlayButton.addEventListener("pressup", function (event) {
              console.log("Press up event!");
              $scope.bigPlayButton.visible = false;
              $scope.bigPauseButton.visible = true;
              $scope.bigStopButton.visible = true;
              $scope.bigPlayButton.gotoAndPlay("normal");
            });

            $scope.bigPlayButton.scaleX = $scope.bigPlayButton.scaleY = scale;
            $scope.bigPlayButton.x = backgroundPosition.x + (backgroundPosition.width / 7);
            $scope.bigPlayButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);

            stage.addChild($scope.bigPlayButton);
            stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for bigPlayButton button...", error);
          });//end of get bigPlay button


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
                if ($scope.englishDerivativesBitmaps[$scope.activityData.derivatives[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {

                    $scope.englishDerivativesBitmaps[derivative.name].visible = false;
                  });

                  englishBigButton.gotoAndPlay("selected");
                  stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {
                    $scope.englishDerivativesBitmaps[derivative.name].visible = true;
                  });
                  englishBigButton.gotoAndPlay("normal");
                  stage.update();
                }
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
                if ($scope.greekDerivativesBitmaps[$scope.activityData.derivatives[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {

                    $scope.greekDerivativesBitmaps[derivative.name].visible = false;
                  });

                  greekBigButton.gotoAndPlay("selected");
                  stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {
                    $scope.greekDerivativesBitmaps[derivative.name].visible = true;
                  });
                  greekBigButton.gotoAndPlay("normal");
                  stage.update();
                }
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

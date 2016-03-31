angular.module("bookbuilder2")
  .controller("VocabularyController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("VocabularyController loaded!");

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
        console.log("GENERAL SCALING FACTOR", scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE

        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        $scope.stage.update();

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
              $scope.stage.update();
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              menuButton.gotoAndPlay("normal");
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lesson", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);
            $scope.stage.update();


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
                            console.log("Sound error: ", err);
                          }, function (status) {

                            if (status === 1) {
                              $scope.sounds[word.name].soundWasPlayed = true;
                            }

                            console.log("Sound status: ", status);
                          });
                          waterfallCallback();
                        });
                      } else {
                        console.log("Else Android");

                        if (status === 1) {
                          $scope.sounds[word.name].soundWasPlayed = true;
                        }

                        /**************** Media ***************/
                        if (window.cordova && window.cordova.platformId !== "browser") {

                          $scope.sounds[word.name] = new Media(assetPath + word.name + ".mp3", function () {
                            console.log("Sound success");

                            //Sound finished and change background color again

                          }, function (err) {
                            console.log("Sound error", err);
                          }, function (status) {
                            console.log("Sound status", status);
                          });
                        }

                        waterfallCallback();
                      }
                    });
                  });
                });

                async.parallel([function (parallelCallback) {
                  createSingleColumnWordsContainers(function () {

                    loadButtons();
                    loadIndexes();
                    loadEnglishWords();
                    loadEquals();
                    loadGreekWords();

                    parallelCallback();
                  });
                }, function (parallelCallback) {
                  createSingleColumnPhrasesContainers(function () {

                    loadPhrasesButtons();
                    loadPhrasesIndexes();
                    loadEnglishPhrases();
                    loadPhrasesEquals();
                    loadGreekPhrases();

                    parallelCallback();
                  });
                }, function (parallelCallback) {
                  createMultiColumnContainers(function () {
                    loadDerivativesButtons();
                    loadDerivativesIndexes();
                    loadEnglishDerivatives();
                    loadGreekDerivatives();
                    parallelCallback();
                  });
                }], function (err, response) {
                  async.waterfall(waterFallFunctions, function (err, response) {
                    $scope.wordsButton.gotoAndPlay("selected");
                    loadPage("words");
                  });
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


        function createSingleColumnWordsContainers(parallelCallback) {
          $scope.buttonsContainer = new createjs.Container();
          $scope.buttonsContainer.visible = false;
          $scope.buttonsContainer.width = background.image.width / 12;
          $scope.buttonsContainer.height = background.image.height / 1.3;
          $scope.buttonsContainer.scaleX = $scope.buttonsContainer.scaleY = scale;
          $scope.buttonsContainer.x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.buttonsContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.buttonsContainer);

          $scope.buttonsContainer.buttonsSubContainers = {};
          _.each($scope.activityData.words, function (word, key, list) {
            $scope.buttonsContainer.buttonsSubContainers[word.name] = new createjs.Container();
            $scope.buttonsContainer.buttonsSubContainers[word.name].width = $scope.buttonsContainer.width;
            $scope.buttonsContainer.buttonsSubContainers[word.name].height = 30;
            $scope.buttonsContainer.buttonsSubContainers[word.name].x = 0;
            $scope.buttonsContainer.buttonsSubContainers[word.name].y = key * 30;
            $scope.buttonsContainer.addChild($scope.buttonsContainer.buttonsSubContainers[word.name]);
          });

          $scope.indexContainer = new createjs.Container();
          $scope.indexContainer.visible = false;
          $scope.indexContainer.width = background.image.width / 28;
          $scope.indexContainer.height = background.image.height / 1.3;
          $scope.indexContainer.scaleX = $scope.indexContainer.scaleY = scale;
          $scope.indexContainer.x = backgroundPosition.x + (backgroundPosition.width / 7);
          $scope.indexContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.indexContainer);

          $scope.indexContainer.indexSubContainers = {};
          _.each($scope.activityData.words, function (word, key, list) {
            $scope.indexContainer.indexSubContainers[word.name] = new createjs.Container();
            $scope.indexContainer.indexSubContainers[word.name].width = $scope.indexContainer.width;
            $scope.indexContainer.indexSubContainers[word.name].height = 30;
            $scope.indexContainer.indexSubContainers[word.name].x = 0;
            $scope.indexContainer.indexSubContainers[word.name].y = key * 30;

            var indexPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0,
              $scope.indexContainer.indexSubContainers[word.name].width,
              $scope.indexContainer.indexSubContainers[word.name].height);
            $scope.indexContainer.indexSubContainers[word.name].indexBackground = new createjs.Shape(indexPhrasesSubContainerGraphics);
            $scope.indexContainer.indexSubContainers[word.name].addChild($scope.indexContainer.indexSubContainers[word.name].indexBackground);
            $scope.indexContainer.indexSubContainers[word.name].indexBackground.alpha = 0.5;
            $scope.indexContainer.indexSubContainers[word.name].indexBackground.visible = false;
            $scope.indexContainer.addChild($scope.indexContainer.indexSubContainers[word.name]);
          });

          $scope.englishWordsContainer = new createjs.Container();
          $scope.englishWordsContainer.visible = false;
          $scope.englishWordsContainer.width = background.image.width / 4;
          $scope.englishWordsContainer.height = background.image.height / 1.3;
          $scope.englishWordsContainer.scaleX = $scope.englishWordsContainer.scaleY = scale;
          $scope.englishWordsContainer.x = backgroundPosition.x + (backgroundPosition.width / 5.5);
          $scope.englishWordsContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.englishWordsContainer);

          $scope.englishWordsContainer.englishSubContainers = {};
          _.each($scope.activityData.words, function (word, key, list) {
            $scope.englishWordsContainer.englishSubContainers[word.name] = new createjs.Container();
            $scope.englishWordsContainer.englishSubContainers[word.name].width = $scope.englishWordsContainer.width;
            $scope.englishWordsContainer.englishSubContainers[word.name].height = 30;
            $scope.englishWordsContainer.englishSubContainers[word.name].x = 0;
            $scope.englishWordsContainer.englishSubContainers[word.name].y = key * 30;
            var englishSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.englishWordsContainer.englishSubContainers[word.name].width,
              $scope.englishWordsContainer.englishSubContainers[word.name].height);
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground = new createjs.Shape(englishSubContainerGraphics);
            $scope.englishWordsContainer.englishSubContainers[word.name].addChild($scope.englishWordsContainer.englishSubContainers[word.name].englishBackground);
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.alpha = 0.5;
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.visible = false;
            $scope.englishWordsContainer.addChild($scope.englishWordsContainer.englishSubContainers[word.name]);
          });
          $scope.equalsSignContainer = new createjs.Container();
          $scope.equalsSignContainer.visible = false;
          $scope.equalsSignContainer.width = background.image.width / 28;
          $scope.equalsSignContainer.height = backgroundPosition.height / 1.15;
          $scope.equalsSignContainer.scaleX = $scope.equalsSignContainer.scaleY = scale;
          $scope.equalsSignContainer.x = backgroundPosition.x + (backgroundPosition.width / 2.2);
          $scope.equalsSignContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.equalsSignContainer);

          $scope.equalsSignContainer.equalsSubContainers = {};
          _.each($scope.activityData.words, function (word, key, list) {
            $scope.equalsSignContainer.equalsSubContainers[word.name] = new createjs.Container();
            $scope.equalsSignContainer.equalsSubContainers[word.name].width = $scope.equalsSignContainer.width;
            $scope.equalsSignContainer.equalsSubContainers[word.name].height = 30;
            $scope.equalsSignContainer.equalsSubContainers[word.name].x = 0;
            $scope.equalsSignContainer.equalsSubContainers[word.name].y = key * 30;
            var equalsSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0,
              $scope.equalsSignContainer.equalsSubContainers[word.name].width,
              $scope.equalsSignContainer.equalsSubContainers[word.name].height);
            $scope.equalsSignContainer.equalsSubContainers[word.name].equalsBackground = new createjs.Shape(equalsSubContainerGraphics);
            $scope.equalsSignContainer.equalsSubContainers[word.name].addChild($scope.equalsSignContainer.equalsSubContainers[word.name].equalsBackground);
            $scope.equalsSignContainer.equalsSubContainers[word.name].equalsBackground.alpha = 0.5;
            $scope.equalsSignContainer.equalsSubContainers[word.name].equalsBackground.visible = false;
            $scope.equalsSignContainer.addChild($scope.equalsSignContainer.equalsSubContainers[word.name]);
          });
          $scope.greekWordsContainer = new createjs.Container();
          $scope.greekWordsContainer.visible = false;
          $scope.greekWordsContainer.width = 300;
          $scope.greekWordsContainer.height = backgroundPosition.height / 1.15;
          $scope.greekWordsContainer.scaleX = $scope.greekWordsContainer.scaleY = scale;
          $scope.greekWordsContainer.x = backgroundPosition.x + (backgroundPosition.width / 2);
          $scope.greekWordsContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.greekWordsContainer);

          $scope.greekWordsContainer.greekWordsSubContainers = {};
          _.each($scope.activityData.words, function (word, key, list) {
            $scope.greekWordsContainer.greekWordsSubContainers[word.name] = new createjs.Container();
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].width = $scope.greekWordsContainer.width;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].height = 30;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].x = 0;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].y = key * 30;
            var greekSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0,
              $scope.greekWordsContainer.greekWordsSubContainers[word.name].width, $scope.greekWordsContainer.greekWordsSubContainers[word.name].height);
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground = new createjs.Shape(greekSubContainerGraphics);
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].addChild($scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground);
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground.alpha = 0.5;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground.visible = false;
            $scope.greekWordsContainer.addChild($scope.greekWordsContainer.greekWordsSubContainers[word.name]);
          });
          parallelCallback();
        }//End of creating single column words containers function


        function createSingleColumnPhrasesContainers(parallelCallback) {
          $scope.buttonsPhrasesContainer = new createjs.Container();
          $scope.buttonsPhrasesContainer.visible = false;
          $scope.buttonsPhrasesContainer.width = background.image.width / 12;
          $scope.buttonsPhrasesContainer.height = background.image.height / 1.3;
          $scope.buttonsPhrasesContainer.scaleX = $scope.buttonsPhrasesContainer.scaleY = scale;
          $scope.buttonsPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.buttonsPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.buttonsPhrasesContainer);

          $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name] = new createjs.Container();
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].width = $scope.buttonsPhrasesContainer.width;
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].height = 30;
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].x = 0;
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].y = key * 30;
            var buttonsPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].width, $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].height);
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].buttonsPhrasesBackground = new createjs.Shape(buttonsPhrasesSubContainerGraphics);
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].addChild($scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].buttonsPhrasesBackground);
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].buttonsPhrasesBackground.alpha = 0.5;
            $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].buttonsPhrasesBackground.visible = false;
            $scope.buttonsPhrasesContainer.addChild($scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name]);
          });

          $scope.indexPhrasesContainer = new createjs.Container();
          $scope.indexPhrasesContainer.visible = false;
          $scope.indexPhrasesContainer.width = background.image.width / 28;
          $scope.indexPhrasesContainer.height = background.image.height / 1.3;
          $scope.indexPhrasesContainer.scaleX = $scope.indexPhrasesContainer.scaleY = scale;
          $scope.indexPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 7);
          $scope.indexPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.indexPhrasesContainer);

          $scope.indexPhrasesContainer.indexPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name] = new createjs.Container();
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].width = $scope.indexPhrasesContainer.width;
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].height = 30;
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].x = 0;
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].y = key * 30;
            var indexPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].width, $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].height);
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].indexPhrasesBackground = new createjs.Shape(indexPhrasesSubContainerGraphics);
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].addChild($scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].indexPhrasesBackground);
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].indexPhrasesBackground.alpha = 0.5;
            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].indexPhrasesBackground.visible = false;
            $scope.indexPhrasesContainer.addChild($scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name]);
          });
          $scope.englishPhrasesContainer = new createjs.Container();
          $scope.englishPhrasesContainer.visible = false;
          $scope.englishPhrasesContainer.width = background.image.width / 4;
          $scope.englishPhrasesContainer.height = background.image.height / 1.3;
          $scope.englishPhrasesContainer.scaleX = $scope.englishPhrasesContainer.scaleY = scale;
          $scope.englishPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 5.5);
          $scope.englishPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.englishPhrasesContainer);

          $scope.englishPhrasesContainer.englishPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name] = new createjs.Container();
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].width = $scope.englishPhrasesContainer.width;
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].height = 30;
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].x = 0;
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].y = key * 30;
            var englishPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].width, $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].height);
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].englishPhrasesBackground = new createjs.Shape(englishPhrasesSubContainerGraphics);
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].addChild($scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].englishPhrasesBackground);
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].englishPhrasesBackground.alpha = 0.5;
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].englishPhrasesBackground.visible = false;
            $scope.englishPhrasesContainer.addChild($scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name]);
          });

          $scope.equalsSignPhrasesContainer = new createjs.Container();
          $scope.equalsSignPhrasesContainer.visible = false;
          $scope.equalsSignPhrasesContainer.width = background.image.width / 28;
          $scope.equalsSignPhrasesContainer.height = backgroundPosition.height / 1.15;
          $scope.equalsSignPhrasesContainer.scaleX = $scope.equalsSignPhrasesContainer.scaleY = scale;
          $scope.equalsSignPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 2.2);
          $scope.equalsSignPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.equalsSignPhrasesContainer);

          $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name] = new createjs.Container();
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].width = $scope.equalsSignPhrasesContainer.width;
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].height = 30;
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].x = 0;
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].y = key * 30;
            var equalsPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].width, $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].height);
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].equalsPhrasesBackground = new createjs.Shape(equalsPhrasesSubContainerGraphics);
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].addChild($scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].equalsPhrasesBackground);
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].equalsPhrasesBackground.alpha = 0.5;
            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].equalsPhrasesBackground.visible = false;
            $scope.equalsSignPhrasesContainer.addChild($scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name]);
          });
          $scope.greekPhrasesContainer = new createjs.Container();
          $scope.greekPhrasesContainer.visible = false;
          $scope.greekPhrasesContainer.width = 300;
          $scope.greekPhrasesContainer.height = backgroundPosition.height / 1.15;
          $scope.greekPhrasesContainer.scaleX = $scope.greekPhrasesContainer.scaleY = scale;
          $scope.greekPhrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 2);
          $scope.greekPhrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.greekPhrasesContainer);

          $scope.greekPhrasesContainer.greekPhrasesSubContainers = {};
          _.each($scope.activityData.phrases, function (phrase, key, list) {
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name] = new createjs.Container();
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].width = $scope.greekPhrasesContainer.width;
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].height = 30;
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].x = 0;
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].y = key * 30;
            var greekPhrasesSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].width, $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].height);
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].greekPhrasesBackground = new createjs.Shape(greekPhrasesSubContainerGraphics);
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].addChild($scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].greekPhrasesBackground);
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].greekPhrasesBackground.alpha = 0.5;
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].greekPhrasesBackground.visible = false;
            $scope.greekPhrasesContainer.addChild($scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name]);
          });
          parallelCallback();
        }//End of creating single column phrases containers function

        /*Creating multi-column template containers mainly for the Derivatives section*/
        function createMultiColumnContainers(parallelCallback) {

          $scope.derivativeContainers = {};
          $scope.derivativeContainers["verbs"] = new createjs.Container();
          $scope.derivativeContainers["verbs"].visible = false;
          $scope.derivativeContainers["verbs"].width = background.image.width / 2.6;
          $scope.derivativeContainers["verbs"].height = background.image.height / 2.5;
          $scope.derivativeContainers["verbs"].scaleX = $scope.derivativeContainers["verbs"].scaleY = scale;
          $scope.derivativeContainers["verbs"].x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.derivativeContainers["verbs"].y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.derivativeContainers["verbs"]);

          $scope.derivativeContainers["verbs"].subContainers = {};
          var verbsTitle = new createjs.Text("VERBS", "17px Arial", "red");
          verbsTitle.x = $scope.derivativeContainers["verbs"].width / 2;
          verbsTitle.y = 0;
          verbsTitle.textBaseline = "top";
          verbsTitle.textAlign = "center";
          $scope.derivativeContainers["verbs"].addChild(verbsTitle);

          $scope.derivativeContainers["nouns"] = new createjs.Container();
          $scope.derivativeContainers["nouns"].visible = false;
          $scope.derivativeContainers["nouns"].width = background.image.width / 2.6;
          $scope.derivativeContainers["nouns"].height = background.image.height / 2.5;
          $scope.derivativeContainers["nouns"].scaleX = $scope.derivativeContainers["nouns"].scaleY = scale;
          $scope.derivativeContainers["nouns"].x = backgroundPosition.x + (backgroundPosition.width / 2.3);
          $scope.derivativeContainers["nouns"].y = backgroundPosition.y + (backgroundPosition.height / 10);
          $scope.stage.addChild($scope.derivativeContainers["nouns"]);

          $scope.derivativeContainers["nouns"].subContainers = {};
          var nounsTitle = new createjs.Text("NOUNS", "17px Arial", "red");
          nounsTitle.x = $scope.derivativeContainers["nouns"].width / 2;
          nounsTitle.y = 0;
          nounsTitle.textBaseline = "top";
          nounsTitle.textAlign = "center";
          $scope.derivativeContainers["nouns"].addChild(nounsTitle);


          $scope.derivativeContainers["noun"] = new createjs.Container();
          $scope.derivativeContainers["noun"].visible = false;
          $scope.derivativeContainers["noun"].width = background.image.width / 2.6;
          $scope.derivativeContainers["noun"].height = background.image.height / 2.5;
          $scope.derivativeContainers["noun"].scaleX = $scope.derivativeContainers["noun"].scaleY = scale;
          $scope.derivativeContainers["noun"].x = backgroundPosition.x + (backgroundPosition.width / 17);
          $scope.derivativeContainers["noun"].y = backgroundPosition.y + (backgroundPosition.height / 2);
          $scope.stage.addChild($scope.derivativeContainers["noun"]);

          $scope.derivativeContainers["noun"].subContainers = {};
          var nounTitle = new createjs.Text("NOUN", "17px Arial", "red");
          nounTitle.x = $scope.derivativeContainers["noun"].width / 2;
          nounTitle.y = 0;
          nounTitle.textBaseline = "top";
          nounTitle.textAlign = "center";
          $scope.derivativeContainers["noun"].addChild(nounTitle);

          $scope.derivativeContainers["adjective"] = new createjs.Container();
          $scope.derivativeContainers["adjective"].visible = false;
          $scope.derivativeContainers["adjective"].width = background.image.width / 2.6;
          $scope.derivativeContainers["adjective"].height = background.image.height / 2.5;
          $scope.derivativeContainers["adjective"].scaleX = $scope.derivativeContainers["adjective"].scaleY = scale;
          $scope.derivativeContainers["adjective"].x = backgroundPosition.x + (backgroundPosition.width / 2.3);
          $scope.derivativeContainers["adjective"].y = backgroundPosition.y + (backgroundPosition.height / 2);
          $scope.stage.addChild($scope.derivativeContainers["adjective"]);

          $scope.derivativeContainers["adjective"].subContainers = {};

          var adjectiveTitle = new createjs.Text("ADJECTIVE", "17px Arial", "red");
          adjectiveTitle.x = $scope.derivativeContainers["adjective"].width / 2;
          adjectiveTitle.y = 0;
          adjectiveTitle.textBaseline = "top";
          adjectiveTitle.textAlign = "center";
          $scope.derivativeContainers["adjective"].addChild(adjectiveTitle);

          $scope.derivativesBackgrounds = {};
          _.each($scope.derivativeContainers, function (container, key, list) {
            $scope.derivativeContainers[key].subContainers["buttons"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["buttons"].width = $scope.derivativeContainers[key].width / 5;
            $scope.derivativeContainers[key].subContainers["buttons"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["buttons"].x = 0;
            $scope.derivativeContainers[key].subContainers["buttons"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["buttons"]);

            $scope.derivativeContainers[key].subContainers["index"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["index"].width = $scope.derivativeContainers[key].width / 11;
            $scope.derivativeContainers[key].subContainers["index"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["index"].x = $scope.derivativeContainers[key].subContainers["buttons"].width;
            $scope.derivativeContainers[key].subContainers["index"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["index"]);

            $scope.derivativeContainers[key].subContainers["english"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["english"].width = $scope.derivativeContainers[key].width / 3;
            $scope.derivativeContainers[key].subContainers["english"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["english"].x = $scope.derivativeContainers[key].subContainers["buttons"].width + $scope.derivativeContainers[key].subContainers["index"].width;
            $scope.derivativeContainers[key].subContainers["english"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["english"]);

            $scope.derivativeContainers[key].subContainers["greek"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["greek"].width = $scope.derivativeContainers[key].width / 3;
            $scope.derivativeContainers[key].subContainers["greek"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["greek"].x = $scope.derivativeContainers[key].subContainers["buttons"].width
              + $scope.derivativeContainers[key].subContainers["index"].width + $scope.derivativeContainers[key].subContainers["english"].width;

            $scope.derivativeContainers[key].subContainers["greek"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["greek"]);

            $scope.derivativeContainers[key].subContainers["buttons"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["index"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["english"].rowContainers = {};
            $scope.derivativeContainers[key].subContainers["greek"].rowContainers = {};

            $scope.derivativesBackgrounds[key] = {};
            $scope.derivativesBackgrounds[key].indexBackground = {};
            $scope.derivativesBackgrounds[key].englishBackground = {};
            $scope.derivativesBackgrounds[key].greekBackground = {};

            _.each(_.filter($scope.activityData.derivatives, {type: key}), function (derivative, k, list) {

              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["buttons"].width;
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].x = 0;
              $scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k].y = (k + 1) * 30;
              $scope.derivativeContainers[key].subContainers["buttons"].addChild($scope.derivativeContainers[key].subContainers["buttons"].rowContainers[k]);
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["index"].width;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].x = 0;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].y = (k + 1) * 30;
              $scope.derivativeContainers[key].subContainers["index"].addChild($scope.derivativeContainers[key].subContainers["index"].rowContainers[k]);

              var graphicsIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].indexBackground[k] = new createjs.Shape(graphicsIndex);
              $scope.derivativesBackgrounds[key].indexBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["index"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].indexBackground[k]);
              $scope.derivativesBackgrounds[key].indexBackground[k].visible = false;

              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["english"].width;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].x = 0;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].y = (k + 1) * 30;
              $scope.derivativeContainers[key].subContainers["english"].addChild($scope.derivativeContainers[key].subContainers["english"].rowContainers[k]);

              var englishIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].englishBackground[k] = new createjs.Shape(englishIndex);
              $scope.derivativesBackgrounds[key].englishBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["english"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].englishBackground[k]);
              $scope.derivativesBackgrounds[key].englishBackground[k].visible = false;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].width = $scope.derivativeContainers[key].subContainers["greek"].width;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].height = 30;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].x = 0;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].y = (k + 1) * 30;
              $scope.derivativeContainers[key].subContainers["greek"].addChild($scope.derivativeContainers[key].subContainers["greek"].rowContainers[k]);

              var greekIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].width, 30);
              $scope.derivativesBackgrounds[key].greekBackground[k] = new createjs.Shape(greekIndex);
              $scope.derivativesBackgrounds[key].greekBackground[k].alpha = 0.5;
              $scope.derivativeContainers[key].subContainers["greek"].rowContainers[k].addChild($scope.derivativesBackgrounds[key].greekBackground[k]);
              $scope.derivativesBackgrounds[key].greekBackground[k].visible = false;
            });
          });//end of each for creating derivatives container


          parallelCallback();
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

          if (vocabularySection === "words") {

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

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
            function (buttonsSpriteSheetCallback) {

              /*English Button*/
              $http.get($rootScope.rootDir + "data/assets/vocabulary_english_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_greek_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_play_small_button_sprite.json")
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

              /*Iterating and populating the container*/
              _.each($scope.activityData.words, function (word, key, list) {

                /********************* Creating English button *********************/
                var enSmallButton = new createjs.Sprite($scope.enSmallButtonSpriteSheet, "normal");

                enSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  enSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                enSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  enSmallButton.gotoAndPlay("normal");
                  $scope.englishWordsBitmaps[word.name].visible = !$scope.englishWordsBitmaps[word.name].visible;
                });

                enSmallButton.x = enSmallButton.getBounds().width / 2;
                enSmallButton.y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

                console.log("getBounds: ", enSmallButton.getBounds());

                /*********************Creating Greek button*********************/
                var grSmallButton = new createjs.Sprite($scope.grSmallButtonSpriteSheet, "normal");

                grSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  grSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                grSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  grSmallButton.gotoAndPlay("normal");
                  $scope.greekWordsBitmaps[word.name].visible = !$scope.greekWordsBitmaps[word.name].visible;

                });

                grSmallButton.x = $scope.buttonsContainer.buttonsSubContainers[word.name].width / 2;
                grSmallButton.y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

                /********************* Creating Play button *********************/
                var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
                playSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  playSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                playSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  playSmallButton.gotoAndPlay("normal");
                  console.log("Playing sound: ", event);
                  /*playingSound()*/
                  console.log("Playing sound for element with word.name: " + word.name + " and key:", key);

                  var elementIndex = _.findIndex($scope.activityData.words, {name: word.name});
                  console.log("The selected element index: ", elementIndex);

                  /** MAKE SHAPES VISIBLE AGAIN **/

                });

                playSmallButton.x = $scope.buttonsContainer.buttonsSubContainers[word.name].width - playSmallButton.getBounds().width / 2;
                playSmallButton.y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

                $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(enSmallButton);
                $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(grSmallButton);
                $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(playSmallButton);
                $scope.stage.update();

              });
            }
          });//End of waterfall
        }//End of loadButtons function


        /*LOAD INDEXES*/
        function loadIndexes() {

          _.each($scope.activityData.words, function (word, key, list) {

            var wordIndex = new createjs.Text(key + 1 + ".", "15px Arial", "black");

            wordIndex.x = $scope.indexContainer.indexSubContainers[word.name].width / 2;
            wordIndex.y = $scope.indexContainer.indexSubContainers[word.name].height / 2;
            wordIndex.textBaseline = "middle";
            wordIndex.textAlign = "center";

            /* wordIndex.maxWidth = $scope.indexContainer.width;*/

            $scope.indexContainer.indexSubContainers[word.name].addChild(wordIndex);
            $scope.stage.update();

          });

        }//End of loadIndexes function


        /*LOAD ENGLISH WORDS*/
        function loadEnglishWords() {

          $scope.englishWordsBitmaps = {};

          /*Iterating and populating the container*/
          _.each($scope.activityData.words, function (word, key, list) {

            $scope.englishWordsBitmaps[word.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + ".png");

            $scope.englishWordsBitmaps[word.name].x = 0;
            $scope.englishWordsBitmaps[word.name].y = $scope.englishWordsContainer.englishSubContainers[word.name].height / 1.5;
            $scope.englishWordsBitmaps[word.name].regY = $scope.englishWordsContainer.englishSubContainers[word.name].height / 2;
            $scope.englishWordsContainer.englishSubContainers[word.name].addChild($scope.englishWordsBitmaps[word.name]);
            $scope.stage.update();

          });
        }//End of loadEnglishWords function


        /*LOAD EQUALS*/
        function loadEquals() {

          _.each($scope.activityData.words, function (word, key, list) {

            var equals = new createjs.Text("=", "15px Arial", "black");

            equals.x = $scope.equalsSignContainer.equalsSubContainers[word.name].width / 2;
            equals.y = $scope.equalsSignContainer.equalsSubContainers[word.name].height / 2;
            equals.textBaseline = "middle";
            equals.textAlign = "center";
            equals.maxWidth = $scope.equalsSignContainer.width;

            $scope.equalsSignContainer.equalsSubContainers[word.name].addChild(equals);
            $scope.stage.update();
          });

        }//End of loadIndexes function


        /*LOAD GREEK WORDS*/
        function loadGreekWords() {

          $scope.greekWordsBitmaps = {};

          /*Iterating and populating the container*/
          _.each($scope.activityData.words, function (word, key, list) {

            $scope.greekWordsBitmaps[word.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + "_gr.png");
            $scope.greekWordsBitmaps[word.name].x = 0;
            $scope.greekWordsBitmaps[word.name].y = $scope.greekWordsContainer.greekWordsSubContainers[word.name].height / 1.5;
            $scope.greekWordsBitmaps[word.name].regY = $scope.greekWordsContainer.greekWordsSubContainers[word.name].height / 2;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].addChild($scope.greekWordsBitmaps[word.name]);
            $scope.stage.update();
          });
        }//End of loadGreekWords function


        /********************************** POPULATING PHRASES CONTAINERS **********************************/

        /*LOAD PHRASES BUTTONS*/
        function loadPhrasesButtons() {

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
            function (buttonsSpriteSheetCallback) {

              /*English Button*/
              $http.get($rootScope.rootDir + "data/assets/vocabulary_english_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_greek_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_play_small_button_sprite.json")
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

              /*Iterating and populating the container*/
              _.each($scope.activityData.phrases, function (phrase, key, list) {

                /********************* Creating English button *********************/
                var enSmallButton = new createjs.Sprite($scope.enSmallButtonSpriteSheet, "normal");

                enSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  enSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                enSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  enSmallButton.gotoAndPlay("normal");
                  $scope.englishPhrasesBitmaps[phrase.name].visible = !$scope.englishPhrasesBitmaps[phrase.name].visible;
                });

                enSmallButton.x = enSmallButton.getBounds().width / 2;
                enSmallButton.y = $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].height / 2;

                console.log("getBounds: ", enSmallButton.getBounds());

                /*********************Creating Greek button*********************/
                var grSmallButton = new createjs.Sprite($scope.grSmallButtonSpriteSheet, "normal");

                grSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  grSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                grSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  grSmallButton.gotoAndPlay("normal");
                  $scope.greekPhrasesBitmaps[phrase.name].visible = !$scope.greekPhrasesBitmaps[phrase.name].visible;

                });

                grSmallButton.x = $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].width / 2;
                grSmallButton.y = $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].height / 2;

                /********************* Creating Play button *********************/
                var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
                playSmallButton.addEventListener("mousedown", function (event) {
                  console.log("Mouse down event on a button !");
                  playSmallButton.gotoAndPlay("onSelection");
                  $scope.stage.update();
                });

                playSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  playSmallButton.gotoAndPlay("normal");
                  console.log("Playing sound: ", event);
                  /*playingSound()*/
                  console.log("Playing sound for element with phrase.name: " + phrase.name + " and key:", key);

                  var elementIndex = _.findIndex($scope.activityData.phrases, {name: phrase.name});
                  console.log("The selected element index: ", elementIndex);

                  /** MAKE SHAPES VISIBLE AGAIN **/

                });

                playSmallButton.x = $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].width - playSmallButton.getBounds().width / 2;
                playSmallButton.y = $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].height / 2;

                $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].addChild(enSmallButton);
                $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].addChild(grSmallButton);
                $scope.buttonsPhrasesContainer.buttonsPhrasesSubContainers[phrase.name].addChild(playSmallButton);
                $scope.stage.update();

              });
            }
          });//End of waterfall
        }//End of loadPhrasesButtons function


        /*LOAD PHRASES INDEXES*/
        function loadPhrasesIndexes() {

          /*Initializing y that will change dynamically for every button*/

          _.each($scope.activityData.phrases, function (phrase, key, list) {

            var phraseIndex = new createjs.Text(key + 1 + ".", "18px Arial", "black");

            phraseIndex.x = $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].width / 2;
            phraseIndex.y = $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].height / 2;
            phraseIndex.textBaseline = "middle";
            phraseIndex.textAlign = "center";

            $scope.indexPhrasesContainer.indexPhrasesSubContainers[phrase.name].addChild(phraseIndex);
            $scope.stage.update();

          });

        }//End of loadPhrasesIndexes function


        /*LOAD ENGLISH PHRASES*/
        function loadEnglishPhrases() {

          /*Initializing y that will change dynamically for every button*/
          $scope.englishPhrasesBitmaps = {};
          /*Iterating and populating the container*/
          _.each($scope.activityData.phrases, function (phrase, key, list) {

            $scope.englishPhrasesBitmaps[phrase.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + phrase.name + ".png");

            $scope.englishPhrasesBitmaps[phrase.name].x = 0;
            $scope.englishPhrasesBitmaps[phrase.name].y = $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].height / 1.5;
            $scope.englishPhrasesBitmaps[phrase.name].regY = $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].height / 2;
            $scope.englishPhrasesContainer.englishPhrasesSubContainers[phrase.name].addChild($scope.englishPhrasesBitmaps[phrase.name]);
            $scope.stage.update();
          });
        }//End of loadEnglishPhrases function


        /*LOAD PHRASES EQUALS*/
        function loadPhrasesEquals() {

          _.each($scope.activityData.phrases, function (phrase, key, list) {

            var equals = new createjs.Text("=", "15px Arial", "black");

            equals.x = $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].width / 2;
            equals.y = $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].height / 2;
            equals.textBaseline = "middle";
            equals.textAlign = "center";

            $scope.equalsSignPhrasesContainer.equalsPhrasesSubContainers[phrase.name].addChild(equals);
            $scope.stage.update();

          });

        }//End of loadPhrasesEquals function


        /*LOAD GREEK PHRASES*/
        function loadGreekPhrases() {

          $scope.greekPhrasesBitmaps = {};

          /*Iterating and populating the container*/
          _.each($scope.activityData.phrases, function (phrase, key, list) {

            $scope.greekPhrasesBitmaps[phrase.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + phrase.name + "_gr.png");

            $scope.greekPhrasesBitmaps[phrase.name].x = 0;
            $scope.greekPhrasesBitmaps[phrase.name].y = $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].height / 1.5;
            $scope.greekPhrasesBitmaps[phrase.name].regY = $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].height / 2;
            $scope.greekPhrasesContainer.greekPhrasesSubContainers[phrase.name].addChild($scope.greekPhrasesBitmaps[phrase.name]);
            $scope.stage.update();

          });
        }//End of loadGreekPhrases function


        /********************************** POPULATING DERIVATIVES CONTAINERS **********************************/

        /*LOAD DERIVATIVES BUTTONS*/
        function loadDerivativesButtons() {

          /*Initializing SpriteSheet instances using waterfall*/
          async.waterfall([
            function (buttonsSpriteSheetCallback) {

              /*English Button*/
              $http.get($rootScope.rootDir + "data/assets/vocabulary_english_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_greek_small_button_sprite.json")
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
              $http.get($rootScope.rootDir + "data/assets/vocabulary_play_small_button_sprite.json")
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
                  $scope.stage.update();
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
                  $scope.stage.update();
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
                  $scope.stage.update();
                });

                playSmallButton.addEventListener("pressup", function (event) {
                  console.log("Press up event!");
                  playSmallButton.gotoAndPlay("normal");
                  console.log("Playing sound: ", event);
                  console.log("Playing sound for element with derivative.type: " + derivative.type + " and key:", key);

                  var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: derivative.type}), {name: $scope.activityData.derivatives[key].name});

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
                  $scope.stage.update();
                  verbsIndex++;
                } else if (derivative.type === 'nouns') {
                  console.log("$scope.derivativeContainers['nouns'].subContainers.rowContainers: ", $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['nouns'].subContainers["buttons"].rowContainers[nounsIndex].addChild(playSmallButton);
                  $scope.stage.update();
                  nounsIndex++;
                } else if (derivative.type === 'noun') {
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['noun'].subContainers["buttons"].rowContainers[nounIndex].addChild(playSmallButton);
                  $scope.stage.update();
                  nounIndex++;
                } else {
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(enSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(grSmallButton);
                  $scope.derivativeContainers['adjective'].subContainers["buttons"].rowContainers[adjectiveIndex].addChild(playSmallButton);
                  $scope.stage.update();
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
              $scope.stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["index"].rowContainers[nounsIndex].addChild(derivativeIndex);
              $scope.stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["index"].rowContainers[nounIndex].addChild(derivativeIndex);
              $scope.stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["index"].rowContainers[adjectiveIndex].addChild(derivativeIndex);
              $scope.stage.update();
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

            $scope.englishDerivativesBitmaps[derivative.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + ".png");

            $scope.englishDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[0].height / 2;
            $scope.englishDerivativesBitmaps[derivative.name].x = 0;
            $scope.englishDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[0].height / 1.5;

            /*Resolving on which container should be added*/
            if (derivative.type === 'verbs') {
              $scope.derivativeContainers['verbs'].subContainers["english"].rowContainers[verbsIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["english"].rowContainers[nounsIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["english"].rowContainers[nounIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["english"].rowContainers[adjectiveIndex].addChild($scope.englishDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
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

            $scope.greekDerivativesBitmaps[derivative.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + "_gr.png");

            $scope.greekDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[0].height / 2;
            $scope.greekDerivativesBitmaps[derivative.name].x = 0;
            $scope.greekDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[0].height / 1.5;

            /*Resolving on which container should be added*/
            if (derivative.type === 'verbs') {
              $scope.derivativeContainers['verbs'].subContainers["greek"].rowContainers[verbsIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              verbsIndex++;
            } else if (derivative.type === 'nouns') {
              $scope.derivativeContainers['nouns'].subContainers["greek"].rowContainers[nounsIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              nounsIndex++;
            } else if (derivative.type === 'noun') {
              $scope.derivativeContainers['noun'].subContainers["greek"].rowContainers[nounIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
              nounIndex++;
            } else {
              $scope.derivativeContainers['adjective'].subContainers["greek"].rowContainers[adjectiveIndex].addChild($scope.greekDerivativesBitmaps[derivative.name]);
              $scope.stage.update();
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
              $scope.stage.update();
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

            $scope.stage.addChild($scope.bigPauseButton);
            $scope.stage.update();

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
              $scope.stage.update();
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

            $scope.stage.addChild($scope.bigStopButton);
            $scope.stage.update();

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
              $scope.stage.update();
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

            $scope.stage.addChild($scope.bigPlayButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for bigPlayButton button...", error);
          });//end of get bigPlay button


        /* WORDS BUTTON */
        $http.get($rootScope.rootDir + "data/assets/vocabulary_words_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var wordsButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordsButton = new createjs.Sprite(wordsButtonSpriteSheet, "normal");

            $scope.wordsButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.wordsButton.gotoAndPlay("onSelection");
              $scope.stage.update();
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

            $scope.stage.addChild($scope.wordsButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for words button...", error);
          });//end of get words button


        /* PHRASES BUTTON */
        $http.get($rootScope.rootDir + "data/assets/vocabulary_phrases_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var phrasesButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.phrasesButton = new createjs.Sprite(phrasesButtonSpriteSheet, "normal");

            $scope.phrasesButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.phrasesButton.gotoAndPlay("onSelection");
              $scope.stage.update();
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

            $scope.stage.addChild($scope.phrasesButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for phrases button...", error);
          });//end of get phrases button


        /* DERIVATIVES BUTTON */
        $http.get($rootScope.rootDir + "data/assets/vocabulary_derivatives_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var derivativesButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.derivativesButton = new createjs.Sprite(derivativesButtonSpriteSheet, "normal");

            $scope.derivativesButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              $scope.derivativesButton.gotoAndPlay("onSelection");
              $scope.stage.update();
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

            $scope.stage.addChild($scope.derivativesButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for derivatives button...", error);
          });//end of get derivatives button


        /* BIG ENGLISH BUTTON */
        $http.get($rootScope.rootDir + "data/assets/vocabulary_english_big_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var englishBigButtonSpriteSheet = new createjs.SpriteSheet(response);
            var englishBigButton = new createjs.Sprite(englishBigButtonSpriteSheet, "normal");

            englishBigButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on big English button!");
              englishBigButton.gotoAndPlay("onSelection");
              $scope.stage.update();
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
                  $scope.stage.update();

                } else {

                  console.log("Making all english words visible again...");
                  _.each($scope.activityData.words, function (word, key, list) {
                    $scope.englishWordsBitmaps[word.name].visible = true;
                  });
                  englishBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              } else if ($scope.selectedVocabularySection === 'phrases') {
                if ($scope.englishPhrasesBitmaps[$scope.activityData.phrases[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.phrases, function (phrase, key, list) {

                    $scope.englishPhrasesBitmaps[phrase.name].visible = false;
                  });

                  englishBigButton.gotoAndPlay("selected");
                  $scope.stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.phrases, function (phrase, key, list) {
                    $scope.englishPhrasesBitmaps[phrase.name].visible = true;
                  });
                  englishBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              } else {
                if ($scope.englishDerivativesBitmaps[$scope.activityData.derivatives[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {

                    $scope.englishDerivativesBitmaps[derivative.name].visible = false;
                  });

                  englishBigButton.gotoAndPlay("selected");
                  $scope.stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {
                    $scope.englishDerivativesBitmaps[derivative.name].visible = true;
                  });
                  englishBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              }

            });

            englishBigButton.scaleX = englishBigButton.scaleY = scale;
            englishBigButton.x = backgroundPosition.x + (backgroundPosition.width / 1.17);
            englishBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
            /*englishBigButton.y = -englishBigButton.getTransformedBounds().height / 5;*/

            $scope.stage.addChild(englishBigButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for english big button...", error);
          });//end of get english big button


        /* BIG GREEK BUTTON */
        $http.get($rootScope.rootDir + "data/assets/vocabulary_greek_big_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
            var greekBigButtonSpriteSheet = new createjs.SpriteSheet(response);
            var greekBigButton = new createjs.Sprite(greekBigButtonSpriteSheet, "normal");

            greekBigButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              greekBigButton.gotoAndPlay("onSelection");
              $scope.stage.update();
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
                  $scope.stage.update();

                } else {

                  console.log("Making all greek words visible again...");
                  _.each($scope.activityData.words, function (word, key, list) {
                    $scope.greekWordsBitmaps[word.name].visible = true;
                  });
                  greekBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              } else if ($scope.selectedVocabularySection === 'phrases') {
                if ($scope.greekPhrasesBitmaps[$scope.activityData.phrases[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.phrases, function (phrase, key, list) {

                    $scope.greekPhrasesBitmaps[phrase.name].visible = false;
                  });

                  greekBigButton.gotoAndPlay("selected");
                  $scope.stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.phrases, function (phrase, key, list) {
                    $scope.greekPhrasesBitmaps[phrase.name].visible = true;
                  });
                  greekBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              } else {
                if ($scope.greekDerivativesBitmaps[$scope.activityData.derivatives[0].name].visible === true) {

                  console.log("Hiding all english phrases...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {

                    $scope.greekDerivativesBitmaps[derivative.name].visible = false;
                  });

                  greekBigButton.gotoAndPlay("selected");
                  $scope.stage.update();

                } else {

                  console.log("Making all english phrases visible again...");
                  _.each($scope.activityData.derivatives, function (derivative, key, list) {
                    $scope.greekDerivativesBitmaps[derivative.name].visible = true;
                  });
                  greekBigButton.gotoAndPlay("normal");
                  $scope.stage.update();
                }
              }


            });

            greekBigButton.scaleX = greekBigButton.scaleY = scale;
            greekBigButton.x = backgroundPosition.x + (backgroundPosition.width / 1.08);
            greekBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
            /*greekBigButton.y = -greekBigButton.getTransformedBounds().height / 5;*/

            $scope.stage.addChild(greekBigButton);
            $scope.stage.update();

          })
          .error(function (error) {
            console.error("Error on getting json for greek big button...", error);
          });//end of get greek button


        $scope.playAllSounds = function () {


        }


      });//end of image on complete
    }, 500);//end of timeout
  });

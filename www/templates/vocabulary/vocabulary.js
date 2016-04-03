angular.module("bookbuilder2")
  .controller("VocabularyController", function ($scope, $ionicLoading, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

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

      var activityNameInLocalStorage = $rootScope.selectedLesson.id + "_vocabulary";

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

            async.waterfall([function (waterfallCall) {
              if (window.localStorage.getItem(activityNameInLocalStorage)) {
                $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));

                $scope.activityData.attempts = $scope.activityData.attempts + 1;
                window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                waterfallCall();
              } else {

                $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/vocabulary.json")
                  .success(function (response) {

                    $scope.activityData = response;
                    $scope.activityData.attempts = 1;
                    window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                    waterfallCall();
                  })
                  .error(function (error) {
                    console.error("Error on getting json for results button...", error);
                  });//end of get menu button

              }
            }, function (waterfallCall) {

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

                  });

                  $scope.bigPauseButton.addEventListener("pressup", function (event) {
                    console.log("Press up event!");
                    $scope.bigPauseButton.visible = false;
                    $scope.bigStopButton.visible = false;
                    $scope.bigPauseButton.gotoAndPlay("normal");
                    $scope.playAll = false;
                    $scope.stage.update();
                  });

                  $scope.bigPauseButton.scaleX = $scope.bigPauseButton.scaleY = scale;
                  $scope.bigPauseButton.x = backgroundPosition.x + (backgroundPosition.width / 12);
                  $scope.bigPauseButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                  $scope.stage.addChild($scope.bigPauseButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigPauseButton button...", error);
                  waterfallCall();

                });//end of get bigPause button
            }, function (waterfallCall) {

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
                    $scope.bigPauseButton.visible = false;
                    $scope.bigStopButton.visible = false;
                    $scope.bigStopButton.gotoAndPlay("normal");
                    $scope.currentWord = $scope.activityData[$scope.selectedVocabularySection][0].name;
                    $scope.playAll = false;
                    $scope.stage.update();
                  });

                  $scope.bigStopButton.scaleX = $scope.bigStopButton.scaleY = scale;
                  $scope.bigStopButton.x = backgroundPosition.x + (backgroundPosition.width / 8);
                  $scope.bigStopButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                  $scope.stage.addChild($scope.bigStopButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigStopButton button...", error);
                  waterfallCall();

                });//end of get bigStop button
            }, function (waterfallCall) {

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
                    $scope.playAll = true;

                    if ($scope.selectedVocabularySection === "derivatives") {
                      playDerivativeSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                        name: $scope.currentWord
                      })]);
                    } else {
                      playWordSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                        name: $scope.currentWord
                      })]);
                    }
                    $scope.stage.update();
                  });

                  $scope.bigPlayButton.scaleX = $scope.bigPlayButton.scaleY = scale;
                  $scope.bigPlayButton.x = backgroundPosition.x + (backgroundPosition.width / 10);
                  $scope.bigPlayButton.y = backgroundPosition.y + (backgroundPosition.height / 1.06);
                  $scope.stage.addChild($scope.bigPlayButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigPlayButton button...", error);
                  waterfallCall();

                });//end of get bigPlay button

            }, function (waterfallCall) {

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
                    $scope.stage.update();
                  });

                  $scope.wordsButton.scaleX = $scope.wordsButton.scaleY = scale * 0.7;
                  $scope.wordsButton.x = backgroundPosition.x + (backgroundPosition.width / 2.5);
                  $scope.wordsButton.y = backgroundPosition.y + (backgroundPosition.height / 1.07);
                  $scope.stage.addChild($scope.wordsButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for words button...", error);
                  waterfallCall();

                });//end of get words button


            }, function (waterfallCall) {


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
                    $scope.stage.update();
                  });

                  $scope.phrasesButton.scaleX = $scope.phrasesButton.scaleY = scale * 0.7;
                  $scope.phrasesButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
                  $scope.phrasesButton.y = backgroundPosition.y + (backgroundPosition.height / 1.07);
                  $scope.stage.addChild($scope.phrasesButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for phrases button...", error);
                  waterfallCall();

                });//end of get phrases button
            }, function (waterfallCall) {

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
                    $scope.stage.update();
                  });

                  $scope.derivativesButton.scaleX = $scope.derivativesButton.scaleY = scale * 0.7;
                  $scope.derivativesButton.x = backgroundPosition.x + (backgroundPosition.width / 1.67);
                  $scope.derivativesButton.y = backgroundPosition.y + (backgroundPosition.height / 1.07);
                  $scope.stage.addChild($scope.derivativesButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for derivatives button...", error);
                  waterfallCall();

                });//end of get derivatives button


            }, function (waterfallCall) {
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

                    if ($scope.selectedVocabularySection === 'words' || $scope.selectedVocabularySection === 'phrases') {
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
                  $scope.stage.addChild(englishBigButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for english big button...", error);
                  waterfallCall();

                });//end of get english big button


            }, function (waterfallCall) {


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

                    if ($scope.selectedVocabularySection === 'words' || $scope.selectedVocabularySection === 'phrases') {
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
                  $scope.stage.addChild(greekBigButton);
                  waterfallCall();
                })
                .error(function (error) {
                  console.error("Error on getting json for greek big button...", error);
                  waterfallCall();

                });//end of get greek butt§on
            }], function (err, result) {
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

                          if (tab === "words" || tab === "phrases") {
                            $scope.indexContainer.indexSubContainers[word.name].indexBackground.visible = false;
                            $scope.indexContainer.indexSubContainers[word.name].englishBackground.visible = false;
                            $scope.indexContainer.indexSubContainers[word.name].greekBackground.visible = false;
                          } else {
                            var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: word.type}), {name: $scope.activityData.derivatives[key].name});
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].indexBackground[elementIndex].visible = false;
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].englishBackground[elementIndex].visible = false;
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].greekBackground[elementIndex].visible = false;
                          }


                          console.log("Sound success");

                          if ($scope.playAll && _.findWhere($scope.activityData[$scope.selectedVocabularySection], {
                              name: $scope.currentWord
                            })) {
                            if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                name: $scope.currentWord
                              }) < $scope.activityData[$scope.selectedVocabularySection].length - 1) {

                              console.log("$scope.activityData[$scope.selectedVocabularySection].length", $scope.activityData[$scope.selectedVocabularySection].length);
                              console.log("current word ", $scope.currentWord + " index:" + _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }));

                              console.log("next word:" + $scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1].name);

                              if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) > 18) {
                                $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.mainContainer.height;
                              } else {
                                $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                              }

                              if ($scope.selectedVocabularySection === "derivatives") {
                                playDerivativeSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1]);
                              } else {
                                playWordSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1]);
                              }

                            } else {
                              console.log("This is the last sound from the section ", $scope.selectedVocabularySection);
                              $scope.bigPauseButton.visible = false;
                              $scope.bigStopButton.visible = false;
                              $scope.bigPlayButton.visible = true;
                              $scope.bigStopButton.gotoAndPlay("normal");
                              $scope.currentWord = $scope.activityData[$scope.selectedVocabularySection][0].name;
                              $scope.playAll = false;
                              $scope.stage.update();

                            }

                          } else {
                            $scope.bigPauseButton.visible = false;
                            $scope.bigStopButton.visible = false;
                            $scope.bigPlayButton.visible = true;
                          }
                        }, function (err) {
                          console.log("Sound error: ", err);
                        }, function (status) {

                          if (status === 1) {
                            $scope.activityData[tab][key].soundWasPlayed = true;
                            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                          }
                          checkIfAllSoundsWerePlayed();

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

                          if (tab === "words" || tab === "phrases") {
                            $scope.indexContainer.indexSubContainers[word.name].indexBackground.visible = false;
                            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.visible = false;
                            $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground.visible = false;
                          } else {
                            var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: word.type}), {name: $scope.activityData.derivatives[key].name});
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].indexBackground[elementIndex].visible = false;
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].englishBackground[elementIndex].visible = false;
                            $scope.derivativesBackgrounds[$scope.quartiles[word.type]].greekBackground[elementIndex].visible = false;
                          }
                          if ($scope.playAll && _.findWhere($scope.activityData[$scope.selectedVocabularySection], {
                              name: $scope.currentWord
                            })) {
                            if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                name: $scope.currentWord
                              }) < $scope.activityData[$scope.selectedVocabularySection].length - 1) {

                              console.log("$scope.activityData[$scope.selectedVocabularySection].length", $scope.activityData[$scope.selectedVocabularySection].length);
                              console.log("current word ", $scope.currentWord + " index:" + _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }));

                              console.log("next word:" + $scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1].name);

                              if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) > 19) {
                                $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.mainContainer.height;
                              } else {
                                $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                              }

                              if ($scope.selectedVocabularySection === "derivatives") {
                                playDerivativeSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1]);
                              } else {
                                playWordSound($scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                                  name: $scope.currentWord
                                }) + 1]);
                              }

                            } else {
                              console.log("This is the last sound from the section ", $scope.selectedVocabularySection);
                              $scope.bigPauseButton.visible = false;
                              $scope.bigStopButton.visible = false;
                              $scope.bigPlayButton.visible = true;
                              $scope.bigStopButton.gotoAndPlay("normal");
                              $scope.currentWord = $scope.activityData[$scope.selectedVocabularySection][0].name;
                              $scope.playAll = false;
                              $scope.stage.update();

                            }
                          } else {
                            $scope.bigPauseButton.visible = false;
                            $scope.bigStopButton.visible = false;
                            $scope.bigPlayButton.visible = true;
                          }

                        }, function (err) {
                          console.log("Sound error", err);
                        }, function (status) {
                          console.log("Sound status", status);
                          if (status === 1) {
                            if (status === 1) {
                              $scope.activityData[tab][key].soundWasPlayed = true;
                              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                            }
                          }
                          checkIfAllSoundsWerePlayed();
                        });
                      }

                      waterfallCallback();
                    }
                  });
                });
              });

              $scope.wordContainersHeight = 25;
              $scope.playAll = false;
              $scope.currentWord = "";

              async.waterfall([function (parallelCallback) {
                async.waterfall([
                  function (buttonsSpriteSheetCallback) {

                    var loadingBitmaps = [];
                    _.each(["vocabulary_scroll_up.png", "vocabulary_scroll_down.png"], function (file, key, list) {

                      loadingBitmaps.push(function (seriesCallback) {
                        var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                          src: $rootScope.rootDir + "data/assets/" + file
                        }));

                        imageLoader.load();

                        imageLoader.on("complete", function (r) {
                          console.log("file", file);
                          $timeout(function () {
                            seriesCallback();
                          });
                        });
                      });
                    });

                    _.each($scope.activityData, function (tabWords, tab, list) {
                      _.each(tabWords, function (word, key, list) {

                        loadingBitmaps.push(function (seriesCallback) {
                          var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                            src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + ".png"
                          }));

                          imageLoader.load();

                          imageLoader.on("complete", function (r) {
                            console.log("file", word.name);
                            $timeout(function () {
                              seriesCallback();
                            });
                          });
                        });

                      });
                    });


                    _.each($scope.activityData, function (tabWords, tab, list) {
                      _.each(tabWords, function (word, key, list) {

                        loadingBitmaps.push(function (seriesCallback) {
                          var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                            src: $rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + "_gr.png"
                          }));

                          imageLoader.load();

                          imageLoader.on("complete", function (r) {
                            console.log("file", word.name);
                            $timeout(function () {
                              seriesCallback();
                            });
                          });
                        });

                      });
                    });


                    async.parallelLimit(loadingBitmaps, 10, function (err, response) {

                      $scope.scrollDown = new createjs.Bitmap($rootScope.rootDir + "data/assets/vocabulary_scroll_down.png");
                      $scope.scrollDown.scaleX = $scope.scrollDown.scaleY = scale * 0.2;
                      $scope.scrollDown.x = backgroundPosition.x + backgroundPosition.width / 1.1;
                      $scope.scrollDown.y = backgroundPosition.y + (backgroundPosition.height / 1.3);
                      $scope.stage.addChild($scope.scrollDown);


                      $scope.scrollDown.addEventListener("mousedown", function (event) {
                        $scope.scrollDown.alpha = 0.5;
                        $scope.stage.update();
                      });


                      $scope.scrollDown.addEventListener("pressup", function (event) {
                        $scope.scrollDown.alpha = 1;
                        $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.mainContainer.height;
                        $scope.stage.update();
                      });

                      $scope.scrollUp = new createjs.Bitmap($rootScope.rootDir + "data/assets/vocabulary_scroll_up.png");
                      $scope.scrollUp.scaleX = $scope.scrollUp.scaleY = scale * 0.2;
                      $scope.scrollUp.x = backgroundPosition.x + backgroundPosition.width / 1.1;
                      $scope.scrollUp.y = backgroundPosition.y + (backgroundPosition.height / 7);
                      $scope.stage.addChild($scope.scrollUp);

                      $scope.scrollUp.addEventListener("mousedown", function (event) {
                        $scope.scrollUp.alpha = 0.5;
                        $scope.stage.update();
                      });

                      $scope.scrollUp.addEventListener("pressup", function (event) {
                        $scope.scrollUp.alpha = 1;
                        $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                        $scope.stage.update();
                      });

                      buttonsSpriteSheetCallback();

                    });
                  }, function (buttonsSpriteSheetCallback) {

                    /*English Button*/
                    $http.get($rootScope.rootDir + "data/assets/vocabulary_english_big_button_sprite.json")
                      .success(function (response) {
                        console.log("vocabulary_english_big_button_sprite");
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        $scope.enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                        buttonsSpriteSheetCallback();
                      })
                      .error(function (error) {
                        buttonsSpriteSheetCallback();
                      });
                  },
                  function (buttonsSpriteSheetCallback) {

                    /*Greek Button*/
                    $http.get($rootScope.rootDir + "data/assets/vocabulary_greek_big_button_sprite.json")
                      .success(function (response) {
                        console.log("Success on getting json data for greek button!");
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        $scope.grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);
                        buttonsSpriteSheetCallback();
                      })
                      .error(function (error) {
                        buttonsSpriteSheetCallback();
                      });
                  },
                  function (buttonsSpriteSheetCallback) {

                    /*Play Button*/
                    $http.get($rootScope.rootDir + "data/assets/vocabulary_play_big_button_sprite.json")
                      .success(function (response) {
                        response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                        $scope.playSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                        buttonsSpriteSheetCallback();
                      })
                      .error(function (error) {
                        buttonsSpriteSheetCallback();
                      });
                  }
                ], function (err, result) {
                  parallelCallback();
                });

              }, function (parallelCallback) {

                var title = new createjs.Text("Vocabulary", "27px Arial", "white");
                title.scaleX = title.scaleY = scale;
                title.x = backgroundPosition.x + (backgroundPosition.width / 1.4);
                title.y = backgroundPosition.y + (backgroundPosition.height / 15);
                title.textBaseline = "alphabetic";
                $scope.stage.addChild(title);

                var lessonTitle = new createjs.Text($rootScope.selectedLesson.lessonTitle, "27px Arial", "white");
                lessonTitle.scaleX = lessonTitle.scaleY = scale;
                lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 10);
                lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 15);
                lessonTitle.textBaseline = "alphabetic";
                lessonTitle.textAlign = "center";
                $scope.stage.addChild(lessonTitle);

                var descriptionText = new createjs.Text("Listen repeat and learn.", "18px Arial", "white");
                descriptionText.scaleX = descriptionText.scaleY = scale;
                descriptionText.x = backgroundPosition.x + (backgroundPosition.width / 1.4);
                descriptionText.y = backgroundPosition.y + (backgroundPosition.height / 8.7);
                descriptionText.textBaseline = "alphabetic";
                $scope.stage.addChild(descriptionText);

                $scope.mainContainer = new createjs.Container();
                $scope.mainContainer.width = background.image.width;
                $scope.mainContainer.height = background.image.height * 2;
                $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
                $scope.mainContainer.x = backgroundPosition.x;
                $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                $scope.stage.addChild($scope.mainContainer);

                var graphics = new createjs.Graphics().beginFill("red").drawRect(backgroundPosition.x, backgroundPosition.y + (backgroundPosition.height / 8), backgroundPosition.width, backgroundPosition.height * 0.73);
                var shape = new createjs.Shape(graphics);
                $scope.mainContainer.mask = shape;

                $timeout(function(){
                  parallelCallback();
                });
              }], function (err, response) {
                async.waterfall(waterFallFunctions, function (err, response) {
                  $scope.wordsButton.gotoAndPlay("selected");
                  loadPage("words");
                });
              });


            });

          })
          .error(function (error) {
            console.error("Error on getting json for menu button...", error);
          });//end of get menu button


        /********************************** CREATION OF CONTAINERS **********************************/


        function createSingleColumnContainers(wordsArray, parallelCallback) {
          if (wordsArray.length > 20) {
            $scope.scrollUp.visible = true;
            $scope.scrollDown.visible = true;
          } else {
            $scope.scrollUp.visible = false;
            $scope.scrollDown.visible = false;
          }

          $scope.mainContainer.removeAllChildren();
          console.log("$scope.mainContainer", $scope.mainContainer.numChildren);

          $scope.mainContainer.height = (wordsArray.length - 1 ) * $scope.wordContainersHeight;
          console.log("$scope.mainContainer.height", $scope.mainContainer.height)
          $scope.buttonsContainer = new createjs.Container();
          $scope.buttonsContainer.width = $scope.mainContainer.width / 6;
          $scope.buttonsContainer.height = $scope.mainContainer.height;
          $scope.mainContainer.addChild($scope.buttonsContainer);

          $scope.buttonsContainer.buttonsSubContainers = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.buttonsContainer.buttonsSubContainers[word.name] = new createjs.Container();
            $scope.buttonsContainer.buttonsSubContainers[word.name].width = $scope.buttonsContainer.width;
            $scope.buttonsContainer.buttonsSubContainers[word.name].height = $scope.wordContainersHeight;
            $scope.buttonsContainer.buttonsSubContainers[word.name].x = 0;
            $scope.buttonsContainer.buttonsSubContainers[word.name].y = key * $scope.wordContainersHeight;
            $scope.buttonsContainer.addChild($scope.buttonsContainer.buttonsSubContainers[word.name]);
          });

          $scope.indexContainer = new createjs.Container();
          $scope.indexContainer.width = $scope.mainContainer.width / 20;
          $scope.indexContainer.height = $scope.mainContainer.height;
          $scope.indexContainer.x = $scope.mainContainer.width / 8;
          $scope.mainContainer.addChild($scope.indexContainer);

          $scope.indexContainer.indexSubContainers = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.indexContainer.indexSubContainers[word.name] = new createjs.Container();
            $scope.indexContainer.indexSubContainers[word.name].width = $scope.indexContainer.width;
            $scope.indexContainer.indexSubContainers[word.name].height = $scope.wordContainersHeight;
            $scope.indexContainer.indexSubContainers[word.name].x = 0;
            $scope.indexContainer.indexSubContainers[word.name].y = key * $scope.wordContainersHeight;

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
          $scope.englishWordsContainer.width = $scope.mainContainer.width / 2.5;
          $scope.englishWordsContainer.height = $scope.mainContainer.height;
          $scope.englishWordsContainer.x = $scope.indexContainer.x + $scope.indexContainer.width;
          $scope.mainContainer.addChild($scope.englishWordsContainer);

          $scope.englishWordsContainer.englishSubContainers = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.englishWordsContainer.englishSubContainers[word.name] = new createjs.Container();
            $scope.englishWordsContainer.englishSubContainers[word.name].width = $scope.englishWordsContainer.width;
            $scope.englishWordsContainer.englishSubContainers[word.name].height = $scope.wordContainersHeight;
            $scope.englishWordsContainer.englishSubContainers[word.name].x = 0;
            $scope.englishWordsContainer.englishSubContainers[word.name].y = key * $scope.wordContainersHeight;
            var englishSubContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.englishWordsContainer.englishSubContainers[word.name].width,
              $scope.englishWordsContainer.englishSubContainers[word.name].height);
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground = new createjs.Shape(englishSubContainerGraphics);
            $scope.englishWordsContainer.englishSubContainers[word.name].addChild($scope.englishWordsContainer.englishSubContainers[word.name].englishBackground);
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.alpha = 0.5;
            $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.visible = false;
            $scope.englishWordsContainer.addChild($scope.englishWordsContainer.englishSubContainers[word.name]);
          });

          $scope.greekWordsContainer = new createjs.Container();
          $scope.greekWordsContainer.width = $scope.mainContainer.width / 2.5;
          $scope.greekWordsContainer.height = $scope.mainContainer.height;
          console.log("$scope.greekWordsContainer", $scope.greekWordsContainer);
          $scope.greekWordsContainer.x = $scope.indexContainer.x + $scope.indexContainer.width + $scope.englishWordsContainer.width;
          $scope.mainContainer.addChild($scope.greekWordsContainer);

          $scope.greekWordsContainer.greekWordsSubContainers = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.greekWordsContainer.greekWordsSubContainers[word.name] = new createjs.Container();
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].width = $scope.greekWordsContainer.width;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].height = $scope.wordContainersHeight;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].x = 0;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].y = key * $scope.wordContainersHeight;
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

        /*Creating multi-column template containers mainly for the Derivatives section*/
        function createMultiColumnContainers(wordsArray, parallelCallback) {

          $scope.scrollUp.visible = false;
          $scope.scrollDown.visible = false;
          $scope.mainContainer.removeAllChildren();
          /*var maxWordsInContainer = 0;
           _.each(_.countBy(wordsArray, 'type'), function (num, key, list) {
           if (maxWordsInContainer < num) {
           maxWordsInContainer = num;
           }
           });
           */

          $scope.mainContainer.height = (wordsArray.length + 1 ) * $scope.wordContainersHeight;
          $scope.derivativeContainers = {};
          $scope.derivativeContainers["q0"] = new createjs.Container();
          $scope.derivativeContainers["q0"].width = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q0"].height = $scope.mainContainer.height / 2;
          $scope.mainContainer.addChild($scope.derivativeContainers["q0"]);
          $scope.derivativeContainers["q0"].subContainers = {};

          $scope.derivativeContainers["q1"] = new createjs.Container();
          $scope.derivativeContainers["q1"].width = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q1"].height = $scope.mainContainer.height / 2;
          $scope.derivativeContainers["q1"].x = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q1"].y = 0;
          $scope.mainContainer.addChild($scope.derivativeContainers["q1"]);
          $scope.derivativeContainers["q1"].subContainers = {};

          $scope.derivativeContainers["q2"] = new createjs.Container();
          $scope.derivativeContainers["q2"].width = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q2"].height = $scope.mainContainer.height / 2;
          $scope.derivativeContainers["q2"].y = $scope.mainContainer.height / 2;
          $scope.mainContainer.addChild($scope.derivativeContainers["q2"]);
          $scope.derivativeContainers["q2"].subContainers = {};

          $scope.derivativeContainers["q3"] = new createjs.Container();
          $scope.derivativeContainers["q3"].width = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q3"].height = $scope.mainContainer.height / 2;
          $scope.derivativeContainers["q3"].x = $scope.mainContainer.width / 2;
          $scope.derivativeContainers["q3"].y = $scope.mainContainer.height / 2;
          $scope.mainContainer.addChild($scope.derivativeContainers["q3"]);
          $scope.derivativeContainers["q3"].subContainers = {};

          $scope.derivativesBackgrounds = {};
          _.each($scope.derivativeContainers, function (container, key, list) {
            $scope.derivativeContainers[key].subContainers["buttons"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["buttons"].width = $scope.derivativeContainers[key].width / 4.5;
            $scope.derivativeContainers[key].subContainers["buttons"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["buttons"]);

            $scope.derivativeContainers[key].subContainers["index"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["index"].width = $scope.derivativeContainers[key].width / 20;
            $scope.derivativeContainers[key].subContainers["index"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["index"].x = $scope.derivativeContainers[key].subContainers["buttons"].width;
            $scope.derivativeContainers[key].subContainers["index"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["index"]);

            $scope.derivativeContainers[key].subContainers["english"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["english"].width = $scope.derivativeContainers[key].width / 2.8;
            $scope.derivativeContainers[key].subContainers["english"].height = $scope.derivativeContainers[key].height;
            $scope.derivativeContainers[key].subContainers["english"].x = $scope.derivativeContainers[key].subContainers["buttons"].width + $scope.derivativeContainers[key].subContainers["index"].width;
            $scope.derivativeContainers[key].subContainers["english"].y = 0;
            $scope.derivativeContainers[key].addChild($scope.derivativeContainers[key].subContainers["english"]);

            $scope.derivativeContainers[key].subContainers["greek"] = new createjs.Container();
            $scope.derivativeContainers[key].subContainers["greek"].width = $scope.derivativeContainers[key].width / 2.7;
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

            _.each(_.filter(wordsArray, {
              type: _.findKey($scope.quartiles, function (value) {
                return value === key;
              })
            }), function (derivative, k, list) {

              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k].width = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].width;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k].height = $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k].x = 0;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k].y = (k + 1) * $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].addChild($scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[k]);
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].width = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].width;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].height = $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].x = 0;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].y = (k + 1) * $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].addChild($scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k]);

              var graphicsIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].width, $scope.wordContainersHeight);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].indexBackground[k] = new createjs.Shape(graphicsIndex);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].indexBackground[k].alpha = 0.5;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[k].addChild($scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].indexBackground[k]);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].indexBackground[k].visible = false;

              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].width = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].width;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].height = $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].x = 0;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].y = (k + 1) * $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].addChild($scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k]);

              var englishIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].width, $scope.wordContainersHeight);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].englishBackground[k] = new createjs.Shape(englishIndex);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].englishBackground[k].alpha = 0.5;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[k].addChild($scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].englishBackground[k]);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].englishBackground[k].visible = false;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k] = new createjs.Container();
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].width = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].width;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].height = $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].x = 0;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].y = (k + 1) * $scope.wordContainersHeight;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].addChild($scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k]);

              var greekIndex = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0, $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].width, $scope.wordContainersHeight);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].greekBackground[k] = new createjs.Shape(greekIndex);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].greekBackground[k].alpha = 0.5;
              $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[k].addChild($scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].greekBackground[k]);
              $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].greekBackground[k].visible = false;
            });
          });//end of each for creating derivatives container

          parallelCallback();
        }//End of creating multiple column containers function


        function loadPage(vocabularySection) {
          $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
          $scope.selectedVocabularySection = vocabularySection;
          $scope.playAll = false;
          $scope.currentWord = $scope.activityData[vocabularySection][0].name;

          $scope.bigPauseButton.visible = false;
          $scope.bigStopButton.visible = false;
          $scope.bigPlayButton.visible = true;
          $scope.bigStopButton.gotoAndPlay("normal");


          if ($scope.selectedVocabularySection === "words" || $scope.selectedVocabularySection === "phrases") {
            createSingleColumnContainers($scope.activityData[$scope.selectedVocabularySection], function () {
              loadButtons($scope.activityData[$scope.selectedVocabularySection]);
              loadIndexes($scope.activityData[$scope.selectedVocabularySection]);
              loadEnglishWords($scope.activityData[$scope.selectedVocabularySection]);
              loadGreekWords($scope.activityData[$scope.selectedVocabularySection]);
              $scope.stage.update();
            });
          } else {
            $scope.quartiles = {};
            $scope.quartilesButtons = {};
            $scope.quartilesIndex = {};
            $scope.quartilesEnglish = {};
            $scope.quartilesGreek = {};
            _.each($scope.activityData.derivatives, function (derivative, key, list) {
              if (!$scope.quartiles[derivative.type] && $scope.quartiles[derivative.type] !== derivative.type) {
                $scope.quartiles[derivative.type] = "q" + (_.keys($scope.quartiles).length);
                $scope.quartilesButtons[derivative.type] = 0;
                $scope.quartilesIndex[derivative.type] = 0;
                $scope.quartilesEnglish[derivative.type] = 0;
                $scope.quartilesGreek[derivative.type] = 0;
              }
            });
            console.log("$scope.quartiles", $scope.quartiles);

            createMultiColumnContainers($scope.activityData.derivatives, function () {
              loadQuartileTitles();
              loadDerivativesButtons($scope.activityData.derivatives);
              loadDerivativesIndexes($scope.activityData.derivatives);
              loadEnglishDerivatives($scope.activityData.derivatives);
              loadGreekDerivatives($scope.activityData.derivatives);
              $scope.stage.update();
            });
          }

        }//end of loadPage function()

        function loadQuartileTitles() {

          _.each($scope.quartiles, function (q, key, list) {
            console.log("q " + q + " key " + key);
            var title = new createjs.Text(key.toUpperCase(), "17px Arial", "red");
            title.x = $scope.derivativeContainers[q].width / 2;
            title.y = 0;
            title.textBaseline = "top";
            title.textAlign = "center";
            $scope.derivativeContainers[q].addChild(title);

          });
        };


        /********************************** POPULATING WORD CONTAINERS **********************************/

        /*LOAD BUTTONS*/
        function loadButtons(wordsArray) {
          console.log("$scope.mainContainer", $scope.mainContainer.numChildren);
          /*Iterating and populating the container*/
          _.each(wordsArray, function (word, key, list) {

            console.log(word.name);
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
              $scope.stage.update();
            });

            enSmallButton.regX = enSmallButton.x / 2;
            enSmallButton.regY = enSmallButton.y / 2;
            enSmallButton.scaleX = enSmallButton.scaleY = 0.7;
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
              $scope.stage.update();

            });
            grSmallButton.regX = grSmallButton.x / 2;
            grSmallButton.regY = grSmallButton.y / 2;
            grSmallButton.scaleX = grSmallButton.scaleY = 0.7;
            grSmallButton.x = $scope.buttonsContainer.buttonsSubContainers[word.name].width / 2.3;
            grSmallButton.y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

            /********************* Creating Play button *********************/
            var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
            playSmallButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              playSmallButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            playSmallButton.addEventListener("pressup", function (event) {
              playSmallButton.gotoAndPlay("normal");
              playWordSound(word);
              $scope.stage.update();
              $scope.playAll = false;
              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = false;
            });

            playSmallButton.regX = playSmallButton.x / 2;
            playSmallButton.regY = playSmallButton.y / 2;
            playSmallButton.scaleX = playSmallButton.scaleY = 0.7;
            playSmallButton.x = $scope.buttonsContainer.buttonsSubContainers[word.name].width / 1.5;
            playSmallButton.y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(enSmallButton);
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(grSmallButton);
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild(playSmallButton);
          });
        }//End of loadButtons function


        function playWordSound(word) {
          if (!_.findWhere($scope.activityData[$scope.selectedVocabularySection], {
              name: word.name
            })) {
            return;
          }
          if (window.cordova && window.cordova.platformId !== "browser") {
            $scope.bigPlayButton.visible = false;
            $scope.sounds[word.name].play();
          }
          $scope.currentWord = word.name;
          $scope.indexContainer.indexSubContainers[word.name].indexBackground.visible = true;
          $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.visible = true;
          $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground.visible = true;
          $scope.stage.update();
        };

        function playDerivativeSound(derivative) {
          if (!_.findWhere($scope.activityData[$scope.selectedVocabularySection], {
              name: derivative.name
            })) {
            return;
          }

          if (window.cordova && window.cordova.platformId !== "browser") {
            $scope.bigPlayButton.visible = false;
            $scope.sounds[derivative.name].play();
          }
          $scope.currentWord = derivative.name;
          var elementIndex = _.findIndex(_.filter($scope.activityData.derivatives, {type: derivative.type}), {name: derivative.name});
          $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].indexBackground[elementIndex].visible = true;
          $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].englishBackground[elementIndex].visible = true;
          $scope.derivativesBackgrounds[$scope.quartiles[derivative.type]].greekBackground[elementIndex].visible = true;
          $scope.stage.update();
        };


        /*LOAD INDEXES*/
        function loadIndexes(wordsArray) {

          _.each(wordsArray, function (word, key, list) {

            var wordIndex = new createjs.Text(key + 1 + ".", "20px Arial", "black");

            wordIndex.x = $scope.indexContainer.indexSubContainers[word.name].width / 2;
            wordIndex.y = $scope.indexContainer.indexSubContainers[word.name].height / 2;
            wordIndex.textBaseline = "middle";
            wordIndex.textAlign = "center";
            $scope.indexContainer.indexSubContainers[word.name].addChild(wordIndex);
          });

        }//End of loadIndexes function


        /*LOAD ENGLISH WORDS*/
        function loadEnglishWords(wordsArray) {

          $scope.englishWordsBitmaps = {};

          /*Iterating and populating the container*/
          _.each(wordsArray, function (word, key, list) {
            $scope.englishWordsBitmaps[word.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + ".png");
            $scope.englishWordsBitmaps[word.name].x = 0;
            $scope.englishWordsBitmaps[word.name].y = $scope.englishWordsContainer.englishSubContainers[word.name].height / 1.5;
            $scope.englishWordsBitmaps[word.name].regY = $scope.englishWordsContainer.englishSubContainers[word.name].height / 2;
            $scope.englishWordsContainer.englishSubContainers[word.name].addChild($scope.englishWordsBitmaps[word.name]);
          });
        }//End of loadEnglishWords function


        /*LOAD GREEK WORDS*/
        function loadGreekWords(wordsArray) {
          $scope.greekWordsBitmaps = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.greekWordsBitmaps[word.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + word.name + "_gr.png");
            $scope.greekWordsBitmaps[word.name].x = 0;
            $scope.greekWordsBitmaps[word.name].y = $scope.greekWordsContainer.greekWordsSubContainers[word.name].height / 1.5;
            $scope.greekWordsBitmaps[word.name].regY = $scope.greekWordsContainer.greekWordsSubContainers[word.name].height / 2;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].addChild($scope.greekWordsBitmaps[word.name]);
          });
        }//End of loadGreekWords function

        /********************************** POPULATING DERIVATIVES CONTAINERS **********************************/

        /*LOAD DERIVATIVES BUTTONS*/
        function loadDerivativesButtons(wordsArray) {

          console.log("loadDerivativesButtons", wordsArray);

          /*Iterating and populating the container*/
          _.each(wordsArray, function (derivative, key, list) {

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
              $scope.stage.update();
            });

            enSmallButton.regY = enSmallButton.y / 2;
            enSmallButton.x = enSmallButton.getBounds().width / 3;
            enSmallButton.y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[0].height / 2;
            enSmallButton.scaleX = enSmallButton.scaleY = 0.7;

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
              $scope.stage.update();
            });

            grSmallButton.regX = grSmallButton.x / 2;
            grSmallButton.regY = grSmallButton.y / 2;
            grSmallButton.scaleX = grSmallButton.scaleY = 0.7;
            grSmallButton.x = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[0].width / 1.8;
            grSmallButton.y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[0].height / 2;

            /********************* Creating Play button *********************/
            var playSmallButton = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
            playSmallButton.addEventListener("mousedown", function (event) {
              playSmallButton.gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            playSmallButton.addEventListener("pressup", function (event) {
              playSmallButton.gotoAndPlay("normal");
              playDerivativeSound(derivative);
              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = false;
              $scope.playAll = false;
              $scope.stage.update();
            });
            playSmallButton.regX = playSmallButton.x / 2;
            playSmallButton.regY = playSmallButton.y / 2;
            playSmallButton.scaleX = playSmallButton.scaleY = 0.7;
            playSmallButton.x = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[0].width / 1.15;
            playSmallButton.y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[0].height / 2;

            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[$scope.quartilesButtons[derivative.type]].addChild(enSmallButton);
            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[$scope.quartilesButtons[derivative.type]].addChild(grSmallButton);
            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["buttons"].rowContainers[$scope.quartilesButtons[derivative.type]].addChild(playSmallButton);
            $scope.quartilesButtons[derivative.type]++;

          });
        }//End of loadDerivativesButtons function


        /*LOAD DERIVATIVES INDEXES*/
        function loadDerivativesIndexes(wordsArray) {
          _.each(wordsArray, function (derivative, key, list) {
            var derivativeIndex = new createjs.Text(key + 1 + ".", "20px Arial", "black");
            derivativeIndex.x = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[0].width / 2;
            derivativeIndex.regX = derivativeIndex.getBounds().width / 2;
            derivativeIndex.y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[0].height / 2;
            derivativeIndex.textBaseline = "middle";
            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["index"].rowContainers[$scope.quartilesIndex[derivative.type]].addChild(derivativeIndex);
            $scope.quartilesIndex[derivative.type]++;
          });
        }//End of loadDerivativesIndexes function


        /*LOAD ENGLISH DERIVATIVES*/
        function loadEnglishDerivatives(wordsArray) {

          $scope.englishDerivativesBitmaps = {};
          _.each(wordsArray, function (derivative, key, list) {
            $scope.englishDerivativesBitmaps[derivative.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + ".png");
            $scope.englishDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[0].height / 2;
            $scope.englishDerivativesBitmaps[derivative.name].x = 0;
            if ($scope.englishDerivativesBitmaps[derivative.name].image.width > $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].width) {
              $scope.englishDerivativesBitmaps[derivative.name].scaleX = $scope.englishDerivativesBitmaps[derivative.name].scaleY = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].width / $scope.englishDerivativesBitmaps[derivative.name].image.width;
            }
            $scope.englishDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[0].height / 1.5;
            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["english"].rowContainers[$scope.quartilesEnglish[derivative.type]].addChild($scope.englishDerivativesBitmaps[derivative.name]);
            $scope.quartilesEnglish[derivative.type]++;
          });
        }//End of loadEnglishDerivatives function


        /*LOAD GREEK DERIVATIVES*/
        function loadGreekDerivatives(wordsArray) {

          $scope.greekDerivativesBitmaps = {};
          /*Iterating and populating the container*/
          _.each(wordsArray, function (derivative, key, list) {
            $scope.greekDerivativesBitmaps[derivative.name] = new createjs.Bitmap($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/vocabulary/" + derivative.name + "_gr.png");
            $scope.greekDerivativesBitmaps[derivative.name].regY = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].height / 2;
            $scope.greekDerivativesBitmaps[derivative.name].x = 0;
            $scope.greekDerivativesBitmaps[derivative.name].y = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].height / 1.5;
            if ($scope.greekDerivativesBitmaps[derivative.name].image.width > $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].width) {
              $scope.greekDerivativesBitmaps[derivative.name].scaleX = $scope.greekDerivativesBitmaps[derivative.name].scaleY = $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[0].width / $scope.greekDerivativesBitmaps[derivative.name].image.width;
            }
            $scope.derivativeContainers[$scope.quartiles[derivative.type]].subContainers["greek"].rowContainers[$scope.quartilesGreek[derivative.type]].addChild($scope.greekDerivativesBitmaps[derivative.name]);
            $scope.quartilesGreek[derivative.type]++;
          });

        }//End of loadGreekDerivatives function

        function completedActivity() {
          console.log("completed activity!");
          $scope.activityData.completed = true;
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        };

        function checkIfAllSoundsWerePlayed() {
          var completed = true;

          _.each($scope.activityData, function (tabWords, tab, list) {
            _.each(tabWords, function (word, key, list) {

              if (!word.soundWasPlayed) {
                completed = false;
              }

            });
          });

          if (completed) {
            completedActivity();
          } else {
            console.log("Not completed activity!");
          }

        };


      });//end of image on complete
    }, 500);//end of timeout
  });

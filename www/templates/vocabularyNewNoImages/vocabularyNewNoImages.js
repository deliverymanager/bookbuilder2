angular.module("bookbuilder2")
  .controller("VocabularyNewNoImagesController", function ($scope, $ionicLoading, $rootScope, $interval, $ionicPlatform, $timeout, $http, _) {

    console.log("VocabularyNewNoImagesController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));

    $scope.backgroundView = {
      "background": "url(" + $scope.rootDir + "data/assets/lesson_background_image.png) no-repeat center top",
      "-webkit-background-size": "cover",
      "-moz-background-size": "cover",
      "background-size": "cover"
    };


    $ionicPlatform.on('pause', function () {
      console.log('pause');
      createjs.Ticker.framerate = 0;
      ionic.Platform.exitApp();
    });
    $ionicPlatform.on('resume', function () {
      createjs.Ticker.framerate = 10;
    });

    $scope.$on('$destroy', function () {
      createjs.Ticker.removeEventListener("tick", handleTick);
      createjs.Tween.removeAllTweens();
      $timeout.cancel(timeout);
      $scope.stage.removeAllEventListeners();
      $scope.stage.removeAllChildren();
      $scope.stage = null;
    });

    var handleTick = function () {
      if ($scope.stage) {
        $scope.stage.update();
      }
    };

    var timeout = $timeout(function () {

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
      createjs.Ticker.addEventListener("tick", handleTick);

      var activityNameInLocalStorage = $scope.selectedLesson.id + "_vocabulary";

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/vocabulary_background_image.png"
      }));
      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        var background = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_background_image.png");
        var scaleY = $scope.stage.canvas.height / background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / background.image.width;
        scaleX = scaleX.toFixed(2);
        $scope.scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR", $scope.scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE

        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        $scope.stage.update();

        var backgroundPosition = background.getTransformedBounds();

        /**** MENU BUTTON ****/
        $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
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
              $scope.stage.update();
              $interval.cancel($scope.playSoundIntervalPromise);
              _.each($scope.sounds, function (sound, key, list) {
                $scope.sounds[key].release();
              });
              $scope.sounds = {};
              $rootScope.navigate("lessonNew");
            });

            menuButton.scaleX = menuButton.scaleY = $scope.scale * ($scope.book.headMenuButtonScale ? $scope.book.headMenuButtonScale : 1);
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.stage.addChild(menuButton);

            async.waterfall([function (waterfallCall) {
              if (window.localStorage.getItem(activityNameInLocalStorage)) {
                $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
                window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                waterfallCall();
              } else {

                $http.get($scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/vocabulary/vocabulary.json")
                  .success(function (response) {

                    $scope.activityData = response;
                    $scope.activityData.attempts = 0;
                    window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
                    waterfallCall();
                  })
                  .error(function (error) {
                    console.error("Error on getting json for results button...", error);
                  });//end of get menu button

              }
            }, function (waterfallCall) {

              /*BIG PAUSE BUTTON*/
              $http.get($scope.rootDir + "data/assets/vocabulary_pause_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for the big pause button");

                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
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
                    $scope.bigPauseButton.visible = false;
                    $scope.bigStopButton.visible = false;
                    $scope.bigPauseButton.gotoAndPlay("normal");
                    $scope.playAll = false;
                    showAllPlayButtons();
                    $scope.stage.update();
                  });

                  $scope.bigPauseButton.scaleX = $scope.bigPauseButton.scaleY = $scope.scale * ($scope.book.vocabularyColorButtonsScale ? $scope.book.vocabularyColorButtonsScale : 1.3);
                  $scope.bigPauseButton.x = backgroundPosition.x + (backgroundPosition.width / 2.13);
                  $scope.bigPauseButton.y = backgroundPosition.y + (backgroundPosition.height / 1.16);
                  $scope.stage.addChild($scope.bigPauseButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigPauseButton button...", error);
                  waterfallCall();

                });//end of get bigPause button
            }, function (waterfallCall) {

              /*BIG STOP BUTTON*/
              $http.get($scope.rootDir + "data/assets/vocabulary_stop_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for the big pause button");

                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
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
                    $scope.currentScroll = 10;
                    $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                    $scope.currentWord = "";
                    $scope.playAll = false;
                    showAllPlayButtons();
                    $scope.stage.update();
                  });

                  $scope.bigStopButton.scaleX = $scope.bigStopButton.scaleY = $scope.scale * ($scope.book.vocabularyColorButtonsScale ? $scope.book.vocabularyColorButtonsScale : 1.3);
                  $scope.bigStopButton.x = backgroundPosition.x + (backgroundPosition.width / 1.98);
                  $scope.bigStopButton.y = backgroundPosition.y + (backgroundPosition.height / 1.16);
                  $scope.stage.addChild($scope.bigStopButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigStopButton button...", error);
                  waterfallCall();

                });//end of get bigStop button
            }, function (waterfallCall) {

              /*BIG PLAY BUTTON*/
              $http.get($scope.rootDir + "data/assets/vocabulary_play_big_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for the big play button");

                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var bigPlayButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.bigPlayButton = new createjs.Sprite(bigPlayButtonSpriteSheet, "normal");

                  $scope.bigPlayButton.visible = true;
                  $scope.currentScroll = 10;

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

                    hideAllPlayButtons();

                    var wordsWithSounds = _.filter($scope.activityData[$scope.selectedVocabularySection], function (word) {
                      return word.soundFileName;
                    });

                    if ($scope.currentWord && _.findIndex(wordsWithSounds, {
                        name: $scope.currentWord
                      }) < wordsWithSounds.length - 1) {


                      console.log("$scope.currentScroll", $scope.currentScroll);
                      console.log("current word index", _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                        name: $scope.currentWord
                      }));

                      if ($scope.currentScroll === 10 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                          name: $scope.currentWord
                        }) > 8) {
                        $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                        $scope.currentScroll = 20;
                      } else if ($scope.currentScroll === 20 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                          name: $scope.currentWord
                        }) > 18) {
                        $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                        $scope.currentScroll = 30;
                      } else if ($scope.currentScroll === 30 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                          name: $scope.currentWord
                        }) > 28) {
                        $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                        $scope.currentScroll = 40;
                      } else {

                        if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                            name: $scope.currentWord
                          }) > 28) {
                          $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 40;

                        } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                            name: $scope.currentWord
                          }) > 18) {

                          $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 30;

                        } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                            name: $scope.currentWord
                          }) > 8) {
                          $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 20;
                        } else {
                          $scope.currentScroll = 10;
                          $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                        }

                      }

                      playWordSound(wordsWithSounds[_.findIndex(wordsWithSounds, {
                        name: $scope.currentWord
                      }) + 1]);


                    } else {

                      $scope.currentScroll = 10;
                      $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                      $scope.currentWord = wordsWithSounds[0].name;

                      playWordSound(wordsWithSounds[_.findIndex(wordsWithSounds, {
                        name: $scope.currentWord
                      })]);

                    }
                    $scope.stage.update();
                  });

                  $scope.bigPlayButton.scaleX = $scope.bigPlayButton.scaleY = $scope.scale * ($scope.book.vocabularyColorButtonsScale ? $scope.book.vocabularyColorButtonsScale : 1.3);
                  $scope.bigPlayButton.x = backgroundPosition.x + (backgroundPosition.width / 2.05);
                  $scope.bigPlayButton.y = backgroundPosition.y + (backgroundPosition.height / 1.16);
                  $scope.stage.addChild($scope.bigPlayButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for bigPlayButton button...", error);
                  waterfallCall();

                });//end of get bigPlay button

            }, function (waterfallCall) {

              $scope.phrasesContainer = new createjs.Container();

              var vocMenuBackground = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_menu_background.png");
              $scope.phrasesContainer.addChild(vocMenuBackground);

              $scope.phrasesButton = new createjs.Text("Phrases", "25px Arial", $scope.book.vocabularyColorTitles ? $scope.book.vocabularyColorTitles : 'black');

              $scope.phrasesButton.x = $scope.book.vocabularyTitlesPositionX ? $scope.book.vocabularyTitlesPositionX : 80;
              $scope.phrasesButton.y = $scope.book.vocabularyTitlesPositionY ? $scope.book.vocabularyTitlesPositionY : 0;

              $scope.phrasesButton.textAlign = "center";
              $scope.phrasesContainer.addEventListener("mousedown", function (event) {
                console.log("Mouse down event on a button !");
                $scope.phrasesContainer.alpha = 0.5;
                $scope.stage.update();
              });

              $scope.phrasesContainer.addEventListener("pressup", function (event) {
                console.log("Press up event!");
                $scope.phrasesContainer.alpha = 1;
                loadPage("phrases");
              });

              $scope.phrasesContainer.scaleX = $scope.phrasesContainer.scaleY = $scope.scale;
              $scope.phrasesContainer.x = backgroundPosition.x + (backgroundPosition.width / 1.55);
              $scope.phrasesContainer.y = backgroundPosition.y + (backgroundPosition.height / 1.18);
              $scope.phrasesContainer.addChild($scope.phrasesButton);
              $scope.stage.addChild($scope.phrasesContainer);


              $scope.wordsContainer = new createjs.Container();
              var vocMenuBackground = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_menu_background.png");
              $scope.wordsContainer.addChild(vocMenuBackground);
              $scope.wordsButton = new createjs.Text("Vocabulary", "25px Arial", $scope.book.vocabularyColorTitles ? $scope.book.vocabularyColorTitles : 'black');
              $scope.wordsButton.x = $scope.book.vocabularyTitlesPositionX ? $scope.book.vocabularyTitlesPositionX : 80;
              $scope.wordsButton.y = $scope.book.vocabularyTitlesPositionY ? $scope.book.vocabularyTitlesPositionY : 0;
              $scope.wordsButton.textAlign = "center";

              $scope.wordsContainer.addEventListener("mousedown", function (event) {
                $scope.wordsContainer.alpha = 0.5;
                $scope.stage.update();
              });

              $scope.wordsContainer.addEventListener("pressup", function (event) {
                $scope.wordsContainer.alpha = 1;
                loadPage("words");
              });

              $scope.wordsContainer.scaleX = $scope.wordsContainer.scaleY = $scope.scale;
              $scope.wordsContainer.x = backgroundPosition.x + (backgroundPosition.width / 5.2);
              $scope.wordsContainer.y = backgroundPosition.y + (backgroundPosition.height / 1.17);
              $scope.wordsContainer.addChild($scope.wordsButton);
              $scope.stage.addChild($scope.wordsContainer);

              waterfallCall();

            }, function (waterfallCall) {
              /* BIG ENGLISH BUTTON */
              $http.get($scope.rootDir + "data/assets/vocabulary_english_big_button_sprite.json")
                .success(function (response) {

                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var englishBigButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var englishBigButton = new createjs.Sprite(englishBigButtonSpriteSheet, "normal");

                  englishBigButton.addEventListener("mousedown", function (event) {
                    englishBigButton.gotoAndPlay("onSelection");
                    $scope.stage.update();
                  });

                  englishBigButton.addEventListener("pressup", function (event) {

                    if ($scope.englishWordsBitmaps[$scope.activityData[$scope.selectedVocabularySection][0].name].visible === true) {
                      _.each($scope.activityData[$scope.selectedVocabularySection], function (word, key, list) {
                        $scope.englishWordsBitmaps[word.name].visible = false;
                      });
                      englishBigButton.gotoAndPlay("onSelection");
                    } else {
                      _.each($scope.activityData[$scope.selectedVocabularySection], function (word, key, list) {
                        $scope.englishWordsBitmaps[word.name].visible = true;
                      });
                      englishBigButton.gotoAndPlay("normal");
                    }
                    $scope.stage.update();
                  });
                  englishBigButton.scaleX = englishBigButton.scaleY = $scope.scale * ($scope.book.vocabularyColorButtonsScale ? $scope.book.vocabularyColorButtonsScale : 1);
                  englishBigButton.x = backgroundPosition.x + (backgroundPosition.width / 2.6);
                  englishBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.15);
                  $scope.stage.addChild(englishBigButton);
                  waterfallCall();

                })
                .error(function (error) {
                  console.error("Error on getting json for english big button...", error);
                  waterfallCall();

                });//end of get english big button


            }, function (waterfallCall) {


              /* BIG GREEK BUTTON */
              $http.get($scope.rootDir + "data/assets/vocabulary_greek_big_button_sprite.json")
                .success(function (response) {

                  //Reassigning images with the rest of resource
                  response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                  var greekBigButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var greekBigButton = new createjs.Sprite(greekBigButtonSpriteSheet, "normal");

                  greekBigButton.addEventListener("mousedown", function (event) {
                    console.log("Mouse down event on a button !");
                    greekBigButton.gotoAndPlay("selected");
                    $scope.stage.update();
                  });

                  greekBigButton.addEventListener("pressup", function (event) {
                    if ($scope.greekWordsBitmaps[$scope.activityData[$scope.selectedVocabularySection][0].name].visible === true) {
                      _.each($scope.activityData[$scope.selectedVocabularySection], function (word, key, list) {
                        $scope.greekWordsBitmaps[word.name].visible = false;
                      });
                      greekBigButton.gotoAndPlay("selected");
                    } else {
                      _.each($scope.activityData[$scope.selectedVocabularySection], function (word, key, list) {
                        $scope.greekWordsBitmaps[word.name].visible = true;
                      });
                      greekBigButton.gotoAndPlay("normal");
                    }

                    $scope.stage.update();
                  });

                  greekBigButton.scaleX = greekBigButton.scaleY = $scope.scale * ($scope.book.vocabularyColorButtonsScale ? $scope.book.vocabularyColorButtonsScale : 1);
                  greekBigButton.x = backgroundPosition.x + (backgroundPosition.width / 1.7);
                  greekBigButton.y = backgroundPosition.y + (backgroundPosition.height / 1.15);
                  $scope.stage.addChild(greekBigButton);
                  waterfallCall();
                })
                .error(function (error) {
                  console.error("Error on getting json for greek big button...", error);
                  waterfallCall();

                });//end of get greek butt§on
            }], function (err, result) {
              $scope.sounds = {};
              var assetPath = $scope.rootDir + "data/lessons/" + $scope.selectedLesson.id + "/vocabulary/";
              console.log("$scope.activityData: ", $scope.activityData);

              var waterFallFunctions = [];
              _.each($scope.activityData, function (tabWords, tab, list) {
                _.each(tabWords, function (word, key, list) {

                  if (!word.soundFileName) {
                    return;
                  }

                  waterFallFunctions.push(function (waterfallCallback) {
                    if (ionic.Platform.isIOS() && window.cordova) {
                      resolveLocalFileSystemURL(assetPath + word.name + ".mp3", function (entry) {
                        console.log(entry);
                        $scope.sounds[word.name] = new Media(entry.toInternalURL(), function () {
                          console.log("Sound success");
                        }, function (err) {
                          console.log("Sound error: ", err);
                        }, function (status) {
                          console.log("Sound status: ", status);
                        });
                        $scope.sounds[word.name].soundWasPlayed = false;
                        waterfallCallback();
                      });
                    } else {
                      if (window.cordova && window.cordova.platformId !== "browser") {
                        $scope.sounds[word.name] = new Media(assetPath + word.name + ".mp3", function () {
                          console.log("Sound success");
                        }, function (err) {
                          console.log("Sound error", err);
                        }, function (status) {
                          console.log("Sound status", status);
                        });
                        $scope.sounds[word.name].soundWasPlayed = false;
                      }
                      waterfallCallback();
                    }
                  });
                });
              });

              $scope.wordContainersHeight = 50;
              $scope.playAll = false;
              $scope.currentWord = "";

              async.waterfall([function (parallelCallback) {
                async.waterfall([
                  function (buttonsSpriteSheetCallback) {

                    var loadingBitmaps = [];
                    _.each(["vocabulary_scroll_up.png", "vocabulary_scroll_down.png", "vocabulary_menu_background.png"], function (file, key, list) {

                      loadingBitmaps.push(function (seriesCallback) {
                        var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                          src: $scope.rootDir + "data/assets/" + file
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

                    $scope.currentScroll = 10;
                    async.parallelLimit(loadingBitmaps, 10, function (err, response) {

                      $scope.scrollDown = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_scroll_down.png");
                      $scope.scrollDown.scaleX = $scope.scrollDown.scaleY = $scope.scale * 0.2;
                      $scope.scrollDown.x = backgroundPosition.x + backgroundPosition.width / 1.08;
                      $scope.scrollDown.y = backgroundPosition.y + (backgroundPosition.height / 2);
                      $scope.stage.addChild($scope.scrollDown);


                      $scope.scrollDown.addEventListener("mousedown", function (event) {
                        $scope.scrollDown.alpha = 0.5;
                        $scope.stage.update();
                      });


                      $scope.scrollDown.addEventListener("pressup", function (event) {
                        $scope.scrollDown.alpha = 1;

                        if ($scope.currentScroll === 10) {
                          $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 20;
                        } else if ($scope.currentScroll === 20 && $scope.activityData[$scope.selectedVocabularySection].length > 20) {
                          $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 30;
                        } else if ($scope.currentScroll === 30 && $scope.activityData[$scope.selectedVocabularySection].length > 30) {
                          $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 40;
                        }

                        $scope.stage.update();
                      });

                      $scope.scrollUp = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_scroll_up.png");
                      $scope.scrollUp.scaleX = $scope.scrollUp.scaleY = $scope.scale * 0.2;
                      $scope.scrollUp.x = backgroundPosition.x + backgroundPosition.width / 1.08;
                      $scope.scrollUp.y = backgroundPosition.y + (backgroundPosition.height / 3);
                      $scope.stage.addChild($scope.scrollUp);

                      $scope.scrollUp.addEventListener("mousedown", function (event) {
                        $scope.scrollUp.alpha = 0.5;
                        $scope.stage.update();
                      });

                      $scope.scrollUp.addEventListener("pressup", function (event) {
                        $scope.scrollUp.alpha = 1;

                        if ($scope.currentScroll === 20) {
                          $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8;
                          $scope.currentScroll = 10;
                        } else if ($scope.currentScroll === 30) {
                          $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                          $scope.currentScroll = 20;
                        } else if ($scope.currentScroll === 40) {
                          $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 20;
                          $scope.currentScroll = 30;
                        } else {

                          if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                              name: $scope.currentWord
                            }) > 28) {
                            $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                            $scope.currentScroll = 40;

                          } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                              name: $scope.currentWord
                            }) > 18) {

                            $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                            $scope.currentScroll = 30;

                          } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                              name: $scope.currentWord
                            }) > 8) {
                            $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                            $scope.currentScroll = 20;
                          } else {
                            $scope.currentScroll = 10;
                            $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                          }
                        }

                        $scope.stage.update();
                      });

                      buttonsSpriteSheetCallback();

                    });
                  }, function (buttonsSpriteSheetCallback) {

                    /*English Button*/
                    $http.get($scope.rootDir + "data/assets/vocabulary_english_big_button_sprite.json")
                      .success(function (response) {
                        console.log("vocabulary_english_big_button_sprite");
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                        $scope.enSmallButtonSpriteSheet = new createjs.SpriteSheet(response);

                        buttonsSpriteSheetCallback();
                      })
                      .error(function (error) {
                        buttonsSpriteSheetCallback();
                      });
                  },
                  function (buttonsSpriteSheetCallback) {

                    /*Greek Button*/
                    $http.get($scope.rootDir + "data/assets/vocabulary_greek_big_button_sprite.json")
                      .success(function (response) {
                        console.log("Success on getting json data for greek button!");
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
                        $scope.grSmallButtonSpriteSheet = new createjs.SpriteSheet(response);
                        buttonsSpriteSheetCallback();
                      })
                      .error(function (error) {
                        buttonsSpriteSheetCallback();
                      });
                  },
                  function (buttonsSpriteSheetCallback) {

                    /*Play Button*/
                    $http.get($scope.rootDir + "data/assets/vocabulary_play_white_big_button_sprite.json")
                      .success(function (response) {
                        response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];
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


                $scope.titleContainer = new createjs.Container();
                var titleBackground = new createjs.Bitmap($scope.rootDir + "data/assets/vocabulary_title_background.png");
                $scope.titleContainer.addChild(titleBackground);
                $scope.titleContainer.x = backgroundPosition.x + (backgroundPosition.width / 4);
                $scope.titleContainer.y = backgroundPosition.y + (backgroundPosition.height / 35);

                $scope.title = new createjs.Text($scope.selectedLesson.lessonTitle + " - Listen, say and learn.", "25px Arial", "white");
                $scope.titleContainer.scaleX = $scope.titleContainer.scaleY = $scope.scale;
                $scope.title.textAlign = "center";
                $scope.title.x = 260;
                $scope.title.y = 15;
                $scope.titleContainer.addChild($scope.title);
                $scope.stage.addChild($scope.titleContainer);

                $scope.mainContainer = new createjs.Container();
                $scope.mainContainer.width = background.image.width;
                $scope.mainContainer.height = background.image.height * 2;
                $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
                $scope.mainContainer.x = backgroundPosition.x;
                $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                $scope.stage.addChild($scope.mainContainer);

                var graphics = new createjs.Graphics().beginFill("red").drawRect(backgroundPosition.x, backgroundPosition.y + (backgroundPosition.height / 8), backgroundPosition.width, backgroundPosition.height * 0.67);
                var shape = new createjs.Shape(graphics);
                $scope.mainContainer.mask = shape;

                $timeout(function () {
                  parallelCallback();
                });
              }], function (err, response) {
                async.waterfall(waterFallFunctions, function (err, response) {
                  loadPage("words");
                });
              });


            });

          })
          .error(function (error) {
            console.error("Error on getting json for menu button...", error);
          });//end of get menu button


        $scope.playSoundIntervalPromise = $interval(function () {
          _.each($scope.sounds, function (sound, key, list) {
            if ($scope.sounds[key].soundPlaying) {
              $scope.sounds[key].getCurrentPosition(
                function (position) {
                  console.log("position", position);
                  if (position < 0) {
                    soundIsFinishedPlaying(key);
                  }
                },
                function (e) {
                  console.log("Error getting pos=" + e);
                }
              );
            }
          });
        }, 500, 0, true);

        function soundIsFinishedPlaying(name) {

          $scope.sounds[name].soundPlaying = false;

          var wordsWithSounds = _.filter($scope.activityData[$scope.selectedVocabularySection], function (word) {
            return word.soundFileName;
          });

          $scope.activityData[$scope.selectedVocabularySection][_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
            name: name
          })].soundWasPlayed = true;

          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));

          $scope.indexContainer.indexSubContainers[name].indexBackground.visible = false;
          $scope.englishWordsContainer.englishSubContainers[name].englishBackground.visible = false;
          $scope.greekWordsContainer.greekWordsSubContainers[name].greekBackground.visible = false;

          if ($scope.playAll && _.findWhere($scope.activityData[$scope.selectedVocabularySection], {
              name: $scope.currentWord
            })) {

            if (_.findIndex(wordsWithSounds, {
                name: $scope.currentWord
              }) < wordsWithSounds.length - 1) {


              console.log("$scope.currentScroll", $scope.currentScroll);
              console.log("current word index", _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                name: $scope.currentWord
              }));

              if ($scope.currentScroll === 10 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                  name: $scope.currentWord
                }) > 8) {
                $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                $scope.currentScroll = 20;
              } else if ($scope.currentScroll === 20 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                  name: $scope.currentWord
                }) > 18) {
                $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                $scope.currentScroll = 30;
              } else if ($scope.currentScroll === 30 && _.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                  name: $scope.currentWord
                }) > 28) {
                $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                $scope.currentScroll = 40;
              } else {

                if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                    name: $scope.currentWord
                  }) > 28) {
                  $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                  $scope.currentScroll = 40;

                } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                    name: $scope.currentWord
                  }) > 18) {

                  $scope.mainContainer.y = $scope.mainContainer.y - $scope.wordContainersHeight * $scope.scale * 10;
                  $scope.currentScroll = 30;

                } else if (_.findIndex($scope.activityData[$scope.selectedVocabularySection], {
                    name: $scope.currentWord
                  }) > 8) {
                  $scope.mainContainer.y = backgroundPosition.y + backgroundPosition.height / 8 - $scope.wordContainersHeight * $scope.scale * 10;
                  $scope.currentScroll = 20;
                } else {
                  $scope.currentScroll = 10;
                  $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
                }
              }

              playWordSound(wordsWithSounds[_.findIndex(wordsWithSounds, {
                name: $scope.currentWord
              }) + 1]);


            } else {
              console.log("This is the last sound from the section ", $scope.selectedVocabularySection);
              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = true;
              $scope.currentScroll = 10;
              $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
              $scope.bigStopButton.gotoAndPlay("normal");
              $scope.currentWord = "";
              $scope.playAll = false;
              showAllPlayButtons();
              $scope.stage.update();
            }

          } else {

            $scope.bigPauseButton.visible = false;
            $scope.bigStopButton.visible = false;
            $scope.bigPlayButton.visible = true;

            showAllPlayButtons();

          }

          checkIfAllSoundsWerePlayed();

        };

        function createSingleColumnContainers(wordsArray, parallelCallback) {
          if (wordsArray.length > 10) {
            $scope.scrollUp.visible = true;
            $scope.scrollDown.visible = true;
          } else {
            $scope.scrollUp.visible = false;
            $scope.scrollDown.visible = false;
          }

          $scope.mainContainer.removeAllChildren();
          $scope.mainContainer.height = (wordsArray.length - 1 ) * $scope.wordContainersHeight;
          $scope.buttonsContainer = new createjs.Container();
          $scope.buttonsContainer.x = $scope.mainContainer.width / 12;
          $scope.buttonsContainer.width = $scope.mainContainer.width / 5;
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
          $scope.indexContainer.width = $scope.mainContainer.width / 25;
          $scope.indexContainer.height = $scope.mainContainer.height;
          $scope.indexContainer.x = $scope.mainContainer.width / 6.5;
          $scope.mainContainer.addChild($scope.indexContainer);

          $scope.indexContainer.indexSubContainers = {};
          _.each(wordsArray, function (word, key, list) {
            $scope.indexContainer.indexSubContainers[word.name] = new createjs.Container();
            $scope.indexContainer.indexSubContainers[word.name].width = $scope.indexContainer.width;
            $scope.indexContainer.indexSubContainers[word.name].height = $scope.wordContainersHeight;
            $scope.indexContainer.indexSubContainers[word.name].x = $scope.buttonsContainer.x;
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
          $scope.englishWordsContainer.width = $scope.mainContainer.width / 3.2;
          $scope.englishWordsContainer.height = $scope.mainContainer.height;
          $scope.englishWordsContainer.x = $scope.buttonsContainer.x + $scope.indexContainer.x + $scope.indexContainer.width;
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
          $scope.greekWordsContainer.width = $scope.mainContainer.width / 3.2;
          $scope.greekWordsContainer.height = $scope.mainContainer.height;
          $scope.greekWordsContainer.y = 0;
          $scope.greekWordsContainer.x = $scope.buttonsContainer.x + $scope.indexContainer.x + $scope.indexContainer.width + $scope.englishWordsContainer.width;
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


        function loadPage(vocabularySection) {
          $scope.mainContainer.y = backgroundPosition.y + (backgroundPosition.height / 8);
          $scope.selectedVocabularySection = vocabularySection;
          $scope.playAll = false;
          $scope.currentWord = "";

          $scope.bigPauseButton.visible = false;
          $scope.bigStopButton.visible = false;
          $scope.bigPlayButton.visible = true;
          $scope.currentScroll = 10;
          $scope.bigStopButton.gotoAndPlay("normal");

          createSingleColumnContainers($scope.activityData[$scope.selectedVocabularySection], function () {
            loadButtons($scope.activityData[$scope.selectedVocabularySection]);
            loadIndexes($scope.activityData[$scope.selectedVocabularySection]);
            loadEnglishWords($scope.activityData[$scope.selectedVocabularySection]);
            loadGreekWords($scope.activityData[$scope.selectedVocabularySection]);
            $scope.stage.update();
          });

        }//end of loadPage function()


        /*LOAD BUTTONS*/
        function loadButtons(wordsArray) {
          console.log("$scope.mainContainer", $scope.mainContainer.numChildren);
          /*Iterating and populating the container*/
          $scope.enSmallButton = [];
          $scope.grSmallButton = [];
          $scope.playSmallButton = [];

          _.each(wordsArray, function (word, key, list) {

            if (!word.soundFileName) {
              return;
            }

            $scope.enSmallButton[key] = new createjs.Sprite($scope.enSmallButtonSpriteSheet, "normal");
            $scope.enSmallButton[key].addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.enSmallButton[key].gotoAndPlay("onSelection");
              $scope.stage.update();
            });

            $scope.enSmallButton[key].addEventListener("pressup", function (event) {
              console.log("Press up event!");
              $scope.enSmallButton[key].gotoAndPlay("normal");
              $scope.englishWordsBitmaps[word.name].visible = !$scope.englishWordsBitmaps[word.name].visible;
              $scope.stage.update();
            });

            $scope.enSmallButton[key].regX = $scope.enSmallButton[key].x / 2;
            $scope.enSmallButton[key].regY = $scope.enSmallButton[key].y / 2;
            $scope.enSmallButton[key].x = $scope.enSmallButton[key].getBounds().width / 2;
            $scope.enSmallButton[key].y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

            /*********************Creating Greek button*********************/
            $scope.grSmallButton[key] = new createjs.Sprite($scope.grSmallButtonSpriteSheet, "normal");

            $scope.grSmallButton[key].addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button !");
              $scope.grSmallButton[key].gotoAndPlay("selected");
              $scope.stage.update();
            });

            $scope.grSmallButton[key].addEventListener("pressup", function (event) {
              console.log("Press up event!");
              $scope.grSmallButton[key].gotoAndPlay("normal");
              $scope.greekWordsBitmaps[word.name].visible = !$scope.greekWordsBitmaps[word.name].visible;
              $scope.stage.update();

            });
            $scope.grSmallButton[key].regX = $scope.grSmallButton[key].x / 2;
            $scope.grSmallButton[key].regY = $scope.grSmallButton[key].y / 2;
            $scope.grSmallButton[key].x = $scope.buttonsContainer.buttonsSubContainers[word.name].width / 2.3;
            $scope.grSmallButton[key].y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;

            /********************* Creating Play button *********************/
            $scope.playSmallButton[key] = new createjs.Sprite($scope.playSmallButtonSpriteSheet, "normal");
            $scope.playSmallButton[key].addEventListener("mousedown", function (event) {
              console.log("Mouse down event on a button playSmallButton");
              $scope.playSmallButton[key].gotoAndPlay("selected");
              $scope.stage.update();

            });

            $scope.playSmallButton[key].addEventListener("pressup", function (event) {

              $scope.playSmallButton[key].gotoAndPlay("normal");
              playWordSound(word);
              $scope.stage.update();
              $scope.playAll = false;

              $scope.bigPauseButton.visible = false;
              $scope.bigStopButton.visible = false;
              $scope.bigPlayButton.visible = false;

              hideAllPlayButtons();

            });

            $scope.playSmallButton[key].regX = $scope.playSmallButton[key].x / 2;
            $scope.playSmallButton[key].regY = $scope.playSmallButton[key].y / 2;
            //$scope.playSmallButton[key].scaleX = $scope.playSmallButton[key].scaleY = 0.7;
            $scope.playSmallButton[key].x = $scope.buttonsContainer.buttonsSubContainers[word.name].width / 1.5;
            $scope.playSmallButton[key].y = $scope.buttonsContainer.buttonsSubContainers[word.name].height / 2;
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild($scope.enSmallButton[key]);
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild($scope.grSmallButton[key]);
            $scope.buttonsContainer.buttonsSubContainers[word.name].addChild($scope.playSmallButton[key]);
          });
        }//End of loadButtons function

        var hideAllPlayButtons = function () {

          $scope.wordsContainer.visible = false;
          $scope.phrasesContainer.visible = false;

          _.each($scope.activityData[$scope.selectedVocabularySection], function (word, k, list) {
            if (!word.soundFileName) {
              return;
            }
            $scope.playSmallButton[k].visible = false;
          });
        };

        var showAllPlayButtons = function () {

          $scope.wordsContainer.visible = true;
          $scope.phrasesContainer.visible = true;

          _.each($scope.activityData[$scope.selectedVocabularySection], function (word, k, list) {
            if (!word.soundFileName) {
              return;
            }
            $scope.playSmallButton[k].visible = true;
          });

        };

        function playWordSound(word) {
          if (!_.findWhere($scope.activityData[$scope.selectedVocabularySection], {
              name: word.name
            })) {
            return;
          }
          if (window.cordova && window.cordova.platformId !== "browser") {
            $scope.bigPlayButton.visible = false;
            $scope.sounds[word.name].play();
            $timeout(function () {
              $scope.sounds[word.name].soundPlaying = true;
            }, 500);
          }
          $scope.currentWord = word.name;
          $scope.indexContainer.indexSubContainers[word.name].indexBackground.visible = true;
          $scope.englishWordsContainer.englishSubContainers[word.name].englishBackground.visible = true;
          $scope.greekWordsContainer.greekWordsSubContainers[word.name].greekBackground.visible = true;
          $scope.stage.update();
        };

        /*LOAD INDEXES*/
        function loadIndexes(wordsArray) {

          _.each(wordsArray, function (word, key, list) {

            if (!word.soundFileName) {
              return;
            }

            var wordIndex = new createjs.Text(word.wordNumber + ".", "25px Arial", $scope.book.vocabularyIndexEnglishColor ? $scope.book.vocabularyIndexEnglishColor : 'white');
            $timeout(function () {
              wordIndex.x = $scope.indexContainer.indexSubContainers[word.name].width / 2;
              wordIndex.y = $scope.indexContainer.indexSubContainers[word.name].height / 2;
              wordIndex.textBaseline = "middle";
              wordIndex.textAlign = "center";
              $scope.indexContainer.indexSubContainers[word.name].addChild(wordIndex);
            });
          });

        }//End of loadIndexes function


        /*LOAD ENGLISH WORDS*/
        function loadEnglishWords(wordsArray) {

          $scope.englishWordsBitmaps = {};

          /*Iterating and populating the container*/
          _.each(wordsArray, function (word, key, list) {

            $scope.englishWordsBitmaps[word.name] = new createjs.Text(!word.onlyTitle ? word.leftWord : word.onlyTitle, (word.isTitle ? "28px" : "20px") + " Arial", $scope.book.vocabularyEnglishColor ? $scope.book.vocabularyEnglishColor : 'white');
            $scope.englishWordsBitmaps[word.name].y = $scope.englishWordsContainer.englishSubContainers[word.name].height / 2;
            $scope.englishWordsBitmaps[word.name].textBaseline = "middle";
            $scope.englishWordsBitmaps[word.name].maxWidth = $scope.englishWordsContainer.englishSubContainers[word.name].width;
            $scope.englishWordsContainer.englishSubContainers[word.name].addChild($scope.englishWordsBitmaps[word.name]);

          });
        }//End of loadEnglishWords function

        /*LOAD GREEK WORDS*/
        function loadGreekWords(wordsArray) {
          var scaleImage = 1.25;
          $scope.greekWordsBitmaps = {};
          _.each(wordsArray, function (word, key, list) {

            $scope.greekWordsBitmaps[word.name] = new createjs.Text(!word.onlyTitle ? word.rightWord : "", (word.isTitle ? "28px" : "20px") + " Arial", $scope.book.vocabularyColor ? $scope.book.vocabularyColor : 'white');
            $scope.greekWordsBitmaps[word.name].y = $scope.greekWordsContainer.greekWordsSubContainers[word.name].height / 2;
            $scope.greekWordsBitmaps[word.name].textBaseline = "middle";
            $scope.greekWordsBitmaps[word.name].maxWidth = $scope.greekWordsContainer.greekWordsSubContainers[word.name].width;
            $scope.greekWordsContainer.greekWordsSubContainers[word.name].addChild($scope.greekWordsBitmaps[word.name]);

          });
        }//End of loadGreekWords function


        function checkIfAllSoundsWerePlayed() {

          //If all sounds were played then it saves an attempt and then it clears all the soundWasPlayed so that it can count again an attempt!
          var completed = true;
          var counter = 0;

          _.each($scope.activityData, function (tabWords, tab, list) {

            _.each(tabWords, function (word, key, list) {

              if (word.soundFileName && !word.soundWasPlayed) {
                completed = false;
                counter++;
              }

            });

          });


          if (completed) {

            $scope.activityData.attempts = $scope.activityData.attempts + 1;
            $scope.activityData.completed = true;

            _.each($scope.activityData, function (tabWords, tab, list) {
              _.each(tabWords, function (word, key, list) {
                $scope.activityData[tab][key].soundWasPlayed = false;
              });
            });

            window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            console.log("ACTIVITY COMPLETED!!!");

          } else {
            console.log("there are sound remaining unplayed", counter);
          }

        };
      });//end of image on complete
    }, 1500);//end of timeout
  });

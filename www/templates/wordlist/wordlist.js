angular.module("bookbuilder2")
  .controller("WordlistController", function ($scope, $ionicPlatform, $timeout, $http, _, $rootScope, $ionicPopup, $interval) {

    console.log("WordlistController loaded!");
    $scope.rootDir = window.localStorage.getItem("rootDir");
    $scope.selectedLesson = JSON.parse(window.localStorage.getItem("selectedLesson"));
    $scope.book = JSON.parse(window.localStorage.getItem("book"));
    $scope.scale = window.localStorage.getItem("scale");
    $scope.ratio = window.localStorage.getItem("ratio");
    $scope.activityFolder = window.localStorage.getItem("activityFolder");

    $scope.backgroundView = {
      "background-color": "#F25D63"
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

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $scope.rootDir + "data/assets/wordlistBg.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($scope.rootDir + "data/assets/wordlistBg.png");

        /**** CALCULATING SCALING ****/
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
        console.log("GENERAL SCALING FACTOR: ", $scope.scale);

        background.scaleX = $scope.scale;
        background.scaleY = $scope.scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        var backgroundPosition = background.getTransformedBounds();
        $scope.backgroundPosition = backgroundPosition;
        console.log("backgroundPosition: ", backgroundPosition);


        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        $scope.stage.addChild($scope.mainContainer);
        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get($scope.rootDir + "data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on Menu button !");
              menuButton.gotoAndPlay("onSelection");
            });

            menuButton.addEventListener("pressup", function (event) {
              console.log("Press up event on Menu event!");
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
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get menu button

        $http.get($scope.rootDir + "data/assets/wordlistPlay.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistPlayButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistPlayButton = new createjs.Sprite(wordlistPlayButtonSpriteSheet, "normal");

            $scope.wordlistPlayButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistPlay button !");
              $scope.wordlistPlayButton.gotoAndPlay("selected");
            });

            $scope.wordlistPlayButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistPlay event!");
              $scope.wordlistPlayButton.gotoAndPlay("normal");

              $scope.wordlistPlayButton.visible = false;
              $scope.wordlistStopButton.visible = true;

              $scope.stage.update();
            });

            $scope.wordlistPlayButton.x = 790;
            $scope.wordlistPlayButton.y = 600;
            $scope.wordlistPlayButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistPlayButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistPlay button

        $http.get($scope.rootDir + "data/assets/wordlistStop.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistStopButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistStopButton = new createjs.Sprite(wordlistStopButtonSpriteSheet, "normal");

            $scope.wordlistStopButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistStop button !");
              $scope.wordlistStopButton.gotoAndPlay("selected");
            });

            $scope.wordlistStopButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistStop event!");
              $scope.wordlistStopButton.gotoAndPlay("normal");

              $scope.wordlistPlayButton.visible = true;
              $scope.wordlistStopButton.visible = false;

              if (window.cordova && window.cordova.platformId !== "browser") {
                _.each($scope.sounds, function (sound, key, list) {
                  if ($scope.sounds[key].soundPlaying) {
                    $scope.sounds[key].soundPlaying = false;
                    $scope.sounds[key].stop();
                  }
                });
              }

              $scope.stage.update();
            });

            $scope.wordlistStopButton.x = 790;
            $scope.wordlistStopButton.y = 600;
            $scope.wordlistStopButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistStopButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistStop button


        $http.get($scope.rootDir + "data/assets/wordlistSingleLesson.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistSingleLessonButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistSingleLessonButton = new createjs.Sprite(wordlistSingleLessonButtonSpriteSheet, "normal");

            $scope.wordlistSingleLessonButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistSingleLesson button !");
              $scope.wordlistSingleLessonButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistSingleLessonButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistSingleLesson event!");
              $scope.wordlistSingleLessonButton.gotoAndPlay("normal");

              $scope.wordlistSingleLessonButton.visible = false;
              $scope.wordlistAllButton.visible = true;

              buildLessonsBoard("lessons");
              $scope.stage.update();
            });

            $scope.wordlistSingleLessonButton.x = 30;
            $scope.wordlistSingleLessonButton.y = 600;
            $scope.wordlistSingleLessonButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistSingleLessonButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistSingleLesson button

        $http.get($scope.rootDir + "data/assets/wordlistAll.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistAllButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistAllButton = new createjs.Sprite(wordlistAllButtonSpriteSheet, "normal");

            $scope.wordlistAllButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistAll button !");
              $scope.wordlistAllButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistAllButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistAll event!");
              $scope.wordlistAllButton.gotoAndPlay("normal");
              $scope.wordlistSingleLessonButton.visible = true;
              $scope.wordlistAllButton.visible = false;

              //Load all the words in the wordlist
              $scope.lessonNumber = "all";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";
              $scope.dataSearch.firstLetter = "";
              loadCurrentWordsSounds();
              $scope.stage.update();
            });

            $scope.wordlistAllButton.x = 30;
            $scope.wordlistAllButton.y = 600;
            $scope.wordlistAllButton.visible = true;

            $scope.mainContainer.addChild($scope.wordlistAllButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistAllButton button


        $http.get($scope.rootDir + "data/assets/wordlistAll.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistAllLettersButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistAllLettersButton = new createjs.Sprite(wordlistAllLettersButtonSpriteSheet, "normal");

            $scope.wordlistAllLettersButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistAllLetters button !");
              $scope.wordlistAllLettersButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistAllLettersButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistAllLetters event!");
              $scope.wordlistAllLettersButton.gotoAndPlay("normal");

              $scope.lessonNumber = "all";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";
              $scope.dataSearch.firstLetter = "";
              $scope.wordlistAllLettersButton.visible = false;
              $scope.wordlistSingleLettersButton.visible = true;
              loadCurrentWordsSounds();
              $scope.stage.update();
            });

            $scope.wordlistAllLettersButton.x = 230;
            $scope.wordlistAllLettersButton.y = 600;
            $scope.wordlistAllLettersButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistAllLettersButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistAllLetters button


        $http.get($scope.rootDir + "data/assets/wordlistAllLetters.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistAllLettersButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistSingleLettersButton = new createjs.Sprite(wordlistAllLettersButtonSpriteSheet, "normal");

            $scope.wordlistSingleLettersButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistAllLetters button !");
              $scope.wordlistSingleLettersButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistSingleLettersButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistAllLetters event!");
              $scope.wordlistSingleLettersButton.gotoAndPlay("normal");

              $scope.wordlistAllLettersButton.visible = true;
              $scope.wordlistSingleLettersButton.visible = false;
              buildLessonsBoard("letters");
              $scope.stage.update();
            });

            $scope.wordlistSingleLettersButton.x = 230;
            $scope.wordlistSingleLettersButton.y = 600;
            $scope.wordlistSingleLettersButton.visible = true;

            $scope.mainContainer.addChild($scope.wordlistSingleLettersButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistAllLetters button


        $http.get($scope.rootDir + "data/assets/wordlistEnglishToGreek.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistEnglishToGreekButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistEnglishToGreekButton = new createjs.Sprite(wordlistEnglishToGreekButtonSpriteSheet, "normal");

            $scope.wordlistEnglishToGreekButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistEnglishToGreek button !");
              $scope.wordlistEnglishToGreekButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistEnglishToGreekButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistEnglishToGreek event!");
              $scope.wordlistEnglishToGreekButton.gotoAndPlay("normal");
              $scope.wordlistGreekToEnglishButton.visible = true;
              $scope.wordlistEnglishToGreekButton.visible = false;
              $scope.stage.update();

              $scope.translationType = "english";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";
              $scope.dataSearch.firstLetter = "";
              $scope.wordlistAllLettersButton.visible = false;
              $scope.wordlistSingleLettersButton.visible = true;
              loadCurrentWordsSounds();
            });

            $scope.wordlistEnglishToGreekButton.x = 500;
            $scope.wordlistEnglishToGreekButton.y = 600;
            $scope.wordlistEnglishToGreekButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistEnglishToGreekButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistEnglishToGreek button


        $http.get($scope.rootDir + "data/assets/wordlistGreekToEnglish.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistGreekToEnglishButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistGreekToEnglishButton = new createjs.Sprite(wordlistGreekToEnglishButtonSpriteSheet, "normal");

            $scope.wordlistGreekToEnglishButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistGreekToEnglish button !");
              $scope.wordlistGreekToEnglishButton.gotoAndPlay("onSelection");
            });

            $scope.wordlistGreekToEnglishButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistGreekToEnglish event!");
              $scope.wordlistGreekToEnglishButton.gotoAndPlay("normal");
              $scope.wordlistGreekToEnglishButton.visible = false;
              $scope.wordlistEnglishToGreekButton.visible = true;
              $scope.stage.update();

              $scope.translationType = "greek";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";
              $scope.dataSearch.firstLetter = "";
              $scope.wordlistAllLettersButton.visible = false;
              $scope.wordlistSingleLettersButton.visible = true;
              loadCurrentWordsSounds();
            });

            $scope.wordlistGreekToEnglishButton.x = 500;
            $scope.wordlistGreekToEnglishButton.y = 600;
            $scope.wordlistGreekToEnglishButton.visible = true;

            $scope.mainContainer.addChild($scope.wordlistGreekToEnglishButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistGreekToEnglish button


        $http.get($scope.rootDir + "data/assets/wordlistPhrases.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistPhrasesButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistPhrasesButton = new createjs.Sprite(wordlistPhrasesButtonSpriteSheet, "normal");

            $scope.wordlistPhrasesButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistPhrases button !");
              $scope.wordlistPhrasesButton.gotoAndPlay("selected");
            });

            $scope.wordlistPhrasesButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistPhrases event!");
              $scope.wordlistPhrasesButton.gotoAndPlay("normal");
              $scope.wordlistPhrasesButton.visible = false;
              $scope.wordlistWordsButton.visible = true;

              $scope.phraseOrWord = "phrase";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";

              $scope.dataSearch.firstLetter = "";
              $scope.wordlistAllLettersButton.visible = false;
              $scope.wordlistSingleLettersButton.visible = true;
              loadCurrentWordsSounds();
              $scope.stage.update();

            });

            $scope.wordlistPhrasesButton.x = 655;
            $scope.wordlistPhrasesButton.y = 605;
            $scope.wordlistPhrasesButton.visible = true;

            $scope.mainContainer.addChild($scope.wordlistPhrasesButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistPhrases button


        $http.get($scope.rootDir + "data/assets/wordlistWords.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistWordsButtonSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistWordsButton = new createjs.Sprite(wordlistWordsButtonSpriteSheet, "normal");

            $scope.wordlistWordsButton.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistWords button !");
              $scope.wordlistWordsButton.gotoAndPlay("selected");
            });

            $scope.wordlistWordsButton.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistWords event!");
              $scope.wordlistWordsButton.gotoAndPlay("normal");
              $scope.wordlistPhrasesButton.visible = true;
              $scope.wordlistWordsButton.visible = false;

              $scope.phraseOrWord = "word";
              $scope.currentWordIndex = 0;
              $scope.dataSearch.text = "";
              $scope.dataSearch.firstLetter = "";
              $scope.wordlistAllLettersButton.visible = false;
              $scope.wordlistSingleLettersButton.visible = true;
              loadCurrentWordsSounds();
              $scope.stage.update();

            });

            $scope.wordlistWordsButton.x = 655;
            $scope.wordlistWordsButton.y = 605;
            $scope.wordlistWordsButton.visible = false;

            $scope.mainContainer.addChild($scope.wordlistWordsButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get wordlistWords button


        $http.get($scope.rootDir + "data/assets/wordlistUpDown.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistUpSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistUp = new createjs.Sprite(wordlistUpSpriteSheet, "normal");

            $scope.wordlistUp.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistWords button !");
              $scope.wordlistUp.gotoAndPlay("selected");
            });

            $scope.wordlistUp.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistWords event!");
              $scope.wordlistUp.gotoAndPlay("normal");
              $scope.stage.update();

              $scope.wordlistDown.alpha = 1;

              loadWordUpDown("up");

            });

            $scope.wordlistUp.x = 428;
            $scope.wordlistUp.y = 145;
            $scope.wordlistUp.visible = true;

            $scope.mainContainer.addChild($scope.wordlistUp);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get $scope.wordlistUp button


        $http.get($scope.rootDir + "data/assets/wordlistUpDown.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = $scope.rootDir + "data/assets/" + response.images[0];

            var wordlistDownSpriteSheet = new createjs.SpriteSheet(response);
            $scope.wordlistDown = new createjs.Sprite(wordlistDownSpriteSheet, "normal");

            $scope.wordlistDown.addEventListener("mousedown", function (event) {
              console.log("Mouse down event on wordlistWords button !");
              $scope.wordlistDown.gotoAndPlay("selected");
            });

            $scope.wordlistDown.addEventListener("pressup", function (event) {
              console.log("Press up event on wordlistWords event!");
              $scope.wordlistDown.gotoAndPlay("normal");
              $scope.stage.update();

              $scope.wordlistUp.alpha = 1;

              loadWordUpDown("down");
            });

            $scope.wordlistDown.x = 478;
            $scope.wordlistDown.y = 475;
            $scope.wordlistDown.rotation = 180;
            $scope.wordlistDown.visible = true;

            $scope.mainContainer.addChild($scope.wordlistDown);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          }); //end of get $scope.wordlistDown button


        $scope.searchIcon = new createjs.Bitmap($scope.rootDir + "data/assets/search-icon.png");
        $scope.searchIcon.scaleY = $scope.searchIcon.scaleX = 0.2;
        $scope.searchIcon.x = 430;
        $scope.searchIcon.y = 598;
        $scope.searchIcon.addEventListener("mousedown", function (event) {
          console.log("Mouse down event on $scope.searchIcon button !");
          $scope.searchIcon.alpha = 0.5;
        });

        $scope.searchIcon.addEventListener("pressup", function (event) {
          console.log("Press up event on $scope.searchIcon event!");
          $scope.searchIcon.alpha = 1;
          $scope.stage.update();

          $ionicPopup.show({
            'templateUrl': 'templates/wordlist/wordlistPopup.html',
            'cssClass': 'searchPopupForm',
            "scope": $scope,
            "buttons": [
              {
                "text": 'OK',
                "type": "button-positive",
                onTap: function (e) {
                  $scope.currentWordIndex = 0;
                  loadCurrentWordsSounds();
                }

              }
            ]
          });

        });
        $scope.mainContainer.addChild($scope.searchIcon);

        $scope.wordsContainer = new createjs.Container();
        $scope.wordsContainer.width = $scope.mainContainer.width / 2 - 30;
        $scope.wordsContainer.height = $scope.mainContainer.height - 150;
        $scope.wordsContainer.x = 20;
        $scope.wordsContainer.y = 50;

        var wordsContainerGraphics = new createjs.Graphics().beginFill("white").drawRect(0, 0,
          $scope.wordsContainer.width,
          $scope.wordsContainer.height);
        $scope.wordsContainer.indexBackground = new createjs.Shape(wordsContainerGraphics);
        $scope.wordsContainer.addChild($scope.wordsContainer.indexBackground);

        $scope.noResultsFounds = new createjs.Text("No results found...", "30px Arial", "black");
        $scope.noResultsFounds.x = 80;
        $scope.noResultsFounds.y = 220;
        $scope.noResultsFounds.visible = false;
        $scope.wordsContainer.addChild($scope.noResultsFounds);

        $scope.wordText = [];
        $scope.wordTextLessonNumber = [];
        $scope.wordTextContainers = [];
        $scope.wordTextContainersBg = [];

        _.each(new Array(11), function (item, i, l) {

          $scope.wordTextContainers[i] = new createjs.Container();
          $scope.wordTextContainers[i].width = $scope.wordsContainer.width;
          $scope.wordTextContainers[i].height = 40;
          $scope.wordTextContainers[i].x = 0;
          $scope.wordTextContainers[i].y = 45 * i + 15;

          var wordsContainerGraphics = new createjs.Graphics().beginFill("lightgreen").drawRect(0, 0,
            $scope.wordTextContainers[i].width,
            $scope.wordTextContainers[i].height);
          $scope.wordTextContainersBg[i] = new createjs.Shape(wordsContainerGraphics);
          $scope.wordTextContainers[i].hitArea = $scope.wordTextContainersBg[i];
          $scope.wordTextContainersBg[i].visible = false;

          $scope.wordTextContainers[i].addChild($scope.wordTextContainersBg[i]);

          $scope.wordText[i] = new createjs.Text("", "30px Arial", "black");
          $scope.wordText[i].x = 20;
          $scope.wordText[i].maxWidth = $scope.wordTextContainers[i].width - 60;

          $scope.wordTextLessonNumber[i] = new createjs.Text("", "25px Arial", "grey");
          $scope.wordTextLessonNumber[i].x = 370;
          $scope.wordTextLessonNumber[i].y = 5;

          $scope.wordTextContainers[i].addEventListener("mousedown", function (event) {
            console.log("Mouse down event on Menu button !", i);
            $scope.wordTextContainersBg[i].alpha = 0.5;
            $scope.stage.update();
            _.each($scope.wordTextContainersBg, function (bg, bgkey, l) {
              if (bgkey !== i) {
                $scope.wordTextContainersBg[bgkey].visible = false;
              } else {
                $scope.wordTextContainersBg[i].visible = true;
              }
            });
            $scope.stage.update();

          });

          $scope.wordTextContainers[i].addEventListener("pressup", function (event) {
            console.log("Press up event on Menu event!", i);
            $scope.wordTextContainersBg[i].alpha = 1;
            $scope.stage.update();
            $scope.currentWord = $scope.wordlist[i];
            playWord();
          });

          $scope.wordTextContainers[i].addChild($scope.wordTextContainersBg[i]);
          $scope.wordTextContainers[i].addChild($scope.wordTextLessonNumber[i]);
          $scope.wordTextContainers[i].addChild($scope.wordText[i]);
          $scope.wordsContainer.addChild($scope.wordTextContainers[i]);

        });

        $scope.mainContainer.addChild($scope.wordsContainer);


        $scope.translationContainer = new createjs.Container();
        $scope.translationContainer.width = $scope.mainContainer.width / 2 - 70;
        $scope.translationContainer.height = $scope.mainContainer.height / 2 - 100;
        $scope.translationContainer.x = 480;
        $scope.translationContainer.y = 50;

        var translationContainerGraphics = new createjs.Graphics().beginFill("white").drawRect(0, 0,
          $scope.translationContainer.width,
          $scope.translationContainer.height);
        $scope.translationContainer.indexBackground = new createjs.Shape(translationContainerGraphics);
        $scope.translationContainer.addChild($scope.translationContainer.indexBackground);

        var translationTitle = new createjs.Text("Translation", "30px Arial", "black");
        translationTitle.x = 20;
        translationTitle.y = 20;
        $scope.translationContainer.addChild(translationTitle);

        $scope.translationText = new createjs.Text("", "20px Arial", "black");
        $scope.translationText.x = 20;
        $scope.translationText.y = 80;
        $scope.translationText.lineWidth = 325;
        $scope.translationContainer.addChild($scope.translationText);

        $scope.mainContainer.addChild($scope.translationContainer);


        $scope.exampleContainer = new createjs.Container();
        $scope.exampleContainer.width = $scope.mainContainer.width / 2 - 70;
        $scope.exampleContainer.height = $scope.mainContainer.height / 2 - 100;
        $scope.exampleContainer.x = 480;
        $scope.exampleContainer.y = 335;

        var exampleContainerGraphics = new createjs.Graphics().beginFill("white").drawRect(0, 0,
          $scope.exampleContainer.width,
          $scope.exampleContainer.height);
        $scope.exampleContainer.indexBackground = new createjs.Shape(exampleContainerGraphics);
        $scope.exampleContainer.addChild($scope.exampleContainer.indexBackground);

        var exampleTitle = new createjs.Text("Example", "30px Arial", "black");
        exampleTitle.x = 20;
        exampleTitle.y = 20;
        $scope.exampleContainer.addChild(exampleTitle);

        $scope.exampleText = new createjs.Text("", "20px Arial", "black");
        $scope.exampleText.x = 20;
        $scope.exampleText.y = 80;
        $scope.exampleText.lineWidth = 325;
        $scope.exampleContainer.addChild($scope.exampleText);


        $scope.mainContainer.addChild($scope.exampleContainer);

        $http.get($scope.rootDir + "data/assets/techVocabulary.json")
          .success(function (response) {

            console.log("respone", response);
            $scope.allWordlist = response;

            checkLessonsDownloaded(function () {
              $scope.currentWordIndex = 0;
              loadCurrentWordsSounds();
            });
          })
          .error(function (error) {
            console.error("Error on getting json for the url...:", error);
          });

      }); //end of image on complete
    }, 500); //end of timeout


    var buildLessonsBoard = function (type) {

      $scope.wordsContainer.visible = false;
      $scope.translationContainer.visible = false;
      $scope.exampleContainer.visible = false;
      $scope.wordlistSingleLessonButton.visible = false;
      $scope.wordlistAllButton.visible = false;
      $scope.searchIcon.visible = false;
      $scope.wordlistGreekToEnglishButton.visible = false;
      $scope.wordlistEnglishToGreekButton.visible = false;
      $scope.wordlistPhrasesButton.visible = false;
      $scope.wordlistWordsButton.visible = false;
      $scope.wordlistAllLettersButton.visible = false;
      $scope.wordlistSingleLettersButton.visible = false;

      $scope.lessonsContainer = new createjs.Container();
      $scope.lessonsContainer.width = $scope.mainContainer.width - 20;
      $scope.lessonsContainer.height = $scope.mainContainer.height - 20;
      $scope.lessonsContainer.x = 10;
      $scope.lessonsContainer.y = 10;

      var lessonsConGraphics = new createjs.Graphics().beginFill("green").drawRect(0, 0,
        $scope.lessonsContainer.width,
        $scope.lessonsContainer.height);
      $scope.lessonsContainer.indexBackground = new createjs.Shape(lessonsConGraphics);

      $scope.lessonsContainer.addChild($scope.lessonsContainer.indexBackground);

      $scope.lessonContainerBtn = [];
      $scope.lessonContainerBtnWord = [];
      var lessonsContainerGraphics = [];


      if (type === "lessons") {

        console.log("_.allKeys($scope.allWordlist)", _.allKeys($scope.allWordlist));
        _.each(_.allKeys($scope.allWordlist), function (lesson, key, l) {

          $scope.lessonContainerBtn[key] = new createjs.Container();
          $scope.lessonContainerBtn[key].width = 120;
          $scope.lessonContainerBtn[key].height = 40;

          console.log("mod", key, parseInt(key / 6));
          $scope.lessonContainerBtn[key].x = 130 * (key - parseInt(key / 6) * 6) + 40;
          $scope.lessonContainerBtn[key].y = 60 * parseInt(key / 6) + 100;

          lessonsContainerGraphics[key] = new createjs.Graphics().beginFill("white").drawRect(0, 0,
            $scope.lessonContainerBtn[key].width,
            $scope.lessonContainerBtn[key].height);
          $scope.lessonContainerBtn[key].indexBackground = new createjs.Shape(lessonsContainerGraphics[key]);
          $scope.lessonContainerBtn[key].addChild($scope.lessonContainerBtn[key].indexBackground);
          $scope.lessonContainerBtn[key].hitArea = $scope.lessonContainerBtn[key].indexBackground;
          $scope.lessonContainerBtnWord[key] = new createjs.Text("Lesson " + (key + 1), "20px Arial", "black");
          $scope.lessonContainerBtnWord[key].x = 13;
          $scope.lessonContainerBtnWord[key].y = 10;

          $scope.lessonContainerBtn[key].addEventListener("mousedown", function (event) {
            console.log("Mouse down event on Menu button !");
            $scope.lessonContainerBtn[key].alpha = 0.5;
            $scope.stage.update();

          });

          $scope.lessonContainerBtn[key].addEventListener("pressup", function (event) {
            console.log("Press up event on Menu event!");
            $scope.lessonContainerBtn[key].alpha = 1;
            $scope.lessonNumber = "lesson" + (key + 1);
            $scope.wordsContainer.visible = true;
            $scope.translationContainer.visible = true;
            $scope.exampleContainer.visible = true;
            $scope.lessonsContainer.visible = false;

            $scope.wordlistSingleLessonButton.visible = false;
            $scope.wordlistAllButton.visible = true;

            $scope.wordlistAllLettersButton.visible = false;
            $scope.wordlistSingleLettersButton.visible = true;

            $scope.searchIcon.visible = true;

            if ($scope.translationType === "english") {
              $scope.wordlistGreekToEnglishButton.visible = true;
            } else {
              $scope.wordlistEnglishToGreekButton.visible = true;
            }

            if ($scope.phraseOrWord === "word") {
              $scope.wordlistPhrasesButton.visible = true;
            } else {
              $scope.wordlistWordsButton.visible = true;
            }


            $scope.currentWordIndex = 0;
            $scope.dataSearch.text = "";
            $scope.dataSearch.firstLetter = "";

            $scope.stage.update();
            loadCurrentWordsSounds();
          });

          $scope.lessonContainerBtn[key].addChild($scope.lessonContainerBtnWord[key]);
          $scope.lessonsContainer.addChild($scope.lessonContainerBtn[key]);
        });
      } else {
        var arrayOfLetters = [];
        if ($scope.translationType === "english") {
          arrayOfLetters = ["Aa", "Bb", "Cc", "Dd", "Ee", "Ff", "Gg", "Hh", "Ii", "Jj", "Kk", "Ll", "Mm", "Nn", "Oo", "Pp", "Qq", "Rr", "Ss", "Tt", "Uu", "Vv", "Ww", "Xx", "Yy", "Zz"];
        } else {
          arrayOfLetters = ["Αα", "Ββ", "Γγ", "Δδ", "Εε", "Ζζ", "Ηη", "Θθ", "Ιι", "Κκ", "Λλ", "Μμ", "Νν", "Ξξ", "Οο", "Ππ", "Ρρ", "Σσ", "Ττ", "Υυ", "Φφ", "Χχ", "Ψψ", "Ωω"];
        }

        _.each(arrayOfLetters, function (lesson, key, l) {

          $scope.lessonContainerBtn[key] = new createjs.Container();
          $scope.lessonContainerBtn[key].width = 120;
          $scope.lessonContainerBtn[key].height = 40;

          $scope.lessonContainerBtn[key].x = 130 * (key - parseInt(key / 6) * 6) + 40;
          $scope.lessonContainerBtn[key].y = 60 * parseInt(key / 6) + 100;

          lessonsContainerGraphics[key] = new createjs.Graphics().beginFill("white").drawRect(0, 0,
            $scope.lessonContainerBtn[key].width,
            $scope.lessonContainerBtn[key].height);
          $scope.lessonContainerBtn[key].indexBackground = new createjs.Shape(lessonsContainerGraphics[key]);
          $scope.lessonContainerBtn[key].addChild($scope.lessonContainerBtn[key].indexBackground);
          $scope.lessonContainerBtn[key].hitArea = $scope.lessonContainerBtn[key].indexBackground;
          $scope.lessonContainerBtnWord[key] = new createjs.Text(lesson, "20px Arial", "black");
          $scope.lessonContainerBtnWord[key].x = 50;
          $scope.lessonContainerBtnWord[key].y = 10;

          $scope.lessonContainerBtn[key].addEventListener("mousedown", function (event) {
            console.log("Mouse down event on Menu button !");
            $scope.lessonContainerBtn[key].alpha = 0.5;
            $scope.stage.update();

          });

          $scope.lessonContainerBtn[key].addEventListener("pressup", function (event) {
            console.log("Press up event on Menu event!");
            $scope.lessonContainerBtn[key].alpha = 1;
            $scope.lessonNumber = "all";
            $scope.dataSearch.firstLetter = $scope.lessonContainerBtnWord[key].text[0].toLowerCase();
            $scope.wordsContainer.visible = true;
            $scope.translationContainer.visible = true;
            $scope.exampleContainer.visible = true;
            $scope.lessonsContainer.visible = false;

            $scope.wordlistSingleLessonButton.visible = true;
            $scope.wordlistAllButton.visible = false;

            $scope.wordlistAllLettersButton.visible = true;
            $scope.wordlistSingleLettersButton.visible = false;

            $scope.searchIcon.visible = true;

            if ($scope.translationType === "english") {
              $scope.wordlistGreekToEnglishButton.visible = true;
            } else {
              $scope.wordlistEnglishToGreekButton.visible = true;
            }

            if ($scope.phraseOrWord === "word") {
              $scope.wordlistPhrasesButton.visible = true;
            } else {
              $scope.wordlistWordsButton.visible = true;
            }


            $scope.currentWordIndex = 0;
            $scope.dataSearch.text = "";

            $scope.stage.update();
            loadCurrentWordsSounds();
          });

          $scope.lessonContainerBtn[key].addChild($scope.lessonContainerBtnWord[key]);
          $scope.lessonsContainer.addChild($scope.lessonContainerBtn[key]);
        });
      }


      $scope.cancelButton = new createjs.Container();
      $scope.cancelButton.width = 120;
      $scope.cancelButton.height = 40;
      $scope.cancelButton.x = 370;
      $scope.cancelButton.y = 550;
      var cancelButtonShape = new createjs.Graphics().beginFill("white").drawRect(0, 0,
        $scope.cancelButton.width,
        $scope.cancelButton.height);
      $scope.cancelButton.indexBackground = new createjs.Shape(cancelButtonShape);
      $scope.cancelButton.addChild($scope.cancelButton.indexBackground);
      $scope.cancelButton.hitArea = $scope.cancelButton.indexBackground;
      var cancelWord = new createjs.Text("Cancel", "20px Arial", "black");
      cancelWord.x = 30;
      cancelWord.y = 10;

      $scope.cancelButton.addEventListener("mousedown", function (event) {
        console.log("cancel down event on Menu button !");
        $scope.cancelButton.alpha = 0.5;
        $scope.stage.update();

      });

      $scope.cancelButton.addEventListener("pressup", function (event) {
        console.log("cancel up event on Menu event!");
        $scope.cancelButton.alpha = 1;
        $scope.lessonNumber = "all";
        $scope.wordsContainer.visible = true;
        $scope.translationContainer.visible = true;
        $scope.exampleContainer.visible = true;
        $scope.lessonsContainer.visible = false;

        $scope.wordlistSingleLessonButton.visible = true;
        $scope.wordlistAllButton.visible = false;

        $scope.wordlistAllLettersButton.visible = false;
        $scope.wordlistSingleLettersButton.visible = true;

        $scope.searchIcon.visible = true;

        if ($scope.translationType === "english") {
          $scope.wordlistGreekToEnglishButton.visible = true;
        } else {
          $scope.wordlistEnglishToGreekButton.visible = true;
        }


        if ($scope.phraseOrWord === "word") {
          $scope.wordlistPhrasesButton.visible = true;
        } else {
          $scope.wordlistWordsButton.visible = true;
        }
        $scope.currentWordIndex = 0;
        $scope.dataSearch.text = "";
        $scope.dataSearch.firstLetter = "";

        $scope.stage.update();
        loadCurrentWordsSounds();
      });
      $scope.cancelButton.addChild(cancelWord);
      $scope.lessonsContainer.addChild($scope.cancelButton);

      $scope.mainContainer.addChild($scope.lessonsContainer);

    };

    $scope.playSoundIntervalPromise = $interval(function () {

      _.each($scope.sounds, function (sound, key, list) {
        if ($scope.sounds[key].soundPlaying) {
          $scope.sounds[key].getCurrentPosition(
            function (position) {
              console.log("position", position);
              if (position < 0) {
                $scope.sounds[key].soundPlaying = false;

              }
            },
            function (e) {
              console.log("Error getting pos=" + e);
            }
          );
        }
      });
    }, 500, 0, true);


    var playWord = function () {

      console.log("$scope.currentWord", $scope.currentWord);

      $scope.exampleText.text = $scope.currentWord.example;
      $scope.translationText.text = $scope.currentWord[($scope.translationType === "english" ? "greek" : "english")];

      if ($scope.currentWord && window.cordova && window.cordova.platformId !== "browser") {

        $scope.sounds[$scope.currentWord.audio.split(".")[0]].play();
        $scope.wordlistPlayButton.visible = false;
        $scope.wordlistStopButton.visible = true;

        $timeout(function () {
          $scope.sounds[$scope.currentWord.audio.split(".")[0]].soundPlaying = true;
        }, 500);
      }

    };

    var loadWordUpDown = function (upDown) {

      console.log("wordlistFull", $scope.wordlistFull.length);
      console.log("wordlist", $scope.wordlist.length);

      if (upDown === "down") {

        if ($scope.wordlistFull.length > 11 && $scope.currentWordIndex + 6 < $scope.wordlistFull.length - 1) {

          $scope.currentWordIndex += 5;

        }

      } else if (upDown === "up") {

        if ($scope.wordlistFull.length > 0 && $scope.wordlist[0] !== $scope.wordlistFull[0]) {
          $scope.currentWordIndex -= 5;
        }

      }

      loadCurrentWordsSounds();

    };

    var checkLessonsDownloaded = function (callback) {

      var waterFallFunctions = [];
      console.log("$scope.book.lessonGroups", $scope.book.lessonGroups);
      _.each($scope.book.lessonGroups, function (lessonGroup, k, l) {

        console.log("lessonGroup", lessonGroup);
        _.each(lessonGroup.lessons, function (lesson, key, list) {

          waterFallFunctions.push(function (waterFallCallback) {

            if (!$scope.allWordlist[lesson.id]) {
              return waterFallCallback();
            }

            if ($scope.allWordlist[lesson.id]) {
              $scope.allWordlist[lesson.id].downloaded = true;
            }

            _.each($scope.allWordlist[lesson.id].word, function (word, key, li) {
              $scope.allWordlist[lesson.id].word[key].downloaded = $scope.allWordlist[lesson.id].downloaded;
            });

            _.each($scope.allWordlist[lesson.id].phrase, function (phrase, ph, li) {
              $scope.allWordlist[lesson.id].phrase[ph].downloaded = $scope.allWordlist[lesson.id].downloaded;
            });

            if (!window.cordova || window.cordova.platformId === "browser") {
              return waterFallCallback();
            }

            checkIfLessonIsDownloaded(lesson, function (res) {
              console.log("Lesson Check " + lesson.id, res);

              $scope.allWordlist[lesson.id].downloaded = res;


              _.each($scope.allWordlist[lesson.id].words, function (word, key, li) {
                $scope.allWordlist[lesson.id].word[key].downloaded = $scope.allWordlist[lesson.id].downloaded;
              });

              _.each($scope.allWordlist[lesson.id].phrase, function (phrase, ph, li) {
                $scope.allWordlist[lesson.id].phrase[ph].downloaded = $scope.allWordlist[lesson.id].downloaded;
              });

              waterFallCallback();
            });
          });
        });

      });

      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });

    };

    var checkIfLessonIsDownloaded = function (lesson, callback) {

      $cordovaFile.checkDir($scope.rootDir + "data/lessons/", lesson.id)
        .then(function (success) {
          $http.get($scope.rootDir + "data/lessons/" + lesson.id + "/lessonassets.json")
            .success(function (activities) {

              var parallelFunctions = [];
              _.each(activities["wordlist"], function (file, k, l) {
                parallelFunctions.push(function (parallelCallback) {
                  $cordovaFile.checkFile($scope.rootDir + "data/lessons/" + lesson.id + "/" + key + "/", file)
                    .then(function (success) {
                      parallelCallback(null);
                    }, function (error) {
                      console.log(error);
                      parallelCallback(key + "/" + file);
                    });
                });
              });
              async.parallelLimit(parallelFunctions, 5, function (err, response) {
                if (err) {
                  return callback(false);
                } else {
                  return callback(true);
                }
              });
            })
            .error(function (error) {
              console.log("Error on getting json data for lessonassets...", error);
              callback(false)
            });
        }, function (error) {
          console.log("The lesson folder doesnot exist for lesson", lesson.id);
          callback(false)
        });
    };


    $scope.dataSearch = {
      text: ""
    };


    $scope.searchFilter = function () {

      loadCurrentWordsSounds(true);
      console.log("$scope.wordlistFull", $scope.wordlistFull);
    };

    var loadCurrentWordsSounds = function (doNotLoadSounds) {

      _.each($scope.sounds, function (sound, key, list) {
        $scope.sounds[key].release();
      });
      $scope.sounds = {};
      $scope.noResultsFounds.visible = false;
      console.log("$scope.currentWordIndex", $scope.currentWordIndex);
      $scope.currentWord = "";
      $scope.exampleText.text = "";
      $scope.translationText.text = "";
      $scope.wordlistPlayButton.visible = false;
      $scope.wordlistStopButton.visible = false;

      _.each(new Array(11), function (item, i, l) {
        $scope.wordText[i].text = "";
        $scope.wordTextLessonNumber[i].text = "";
        $scope.wordTextContainersBg[i].visible = false;
        $scope.wordText[i].alpha = 1;
      });

      if (!$scope.phraseOrWord) {
        $scope.phraseOrWord = "word";
      }

      if (!$scope.translationType) {
        $scope.translationType = "english";
      }

      console.log($scope.phraseOrWord, $scope.translationType);

      $scope.wordlistFull = [];

      if ($scope.lessonNumber === "all") {

        _.each($scope.allWordlist, function (lesson) {
          $scope.wordlistFull = _.sortBy(_.uniq(_.union($scope.wordlistFull, lesson[$scope.phraseOrWord])), function (word) {
            return word[$scope.translationType].toLowerCase();
          });
        });

      } else if (!$scope.lessonNumber) {
        $scope.lessonNumber = $scope.selectedLesson.id;
        $scope.wordlistFull = _.sortBy($scope.allWordlist[$scope.lessonNumber][$scope.phraseOrWord], function (word) {
          return word[$scope.translationType].toLowerCase();
        });

      } else {
        $scope.wordlistFull = _.sortBy($scope.allWordlist[$scope.lessonNumber][$scope.phraseOrWord], function (word) {
          return word[$scope.translationType].toLowerCase();
        });
      }

      console.log("$scope.dataSearch.text", $scope.dataSearch.text);

      if ($scope.dataSearch.text) {
        $scope.wordlistFull = _.filter($scope.wordlistFull, function (word) {
          return word[$scope.translationType].toLowerCase().indexOf($scope.dataSearch.text.toLowerCase()) >= 0;
        });
      }

      console.log("$scope.dataSearch.firstLetter", $scope.dataSearch.firstLetter);
      if ($scope.dataSearch.firstLetter) {
        $scope.wordlistFull = _.filter($scope.wordlistFull, function (word) {
          return word[$scope.translationType].toLowerCase().indexOf($scope.dataSearch.firstLetter.toLowerCase()) === 0;
        });
      }

      console.log("$scope.wordlistFull", $scope.wordlistFull);
      if (!$scope.currentWordIndex) {
        $scope.wordlist = _.first($scope.wordlistFull, 11);
      } else {

        $scope.wordlist = _.first(_.rest($scope.wordlistFull, $scope.currentWordIndex), 11)

      }

      if ($scope.wordlist[$scope.wordlist.length - 1] === $scope.wordlistFull[$scope.wordlistFull.length - 1]) {
        $scope.wordlistDown.alpha = 0.5;
      } else {
        $scope.wordlistDown.alpha = 1;
      }

      if ($scope.wordlist[0] === $scope.wordlistFull[0]) {
        $scope.wordlistUp.alpha = 0.5;
      } else {
        $scope.wordlistUp.alpha = 1;
      }

      if ($scope.wordlistFull.length === 11) {

        $scope.wordlistDown.alpha = 0.5;
        $scope.wordlistUp.alpha = 0.5;

      }

      console.log("wordlist", $scope.wordlist);

      if ($scope.wordlist.length === 0) {
        $scope.noResultsFounds.visible = true;
      }
      var waterFallFunctions = [];

      _.each($scope.wordlist, function (word, key, list) {

        waterFallFunctions.push(function (waterfallCallback) {

          $scope.wordText[key].text = word[$scope.translationType];
          $scope.wordTextLessonNumber[key].text = word.lessonNumber;

          if (!$scope.wordlist[key].downloaded) {
            $scope.wordText[key].alpha = 0.5;
          }

          var assetPath = $scope.rootDir + "data/lessons/lesson" + word.lessonNumber + "/wordlist/";

          if (doNotLoadSounds) {
            return waterfallCallback();
          }

          if (ionic.Platform.isIOS() && window.cordova) {
            resolveLocalFileSystemURL(assetPath + word.audio, function (entry) {
              console.log(entry);
              $scope.sounds[word.audio.split(".")[0]] = new Media(entry.toInternalURL(), function () {
                console.log("Sound success");
              }, function (err) {
                console.log("Sound error: ", err);
              }, function (status) {
                console.log("Sound status: ", status);
              });
              waterfallCallback();
            });
          } else {
            if (window.cordova && window.cordova.platformId !== "browser") {
              $scope.sounds[word.audio.split(".")[0]] = new Media(assetPath + word.audio, function () {
                console.log("Sound success");
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

      async.waterfall(waterFallFunctions, function () {

        console.log("sounds are loaded!");
      });


    };

  });

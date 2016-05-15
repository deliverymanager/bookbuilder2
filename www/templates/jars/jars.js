angular.module("bookbuilder2")
  .controller("jarsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

    console.log("jarsController loaded!");

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
        src: $rootScope.rootDir + "data/assets/jars_background.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/jars_background.png");

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
              $scope.stage.update();
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });

              /*Removing all tween before navigating back*/
              $ionicHistory.clearCache();
              createjs.Tween.removeAllTweens();
              $scope.stage.removeAllEventListeners();
              $scope.stage.removeAllChildren();

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

          console.log("Word's groups: ", $scope.activityData.wordsGroups);
          console.warn("Starting init()...");
          init();

        } else {

          /*Getting the activityData from http.get request*/
          console.warn("There is no activity in local storage...Getting the json through $http.get()");
          console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/jars.json")
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

              //Extracting the available groups and adding the wordsGroups property to activityData
              $scope.activityData.wordsGroups = _.groupBy($scope.activityData.questions, "group");
              console.log("Word's groups: ", $scope.activityData.wordsGroups);

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

          //INITIALIZATIONS
          $scope.wordsContainers = {};
          $scope.wordsSprites = {};
          $scope.wordsTexts = {};
          $scope.jars = {};
          $scope.jarsText = {};
          $scope.wordsPlaceholders = {};
          //Configuring placeholders
          _.each($scope.activityData.wordsGroups, function (group, key, list) {
            $scope.wordsPlaceholders[key] = {};
          });

          async.waterfall([
            //Getting the candySprite for the words
            function (initWaterfallCallback) {
              $http.get($rootScope.rootDir + "data/assets/jars_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for check button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  $scope.wordsSpriteSheet = new createjs.SpriteSheet(response);
                  initWaterfallCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for check button: ", error);
                  initWaterfallCallback(true, error);
                });
            },
            //Getting the first jar background
            function (initWaterfallCallback) {
              var firstJarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/jars_jar1.png"
              }));
              firstJarImageLoader.load();

              firstJarImageLoader.on("complete", function (r) {

                //Adding the text for the jar
                initWaterfallCallback(null);
              });//end of firstJarImageLoader
            },
            //Getting the second jar background
            function (initWaterfallCallback) {
              var secondJarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/jars_jar2.png"
              }));
              secondJarImageLoader.load();

              secondJarImageLoader.on("complete", function (r) {

                initWaterfallCallback(null);
              });//end of secondJarImageLoader
            },
            //Getting the third jar background
            function (initWaterfallCallback) {
              var thirdJarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/jars_jar3.png"
              }));
              thirdJarImageLoader.load();

              thirdJarImageLoader.on("complete", function (r) {

                initWaterfallCallback(null);
              });//end of thirdJarImageLoader
            },
            //Getting the fourth jar background
            function (initWaterfallCallback) {
              var fourthJarImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/jars_jar4.png"
              }));
              fourthJarImageLoader.load();

              fourthJarImageLoader.on("complete", function (r) {

                initWaterfallCallback(null);
              });//end of fourthJarImageLoader
            },
            //Adding the jars
            function (initWaterfallCallback) {
              var jarIndex = 0;
              _.each($scope.activityData.wordsGroups, function (group, key, list) {
                /*Creating Bitmap Background for restart button*/

                //Building the image name for the jar
                var imageName = "data/assets/jars_jar" + (jarIndex + 1) + ".png";
                $scope.jars[key] = new createjs.Bitmap($rootScope.rootDir + imageName);
                $scope.jars[key].x = jarIndex === 0 ? 80 : jarIndex === 1 ? 260 : jarIndex === 2 ? 440 : 620;
                $scope.jars[key].y = 230;
                $scope.jars[key].scaleX = $scope.jars[key].scaleY = 0.8;
                $scope.jars[key].jarIndex = jarIndex;
                $scope.jars[key].visible = false;
                $scope.mainContainer.addChild($scope.jars[key]);
                //Incrementing index
                jarIndex++;
              });
              initWaterfallCallback(null);
            },

            //Resolving which jars will be used and adjusting their positions
            function (initWaterfallCallback) {
              if (_.keys($scope.activityData.wordsGroups).length === 4) {
                console.warn("Number of jars: ", 4);
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].visible = true;
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].visible = true;
              } else if (_.keys($scope.activityData.wordsGroups).length === 3) {
                console.warn("Number of jars: ", 3);
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].x + 30;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].x + 50;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].x + 70;

              } else {
                console.warn("Number of jars: ", 2);
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].x = 260;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].visible = true;
                $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].x = 420;
              }
              initWaterfallCallback(null);
            },
            //Adding the texts for every jar
            function (initWaterfallCallback) {

              //Creating text for the first jar
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 0})] = new createjs.Text(_.keys($scope.activityData.wordsGroups)[0], "40px Arial", "white");
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 0})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].x + 80;
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 0})].y = $scope.jars[_.findKey($scope.jars, {"jarIndex": 0})].y + 10;
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 0})].textAlign = "center";
              $scope.mainContainer.addChild($scope.jarsText[_.findKey($scope.jars, {"jarIndex": 0})]);

              //Creating text for the second jar
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 1})] = new createjs.Text(_.keys($scope.activityData.wordsGroups)[1], "40px Arial", "white");
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 1})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].x + 80;
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 1})].y = $scope.jars[_.findKey($scope.jars, {"jarIndex": 1})].y + 10;
              $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 1})].textAlign = "center";
              $scope.mainContainer.addChild($scope.jarsText[_.findKey($scope.jars, {"jarIndex": 1})]);

              if (_.keys($scope.activityData.wordsGroups).length === 3) {

                //Creating text for the third jar
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 2})] = new createjs.Text(_.keys($scope.activityData.wordsGroups)[2], "40px Arial", "white");
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 2})].x = $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].x + 80;
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 2})].y = $scope.jars[_.findKey($scope.jars, {"jarIndex": 2})].y + 10;
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 2})].textAlign = "center";
                $scope.mainContainer.addChild($scope.jarsText[_.findKey($scope.jars, {"jarIndex": 2})]);

              } else if (_.keys($scope.activityData.wordsGroups).length === 4) {

                //Creating text for the fourth jar
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})] = new createjs.Text(_.keys($scope.activityData.wordsGroups)[3], "40px Arial", "white");
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].x = $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].x + 80;
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].y = $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].y + 10;
                $scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})].textAlign = "center";
                $scope.mainContainer.addChild($scope.jarsText[_.findKey($scope.jars, {"jarIndex": 3})]);
              }
              initWaterfallCallback(null);
            },

            //Getting placeholder image
            function (initWaterfallCallback) {
              var wordPlaceholderImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/jars_placeholder.png"
              }));
              wordPlaceholderImageLoader.load();

              wordPlaceholderImageLoader.on("complete", function (r) {

                initWaterfallCallback(null);
              });
            },

            //Filling the jars with candy placeholders
            function (initWaterfallCallback) {

              _.each($scope.activityData.wordsGroups, function (group, groupKey, groupList) {
                _.each(new Array(5), function (placeholder, key, list) {

                  console.log("Group Key is: ", groupKey);
                  console.log("Index of placeholder: ", key);
                  $scope.wordsPlaceholders[groupKey][key] = new createjs.Bitmap($rootScope.rootDir + "data/assets/jars_placeholder.png");
                  $scope.wordsPlaceholders[groupKey][key].x = $scope.jars[groupKey].x + 20;
                  $scope.wordsPlaceholders[groupKey][key].y = key === 0 ? $scope.jars[groupKey].y + 90 : $scope.wordsPlaceholders[groupKey][key - 1].y + 37;
                  $scope.mainContainer.addChild($scope.wordsPlaceholders[groupKey][key]);
                })
              });
              initWaterfallCallback(null);
            },
            //Creating activity Score Text
            function (initWaterfallCallback) {

              //Adding Score Text background
              var scoreTextGraphic = new createjs.Graphics().beginFill("blue").drawRect(90, 545, 187, 47);
              var scoreTextBackground = new createjs.Shape(scoreTextGraphic);
              $scope.mainContainer.addChild(scoreTextBackground);

              /*Adding Score Text*/
              $scope.scoreText = new createjs.Text("Score: " + "0" + " / " + $scope.activityData.questions.length, "30px Arial", "white");
              $scope.scoreText.x = 100;
              $scope.scoreText.y = 550;
              $scope.mainContainer.addChild($scope.scoreText);

              initWaterfallCallback(null);
            },
            //Adding Check answers button
            function (initWaterfallCallback) {
              $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for check button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  /*Mouse down event*/
                  $scope.checkButton.on("mousedown", function (event) {
                    $scope.checkButton.alpha = 0.5;
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.checkButton.on("pressup", function (event) {
                    console.log("Click on Check Answers button!");
                    $scope.checkButton.alpha = 1;
                    console.log("Checking the answers...");
                    checkActivity();
                  });

                  $scope.checkButton.x = 380;
                  $scope.checkButton.y = 543;
                  $scope.checkButton.gotoAndPlay("normal");
                  $scope.mainContainer.addChild($scope.checkButton);
                  initWaterfallCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for check button: ", error);
                  initWaterfallCallback(true, error);
                });
            },
            //Adding Restart button
            function (initWaterfallCallback) {
              $http.get($rootScope.rootDir + "data/assets/restart_button_drag_and_drop_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for restart button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var restartTotalButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.restartTotalButton = new createjs.Sprite(restartTotalButtonSpriteSheet, "normal");

                  /*Mouse down event*/
                  $scope.restartTotalButton.on("mousedown", function (event) {
                    $scope.restartTotalButton.alpha = 0.5;
                    $scope.stage.update();
                  });

                  /*Press up event*/
                  $scope.restartTotalButton.on("pressup", function (event) {
                    console.log("Click on Restart button!");
                    $scope.restartTotalButton.alpha = 1;
                    $scope.stage.update();

                    restartActivity();

                  });//End of press up element

                  $scope.restartTotalButton.x = 600;
                  $scope.restartTotalButton.y = 558;
                  $scope.restartTotalButton.gotoAndPlay("normal");
                  $scope.mainContainer.addChild($scope.restartTotalButton);
                  initWaterfallCallback(null);

                })
                .error(function (error) {
                  console.log("Error on getting json data for check button: ", error);
                  initWaterfallCallback(true, error);
                });
            },
            //Adding NextActivity button
            function (initWaterfallCallback) {
              /*NEXT BUTTON*/
              $http.get($rootScope.rootDir + "data/assets/next_activity_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var nextButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.nextButton = new createjs.Sprite(nextButtonSpriteSheet, "normal");
                  $scope.nextButton.alpha = 0.5;

                  $scope.nextButton.on("mousedown", function (event) {
                    console.log("mousedown event on a button !", $scope.activityData.completed);
                    $scope.nextButton.alpha = 0.5;
                    if ($scope.activityData.completed) {
                      $scope.nextButton.gotoAndPlay("onSelection");
                    }
                    $scope.stage.update();
                  });
                  $scope.nextButton.on("pressup", function (event) {
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
                  initWaterfallCallback(null);
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initWaterfallCallback(true, error);
                });
            },
            //Building the candies
            function (initWaterfallCallback) {

              _.each(new Array(10), function (word, key, list) {

                //Creating the word sprite
                $scope.wordsSprites[key] = new createjs.Sprite($scope.wordsSpriteSheet, "pink");

                //Building the containers
                $scope.wordsContainers[key] = new createjs.Container();
                $scope.wordsContainers[key].width = $scope.wordsSprites[key].getBounds().width;
                $scope.wordsContainers[key].height = $scope.wordsSprites[key].getBounds().height;
                $scope.wordsContainers[key].x = key === 0 || key === 5 ? 80 : $scope.wordsContainers[key - 1].x + 140;
                $scope.wordsContainers[key].y = key <= 4 ? 100 : 150;
                $scope.wordsContainers[key].startingPointX = $scope.wordsContainers[key].x;
                $scope.wordsContainers[key].startingPointY = $scope.wordsContainers[key].y;
                $scope.mainContainer.addChild($scope.wordsContainers[key]);

                //Events
                $scope.wordsContainers[key].on("mousedown", function (evt) {

                  console.log("Mouse down event on candy!");
                  //Check if completed
                  if ($scope.activityData.completed) {
                    console.warn("Activity completed cannot move!");

                    if ($scope.wordsTexts[key].text === $scope.activityData.questions[key].word) {
                      console.log("Toggle text, showing correctWord");
                      $scope.wordsTexts[key].text = $scope.activityData.questions[key].correctWord;
                    } else {
                      console.log("Toggle text, showing word");
                      $scope.wordsTexts[key].text = $scope.activityData.questions[key].word;
                    }
                    return;
                  }

                  if (window.cordova && window.cordova.platformId !== "browser") {
                    $scope.sounds["drag"].play();
                  }
                  var global = $scope.mainContainer.localToGlobal(this.x, this.y);

                  this.offset = {
                    'x': global.x - evt.stageX,
                    'y': global.y - evt.stageY
                  };
                  this.global = {
                    'x': global.x,
                    'y': global.y
                  };
                });

                $scope.wordsContainers[key].on("pressmove", function (evt) {
                  console.log("Press move event on candy!");
                  //Check if completed
                  if ($scope.activityData.completed) {
                    console.warn("Activity completed cannot move!");
                    return;
                  }
                  var local = $scope.mainContainer.globalToLocal(evt.stageX + this.offset.x, evt.stageY + this.offset.y);
                  this.x = local.x;
                  this.y = local.y;
                });

                $scope.wordsContainers[key].on("pressup", function (evt) {
                  console.log("Press up event on candy!");
                  //Check if completed
                  if ($scope.activityData.completed) {
                    console.warn("Activity completed cannot move!");
                    return;
                  }

                  if (window.cordova && window.cordova.platformId !== "browser") {
                    $scope.sounds["drop"].play();
                  }

                  var collisionDetectedQuestion = collision(evt.stageX / scale - $scope.mainContainer.x / scale, evt.stageY / scale - $scope.mainContainer.y / scale);

                  if (collisionDetectedQuestion !== -1) {

                    //There is collision
                    console.warn("There is collision! : ", collisionDetectedQuestion);

                    this.x = $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": collisionDetectedQuestion.groupKey})][collisionDetectedQuestion.index].x;
                    this.y = $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": collisionDetectedQuestion.groupKey})][collisionDetectedQuestion.index].y;

                    //Adding the selected word to current userChoices
                    $scope.activityData.questions[key].userChoice = _.findKey($scope.jars, {"jarIndex": collisionDetectedQuestion.groupKey});

                    //Saving it to localStorage
                    save();

                  } else {
                    console.warn("No collision occurred...");

                    /*No collision going back to start point*/
                    createjs.Tween.get(this, {loop: false})
                      .to({
                        x: this.startingPointX,
                        y: this.startingPointY
                      }, 200, createjs.Ease.getPowIn(2));

                    //If the user deselects a letter it has to be removed from the userChoices array
                    $scope.activityData.questions[key].userChoice = "";
                    save();
                  }
                });

                $scope.wordsSprites[key].x = 0;
                $scope.wordsSprites[key].y = 0;
                $scope.wordsContainers[key].addChild($scope.wordsSprites[key]);

                //Creating the bombs text
                $scope.wordsTexts[key] = new createjs.Text("", "20px Arial", "white");
                $scope.wordsTexts[key].x = 63;
                $scope.wordsTexts[key].y = 3;
                $scope.wordsTexts[key].textAlign = "center";
                $scope.wordsTexts[key].maxWidth = $scope.wordsContainers[key].width - 10;
                $scope.wordsContainers[key].addChild($scope.wordsTexts[key]);
              });

              initWaterfallCallback(null);
            }
          ], function (error, result) {
            if (error) {
              console.error("There was an error during init waterfall process...:", result);
            } else {
              console.log("Success during init waterfall process!");
              //Loading game
              loadGame();
            }
          })
        }

        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/

        //Function for saving
        function save() {
          //Saving it to localStorage
          window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
        }


        //Function that loads the game after initialization
        function loadGame() {

          //Populating the wordsTexts
          _.each($scope.activityData.questions, function (container, key, list) {
            $scope.wordsTexts[key].text = $scope.activityData.questions[key].word;
          });

          //Checking activity has completed
          if ($scope.activityData.completed) {
            checkActivity();
            return;
          }

          //Checking if user already made choices and moves the words that have userChoice

          var firstJarIndex = 0;
          var secondJarIndex = 0;
          var thirdJarIndex = 0;
          var fourthJarIndex = 0;

          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].userChoice !== "") {

              if ($scope.activityData.questions[key].userChoice === _.findKey($scope.jars, {"jarIndex": 0})) {
                //Tween the container to the right jar
                createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                  .to({
                    x: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][firstJarIndex].x,
                    y: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][firstJarIndex].y
                  }, 200, createjs.Ease.getPowIn(2));

                firstJarIndex++;

              } else if ($scope.activityData.questions[key].userChoice === _.findKey($scope.jars, {"jarIndex": 1})) {
                //Tween the container to the right jar
                createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                  .to({
                    x: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][secondJarIndex].x,
                    y: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][secondJarIndex].y
                  }, 200, createjs.Ease.getPowIn(2));

                secondJarIndex++;

              } else if ($scope.activityData.questions[key].userChoice === _.findKey($scope.jars, {"jarIndex": 2})) {
                //Tween the container to the right jar
                createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                  .to({
                    x: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][thirdJarIndex].x,
                    y: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][thirdJarIndex].y
                  }, 200, createjs.Ease.getPowIn(2));

                thirdJarIndex++;
              } else {
                //Tween the container to the right jar
                createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                  .to({
                    x: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][fourthJarIndex].x,
                    y: $scope.wordsPlaceholders[$scope.activityData.questions[key].userChoice][fourthJarIndex].y
                  }, 200, createjs.Ease.getPowIn(2));

                fourthJarIndex++;
              }
            }
          });
        }


        /*Function that handles collision*/
        function collision(x, y) {

          console.log("Collision stageX: ", x);
          console.log("Collision stageY: ", y);

          var emptyWordsPlaceholder = true;

          for (var i = 0; i < _.keys($scope.wordsPlaceholders).length; i++) {
            for (var j = 0; j < 5; j++) {
              if (ionic.DomUtil.rectContains(
                  x,
                  y,
                  $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].x,
                  $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].y,
                  $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].x + $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].getBounds().width,
                  $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].y + $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].getBounds().height
                )) {

                //Checking if there is already a letter
                _.each($scope.wordsContainers, function (container, key, list) {
                  if ($scope.wordsContainers[key].x === $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].x
                    && $scope.wordsContainers[key].y === $scope.wordsPlaceholders[_.findKey($scope.jars, {"jarIndex": i})][j].y) {
                    emptyWordsPlaceholder = false;
                  }
                });

                //Last check if there is already a letter in the container collision happened
                if (!emptyWordsPlaceholder) {
                  console.warn("There is collision but there is already a letter in this position...");
                  return -1;

                } else {
                  //There is collision
                  console.log("Collision returns group: ", i);
                  console.log("Collision returns index: ", j);
                  return {
                    "groupKey": i,
                    "index": j
                  };
                }
              }//end of if
            }
          }
          //No collision
          return -1;
        }


        //Function for checking activity
        function checkActivity() {

          //Move everything back
          _.each($scope.wordsContainers, function (container, key, list) {
            $scope.wordsContainers[key].x = $scope.wordsContainers[key].startingPointX;
            $scope.wordsContainers[key].y = $scope.wordsContainers[key].startingPointY;
          });

          //Tween everything to the right jar
          var firstJarIndex = 0;
          var secondJarIndex = 0;
          var thirdJarIndex = 0;
          var fourthJarIndex = 0;

          _.each($scope.activityData.questions, function (question, key, list) {
            if ($scope.activityData.questions[key].group === _.findKey($scope.jars, {"jarIndex": 0})) {
              //Tween the container to the right jar
              createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                .to({
                  x: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][firstJarIndex].x,
                  y: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][firstJarIndex].y
                }, 200, createjs.Ease.getPowIn(2));

              firstJarIndex++;

            } else if ($scope.activityData.questions[key].group === _.findKey($scope.jars, {"jarIndex": 1})) {
              //Tween the container to the right jar
              createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                .to({
                  x: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][secondJarIndex].x,
                  y: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][secondJarIndex].y
                }, 200, createjs.Ease.getPowIn(2));

              secondJarIndex++;

            } else if ($scope.activityData.questions[key].group === _.findKey($scope.jars, {"jarIndex": 2})) {
              //Tween the container to the right jar
              createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                .to({
                  x: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][thirdJarIndex].x,
                  y: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][thirdJarIndex].y
                }, 200, createjs.Ease.getPowIn(2));

              thirdJarIndex++;
            } else {
              //Tween the container to the right jar
              createjs.Tween.get($scope.wordsContainers[key], {loop: false})
                .to({
                  x: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][fourthJarIndex].x,
                  y: $scope.wordsPlaceholders[$scope.activityData.questions[key].group][fourthJarIndex].y
                }, 200, createjs.Ease.getPowIn(2));

              fourthJarIndex++;
            }
          });


          var rightAnswers = 0;
          //Checking for the right answers
          _.each($scope.activityData.questions, function (question, key, list) {

            if ($scope.activityData.questions[key].userChoice !== "") {
              if ($scope.activityData.questions[key].userChoice === $scope.activityData.questions[key].group) {
                $scope.wordsSprites[key].gotoAndPlay("green");
                rightAnswers++;
              } else {
                $scope.wordsSprites[key].gotoAndPlay("red");
              }
            } else {
              $scope.wordsSprites[key].gotoAndPlay("red");
            }
          });

          //Updating score
          $scope.scoreText.text = "Score: " + rightAnswers + " / " + $scope.activityData.questions.length;

          //Setting completed activity false
          $scope.activityData.completed = true;
          $scope.nextButton.gotoAndPlay("selected");

          //Saving
          save();

        }

        //Function for restarting activity
        function restartActivity() {

          //Getting all container to their starting points
          _.each($scope.wordsContainers, function (container, key, list) {
            $scope.wordsSprites[key].gotoAndPlay("pink");
            createjs.Tween.get($scope.wordsContainers[key], {loop: false})
              .to({
                x: $scope.wordsContainers[key].startingPointX,
                y: $scope.wordsContainers[key].startingPointY
              }, 200, createjs.Ease.getPowIn(2));
          });

          //Erasing any user choice activity
          _.each($scope.activityData.questions, function (question, key, list) {
            $scope.activityData.questions[key].userChoice = "";
          });

          //Updating score
          $scope.scoreText.text = "Score: " + "0" + " / " + $scope.activityData.questions.length;

          //Setting completed activity false
          $scope.activityData.completed = false;
          $scope.nextButton.gotoAndPlay("normal");

          //Saving
          save();
        }

      });//end of image on complete
    }, 500);//end of timeout
  })
;

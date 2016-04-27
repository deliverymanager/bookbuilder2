angular.module("bookbuilder2")
  .controller("wizardController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, TypicalFunctions) {

    console.log("wizardController loaded!");

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
        src: $rootScope.rootDir + "data/assets/wizard_results_table.png"
      }));

      imageLoader.load();

      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/wizard_results_table.png");

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

        var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
        var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
        mainContainerBackground.alpha = 0.5;

        $scope.mainContainer.addChild(mainContainerBackground);


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
          $scope.pageTitleAndDescription = new createjs.Text($scope.activityData.title + " - " + $scope.activityData.description, "23px Arial", "white");
          $scope.pageTitleAndDescription.x = 85;
          $scope.pageTitleAndDescription.y = 623;
          $scope.mainContainer.addChild($scope.pageTitleAndDescription);

          init();

        } else {

          /*Getting the activityData from http.get request*/
          console.warn("There is no activity in local storage...Getting the json through $http.get()");
          console.log("selectedLesson.id: ", $rootScope.selectedLesson.id);
          console.log("activityFolder: ", $rootScope.activityFolder);

          $http.get($rootScope.rootDir + "data/lessons/" + $rootScope.selectedLesson.id + "/" + $rootScope.activityFolder + "/wizard.json")
            .success(function (response) {
              console.log("Success on getting json for the url. The response object is: ", response);

              //Assigning configured response to activityData
              $scope.activityData = response;
              $scope.activityData.attempts = 1;

              init();

              //Saving it to localStorage
              window.localStorage.setItem(activityNameInLocalStorage, JSON.stringify($scope.activityData));
            })
            .error(function (error) {
              console.error("Error on getting json for the url...:", error);
            });
        }

        /*Function init() that initializes almost everything*/
        function init() {

          /*1. Dividing th activity data into the two separate groups*/
          $scope.questionsGroups = _.groupBy($scope.activityData.questions, "group");
          console.log("Group 1: ", $scope.questionsGroups["group_1"]);
          console.log("Group 2: ", $scope.questionsGroups["group_2"]);

          $scope.englishWords = {};
          $scope.greekWords = {};

          /*2. Dividing questionsGroup 1 into subgroups by language*/
          $scope.englishWords["group_1"] = _.groupBy($scope.questionsGroups["group_1"], "englishWord");
          $scope.greekWords["group_1"] = _.groupBy($scope.questionsGroups["group_1"], "greekWord");
          console.log("Group 1 English words: ", $scope.englishWords["group_1"]);
          console.log("Group 1 Greek words: ", $scope.greekWords["group_1"]);

          /*3. Dividing questionsGroup 2 into subgroups by language*/
          $scope.englishWords["group_2"] = _.groupBy($scope.questionsGroups["group_2"], "englishWord");
          $scope.greekWords["group_2"] = _.groupBy($scope.questionsGroups["group_2"], "greekWord");
          console.log("Group 2 English words: ", $scope.englishWords["group_2"]);
          console.log("Group 2 Greek words: ", $scope.greekWords["group_2"]);

          $scope.englishWordsContainers = {};
          $scope.greekWordsContainers = {};
          $scope.englishWordsBackgrounds = {};
          $scope.greekWordsBackgrounds = {};
          $scope.englishWordsTexts = {};
          $scope.greekWordsTexts = {};
          $scope.checkboxes = {};


          async.waterfall([

            /*Check Button*/
            function(initCallback){
              $http.get($rootScope.rootDir + "data/assets/check_answers_drag_and_drop_sprite.json")
                .success(function (response) {
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkButtonSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.checkButton = new createjs.Sprite(checkButtonSpriteSheet, "normal");

                  if (!$scope.activityData.completed) {
                    $scope.checkButton.alpha = 1;
                  } else {
                    $scope.checkButton.alpha = 0.5;
                  }

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
                      check();
                    }
                  });

                  $scope.checkButton.x = 370;
                  $scope.checkButton.y = 560;
                  $scope.mainContainer.addChild($scope.checkButton);
                  initCallback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initCallback();
                });
            },

            /*Restart Button*/
            function(initCallback){
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
                    restart();
                  });
                  $scope.restartButton.x = 160;
                  $scope.restartButton.y = 570;
                  $scope.mainContainer.addChild($scope.restartButton);
                  initCallback();
                })
                .error(function (error) {
                  console.log("Error on getting json data for return button...", error);
                  initCallback();
                });
            },

            /*Score Text*/
            function(initCallback){
              initCallback();
            },

            /*Next Activity Button*/
            function(initCallback){
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
                  $scope.nextButton.x = 810;
                  $scope.nextButton.y = 655;
                  $scope.mainContainer.addChild($scope.nextButton);
                  $scope.stage.update();
                  initCallback();
                })
                .error(function (error) {

                  console.log("Error on getting json data for check button...", error);
                  initCallback();
                });
            },

            /*Getting the sprite of checkbox*/
            function(initCallback){
              $http.get($rootScope.rootDir + "data/assets/wizard_tick_wrong_bubble_sprite.json")
                .success(function (response) {
                  //Reassigning images with the rest of resource
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                  var checkboxSpriteSheet = new createjs.SpriteSheet(response);

                  initCallback(null, checkboxSpriteSheet);

                })
                .error(function (error) {
                  initCallback(true, error);
                  console.log("Error on getting json data for checkbox...", error);
                });
            },

            /*Creating the game, first foreach word a container, a shape and text is created*/
            function(restartButtonSpriteSheet, initCallback){
              _.each($scope.questionsGroups, function (group, key, list) {

                /*Deploying the english words*/
                _.each($scope.englishWords[key], function (word, wordKey, wordList) {

                  /* 1.A. The container for the english words*/
                  $scope.englishWordsContainers[wordKey] = new createjs.Container();
                  $scope.englishWordsContainers[wordKey].width = 170;
                  $scope.englishWordsContainers[wordKey].height = 35;
                  $scope.englishWordsContainers[wordKey].x = 80;

                  var englishWordsContainersKeys = _.allKeys($scope.englishWordsContainers);
                  console.log("englishWordsContainersKeys: ", englishWordsContainersKeys);
                  var currentEnglishWordIndex = _.indexOf(englishWordsContainersKeys, wordKey);
                  console.log("currentEnglishWordIndex: ", currentEnglishWordIndex);

                  if(currentEnglishWordIndex >= 1){
                    console.log("It's not the first iteration...");
                    console.log("currentEnglishWordIndex: ", currentEnglishWordIndex);
                    var previousEnglishWordKey = englishWordsContainersKeys[currentEnglishWordIndex - 1 ];
                    console.log("previousEnglishWordKey: ",previousEnglishWordKey)
                  }

                  /*Checking if tits the first element to enter*/
                  $scope.englishWordsContainers[wordKey].y = (key === "group_2" && currentEnglishWordIndex === 5) ? $scope.englishWordsContainers[previousEnglishWordKey].y+60 : (currentEnglishWordIndex === 0 ? 100 : $scope.englishWordsContainers[previousEnglishWordKey].y + 40);

                  $scope.mainContainer.addChild($scope.englishWordsContainers[wordKey]);

                  /* 2.A. Creating the letterBackground*/
                  var englishWordsGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.englishWordsContainers[wordKey].width, $scope.englishWordsContainers[wordKey].height);
                  $scope.englishWordsBackgrounds[wordKey] = new createjs.Shape(englishWordsGraphic);
                  $scope.englishWordsContainers[wordKey].addChild($scope.englishWordsBackgrounds[wordKey]);

                  /* 3.A Adding text*/
                  $scope.englishWordsTexts[wordKey] = new createjs.Text($scope.englishWords[key][wordKey][0].englishWord, "20px Arial", "white");
                  $scope.englishWordsTexts[wordKey].x = $scope.englishWordsContainers[wordKey].width / 2;
                  $scope.englishWordsTexts[wordKey].y = $scope.englishWordsContainers[wordKey].height / 2;
                  $scope.englishWordsTexts[wordKey].textAlign = "center";
                  $scope.englishWordsTexts[wordKey].textBaseline = "middle";
                  $scope.englishWordsContainers[wordKey].addChild($scope.englishWordsTexts[wordKey]);

                });

                /* Deploying the greek words */
                _.each($scope.greekWords[key], function (word, wordKey, wordList) {

                  /* 1.B. The container for the greek words*/
                  $scope.greekWordsContainers[wordKey] = new createjs.Container();
                  $scope.greekWordsContainers[wordKey].width = 170;
                  $scope.greekWordsContainers[wordKey].height = 35;
                  $scope.greekWordsContainers[wordKey].x = 350;

                  var greekWordsContainersKeys = _.allKeys($scope.greekWordsContainers);
                  console.log("greekWordsContainersKeys: ", greekWordsContainersKeys);
                  var currentGreekWordIndex = _.indexOf(greekWordsContainersKeys, wordKey);
                  console.log("currentGreekWordIndex: ", currentGreekWordIndex);

                  if(currentGreekWordIndex >= 1){
                    console.log("It's not the first iteration...");
                    console.log("currentGreekWordIndex: ", currentGreekWordIndex);
                    var previousGreekWordKey = greekWordsContainersKeys[currentGreekWordIndex - 1 ];
                    console.log("previousGreekWordKey: ", previousGreekWordKey);
                  }

                  /*Checking if its the first element to enter*/
                  $scope.greekWordsContainers[wordKey].y = (key === "group_2" && currentGreekWordIndex === 5) ? $scope.greekWordsContainers[previousGreekWordKey].y+60 : (currentGreekWordIndex === 0 ? 100 : $scope.greekWordsContainers[previousGreekWordKey].y + 40);
                  $scope.mainContainer.addChild($scope.greekWordsContainers[wordKey]);

                  /* 2.A. Creating the letterBackground*/
                  var greekWordsGraphic = new createjs.Graphics().beginFill("blue").drawRect(0, 0, $scope.greekWordsContainers[wordKey].width, $scope.greekWordsContainers[wordKey].height);
                  $scope.greekWordsBackgrounds[wordKey] = new createjs.Shape(greekWordsGraphic);
                  $scope.greekWordsContainers[wordKey].addChild($scope.greekWordsBackgrounds[wordKey]);

                  /* 3.B. Adding text*/
                  $scope.greekWordsTexts[wordKey] = new createjs.Text($scope.greekWords[key][wordKey][0].greekWord, "20px Arial", "white");
                  $scope.greekWordsTexts[wordKey].x = $scope.greekWordsContainers[wordKey].width / 2;
                  $scope.greekWordsTexts[wordKey].y = $scope.greekWordsContainers[wordKey].height / 2;
                  $scope.greekWordsTexts[wordKey].textAlign = "center";
                  $scope.greekWordsTexts[wordKey].textBaseline = "middle";
                  $scope.greekWordsContainers[wordKey].addChild($scope.greekWordsTexts[wordKey]);

                  /*Adding checkboxes*/
                  $scope.checkboxes[wordKey] = new createjs.Sprite(restartButtonSpriteSheet, "normal");
                  $scope.checkboxes[wordKey].x = $scope.greekWordsContainers[wordKey].width + $scope.greekWordsContainers[wordKey].x + 180;
                  $scope.checkboxes[wordKey].y = $scope.greekWordsContainers[wordKey].y;
                  $scope.mainContainer.addChild($scope.checkboxes[wordKey]);
                  $scope.checkboxes[wordKey].gotoAndPlay("normal");

                });
              });

              //Waterfall callback
              initCallback(null);
            }

          ],function(error, result){
            if(!error){
              console.log("Success on creating game!");
            }else{
              console.error("Error on creating the game during init function. Error: ", result);
            }

          });

        }//end of function init()


        /******************************************* PLAYING GAME - LOADING QUESTION *****************************************/
        
        /*Function that handles navigation to next activity*/
        function next() {
          console.log("Going to next activity!");
          var index = _.findIndex($rootScope.selectedLesson.lessonMenu, {
            "activityFolder": $rootScope.activityFolder
          });
          console.log("Lessons Index: ", index);

          if (index < $rootScope.selectedLesson.lessonMenu.length - 1) {
            $rootScope.activityFolder = $rootScope.selectedLesson.lessonMenu[index + 1].activityFolder;
            $rootScope.activityName = $rootScope.selectedLesson.lessonMenu[index + 1].name;
            window.localStorage.setItem("activityFolder", $rootScope.activityFolder);
            window.localStorage.setItem("activityName", $rootScope.activityName);
            console.log("Next $rootScope.activityFolder: " + $rootScope.activityFolder + " $rootScope.activityName" + $rootScope.activityName);
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go($rootScope.selectedLesson.lessonMenu[index + 1].activityTemplate, {}, {reload: true});
          } else {
            $ionicHistory.nextViewOptions({
              historyRoot: true,
              disableBack: true
            });
            $state.go("results", {}, {reload: true});
          }
        }
        
      });//end of image on complete
    }, 500);//end of timeout
  });

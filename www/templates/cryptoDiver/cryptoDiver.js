angular.module("bookbuilder2")
  .controller("cryptoDiverController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory, Toast) {

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
        $scope.activeQuestionIndex = 0;


        /* ------------------------------------------ MAIN CONTAINER ---------------------------------------------- */
        $scope.mainContainer = new createjs.Container();
        $scope.mainContainer.width = background.image.width;
        $scope.mainContainer.height = background.image.height;
        $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = scale;
        $scope.mainContainer.x = backgroundPosition.x;
        $scope.mainContainer.y = backgroundPosition.y;
        $scope.stage.addChild($scope.mainContainer);

        //mainContainer Background
        /* var mainContainerGraphic = new createjs.Graphics().beginFill("green").drawRect(0, 0, $scope.mainContainer.width, $scope.mainContainer.height);
         var mainContainerBackground = new createjs.Shape(mainContainerGraphic);
         mainContainerBackground.alpha = 0.5;

         $scope.mainContainer.addChild(mainContainerBackground);
         */
        /* ------------------------------------------ CRYPTO CONTAINER ---------------------------------------------- */
        $scope.cryptoContainer = new createjs.Container();
        $scope.cryptoContainer.width = 500;
        $scope.cryptoContainer.height = 500;
        $scope.cryptoContainer.x = 20;
        $scope.cryptoContainer.y = 70;
        $scope.mainContainer.addChild($scope.cryptoContainer);

        //cryptoContainer Background
        var cryptoContainerGraphic = new createjs.Graphics().beginFill("red").drawRect(0, 0, $scope.cryptoContainer.width, $scope.cryptoContainer.height);
        var cryptoContainerBackground = new createjs.Shape(cryptoContainerGraphic);
        cryptoContainerBackground.alpha = 0.5;

        $scope.cryptoContainer.addChild(cryptoContainerBackground);

        /* ------------------------------------------ WORDS CONTAINER ---------------------------------------------- */
        $scope.wordsContainer = new createjs.Container();
        $scope.wordsContainer.width = 160;
        $scope.wordsContainer.height = 500;
        $scope.wordsContainer.x = $scope.cryptoContainer.x + $scope.cryptoContainer.width+5;
        $scope.wordsContainer.y = $scope.cryptoContainer.y;
        $scope.mainContainer.addChild($scope.wordsContainer);

        //wordsContainer Background
        var wordsContainerGraphic = new createjs.Graphics().beginFill("orange").drawRect(0, 0, $scope.wordsContainer.width, $scope.wordsContainer.height);
        var wordsContainerBackground = new createjs.Shape(wordsContainerGraphic);
        wordsContainerBackground.alpha = 0.5;

        $scope.wordsContainer.addChild(wordsContainerBackground);

        /* ------------------------------------------ DIVER CONTAINER ---------------------------------------------- */
        $scope.diverContainer = new createjs.Container();
        $scope.diverContainer.width = 150;
        $scope.diverContainer.height = 600;
        $scope.diverContainer.x = $scope.wordsContainer.x + $scope.wordsContainer.width+5;
        $scope.diverContainer.y = 0;
        $scope.mainContainer.addChild($scope.diverContainer);

        //diverContainer Background
        var diverContainerGraphic = new createjs.Graphics().beginFill("darkred").drawRect(0, 0, $scope.diverContainer.width, $scope.diverContainer.height);
        var diverContainerBackground = new createjs.Shape(diverContainerGraphic);
        diverContainerBackground.alpha = 0.5;

        $scope.diverContainer.addChild(diverContainerBackground);

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
              $state.go("lessonNew", {}, {reload: true});
            });

            menuButton.scaleX = menuButton.scaleY = scale;
            menuButton.x = 0;
            menuButton.y = -menuButton.getTransformedBounds().height / 5;

            $scope.mainContainer.addChild(menuButton);
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        /************************************** Initializing Page **************************************/

        console.log("Searching in localStorage fo activity: ", activityNameInLocalStorage);
        if (window.localStorage.getItem(activityNameInLocalStorage)) {

          $scope.activityData = JSON.parse(window.localStorage.getItem(activityNameInLocalStorage));
          console.log("activityData: ", $scope.activityData);

          init();

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
          var letterContainerWidth = 500/$scope.activityData.lettersArray[0].length;
          var letterContainerHeight = 500/$scope.activityData.lettersArray.length;

          console.log("letterContainer's Width: ", letterContainerWidth);
          console.log("letterContainer's Height: ", letterContainerHeight);

          /*Initializing letterContainers*/
          $scope.letterContainers = {};
          $scope.letterBackgrounds = {};
          $scope.letterTexts = {};


          /*** 1. Creating the letters array ***/
          _.each($scope.activityData.lettersArray, function(lettersArrayRow, rowKey, list){
            _.each($scope.activityData.lettersArray[rowKey], function(letter, columnKey, secondList){

              var letterIndex = rowKey+"_"+columnKey;

              /*A. Creating the letterContainer*/
              $scope.letterContainers[letterIndex] = new createjs.Container();
              $scope.letterContainers[letterIndex].width = letterContainerWidth;
              $scope.letterContainers[letterIndex].height = letterContainerHeight;
              $scope.letterContainers[letterIndex].x = columnKey*letterContainerWidth;
              $scope.letterContainers[letterIndex].y = rowKey*letterContainerHeight;
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


          /*** 2. Creating the words list ***/
          /*The greek equivalents of the missing words*/
          $scope.greekWords = {};

          _.each($scope.activityData.questions, function(word, key, list){
            $scope.greekWords[key] = new createjs.Text($scope.activityData.questions[key].greekWord, "20px Arial", "white");
            $scope.greekWords[key].x = $scope.wordsContainer.width/2;
            $scope.greekWords[key].y = key * 20;
            $scope.greekWords[key].textAlign = "center";
            $scope.wordsContainer.addChild($scope.greekWords[key]);
          });


          /*** 3. Creating the game ***/
          async.waterfall([
            /*Creating Chain*/
            function(gameCreationCallback){

              /*Creating the continue button*/
              var continueButtonImageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/soccer_results_continue.png"
              }));
              continueButtonImageLoader.load();

              continueButtonImageLoader.on("complete", function (r) {

                /*Creating Bitmap Background for continue button*/
                $scope.continueButton = new createjs.Bitmap($rootScope.rootDir + "data/assets/soccer_results_continue.png");
                $scope.continueButton.x = 40;
                $scope.continueButton.y = 303;
                $scope.resultsContainer.addChild($scope.continueButton);

                /*Mouse down event*/
                $scope.continueButton.addEventListener("mousedown", function (event) {
                  $scope.activeQuestionIndex++;
                  loadQuestion($scope.activeQuestionIndex);
                });

                /*Press up event*/
                $scope.continueButton.addEventListener("pressup", function (event) {
                });

                gameCreationCallback(null);

              });//end of continueButtonImageLoader

            },
            /*Creating Diver*/
            function(gameCreationCallback){
              $http.get($rootScope.rootDir + "data/assets/skip_one_answer_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for skipAnswer button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  var skipAnswerSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.skipAnswerButton = new createjs.Sprite(skipAnswerSpriteSheet, "normal");


                  gameCreationCallback(null);
                })
                .error(function (error) {

                  console.error("Error on getting json data for skipAnswer button: ", error);
                  gameCreationCallback(true, error);
                });
            },
            /*Creating Bottom Diver*/
            function(gameCreationCallback){
              $http.get($rootScope.rootDir + "data/assets/skip_one_answer_button_sprite.json")
                .success(function (response) {
                  console.log("Success on getting json for skipAnswer button!");
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                  var skipAnswerSpriteSheet = new createjs.SpriteSheet(response);
                  $scope.skipAnswerButton = new createjs.Sprite(skipAnswerSpriteSheet, "normal");


                  gameCreationCallback(null);
                })
                .error(function (error) {

                  console.error("Error on getting json data for skipAnswer button: ", error);
                  gameCreationCallback(true, error);
                });
            },
            /*Creating Tube*/
            function(gameCreationCallback){

            }
          ],function (error, result) {

          })

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

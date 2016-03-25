angular.module("bookbuilder2")
  .controller("ResultsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope, $ionicHistory) {

    console.log("ResultsController loaded!");

    $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("resultsCanvas"));
      var ctx = document.getElementById("resultsCanvas").getContext("2d");
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
        $scope.fps = createjs.Ticker.getMeasuredFPS().toFixed(2);
        $scope.$apply();
        stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      //EVENTS THAT SHOULD BE USED TO CONTROL THE APP
      $scope.$on('$destroy', function () {
        console.log('destroy');
        createjs.Ticker.framerate = 0;
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
        src: $rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/lesson_menu_background_image_2_blue.png");

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

        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

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
          })
          .error(function (error) {
            console.error("Error on getting json for results button...", error);
          });//end of get menu button


        /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
          //Getting the right lesson json
        console.log($rootScope.selectedLessonId);
        var lessonResourceUrl = $rootScope.rootDir + 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json";
        console.log("URL for selected lesson's json: ", lessonResourceUrl);

        $http.get(lessonResourceUrl)
          .success(function (response) {
            console.log("Success on getting json for the selected lesson! ", response);


            /*---------------------------------------LESSON TITLE CREATION------------------------------------------*/

            console.log("Lesson Title: ", response.lessonTitle);
            var lessonTitle = new createjs.Text(response.lessonTitle, "33px Arial", "white");

            /*background.scaleX = background.scaleY = scale;*/
            lessonTitle.scaleX = lessonTitle.scaleY = scale;
            lessonTitle.x = backgroundPosition.x + (backgroundPosition.width / 10);
            lessonTitle.y = backgroundPosition.y + (backgroundPosition.height / 9.8);
            lessonTitle.rotation = -4;
            lessonTitle.textBaseline = "alphabetic";

            stage.addChild(lessonTitle);
            stage.update();


            /*-------------------------------------TITLE CREATION--------------------------------------------*/

            console.log("Lesson Title: ", response.title);
            var title = new createjs.Text(response.title, "25px Arial", "white");

            /*background.scaleX = background.scaleY = scale;*/
            title.scaleX = title.scaleY = scale;
            title.x = backgroundPosition.x + (backgroundPosition.width / 3);
            title.y = backgroundPosition.y + (backgroundPosition.height / 13);
            title.textBaseline = "alphabetic";

            stage.addChild(title);
            stage.update();

          });//end of $http.get(lessonResourceUrl)


        /* ------------------------------------------ vocabularyReading Shape ---------------------------------------------- */

        //Starting and making it transparent
        var vocabularyReadingGraphics = new createjs.Graphics().beginFill(null);
        //Setting Stroke
        vocabularyReadingGraphics.setStrokeStyle(3).beginStroke("white");

        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        vocabularyReadingGraphics.drawRoundRect(0, 0, 430, 110, 15);

        var vocabularyReadingShape = new createjs.Shape(vocabularyReadingGraphics);
        vocabularyReadingShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 20), backgroundPosition.y + (backgroundPosition.height / 7), scale, scale, 0, 0, 0, 0, 0);
        stage.addChild(vocabularyReadingShape);
        stage.update();


        /* ------------------------------------------ totalScore Shape ---------------------------------------------- */

        var totalScoreGraphics = new createjs.Graphics().beginFill("blue").drawRect(0, 0, 430, 100);
        var totalScoreShape = new createjs.Shape(totalScoreGraphics);
        totalScoreShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 2), backgroundPosition.y + (backgroundPosition.height / 6.5), scale, scale, 0, 0, 0, 0, 0);
        //Setting Shadow
        totalScoreShape.shadow = new createjs.Shadow("#000000", 5, 5, 10);
        stage.addChild(totalScoreShape);
        stage.update();

        //Text for the totalScore
        var totalScoreTitle = new createjs.Text("Total Score:", "25px Arial", "white");

        /*background.scaleX = background.scaleY = scale;*/
        totalScoreTitle.scaleX = totalScoreTitle.scaleY = scale;
        totalScoreTitle.x = backgroundPosition.x + (backgroundPosition.width / 3);
        totalScoreTitle.y = backgroundPosition.y + (backgroundPosition.height / 13);
        totalScoreTitle.textBaseline = "alphabetic";

        stage.addChild(totalScoreTitle);
        stage.update();


        /* ------------------------------------------ activitiesScore Shape ---------------------------------------------- */

        //Starting and making it transparent
        var activitiesScoreGraphics = new createjs.Graphics().beginFill(null);
        //Setting Stroke
        activitiesScoreGraphics.setStrokeStyle(3).beginStroke("white");

        //Drawing the shape !!!NOTE Every optimization before drawRoundRect
        activitiesScoreGraphics.drawRoundRect(0, 0, 900, 400, 15);

        var activitiesScoreShape = new createjs.Shape(activitiesScoreGraphics);

        activitiesScoreShape.setTransform(backgroundPosition.x + (backgroundPosition.width / 20), backgroundPosition.y
          + (backgroundPosition.height / 3), scale, scale, 0, 0, 0, 0, 0);

        console.log("Shape transformed bounds: ", activitiesScoreShape.getTransformedBounds());

        stage.addChild(activitiesScoreShape);
        stage.update();


      });//end of image on complete
    }, 500);//end of timeout
  });

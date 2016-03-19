angular.module("bookbuilder2")
  .controller("LessonController", function ($scope, $ionicPlatform, $timeout, $rootScope, $http, $state, $ionicHistory) {

    console.log("LessonController loaded!");


    $timeout(function () {
      var stage = new createjs.Stage(document.getElementById("lessonCanvas"));
      var ctx = document.getElementById("lessonCanvas").getContext("2d");
      stage.canvas.height = window.innerHeight;
      stage.canvas.width = window.innerWidth;
      stage.enableDOMEvents(true);
      ctx.mozImageSmoothingEnabled = true;
      ctx.webkitImageSmoothingEnabled = true;
      ctx.msImageSmoothingEnabled = true;
      ctx.imageSmoothingEnabled = true;
      stage.regX = stage.width / 2;
      stage.regY = stage.height / 2;
      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable(stage);
      stage.enableMouseOver(0);
      createjs.Ticker.setFPS(60);
      createjs.Ticker.addEventListener("tick", stage);
      stage.mouseMoveOutside = false;

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();

      imageLoader.on("complete", function (r) {

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap("data/assets/lesson_menu_background_image_2_blue.png");

        /*************** CALCULATING SCALING *********************/
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
        console.log("backgroundPosition", backgroundPosition);

        /****** End of scaling calculation ******/

        /* ------------------------------------------ MENU BUTTON ---------------------------------------------- */

        $http.get("data/assets/head_menu_button_sprite.json")
          .success(function (response) {

            //Reassigning images with the rest of resource
            response.images[0] = "data/assets/" + response.images[0];

            //Reassigning animations
            response.animations = {
              normal: 0,
              pressed: 1,
              tap: {
                frames: [1],
                next: "normal"
              }
            };

            var menuButtonSpriteSheet = new createjs.SpriteSheet(response);
            var menuButton = new createjs.Sprite(menuButtonSpriteSheet, "normal");

            menuButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              menuButton.gotoAndPlay("pressed");
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


        /*-------------------------------------------ACTIVITIES MENU CONTAINER--------------------------------------*/
        var activitiesMenuContainer = new createjs.Container();
        /*It's important too define containers height before start calculating buttons*/
        activitiesMenuContainer.width = 240;
        activitiesMenuContainer.height = 450;

        activitiesMenuContainer.scaleX = activitiesMenuContainer.scaleY = scale;

        var yPosition = 60;

        activitiesMenuContainer.x = backgroundPosition.x + (backgroundPosition.width / 24);
        activitiesMenuContainer.y = backgroundPosition.y + (backgroundPosition.height / 7);
        /*
         var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, activitiesMenuContainer.width, activitiesMenuContainer.height);
         var shape = new createjs.Shape(graphics);
         shape.alpha = 0.5;
         activitiesMenuContainer.addChild(shape);
         */
        stage.addChild(activitiesMenuContainer);
        stage.update();


        /*********************************************** GETTING JSON FOR THE SELECTED LESSON ***********************************************/
          //Getting the right lesson json
        console.log($rootScope.selectedLessonId);
        var lessonResourceUrl = 'data/lessons/' + $rootScope.selectedLessonId + "/lesson.json";
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
            title.x = backgroundPosition.x + (backgroundPosition.width / 2.9);
            title.y = backgroundPosition.y + (backgroundPosition.height / 13);
            title.textBaseline = "alphabetic";

            stage.addChild(title);
            stage.update();


            $http.get("data/assets/" + response.lessonButtons.readingButtonFileName)
              .success(function (response) {

                //Reassigning images with the rest of resource
                response.images[0] = "data/assets/" + response.images[0];

                //Reassigning animations
                response.animations = {
                  normal: 0,
                  onSelection: 1,
                  selected: 2,
                  tap: {
                    frames: [1],
                    next: "selected"
                  }
                };

                var readingButtonSpriteSheet = new createjs.SpriteSheet(response);
                var readingButton = new createjs.Sprite(readingButtonSpriteSheet, "normal");

                /* ------------------------ EVENT --------------------------- */
                readingButton.addEventListener("click", function (event) {

                });

                //We need to scale every container!
                readingButton.scaleX = readingButton.scaleY = scale;
                readingButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
                readingButton.y = backgroundPosition.y + (backgroundPosition.height / 1.5);


                /* ------------------------ EVENT ------------------------ */
                readingButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a lesson button!");
                  readingButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                readingButton.addEventListener("pressup", function (event) {
                  readingButton.gotoAndPlay("selected");
                  stage.update();
                  console.log($rootScope.selectedLessonId);
                  $state.go("vocabulary");
                });

                stage.addChild(readingButton);
                stage.update();

              })
              .error(function (error) {
                console.error("Error on getting json for reading button...", error);
              });

            /*-----------------------------------------VOCABULARY BUTTON----------------------------------------*/

            $http.get("data/assets/" + response.lessonButtons.vocabularyButtonFileName)
              .success(function (response) {

                //Reassigning images with the rest of resource
                response.images[0] = "data/assets/" + response.images[0];

                //Reassigning animations
                response.animations = {
                  normal: 0,
                  onSelection: 1,
                  selected: 2,
                  tap: {
                    frames: [1],
                    next: "selected"
                  }
                };

                var vocabularyButtonSpriteSheet = new createjs.SpriteSheet(response);
                var vocabularyButton = new createjs.Sprite(vocabularyButtonSpriteSheet, "normal");
                vocabularyButton.scaleX = vocabularyButton.scaleY = scale;
                vocabularyButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
                vocabularyButton.y = backgroundPosition.y + (backgroundPosition.height / 2.5);


                /* ------------------------ EVENT ------------------------ */
                vocabularyButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a lesson button!");
                  vocabularyButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                vocabularyButton.addEventListener("pressup", function (event) {
                  vocabularyButton.gotoAndPlay("selected");
                  stage.update();
                  console.log($rootScope.selectedLessonId);
                  $state.go("vocabulary");
                });

                stage.addChild(vocabularyButton);
                stage.update();

              })
              .error(function (error) {
                console.error("Error on getting json for vocabulary button...", error);
              });


            /*-----------------------------------------RESULTS BUTTON----------------------------------------*/

            $http.get("data/assets/" + response.lessonButtons.resultsButtonFileName)
              .success(function (response) {

                //Reassigning images with the rest of resource
                response.images[0] = "data/assets/" + response.images[0];

                //Reassigning animations
                response.animations = {
                  normal: 0,
                  pressed: 1,
                  tap: {
                    frames: [1],
                    next: "normal"
                  }
                };

                var resultsButtonSpriteSheet = new createjs.SpriteSheet(response);
                var resultsButton = new createjs.Sprite(resultsButtonSpriteSheet, "normal");
                resultsButton.scaleX = resultsButton.scaleY = scale;
                resultsButton.x = backgroundPosition.x + (backgroundPosition.width / 6.5);
                resultsButton.y = backgroundPosition.y + (backgroundPosition.height / 1.1);
                stage.addChild(resultsButton);
                stage.update();

                /* ------------------------ EVENT ------------------------ */
                resultsButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a button !");
                  resultsButton.gotoAndPlay("pressed");
                  stage.update();
                });
                resultsButton.addEventListener("pressup", function (event) {
                  console.log("pressup event!");
                  resultsButton.gotoAndPlay("normal");
                  $state.go("results");
                });
              })
              .error(function (error) {
                console.error("Error on getting json for results button...", error);
              });

            /*-------------------------------- Populating Activities Menu -----------------------------------*/
            _.each(response.lessonMenu, function (activity, key, list) {
              var spriteResourceUrl = "data/assets/" + activity.buttonFileName;

              $http.get(spriteResourceUrl)
                .success(function (response) {


                  //Reassigning images with the rest of resource
                  response.images[0] = "data/assets/" + response.images[0];

                  //Reassigning animations
                  response.animations = {
                    normal: 0,
                    onSelection: 1,
                    selected: 2,
                    tap: {
                      frames: [1],
                      next: "selected"
                    }
                  };

                  var activityButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var activityButton = new createjs.Sprite(activityButtonSpriteSheet, "normal");
                  activityButton.activityFolder = activity.activityFolder;
                  activityButton.activityTemplate = activity.activityTemplate;
                  activityButton.y = yPosition;
                  activityButton.x = -1500 * scale;
                  createjs.Tween.get(activityButton, {loop: false}).wait(yPosition)
                    .to({x: 120}, 500, createjs.Ease.getPowIn(2));
                  yPosition += 75;
                  activitiesMenuContainer.addChild(activityButton);
                  stage.update();

                  /* -------------------------------- CLICK ON LESSON BUTTON -------------------------------- */
                  activityButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a lesson button!");
                    activityButton.gotoAndPlay("onSelection");
                    stage.update();
                  });

                  activityButton.addEventListener("pressup", function (event) {
                    console.log("pressup event on a lesson button !");
                    activityButton.gotoAndPlay("selected");
                    stage.update();
                    $rootScope.activityFolder = activityButton.activityFolder;
                    console.log($rootScope.selectedLessonId);
                    console.log($rootScope.activityFolder);
                    $state.go(activityButton.activityTemplate);
                  });

                }).error(function (error) {
                console.log("There was an error on getting lesson json");
              })
            });
          })
          .error(function (error) {
            console.error("Error on getting json for the selected lesson...", error);
          });

      });
    }, 500);
  });

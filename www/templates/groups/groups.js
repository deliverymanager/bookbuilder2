angular.module("bookbuilder2")
  .controller("GroupsController", function ($scope, $ionicPlatform, $timeout, $http, _, $state, $rootScope) {

    console.log("GroupsController loaded!");

    $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("groupCanvas"));
      stage.canvas.height = window.innerHeight;
      stage.canvas.width = window.innerWidth;

      stage.enableDOMEvents(true);
      var ctx = document.getElementById("groupCanvas").getContext("2d");
      ctx.mozImageSmoothingEnabled = true;
      ctx.webkitImageSmoothingEnabled = true;
      ctx.msImageSmoothingEnabled = true;
      ctx.imageSmoothingEnabled = true;

      stage.regX = stage.width / 2;
      stage.regY = stage.height / 2;

      console.log("innerWidth: ", window.innerWidth);
      console.log("innerHeight: ", window.innerHeight);

      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable(stage);
      // enabled mouse over / out events
      stage.enableMouseOver(0);

      createjs.Ticker.setFPS(60);
      createjs.Ticker.addEventListener("tick", stage);

      stage.mouseMoveOutside = false;

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: "data/assets/first_menu_background_b1.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap("data/assets/first_menu_background_b1.png");

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
        console.log("backgroundPosition", backgroundPosition);

        /* -------------------------------- EXIT BUTTON -------------------------------- */
        //Getting the element
        $http.get("data/assets/first_menu_exit_button_sprite.json")
          .success(function (response) {

            console.log("Success on getting data for exitButton!");

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

            var exitButtonSpriteSheet = new createjs.SpriteSheet(response);
            var exitButton = new createjs.Sprite(exitButtonSpriteSheet, "normal");
            //exitButton.visible = ionic.Platform.isAndroid();

            exitButton.addEventListener("mousedown", function (event) {
              console.log("mousedown event on a button !");
              exitButton.gotoAndPlay("pressed");
              stage.update();
            });

            exitButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              exitButton.gotoAndPlay("normal");
              ionic.Platform.exitApp();
            });
            exitButton.scaleX = exitButton.scaleY = scale;
            exitButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
            exitButton.y = backgroundPosition.y + (backgroundPosition.height / 1.07);
            stage.addChild(exitButton);
            stage.update();
          })
          .error(function (error) {

            console.log("Error on getting json data for exit button...");

          });


        /* -------------------------------- LEFT SIDE GROUP MENU -------------------------------- */

        /*Initializing savedGroupButtonsArray that will hold all the instances of buttons on the left sideMenu*/
        var savedGroupButtonsArray = [];
        var savedLessonButtonsArray = [];
        var selectedGroupLessons = [];

        $http.get("data/groups.json")
          .success(function (response) {
            //groupsMenuContainer CREATION
            var groupsMenuContainer = new createjs.Container();
            /*It's important too define containers height before start calculating buttons*/
            groupsMenuContainer.width = 236;
            groupsMenuContainer.height = 480;

            groupsMenuContainer.scaleX = groupsMenuContainer.scaleY = scale;

            var buttonHeight = 50;
            var yPosition = 40;

            groupsMenuContainer.x = backgroundPosition.x + (backgroundPosition.width / 17);
            groupsMenuContainer.y = backgroundPosition.y + (backgroundPosition.height / 7);

            stage.addChild(groupsMenuContainer);
            stage.update();

            /* ---------------------------------------- ADDING GROUP BUTTONS ---------------------------------------- */

            _.each(response.lessonGroups, function (lessonGroup) {

              var spriteUrl = "data/assets/" + lessonGroup.groupButtonSprite;
              console.log("spriteUrl: ", spriteUrl);

              //Getting the element
              $http.get(spriteUrl)
                .success(function (response) {

                  console.log("Success on getting data for lessonGroup.groupButtonSprite!");

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

                  var groupButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var groupButton = new createjs.Sprite(groupButtonSpriteSheet, "normal");

                  /* -------------------------------- CLICK ON BUTTON -------------------------------- */

                  groupButton.addEventListener("mousedown", function (event) {
                    console.log("mousedown event on a button !");
                    groupButton.gotoAndPlay("onSelection");
                    stage.update();
                  });

                  groupButton.addEventListener("pressup", function (event) {
                    console.log("pressup event on a group button !");
                    groupButton.gotoAndPlay("selected");
                    stage.update();

                    _.each(savedLessonButtonsArray, function (lesson, key, list) {
                      createjs.Tween.get(lesson, {loop: false}).to({x: 1500 * scale}, 200, createjs.Ease.getPowIn(2));
                    });

                    var selectedGroup = _.findWhere(savedGroupButtonsArray, {"id": groupButton.id});
                    selectedGroupLessons = selectedGroup.lessons;

                    //Making all buttons appear in normal state again
                    _.each(savedGroupButtonsArray, function (button, key, list) {
                      if (button.id !== groupButton.id) {
                        savedGroupButtonsArray[key].gotoAndPlay("normal");
                      }
                    });

                    addSelectedGroupLessonsButtons();
                  });

                  groupButton.lessons = lessonGroup.lessons;
                  savedGroupButtonsArray.push(groupButton);

                  groupButton.y = yPosition;
                  groupButton.x = -1500 * scale;

                  createjs.Tween.get(groupButton, {loop: false}).wait(yPosition)
                    .to({x: 120}, 1000, createjs.Ease.getPowIn(2));

                  yPosition += buttonHeight;
                  groupsMenuContainer.addChild(groupButton);
                  stage.update();
                })
                .error(function (error) {
                  console.log("Error on getting json data for group button...");
                });

            }); //end of _.each (groupLessons)

          })//Success of getting groups.json
          .error(function (error) {
            console.error("There was an error getting groups.json: ", error);
          });


        /* -------------------------------- RIGHT SIDE GROUP MENU -------------------------------- */


        /* ------------------ Creation of the right side menu container ------------------ */
        //groupsMenuContainer CREATION
        var lessonsMenuContainer = new createjs.Container();

        /*It's important too define containers height before start calculating buttons*/
        lessonsMenuContainer.width = 236;
        lessonsMenuContainer.height = 480;

        lessonsMenuContainer.scaleX = lessonsMenuContainer.scaleY = scale;
        lessonsMenuContainer.x = backgroundPosition.x + (backgroundPosition.width / 1.4);
        lessonsMenuContainer.y = backgroundPosition.y + (backgroundPosition.height / 7);

        /*var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, lessonsMenuContainer.width, lessonsMenuContainer.height);
         var shape = new createjs.Shape(graphics);
         shape.alpha = 0.5;

         lessonsMenuContainer.addChild(shape);*/

        stage.addChild(lessonsMenuContainer);
        stage.update();


        function addSelectedGroupLessonsButtons() {


          console.log("selectedGroupLessons: ", selectedGroupLessons);

          /*Array for saving the lesson buttons references*/
          var yPosition = 150;


          _.each(selectedGroupLessons, function (lesson, key, list) {
            var spriteResourceUrl = "data/assets/" + lesson.lessonButtonSprite;

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

                var lessonButtonSpriteSheet = new createjs.SpriteSheet(response);
                var lessonButton = new createjs.Sprite(lessonButtonSpriteSheet, "normal");

                /* -------------------------------- CLICK ON LESSON BUTTON -------------------------------- */
                lessonButton.addEventListener("mousedown", function (event) {
                  console.log("mousedown event on a lesson button!");
                  lessonButton.gotoAndPlay("onSelection");
                  stage.update();
                });

                lessonButton.addEventListener("pressup", function (event) {
                  console.log("pressup event on a lesson button !");

                  lessonButton.gotoAndPlay("tap");
                  stage.update();

                  _.each(savedLessonButtonsArray, function (button, key, list) {
                    if (button.id !== lessonButton.id) {
                      savedLessonButtonsArray[key].gotoAndPlay("normal");
                    }
                  });
                  stage.update();

                  $rootScope.selectedLessonId = lessonButton.id;
                  console.log($rootScope.selectedLessonId);
                  $state.go("lesson");

                });

                lessonButton.id = lesson.id;
                savedLessonButtonsArray.push(lessonButton);

                lessonButton.y = yPosition;
                lessonButton.x = 1500 * scale;

                createjs.Tween.get(lessonButton, {loop: false}).wait(yPosition)
                  .to({x: 120}, 500, createjs.Ease.getPowIn(2));

                yPosition += 55;
                lessonsMenuContainer.addChild(lessonButton);
                stage.update();

              }).error(function (error) {

              console.log("There was an error on getting lesson json");

            })

          });//end of _.each(selectedGroupLessons)

          /* ----------------------------------------------------- END RIGHT SIDE MENU HANDLING-----------------------------------------------------*/

        }//End of function


      });//end of image on complete
    }, 500);//end of timeout
  });

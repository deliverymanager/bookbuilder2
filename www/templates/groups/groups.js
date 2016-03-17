angular.module("bookbuilder2")
  .controller("GroupsController", function ($scope, $ionicPlatform, $timeout, $http, _) {

    console.log("GroupsController loaded!");


    $timeout(function () {
      var stage = new createjs.Stage(document.getElementById("groupCanvas"));

      stage.canvas.width = window.innerWidth;
      stage.canvas.height = window.innerHeight;

      //Fixed size for stage canvas
      /*
       stage.canvas.width = 1024;
       stage.canvas.height = 600;
       */

      stage.enableDOMEvents(true);
      createjs.Touch.enable(stage);

      var ctx = document.getElementById("groupCanvas").getContext("2d");
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;

      stage.regX = stage.width / 2;
      stage.regY = stage.height / 2;

      console.log("innerWidth: ", window.innerWidth);
      console.log("innerHeight: ", window.innerHeight);

      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable(stage);
      // enabled mouse over / out events
      stage.enableMouseOver(0);

      stage.mouseMoveOutside = false;

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: "data/assets/first_menu_background_b1.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");


        createjs.Ticker.addEventListener("tick", handleTick);

        function handleTick() {
          stage.update();
        }

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap("data/assets/first_menu_background_b1.png");
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = stage.canvas.width / 2;
        background.y = stage.canvas.height / 2;
        stage.addChild(background);
        stage.update();


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


            /* -------------------------------- ANIMATION EVENT -------------------------------- */
            exitButton.addEventListener("click", function (event) {
              console.log("Click event!");
              exitButton.gotoAndPlay("tap");
            });

            var exitButtonContainer = new createjs.Container(exitButtonSpriteSheet);
            exitButtonContainer.addChild(exitButton);

            exitButtonContainer.regX = exitButtonContainer.width / 2;
            exitButtonContainer.regY = exitButtonContainer.height / 2;
            exitButtonContainer.x = stage.canvas.width / 2;
            exitButtonContainer.y = stage.canvas.height / 1.14;

            stage.addChild(exitButtonContainer);
            stage.update();

          })
          .error(function (error) {

            console.log("Error on getting json data for exit button...");

          });


        /* -------------------------------- LEFT SIDE GROUP MENU -------------------------------- */
        $http.get("data/groups.json")
          .success(function (response) {

            console.log("Response from getting data groups: ", response);

            //groupsMenuContainer CREATION
            var groupsMenuContainer = new createjs.Container();

            groupsMenuContainer.width = 236;
            groupsMenuContainer.height = 480;
            groupsMenuContainer.regX = groupsMenuContainer.width / 2;
            groupsMenuContainer.regY = groupsMenuContainer.height / 2;
            groupsMenuContainer.x = stage.canvas.width / 4.4;
            groupsMenuContainer.y = stage.canvas.height / 1.96;

            var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, groupsMenuContainer.width, groupsMenuContainer.height);
            var shape = new createjs.Shape(graphics);
            shape.alpha = 0.5;

            groupsMenuContainer.addChild(shape);

            /*groupsMenuContainer.shadow = new createjs.Shadow("red", 5, 5, 10);*/


            stage.addChild(groupsMenuContainer);
            stage.update();


            /*ITERATION FOR EVERY BUTTON*/

            var yPosition = 20;

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
                      next: "normal"
                    }
                  };

                  var groupButtonSpriteSheet = new createjs.SpriteSheet(response);
                  var groupButton = new createjs.Sprite(groupButtonSpriteSheet, "normal");


                  /* -------------------------------- GROUP BUTTON EVENTS -------------------------------- */
                  groupButton.addEventListener("click", function (event) {
                    console.log("Click event on a group button !");
                    groupButton.gotoAndPlay("tap");
                  });

                  var groupButtonContainer = new createjs.Container(groupButtonSpriteSheet);
                  groupButtonContainer.addChild(groupButton);


                  groupButtonContainer.regX = groupButtonContainer.width / 2;
                  groupButtonContainer.regY = 0;
                  groupButtonContainer.x = groupsMenuContainer.width / 2;
                  groupButtonContainer.y = yPosition;
                  yPosition += 48;

                  console.log("y position: ", yPosition);

                  groupsMenuContainer.addChild(groupButtonContainer);
                  stage.update();

                })
                .error(function (error) {
                  console.log("Error on getting json data for group button...");
                });

            });


          })//Success of get groups.json
          .error(function (error) {
            console.error("There was an error getting groups.json: ", error);
          });


        /* -------------------------------- RESPONSIVENESS TESTING -------------------------------- */
        /*stage.scaleX = 0.5;
         stage.scaleY = 0.5;
         stage.update();*/
        /* -------------------------------- RESPONSIVENESS TESTING -------------------------------- */

      });//end of image on complete
    }, 500);//end of timeout
  });

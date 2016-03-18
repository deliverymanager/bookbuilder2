angular.module("bookbuilder2")
  .controller("GroupsController", function ($scope, $ionicPlatform, $timeout, $http, _, $rootScope) {

    console.log("GroupsController loaded!");

    $timeout(function () {

      var stage = new createjs.Stage(document.getElementById("groupCanvas"));
      stage.canvas.height = window.innerHeight;
      stage.canvas.width = window.innerWidth;

      stage.enableDOMEvents(true);
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

        /****   CALCULATING SCALING ****/
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

        /*Initializing savedGroupButtonsArray that will hold all the instances of buttons on the left sideMenu*/
        var savedGroupButtonsArray = [];
        var selectedGroupLessons = [];

        $http.get("data/groups.json")
          .success(function (response) {
            //groupsMenuContainer CREATION
            var groupsMenuContainer = new createjs.Container();
            /*It's important too define containers height before start calculating buttons*/
            groupsMenuContainer.width = 236;
            groupsMenuContainer.height = 480;

            var buttonHeight = 50;
            /*Group Buttons sideMenu calculation*/
            var buttonsLength = response.lessonGroups.length;
            var buttonsToContainerRatio = groupsMenuContainer.height / (buttonsLength * buttonHeight);

            //yPosition is the starting offset for sideMenu buttons
            var yPosition = buttonsToContainerRatio > 1 ? (groupsMenuContainer.height - buttonsLength * buttonHeight) / 2 : 0;
            groupsMenuContainer.x = 110;
            groupsMenuContainer.y = 170;

            var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, groupsMenuContainer.width, groupsMenuContainer.height);
            var shape = new createjs.Shape(graphics);
            shape.alpha = 0.5;
            groupsMenuContainer.addChild(shape);

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
                  groupButton.addEventListener("click", function (event) {
                    console.log("Click event on a group button !");

                    var selectedGroup = _.findWhere(savedGroupButtonsArray, {"id": groupButton.id});
                    selectedGroupLessons = selectedGroup.lessons;
                    console.log("selectedGroupLessons: ", selectedGroupLessons);

                    //Making all buttons appear in normal state again
                    _.each(savedGroupButtonsArray, function (button, key, list) {
                      savedGroupButtonsArray[key].gotoAndPlay("normal");
                    });

                    //ADDING SELECTED GROUP'S LESSONS ON THE RIGHT SIDEMENU
                    console.log("Selected group's lessons: ", selectedGroupLessons);
                    addSelectedGroupLessonsButtons();

                    stage.update();

                    groupButton.gotoAndPlay("tap");

                  });


                  var groupButtonContainer = new createjs.Container(groupButtonSpriteSheet);

                  //Adding groupButton
                  groupButtonContainer.addChild(groupButton);

                  /*Application keeps in a custom array the groupButton object and lessons for every group*/

                  groupButton.lessons = lessonGroup.lessons;
                  savedGroupButtonsArray.push(groupButton);

                  groupButtonContainer.y = yPosition;
                  groupButtonContainer.x = 120;
                  yPosition += buttonHeight;
                  groupsMenuContainer.addChild(groupButtonContainer);
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

        lessonsMenuContainer.regX = lessonsMenuContainer.width / 2;
        lessonsMenuContainer.regY = lessonsMenuContainer.height / 2;
        lessonsMenuContainer.x = stage.canvas.width / 1.25;
        lessonsMenuContainer.y = stage.canvas.height / 1.96;

        var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, lessonsMenuContainer.width, lessonsMenuContainer.height);
        var shape = new createjs.Shape(graphics);
        shape.alpha = 0.5;

        lessonsMenuContainer.addChild(shape);

        stage.addChild(lessonsMenuContainer);
        stage.update();


        /*FUNCTION FOR POPULATING RIGHT SIDE MENU*/
        function addSelectedGroupLessonsButtons() {

          _.each(selectedGroupLessons, function (lesson, key, list) {
            var spriteResourceUrl = "data/assets/" + lesson.lessonButtonSprite;

            $http.get(spriteResourceUrl)
              .success(function (response) {

                console.log(response);

              }).error(function (error) {

              console.log("There was an error on getting lesson json");

            })

          });//end of _.each(selectedGroupLessons)

        }

      });//end of image on complete
    }, 500);//end of timeout
  });

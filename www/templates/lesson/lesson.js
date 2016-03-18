angular.module("bookbuilder2")
  .controller("LessonController", function ($scope, $ionicPlatform, $timeout, $rootScope, $state, $ionicLoading, $ionicPopup) {

    console.log("LessonController loaded!");


    $timeout(function () {
      var stage = new createjs.Stage(document.getElementById("lessonCanvas"));

      stage.canvas.width = window.innerWidth;
      stage.canvas.height = window.innerHeight;

      stage.enableDOMEvents(true);
      createjs.Touch.enable(stage);

      var ctx = document.getElementById("lessonCanvas").getContext("2d");
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
        src: "data/assets/lesson_menu_background_image_2_blue.png"
      }));
      imageLoader.load();

      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");


        createjs.Ticker.addEventListener("tick", handleTick);

        function handleTick() {
          stage.update();
        }

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
        background.y = stage.canvas.height / 1.85;
        stage.addChild(background);
        stage.update();
        var backgroundPosition = background.getTransformedBounds();
        console.log("backgroundPosition", backgroundPosition);

        /*** End of scaling calculation ***/

        /*Before navigating the selected lessonID has been calculated and it's $rootScope.selectedLessonId*/

        //Getting the right lesson json


      });
    }, 500);
  });

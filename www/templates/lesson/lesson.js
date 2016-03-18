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

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap("data/assets/lesson_menu_background_image_2_blue.png");
        background.x = 0;
        background.y = 0;
        stage.addChild(background);
        stage.update();

      });
    }, 500);
  });

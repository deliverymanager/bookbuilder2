angular.module("bookbuilder2")
  .controller("GroupsController", function ($scope, $ionicPlatform, $timeout, $rootScope, $state, $ionicLoading, $ionicPopup) {

    console.log("GroupsController loaded!");

    $ionicPlatform.ready(function () {

      if (window.cordova && window.cordova.platformId !== "browser") {
        navigator.splashscreen.hide();
      }

      $timeout(function () {
        var stage = new createjs.Stage(document.getElementById("canvas"));
        stage.canvas.width = window.innerWidth;
        stage.canvas.height = window.innerHeight;

        stage.enableDOMEvents(true);
        createjs.Touch.enable(stage);

        var ctx = document.getElementById("canvas").getContext("2d");
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        stage.regX = stage.width / 2;
        stage.regY = stage.height / 2;

        console.log("innerWidth", window.innerWidth);
        console.log("innerHeight", window.innerHeight);

        createjs.MotionGuidePlugin.install();
        createjs.Touch.enable(stage);
        // enabled mouse over / out events
        stage.enableMouseOver(0);

        stage.mouseMoveOutside = false;


        var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: "img/" + "ben.png"
        }));
        imageLoader.load();

        imageLoader.on("complete", function (r) {

          console.log("image Loaded");

          var bgimg = new createjs.Bitmap("img/" + "ben.png");
          bgimg.x = 0;
          bgimg.y = 0;

          bgimg.on("click", function () {
            $state.go('lessongroup');
          });
          stage.addChild(bgimg);
          createjs.Ticker.addEventListener("tick", handleTick);

          function handleTick() {
            //Circle will move 10 units to the right.
            bgimg.x += 10;
            //Will cause the circle to wrap back
            if (bgimg.x > stage.canvas.width) {
              bgimg.x = 0;
            }
            stage.update();
          }

        });
      }, 500);
    });
  });

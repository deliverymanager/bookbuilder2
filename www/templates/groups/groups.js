angular.module("bookbuilder2")
  .controller("GroupsController", function (Download, $ionicLoading, $scope, $ionicPlatform, $timeout, $http, _, $ionicPopup, $state, $rootScope, Toast, $cordovaFile) {

    console.log("GroupsController loaded!");

    $timeout(function () {

      $scope.stage = new createjs.Stage(document.getElementById("groupCanvas"));
      var ctx = document.getElementById("groupCanvas").getContext("2d");
      $scope.stage.canvas.height = window.innerHeight;
      $scope.stage.canvas.width = window.innerWidth;
      $scope.stage.enableDOMEvents(false);
      ctx.mozImageSmoothingEnabled = true;
      ctx.webkitImageSmoothingEnabled = true;
      ctx.msImageSmoothingEnabled = true;
      ctx.imageSmoothingEnabled = true;
      $scope.stage.regX = $scope.stage.width / 2;
      $scope.stage.regY = $scope.stage.height / 2;
      createjs.MotionGuidePlugin.install();
      createjs.Touch.enable($scope.stage);
      $scope.stage.enableMouseOver(0);
      $scope.stage.mouseMoveOutside = false;

      createjs.Ticker.framerate = 20;
      var handleTick = function () {
        $scope.fps = createjs.Ticker.getMeasuredFPS().toFixed(2);
        $scope.$apply();
        $scope.stage.update();
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


      var savedGroupButtonsArray = [];
      $scope.savedLessonButtonsArray = [];

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/first_menu_background_b1.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Image Loaded...");


        var downloadIconLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: $rootScope.rootDir + "data/assets/downloadIcon.png"
        }));
        downloadIconLoader.load();

        downloadIconLoader.on("complete", function (r) {

          $scope.downloadIcon = new createjs.Bitmap($rootScope.rootDir + "data/assets/downloadIcon.png");
          $scope.downloadIcon.visible = false;

          $scope.downloadIcon.addEventListener("mousedown", function (event) {
            console.log("mousedown event on downloadIcon !");
            $scope.downloadIcon.alpha = 0.5;
            $scope.stage.update();
          });

          $scope.downloadIcon.addEventListener("pressup", function (event) {
            console.log("pressup event!");
            $scope.downloadIcon.alpha = 1;

            console.log("$rootScope.selectedGroupId", $rootScope.selectedGroupId);

            $scope.stage.update();
          });

          $scope.downloadIcon.scaleX = $scope.downloadIcon.scaleY = scale / 4;
          $scope.downloadIcon.x = backgroundPosition.x + (backgroundPosition.width / 1.15);
          $scope.downloadIcon.y = backgroundPosition.y + (backgroundPosition.height / 1.4);
          $scope.stage.addChild($scope.downloadIcon);
          $scope.stage.update();
        });

        var deleteIconLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
          src: $rootScope.rootDir + "data/assets/deleteIcon.png"
        }));
        deleteIconLoader.load();

        deleteIconLoader.on("complete", function (r) {

          $scope.deleteIcon = new createjs.Bitmap($rootScope.rootDir + "data/assets/deleteIcon.png");
          $scope.deleteIcon.visible = false;

          $scope.deleteIcon.addEventListener("mousedown", function (event) {
            console.log("mousedown event on deleteIcon !");
            $scope.deleteIcon.alpha = 0.5;
            $scope.stage.update();
          });

          $scope.deleteIcon.addEventListener("pressup", function (event) {
            console.log("pressup event!");
            $scope.deleteIcon.alpha = 1;

            console.log("$rootScope.selectedGroupId", $rootScope.selectedGroupId);

            $scope.stage.update();
          });

          $scope.deleteIcon.scaleX = $scope.deleteIcon.scaleY = scale / 4;
          $scope.deleteIcon.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
          $scope.deleteIcon.y = backgroundPosition.y + (backgroundPosition.height / 1.4);
          $scope.stage.addChild($scope.deleteIcon);
          $scope.stage.update();
        });


        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/first_menu_background_b1.png");

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
        console.log("GENERAL SCALING FACTOR", scale);
        //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE


        background.scaleX = scale;
        background.scaleY = scale;
        background.regX = background.image.width / 2;
        background.regY = background.image.height / 2;
        background.x = $scope.stage.canvas.width / 2;
        background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild(background);
        $scope.stage.update();
        var backgroundPosition = background.getTransformedBounds();
        console.log("backgroundPosition", backgroundPosition);

        /* -------------------------------- EXIT BUTTON -------------------------------- */
        //Getting the element
        $http.get($rootScope.rootDir + "data/assets/first_menu_exit_button_sprite.json")
          .success(function (response) {

            console.log("Success on getting data for exitButton!");

            //Reassigning images with the rest of resource
            response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

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
              $scope.stage.update();
            });

            exitButton.addEventListener("pressup", function (event) {
              console.log("pressup event!");
              exitButton.gotoAndPlay("normal");
              ionic.Platform.exitApp();
            });
            exitButton.scaleX = exitButton.scaleY = scale;
            exitButton.x = backgroundPosition.x + (backgroundPosition.width / 2);
            exitButton.y = backgroundPosition.y + (backgroundPosition.height / 1.07);
            $scope.stage.addChild(exitButton);
            $scope.stage.update();
          })
          .error(function (error) {

            console.log("Error on getting json data for exit button...");

          });


        /* -------------------------------- LEFT SIDE GROUP MENU -------------------------------- */
        //This groups.json is loaded within the application and not from the server!
        $http.get("data/groups.json")
          .success(function (response) {
            //groupsMenuContainer CREATION
            $rootScope.book = response;
            var groupsMenuContainer = new createjs.Container();
            /*It's important too define containers height before start calculating buttons*/
            groupsMenuContainer.width = 236;
            groupsMenuContainer.height = 480;

            groupsMenuContainer.scaleX = groupsMenuContainer.scaleY = scale;

            var buttonHeight = 50;
            var yPosition = 40;

            groupsMenuContainer.x = backgroundPosition.x + (backgroundPosition.width / 17);
            groupsMenuContainer.y = backgroundPosition.y + (backgroundPosition.height / 7);

            $scope.stage.addChild(groupsMenuContainer);
            $scope.stage.update();

            /* ---------------------------------------- ADDING GROUP BUTTONS ---------------------------------------- */
            var waterfallFunctions = [];
            _.each(response.lessonGroups, function (lessonGroup) {

              waterfallFunctions.push(function (waterfallCallback) {

                var spriteUrl = $rootScope.rootDir + "data/assets/" + lessonGroup.groupButtonSprite;
                console.log("spriteUrl: ", spriteUrl);

                //Getting the element
                $http.get(spriteUrl)
                  .success(function (response) {

                    console.log("Success on getting data for lessonGroup.groupButtonSprite!");

                    //Reassigning images with the rest of resource
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

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
                      $scope.stage.update();
                    });

                    groupButton.addEventListener("pressup", function (event) {
                      console.log("pressup event on a group button !");
                      groupButton.gotoAndPlay("selected");

                      $rootScope.selectedGroupId = groupButton.groupId;
                      $scope.stage.update();

                      //Make all lessons dissappear from the screen
                      _.each($scope.savedLessonButtonsArray, function (lesson, key, list) {
                        createjs.Tween.get(lesson, {loop: false}).to({x: 1500 * scale}, 200, createjs.Ease.getPowIn(2));
                      });

                      //Making all buttons appear in normal state again
                      _.each(savedGroupButtonsArray, function (button, key, list) {
                        if (button.groupId !== groupButton.groupId) {
                          savedGroupButtonsArray[key].gotoAndPlay("normal");
                        }
                      });

                      addSelectedGroupLessonsButtons(_.findWhere(savedGroupButtonsArray, {"groupId": groupButton.groupId}).lessons);
                    });

                    groupButton.lessons = lessonGroup.lessons;
                    groupButton.groupId = lessonGroup.groupId;
                    savedGroupButtonsArray.push(groupButton);
                    groupButton.y = yPosition;
                    groupButton.x = -1500 * scale;

                    createjs.Tween.get(groupButton, {loop: false}).to({x: 120}, 1000, createjs.Ease.getPowIn(2));

                    yPosition += buttonHeight;
                    groupsMenuContainer.addChild(groupButton);
                    $scope.stage.update();

                    $timeout(function () {
                      waterfallCallback();
                    }, 100);

                  })
                  .error(function (error) {
                    console.log("Error on getting json data for group button...");
                  });
              });
            }); //end of _.each (groupLessons)


            async.waterfall(waterfallFunctions, function (callback) {
              console.log("Lesson Groups Inserted!");
            });

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

        $scope.stage.addChild(lessonsMenuContainer);
        $scope.stage.update();


        function addSelectedGroupLessonsButtons(selectedGroupLessons) {

          /*Array for saving the lesson buttons references*/
          var yPosition = 150;

          var waterfallFunctions = [];
          _.each(selectedGroupLessons, function (lesson, key, list) {

            waterfallFunctions.push(function (waterfallCallback) {

              var spriteResourceUrl = $rootScope.rootDir + "data/assets/" + lesson.lessonButtonSprite;

              $http.get(spriteResourceUrl)
                .success(function (response) {


                  //Reassigning images with the rest of resource
                  response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

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
                    $scope.stage.update();
                  });

                  lessonButton.addEventListener("pressup", function (event) {
                    console.log("pressup event on a lesson button !");
                    lessonButton.gotoAndPlay("tap");
                    $scope.stage.update();

                    _.each($scope.savedLessonButtonsArray, function (button, key, list) {
                      if (button.id !== lessonButton.id) {
                        $scope.savedLessonButtonsArray[key].gotoAndPlay("normal");
                      }
                    });
                    $scope.stage.update();

                    $rootScope.selectedLessonId = lessonButton.id;
                    console.log($rootScope.selectedLessonId);

                    if (lessonButton.active) {

                      if (lessonButton.downloaded) {

                        downloadLessonAssets(lesson, function (response) {

                          if (response) {
                            $state.go("lesson");
                          } else {
                            showDownloadingError(lesson);
                          }
                        });

                      } else {

                        var confirmPopup = $ionicPopup.confirm({
                          title: 'Download ' + lesson.title,
                          template: 'Do you want to start downloading ' + lesson.title + "?"
                        });
                        confirmPopup.then(function (res) {
                          if (res) {
                            downloadLessonAssets(lesson, function (response) {
                              if (response) {
                                $state.go("lesson");
                              } else {
                                showDownloadingError(lesson);
                              }
                            });
                          }
                        });
                      }
                    } else {
                      Toast.show("Coming soon...");
                    }
                  });

                  lessonButton.id = lesson.id;
                  lessonButton.active = lesson.active;
                  $scope.savedLessonButtonsArray.push(lessonButton);

                  if (!lessonButton.active) {
                    lessonButton.alpha = 0.15;
                  }else{
                    lessonButton.alpha = 0.5;
                  }

                  lessonButton.y = yPosition;
                  lessonButton.x = 1500 * scale;

                  createjs.Tween.get(lessonButton, {loop: false}).wait(yPosition)
                    .to({x: 120}, 500, createjs.Ease.getPowIn(2));

                  yPosition += 55;
                  lessonsMenuContainer.addChild(lessonButton);
                  $scope.stage.update();

                  $timeout(function () {
                    waterfallCallback();
                  }, 50);

                }).error(function (error) {
                console.log("There was an error on getting lesson json");
              });
            });
          });

          async.waterfall(waterfallFunctions, function (err, res) {
            console.log("$scope.savedLessonButtonsArray", $scope.savedLessonButtonsArray);
            console.log("$rootScope.selectedGroupId", $rootScope.selectedGroupId);

            checkIfLessonGroupIsDownloaded($rootScope.selectedGroupId, function () {
              $scope.downloadIcon.visible = true;
              $scope.deleteIcon.visible = true;
              $scope.stage.update();
            });
          });
        }//End of function
      });//end of image on complete
    }, 500);//end of timeout


    var checkIfLessonGroupIsDownloaded = function (groupId, callback) {

      console.log("Checking if lesson groups is downloaded", groupId);

      var waterFallFunctions = [];
      console.log($rootScope.book);

      _.each(_.findWhere($rootScope.book.lessonGroups, {"groupId": groupId}).lessons, function (lesson, key, list) {

        waterFallFunctions.push(function (waterFallCallback) {

          checkIfLessonIsDownloaded(lesson, function (res) {
            console.log("res", res);
            waterFallCallback();
          });
        });
      });

      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });
    };

    var checkIfLessonIsDownloaded = function (lesson, callback) {

      console.log("Checking if lesson is downloaded", lesson.id);

      $http.get($rootScope.rootDir + "data/lessons/" + lesson.id + "/lessonassets.json")
        .success(function (activities) {
          var parallelFunctions = [];
          _.each(activities, function (activityAssets, key, list) {
            _.each(activityAssets, function (file, k, l) {
              parallelFunctions.push(function (parallelCallback) {
                $cordovaFile.checkFile($rootScope.rootDir + "data/lessons/" + lesson.id + "/" + key + "/", file)
                  .then(function (success) {
                    parallelCallback(null);
                  }, function (error) {
                    console.log(error);
                    parallelCallback(key + "/" + file);
                  });
              });
            });
          });

          async.parallelLimit(parallelFunctions, 5, function (err, response) {

            var lessonButton = _.findWhere($scope.savedLessonButtonsArray, {"id": lesson.id});

            if (err) {
              console.log(err);
              console.log("Lesson Check " + lesson.id, false);
              lessonButton.downloaded = false;
              lessonButton.alpha = 0.5;
              $scope.stage.update();
              return callback(false);
            } else {
              console.log("Lesson Check " + lesson.id, true);
              lessonButton.downloaded = true;
              lessonButton.alpha = 1;
              $scope.stage.update();
              return callback(true);
            }

          });

        })
        .error(function (error) {
          console.log("Error on getting json data for lessonassets...", error);
          callback(false)
        });
    };


    var showDownloadingError = function (lesson) {

      var confirmPopup = $ionicPopup.confirm({
        title: 'Assets are missing!',
        template: 'Restart the dowloading process?'
      });
      confirmPopup.then(function (res) {

        if (res) {
          downloadLessonAssets(lesson, function (response) {
            if (response) {
              $state.go("lesson");
            } else {
              showDownloadingError(lesson);
            }
          });

        } else {
          $state.go("lesson");
        }
      });
    };

    var downloadLessonAssets = function (lesson, callback) {
      $rootScope.totalFilesLessonAssets = 0;
      $rootScope.downloadingLessonAsset = 0;


      $http.get($rootScope.rootDir + "data/lessons/" + lesson.id + "/lessonassets.json")
        .success(function (response) {

          var waterfallFunctions = [];
          _.each(response, function (arrayOfStrings, key, list) {

            console.log("arrayOfStrings", arrayOfStrings);

            waterfallFunctions.push(function (waterfallCallback) {

              Download.assets(arrayOfStrings, $rootScope.book.cdnUrl, "data/lessons/" + lesson.id, key, function (response) {
                $rootScope.downloadingLessonAsset++;
                $ionicLoading.show({
                  template: "Downloading " + ($rootScope.downloadingLessonAsset && $rootScope.totalFilesLessonAssets ? (($rootScope.downloadingLessonAsset / $rootScope.totalFilesLessonAssets) * 100).toFixed() : 0) + "%"
                });
                if (response) {
                  waterfallCallback(null);
                } else {
                  waterfallCallback(true);
                }
              });
            });
          });

          $rootScope.totalFilesLessonAssets = waterfallFunctions.length;
          console.log("TOTAL LESSON ASSETS", $rootScope.totalFilesLessonAssets);

          $ionicLoading.show({
            template: "Downloading " + ($rootScope.downloadingLessonAsset && $rootScope.totalFilesLessonAssets ? (($rootScope.downloadingLessonAsset / $rootScope.totalFilesLessonAssets) * 100).toFixed() : 0) + "%"
          });

          async.waterfall(waterfallFunctions, function (err, response) {
            $timeout(function () {
              $ionicLoading.hide();
              if (err) {
                callback(false);
              } else {
                callback(true);
              }
            }, 500);
          });
        })
        .error(function (error) {
          console.log("Error on getting json data for exit button...", error);
          $state.go("lesson");
        });
    };
  });

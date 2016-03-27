angular.module("bookbuilder2")
  .controller("GroupsController", function (Download, $ionicLoading, $scope, $ionicPlatform, $timeout, $http, _, $ionicPopup, $state, $rootScope, Toast, $cordovaFile) {

    console.log("GroupsController loaded!");

    $scope.backgroundView = {
      "background": "url(" + $rootScope.rootDir + "data/assets/first_menu_background.png) no-repeat center top",
      "-webkit-background-size": "cover",
      "-moz-background-size": "cover",
      "background-size": "cover"
    };

    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }

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

      $scope.savedGroupButtonsArray = {};
      $scope.savedLessonButtonsArray = {};

      /*Image Loader*/
      var imageLoader = new createjs.ImageLoader(new createjs.LoadItem().set({
        src: $rootScope.rootDir + "data/assets/first_menu_background_b1.png"
      }));
      imageLoader.load();


      /*IMAGE LOADER COMPLETED*/
      imageLoader.on("complete", function (r) {

        console.log("Background Image Loaded...");

        /*Creating Bitmap Background for Canvas*/
        var background = new createjs.Bitmap($rootScope.rootDir + "data/assets/first_menu_background_b1.png");

        $timeout(function () {
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
              //Reassigning images with the rest of resource
              response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
              var exitButtonSpriteSheet = new createjs.SpriteSheet(response);
              var exitButton = new createjs.Sprite(exitButtonSpriteSheet, "normal");
              exitButton.visible = ionic.Platform.isAndroid();

              exitButton.addEventListener("mousedown", function (event) {
                console.log("mousedown event on a button !");
                exitButton.gotoAndPlay("onSelection");
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

              var completedTween = function () {
                console.log("Completed Tween");
              };

              /* ---------------------------------------- ADDING GROUP BUTTONS ---------------------------------------- */
              var waterFallFunctions = [];
              _.each(response.lessonGroups, function (lessonGroup) {

                waterFallFunctions.push(function (waterfallCallback) {

                  var spriteUrl = $rootScope.rootDir + "data/assets/" + lessonGroup.groupButtonSprite;
                  console.log("spriteUrl: ", spriteUrl);

                  //Getting the element
                  $http.get(spriteUrl)
                    .success(function (response) {
                      //Reassigning images with the rest of resource
                      response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];
                      var groupButtonSpriteSheet = new createjs.SpriteSheet(response);

                      $scope.savedGroupButtonsArray[lessonGroup.groupId] = new createjs.Sprite(groupButtonSpriteSheet, "normal");

                      $scope.savedGroupButtonsArray[lessonGroup.groupId].addEventListener("mousedown", function (event) {
                        console.log("mousedown event on a button !");
                        $scope.savedGroupButtonsArray[lessonGroup.groupId].gotoAndPlay("onSelection");
                        $scope.stage.update();
                      });

                      $scope.savedGroupButtonsArray[lessonGroup.groupId].addEventListener("pressup", function (event) {
                        console.log("pressup event on a group button !");
                        $scope.savedGroupButtonsArray[lessonGroup.groupId].gotoAndPlay("selected");

                        $rootScope.selectedGroupId = lessonGroup.groupId;

                        _.each($scope.savedGroupButtonsArray, function (button, key, list) {
                          if (key !== lessonGroup.groupId) {
                            $scope.savedGroupButtonsArray[key].gotoAndPlay("normal");
                          }
                        });
                        $scope.stage.update();

                        var parallelFunctions = [];
                        //Make all lessons dissappear from the screen
                        console.log("$scope.savedLessonButtonsArray", $scope.savedLessonButtonsArray);
                        _.each($scope.savedLessonButtonsArray, function (lesson, key, list) {
                          parallelFunctions.push(function (parallelCallback) {
                            createjs.Tween.get($scope.savedLessonButtonsArray[key], {loop: false}).to({x: 1500 * scale}, 200, createjs.Ease.getPowIn(2)).call(parallelCallback);
                          });
                        });

                        async.parallel(parallelFunctions, function (err, response) {
                          console.log("parallelFunctions savedLessonButtonsArray finished");
                          $scope.savedLessonButtonsArray = {};
                          addSelectedGroupLessonsButtons($scope.savedGroupButtonsArray[lessonGroup.groupId].lessons);
                        });
                      });

                      $scope.savedGroupButtonsArray[lessonGroup.groupId].lessons = lessonGroup.lessons;
                      $scope.savedGroupButtonsArray[lessonGroup.groupId].groupId = lessonGroup.groupId;
                      $scope.savedGroupButtonsArray[lessonGroup.groupId].y = yPosition;
                      $scope.savedGroupButtonsArray[lessonGroup.groupId].x = -1500 * scale;

                      createjs.Tween.get($scope.savedGroupButtonsArray[lessonGroup.groupId], {loop: false}).to({x: 120}, 1000, createjs.Ease.getPowIn(2));

                      yPosition += buttonHeight;
                      groupsMenuContainer.addChild($scope.savedGroupButtonsArray[lessonGroup.groupId]);
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


              async.waterfall(waterFallFunctions, function (callback) {
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

            lessonsMenuContainer.removeAllEventListeners();
            lessonsMenuContainer.removeAllChildren();
            console.log("lessonsMenuContainer", lessonsMenuContainer.numChildren);
            /*Array for saving the lesson buttons references*/
            var yPosition = 150;

            var waterFallFunctions = [];
            _.each(selectedGroupLessons, function (lesson, key, list) { //lesson is a varible that is inside the function and is accessible by each button at all times

              waterFallFunctions.push(function (waterfallCallback) {

                var spriteResourceUrl = $rootScope.rootDir + "data/assets/" + lesson.lessonButtonSprite;

                $http.get(spriteResourceUrl)
                  .success(function (response) {

                    //Reassigning images with the rest of resource
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                    var lessonButtonSpriteSheet = new createjs.SpriteSheet(response);

                    $scope.savedLessonButtonsArray[lesson.id] = new createjs.Sprite(lessonButtonSpriteSheet, "normal");

                    /* -------------------------------- CLICK ON LESSON BUTTON -------------------------------- */

                    $scope.savedLessonButtonsArray[lesson.id].addEventListener("mousedown", function (event) {
                      console.log("mousedown event on a lesson button!");
                      $scope.savedLessonButtonsArray[lesson.id].gotoAndPlay("onSelection");
                      $scope.stage.update();
                    });

                    $scope.savedLessonButtonsArray[lesson.id].addEventListener("pressup", function (event) {
                      console.log("pressup event on a lesson button !");
                      $scope.savedLessonButtonsArray[lesson.id].gotoAndPlay("selected");
                      $scope.stage.update();

                      _.each($scope.savedLessonButtonsArray, function (button, key, list) {
                        if (key !== lesson.id) {
                          $scope.savedLessonButtonsArray[key].gotoAndPlay("normal");
                        }
                      });
                      $scope.stage.update();

                      console.log("Selected lesson id " + lesson.id + " active " + lesson.active);
                      $rootScope.selectedLessonId = lesson.id;

                      if (lesson.active) {

                        if ($scope.savedLessonButtonsArray[lesson.id].downloaded) {

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

                    $scope.savedLessonButtonsArray[lesson.id].y = yPosition;
                    $scope.savedLessonButtonsArray[lesson.id].x = 1500 * scale;

                    createjs.Tween.get($scope.savedLessonButtonsArray[lesson.id], {loop: false}).wait(yPosition)
                      .to({x: 120}, 500, createjs.Ease.getPowIn(2));

                    yPosition += 55;
                    lessonsMenuContainer.addChild($scope.savedLessonButtonsArray[lesson.id]);
                    $scope.stage.update();

                    $timeout(function () {
                      waterfallCallback();
                    }, 50);

                  }).error(function (error) {
                  console.log("There was an error on getting lesson json");
                });
              });
            });

            async.waterfall(waterFallFunctions, function (err, res) {
              checkIfLessonGroupIsDownloaded($rootScope.selectedGroupId, function () {
                $scope.downloadIcon.visible = true;
                $scope.deleteIcon.visible = true;
                $scope.stage.update();
              });
            });
          }//End of function


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
              $scope.stage.update();

              var confirmPopup = $ionicPopup.confirm({
                title: 'Download ' + _.findWhere($rootScope.book.lessonGroups, {"groupId": $rootScope.selectedGroupId}).groupTitle,
                template: 'Do you want to download the contents of ' + _.findWhere($rootScope.book.lessonGroups, {"groupId": $rootScope.selectedGroupId}).groupTitle + "?"
              });
              confirmPopup.then(function (res) {
                if (res) {
                  downloadLessonGroup($rootScope.selectedGroupId, function () {
                    checkIfLessonGroupIsDownloaded($rootScope.selectedGroupId, function () {
                      confirmPopup.close();
                      Toast.show("Lessons Downloaded!");
                    });
                  });
                }
              });

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
              $scope.stage.update();

              var confirmPopup = $ionicPopup.confirm({
                title: 'Delete ' + _.findWhere($rootScope.book.lessonGroups, {"groupId": $rootScope.selectedGroupId}).groupTitle,
                template: 'Do you want to delete the contents of ' + _.findWhere($rootScope.book.lessonGroups, {"groupId": $rootScope.selectedGroupId}).groupTitle + "?"
              });
              confirmPopup.then(function (res) {
                if (res) {
                  deleteLessonGroup($rootScope.selectedGroupId, function () {
                    checkIfLessonGroupIsDownloaded($rootScope.selectedGroupId, function () {
                      confirmPopup.close();
                      Toast.show("Lessons Deleted!");
                    });
                  });
                }
              });

            });

            $scope.deleteIcon.scaleX = $scope.deleteIcon.scaleY = scale / 4;
            $scope.deleteIcon.x = backgroundPosition.x + (backgroundPosition.width / 1.3);
            $scope.deleteIcon.y = backgroundPosition.y + (backgroundPosition.height / 1.4);
            $scope.stage.addChild($scope.deleteIcon);
            $scope.stage.update();
          });
        }, 500);
      });//end of image on complete
    }, 500);//end of timeout


    var checkIfLessonGroupIsDownloaded = function (groupId, callback) {

      console.log("Checking if lesson groups is downloaded", groupId);

      var waterFallFunctions = [];
      _.each(_.findWhere($rootScope.book.lessonGroups, {"groupId": groupId}).lessons, function (lesson, key, list) {
        waterFallFunctions.push(function (waterFallCallback) {
          checkIfLessonIsDownloaded(lesson, function (res) {
            console.log("Lesson Check " + lesson.id, res);
            if (res) {
              $scope.savedLessonButtonsArray[lesson.id].downloaded = true;
              $scope.savedLessonButtonsArray[lesson.id].alpha = 1;
              $scope.stage.update();
            } else {
              $scope.savedLessonButtonsArray[lesson.id].downloaded = false;
              if (lesson.active) {
                $scope.savedLessonButtonsArray[lesson.id].alpha = 0.5;
              } else {
                $scope.savedLessonButtonsArray[lesson.id].alpha = 0.15;
              }
              $scope.stage.update();
            }
            waterFallCallback();
          });
        });
      });
      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });
    };

    var checkIfLessonIsDownloaded = function (lesson, callback) {
      $cordovaFile.checkDir($rootScope.rootDir + "data/lessons/", lesson.id)
        .then(function (success) {
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
                if (err) {
                  return callback(false);
                } else {
                  return callback(true);
                }
              });
            })
            .error(function (error) {
              console.log("Error on getting json data for lessonassets...", error);
              callback(false)
            });
        }, function (error) {
          console.log("The lesson folder doesnot exist for lesson", lesson.id);
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
      $rootScope.totalFilesLessonAssets = 2;
      $rootScope.downloadingLessonAsset = 0;

      Download.assets(["lesson.json", "lessonassets.json"], $rootScope.book.cdnUrl, "data/lessons", lesson.id, function (response) {
        console.log(lesson.id + " downloaded basic lesson file lesson.json and lessonassets.json ", response);

        $http.get($rootScope.rootDir + "data/lessons/" + lesson.id + "/lessonassets.json")
          .success(function (response) {

            var waterFallFunctions = [];
            _.each(response, function (arrayOfStrings, key, list) {

              console.log("arrayOfStrings", arrayOfStrings);

              waterFallFunctions.push(function (waterfallCallback) {

                Download.assets(arrayOfStrings, $rootScope.book.cdnUrl, "data/lessons/" + lesson.id, key, function (response) {
                  $rootScope.downloadingLessonAsset++;
                  $ionicLoading.show({
                    template: lesson.title + " " + ($rootScope.downloadingLessonAsset && $rootScope.totalFilesLessonAssets ? (($rootScope.downloadingLessonAsset / $rootScope.totalFilesLessonAssets) * 100).toFixed() : 0) + "%"
                  });
                  if (response) {
                    waterfallCallback(null);
                  } else {
                    waterfallCallback(true);
                  }
                });
              });
            });

            $rootScope.totalFilesLessonAssets = waterFallFunctions.length;
            console.log("TOTAL LESSON ASSETS", $rootScope.totalFilesLessonAssets);

            $ionicLoading.show({
              template: "Downloading " + ($rootScope.downloadingLessonAsset && $rootScope.totalFilesLessonAssets ? (($rootScope.downloadingLessonAsset / $rootScope.totalFilesLessonAssets) * 100).toFixed() : 0) + "%"
            });

            async.waterfall(waterFallFunctions, function (err, response) {
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
            $rootScope.showPopup();
          });

      });
    };

    var downloadLessonGroup = function (groupId, callback) {
      var waterFallFunctions = [];
      _.each(_.findWhere($rootScope.book.lessonGroups, {"groupId": groupId}).lessons, function (lesson, key, list) {
        if (lesson.active) {
          waterFallFunctions.push(function (waterFallCallback) {
            downloadLessonAssets(lesson, function () {
              waterFallCallback();
            });
          });
        }
      });
      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });
    };

    var deleteLessonGroup = function (groupId, callback) {


      var waterFallFunctions = [];

      _.each(_.findWhere($rootScope.book.lessonGroups, {"groupId": groupId}).lessons, function (lesson, key, list) {

        waterFallFunctions.push(function (waterFallCallback) {

          $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "data/lessons/" + lesson.id)
            .then(function (success) {
              console.log(lesson.id + " assets directory deleted!");
              waterFallCallback();
            }, function (error) {
              console.log(error);
              waterFallCallback();
            });
        });
      });

      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });

    };

    $ionicPlatform.onHardwareBackButton(function () {
      ionic.Platform.exitApp();
    });


  });

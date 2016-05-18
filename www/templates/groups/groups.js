angular.module("bookbuilder2")
  .controller("GroupsController", function (TypicalFunctions, Download, $ionicLoading, $scope, $ionicPlatform, $timeout, $http, _, $ionicHistory, $ionicPopup, $state, $rootScope, Toast, $cordovaFile) {

    console.log("GroupsController loaded!");

    TypicalFunctions.loadVariablesFromLocalStorage();

    $scope.backgroundView = {
      "background": "url(" + $rootScope.rootDir + "data/assets/first_menu_background.png) no-repeat center top",
      "-webkit-background-size": "cover",
      "-moz-background-size": "cover",
      "background-size": "cover"
    };

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

      createjs.Ticker.framerate = 10;
      var handleTick = function () {
        $scope.stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
        ionic.Platform.exitApp();
      });
      $ionicPlatform.on('resume', function () {
        createjs.Ticker.framerate = 10;
      });

      $scope.savedGroupButtonsArray = {};
      $scope.savedLessonButtonsArray = {};

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
          $scope.scale = 1;
          if (scaleX >= scaleY) {
            $scope.scale = scaleY;
          } else {
            $scope.scale = scaleX;
          }
          console.log("GENERAL SCALING FACTOR", $scope.scale);
          //IN ORDER TO FIND THE CORRECT COORDINATES FIRST WE NEED TO ENTER THE EXACT SAME DIMENSIONS IN THE EMULATOR OF THE BACKGROUND IMAGE

          background.scaleX = $scope.scale;
          background.scaleY = $scope.scale;
          background.regX = background.image.width / 2;
          background.regY = background.image.height / 2;
          background.x = $scope.stage.canvas.width / 2;
          background.y = $scope.stage.canvas.height / 2;
          $scope.stage.addChild(background);
          var backgroundPosition = background.getTransformedBounds();


          /* -------------------------------- MAIN CONTAINER -------------------------------- */
          $scope.mainContainer = new createjs.Container();
          $scope.mainContainer.width = background.image.width;
          $scope.mainContainer.height = background.image.height;
          $scope.mainContainer.scaleX = $scope.mainContainer.scaleY = $scope.scale;
          $scope.mainContainer.x = backgroundPosition.x;
          $scope.mainContainer.y = backgroundPosition.y;
          $scope.stage.addChild($scope.mainContainer);

          /* -------------------------------- POPULATING LEFT SIDE GROUP MENU -------------------------------- */
          //This groups.json is loaded within the application and not from the server!
          $http.get($rootScope.rootDir + "data/book/groups.json")
            .success(function (response) {


              $rootScope.book = response;
              window.localStorage.setItem("book", JSON.stringify($rootScope.book));


              $scope.spaceBetweenGroups = 55;
              if ($rootScope.book.bookTemplate === "groups") {
                $scope.leftMarginGroupButtons = 165;
                $scope.downloadDeleteIconY = 500;
                $scope.exitButtonY = 615;
              } else {
                $scope.leftMarginGroupButtons = 140;
                $scope.downloadDeleteIconY = 555;
                $scope.exitButtonY = 595;
              }

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
                    $scope.stage.update();
                    ionic.Platform.exitApp();
                  });
                  exitButton.x = $scope.mainContainer.width / 2;
                  exitButton.y = $scope.exitButtonY;
                  $scope.mainContainer.addChild(exitButton);
                })
                .error(function (error) {
                  console.log("Error on getting json data for exit button...");
                });

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
                $scope.downloadIcon.scaleX = $scope.downloadIcon.scaleY = 0.3;
                $scope.downloadIcon.x = 780;
                $scope.downloadIcon.y = $scope.downloadDeleteIconY;
                $scope.mainContainer.addChild($scope.downloadIcon);
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

                $scope.deleteIcon.scaleX = $scope.deleteIcon.scaleY = 0.3;
                $scope.deleteIcon.x = 680;
                $scope.deleteIcon.y = $scope.downloadDeleteIconY;
                $scope.mainContainer.addChild($scope.deleteIcon);
              });


              //groupsMenuContainer CREATION
              $scope.groupsMenuContainer = new createjs.Container();
              $scope.groupsMenuContainer.width = 330;
              $scope.groupsMenuContainer.height = 500;
              $scope.groupsMenuContainer.x = 10;
              $scope.groupsMenuContainer.y = 90;
              $scope.mainContainer.addChild($scope.groupsMenuContainer);

              /* ---------------------------------------- ADDING GROUP BUTTONS ---------------------------------------- */
              var waterFallFunctions = [];
              _.each(response.lessonGroups, function (lessonGroup, key) {

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
                        //Make all lessons disappear from the screen
                        console.log("$scope.savedLessonButtonsArray", $scope.savedLessonButtonsArray);
                        _.each($scope.savedLessonButtonsArray, function (lesson, key, list) {
                          parallelFunctions.push(function (parallelCallback) {
                            createjs.Tween.get($scope.savedLessonButtonsArray[key], {loop: false}).to({x: 1500 * $scope.scale}, 200, createjs.Ease.getPowIn(2)).call(parallelCallback);
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
                      $scope.savedGroupButtonsArray[lessonGroup.groupId].y = ($scope.groupsMenuContainer.height - $rootScope.book.lessonGroups.length * 50) / 2 + (key * $scope.spaceBetweenGroups);
                      $scope.savedGroupButtonsArray[lessonGroup.groupId].x = -1500;
                      $scope.groupsMenuContainer.addChild($scope.savedGroupButtonsArray[lessonGroup.groupId]);

                      createjs.Tween.get($scope.savedGroupButtonsArray[lessonGroup.groupId], {loop: false}).to({x: $scope.leftMarginGroupButtons}, 1000, createjs.Ease.getPowIn(2));

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


          /* -------------------------------- POPULATING RIGHT SIDE MENU -------------------------------- */
          $scope.lessonsMenuContainer = new createjs.Container();

          /*It's important too define containers height before start calculating buttons*/
          $scope.lessonsMenuContainer.width = 236;
          $scope.lessonsMenuContainer.height = 440;
          $scope.lessonsMenuContainer.x = 645;
          $scope.lessonsMenuContainer.y = 110;
          $scope.mainContainer.addChild($scope.lessonsMenuContainer);


          /*Function that populates right-side menu according to selected group menu*/
          function addSelectedGroupLessonsButtons(selectedGroupLessons) {
            //Initializing lessonsMenuContainer for re-population
            $scope.lessonsMenuContainer.removeAllEventListeners();
            $scope.lessonsMenuContainer.removeAllChildren();
            //Checking which lessons have been selected
            console.log("Selected Group Lessons: ", selectedGroupLessons);

            var waterFallFunctions = [];

            _.each(selectedGroupLessons, function (lesson, key, list) { //lesson is a variable that is inside the function and is accessible by each button at all times

              waterFallFunctions.push(function (waterfallCallback) {

                var spriteResourceUrl = $rootScope.rootDir + "data/assets/" + lesson.lessonButtonSprite;

                console.log("Sprite resource URL for lesson button: ", spriteResourceUrl);

                $http.get(spriteResourceUrl)
                  .success(function (response) {

                    console.log("Success on getting Lesson Button Sprite!");
                    //Reassigning images with the rest of resource
                    response.images[0] = $rootScope.rootDir + "data/assets/" + response.images[0];

                    var lessonButtonSpriteSheet = new createjs.SpriteSheet(response);

                    //Creating the lesson button and adding it to savedLessonButtonsArray
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

                      $rootScope.selectedLessonId = lesson.id;
                      window.localStorage.setItem("selectedLessonId", $rootScope.selectedLessonId);

                      if (lesson.active) {

                        if ($scope.savedLessonButtonsArray[lesson.id].downloaded) {

                          downloadLessonAssets(lesson, function (response) {
                            if (response) {
                              console.log("Success on downloading Lesson");
                              $ionicHistory.nextViewOptions({
                                historyRoot: true,
                                disableBack: true
                              });

                              $ionicHistory.clearCache();
                              createjs.Tween.removeAllTweens();
                              $scope.stage.removeAllEventListeners();
                              $scope.stage.removeAllChildren();

                              if ($rootScope.book.bookTemplate === "groups") {
                                $state.go("lesson", {}, {reload: true});
                              } else {
                                $state.go("lessonNew", {}, {reload: true});
                              }
                            } else {
                              console.log("Error on downloading Lesson");
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
                                  //Clearing Lesson after downloading for the first time!

                                  _.each(lesson.lessonMenu, function (activity, key, list) {
                                    window.localStorage.removeItem(lesson.id + "_" + activity.activityFolder);
                                  });
                                  _.each(lesson.activitiesMenu, function (activity, key, list) {
                                    window.localStorage.removeItem(lesson.id + "_" + activity.activityFolder);
                                  });

                                  $ionicHistory.nextViewOptions({
                                    historyRoot: true,
                                    disableBack: true
                                  });
                                  $ionicHistory.clearCache();
                                  createjs.Tween.removeAllTweens();
                                  $scope.stage.removeAllEventListeners();
                                  $scope.stage.removeAllChildren();
                                  if ($rootScope.book.bookTemplate === "groups") {
                                    $state.go("lesson", {}, {reload: true});
                                  } else {
                                    $state.go("lessonNew", {}, {reload: true});
                                  }
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
                    $scope.savedLessonButtonsArray[lesson.id].y = ($scope.lessonsMenuContainer.height - selectedGroupLessons.length * 50) / 2 + (key * $scope.spaceBetweenGroups);
                    $scope.savedLessonButtonsArray[lesson.id].x = 1500;

                    createjs.Tween.get($scope.savedLessonButtonsArray[lesson.id], {loop: false}).wait(100)
                      .to({x: 120}, 500, createjs.Ease.getPowIn(2));

                    //Adding Lesson button
                    $scope.lessonsMenuContainer.addChild($scope.savedLessonButtonsArray[lesson.id]);

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

        }, 500);//End of timeout() for calculating $scope.scale
      });//End of imageLoader()
    }, 1500);//End of general timeout()


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
            } else {
              $scope.savedLessonButtonsArray[lesson.id].downloaded = false;
              if (lesson.active) {
                $scope.savedLessonButtonsArray[lesson.id].alpha = 0.5;
              } else {
                $scope.savedLessonButtonsArray[lesson.id].alpha = 0.15;
              }
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
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });

              $ionicHistory.clearCache();
              createjs.Tween.removeAllTweens();
              $scope.stage.removeAllEventListeners();
              $scope.stage.removeAllChildren();

              if ($rootScope.book.bookTemplate === "groups") {
                $state.go("lesson", {}, {reload: true});
              } else {
                $state.go("lessonNew", {}, {reload: true});
              }
            } else {
              showDownloadingError(lesson);
            }
          });
        } else {
          $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableBack: true
          });

          $ionicHistory.clearCache();
          createjs.Tween.removeAllTweens();
          $scope.stage.removeAllEventListeners();
          $scope.stage.removeAllChildren();

          if ($rootScope.book.bookTemplate === "groups") {
            $state.go("lesson", {}, {reload: true});
          } else {
            $state.go("lessonNew", {}, {reload: true});
          }
        }
      });
    };

    var downloadLessonAssets = function (lesson, callback) {
      $rootScope.totalFilesLessonAssets = 2;
      $rootScope.downloadingLessonAsset = 0;
      var lessonSpecificFiles = ["lesson.json", "lessonassets.json"];

      if ($rootScope.book.bookTemplate === "groupsNew") {
        lessonSpecificFiles.push("background_image_icon.png");
        $rootScope.totalFilesLessonAssets++;
      }

      $ionicLoading.show();

      Download.assets(lessonSpecificFiles, $rootScope.cdnUrl, "data/lessons", lesson.id, function (response) {
        console.log(lesson.id + " downloaded basic lesson file lesson.json and lessonassets.json ", response);

        $http.get($rootScope.rootDir + "data/lessons/" + lesson.id + "/lessonassets.json")
          .success(function (response) {

            var waterFallFunctions = [];
            _.each(response, function (arrayOfStrings, key, list) {

              console.log("arrayOfStrings", arrayOfStrings);

              waterFallFunctions.push(function (waterfallCallback) {

                Download.assets(arrayOfStrings, $rootScope.cdnUrl, "data/lessons/" + lesson.id, key, function (response) {
                  $rootScope.downloadingLessonAsset++;
                  $ionicLoading.show({
                    template: lesson.title + " - " + ($rootScope.downloadingLessonAsset && $rootScope.totalFilesLessonAssets ? (($rootScope.downloadingLessonAsset / $rootScope.totalFilesLessonAssets) * 100).toFixed() : 0) + "%"
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
            TypicalFunctions.showPopup();
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

          var lessonResourceUrl = $rootScope.rootDir + 'data/lessons/' + lesson.id + "/lesson.json";

          $http.get(lessonResourceUrl).success(function (response) {

            _.each(response.lessonMenu, function (activity, key, list) {
              console.log("Clearing", lesson.id + "_" + activity.activityFolder);
              window.localStorage.removeItem(lesson.id + "_" + activity.activityFolder);
            });

            $cordovaFile.removeRecursively(window.cordova.file.dataDirectory, "data/lessons/" + lesson.id)
              .then(function (success) {
                console.log(lesson.id + " assets directory deleted!");
                waterFallCallback();
              }, function (error) {
                console.log(error);
                waterFallCallback();
              });
          }).error(function (err) {
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
      });

      async.waterfall(waterFallFunctions, function (err, res) {
        callback();
      });

    };

    $ionicPlatform.onHardwareBackButton(function () {
      ionic.Platform.exitApp();
    });


  });

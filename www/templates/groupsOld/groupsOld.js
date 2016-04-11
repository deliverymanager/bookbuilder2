angular.module("bookbuilder2")
  .controller("GroupsController", function (Download, $ionicLoading, $scope, $ionicPlatform, $timeout, $http, _, $ionicHistory, $ionicPopup, $state, $rootScope, Toast, $cordovaFile) {

    console.log("GroupsController loaded!");

    if (window.cordova && window.cordova.platformId !== "browser") {
      $rootScope.rootDir = window.cordova.file.dataDirectory;
    } else {
      $rootScope.rootDir = "";
    }

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

      createjs.Ticker.framerate = 20;
      var handleTick = function () {
        $scope.$apply();
        $scope.stage.update();
      };
      createjs.Ticker.addEventListener("tick", handleTick);

      $ionicPlatform.on('pause', function () {
        console.log('pause');
        createjs.Ticker.framerate = 0;
        ionic.Platform.exitApp();
      });
      $ionicPlatform.on('resume', function () {
        createjs.Ticker.framerate = 20;
      });

      $scope.savedGroupButtonsArray = {};
      $scope.savedLessonButtonsArray = {};

      var bitmapLoaders = {};

      async.waterfall([function (waterfallCallback) {

        if (bitmapLoaders["first_menu_background_b1"] && bitmapLoaders["first_menu_background_b1"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["first_menu_background_b1"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/first_menu_background_b1.png"
          }));

          bitmapLoaders["first_menu_background_b1"].load();

          bitmapLoaders["first_menu_background_b1"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

        $scope.background = new createjs.Bitmap($rootScope.rootDir + "data/assets/first_menu_background_b1.png");
        var scaleY = $scope.stage.canvas.height / $scope.background.image.height;
        scaleY = scaleY.toFixed(2);
        var scaleX = $scope.stage.canvas.width / $scope.background.image.width;
        scaleX = scaleX.toFixed(2);
        $scope.scale = 1;
        if (scaleX >= scaleY) {
          $scope.scale = scaleY;
        } else {
          $scope.scale = scaleX;
        }
        console.log("GENERAL SCALING FACTOR", $scope.scale);

        $scope.background.scaleX = $scope.scale;
        $scope.background.scaleY = $scope.scale;
        $scope.background.regX = $scope.background.image.width / 2;
        $scope.background.regY = $scope.background.image.height / 2;
        $scope.background.x = $scope.stage.canvas.width / 2;
        $scope.background.y = $scope.stage.canvas.height / 2;
        $scope.stage.addChild($scope.background);
        $scope.backgroundPosition = $scope.background.getTransformedBounds();
        console.log("$scope.backgroundPosition", $scope.backgroundPosition);

        $timeout(function () {
          waterfallCallback();
        });

      }, function (waterfallCallback) {

        /* -------------------------------- LEFT SIDE GROUP MENU -------------------------------- */
        //This groups.json is loaded within the application and not from the server!
        $http.get($rootScope.rootDir + "data/book/groups.json")
          .success(function (response) {
            //$scope.groupsMenuContainer CREATION
            $scope.groupsMenuContainer = new createjs.Container();
            $scope.groupsMenuContainer.width = 236;
            $scope.groupsMenuContainer.height = 480;

            $rootScope.book = response;
            window.localStorage.setItem("book", JSON.stringify($rootScope.book));

            $scope.groupsMenuContainer.scaleX = $scope.groupsMenuContainer.scaleY = $scope.scale;

            $scope.buttonHeight = 50;
            $scope.yPosition = 40;

            $scope.groupsMenuContainer.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 17);
            $scope.groupsMenuContainer.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 7);

            $scope.stage.addChild($scope.groupsMenuContainer);
            waterfallCallback();

          }).error(function (error) {
          console.error("There was an error getting groups.json: ", error);
          waterfallCallback();
        });

      }, function (waterfallCallback) {

        if (bitmapLoaders["first_menu_exit_button_sprite"] && bitmapLoaders["first_menu_exit_button_sprite"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["first_menu_exit_button_sprite"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/first_menu_exit_button_sprite.png"
          }));

          bitmapLoaders["first_menu_exit_button_sprite"].load();

          bitmapLoaders["first_menu_exit_button_sprite"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

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
            exitButton.scaleX = exitButton.scaleY = $scope.scale;
            exitButton.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 2);
            exitButton.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.07);
            $scope.stage.addChild(exitButton);
            waterfallCallback();
          })
          .error(function (error) {
            console.log("Error on getting json data for exit button...");
            waterfallCallback();
          });


      }, function (waterfallCallback) {

        if (bitmapLoaders["deleteIcon"] && bitmapLoaders["deleteIcon"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["deleteIcon"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/deleteIcon.png"
          }));

          bitmapLoaders["deleteIcon"].load();

          bitmapLoaders["deleteIcon"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {

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

        $scope.deleteIcon.scaleX = $scope.deleteIcon.scaleY = $scope.scale / 4;
        $scope.deleteIcon.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.3);
        $scope.deleteIcon.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.4);
        $scope.stage.addChild($scope.deleteIcon);

        waterfallCallback();

      }, function (waterfallCallback) {

        if (bitmapLoaders["downloadIcon"] && bitmapLoaders["downloadIcon"].loaded) {
          waterfallCallback();
        } else {
          bitmapLoaders["downloadIcon"] = new createjs.ImageLoader(new createjs.LoadItem().set({
            src: $rootScope.rootDir + "data/assets/downloadIcon.png"
          }));

          bitmapLoaders["downloadIcon"].load();

          bitmapLoaders["downloadIcon"].on("complete", function (r) {
            $timeout(function () {
              waterfallCallback();
            });
          });
        }

      }, function (waterfallCallback) {


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

        $scope.downloadIcon.scaleX = $scope.downloadIcon.scaleY = $scope.scale / 4;
        $scope.downloadIcon.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.15);
        $scope.downloadIcon.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 1.4);
        $scope.stage.addChild($scope.downloadIcon);

        waterfallCallback();

      }, function (waterfallCallback) {


        var waterfallFunctions = [];
        _.each($rootScope.book.lessonGroups, function (lessonGroup) {

          waterfallFunctions.push(function (miniWaterfallCallback) {
            var spriteResourceUrlPng = lessonGroup.groupButtonSprite.split(".")[0];

            if (bitmapLoaders[spriteResourceUrlPng] && bitmapLoaders[spriteResourceUrlPng].loaded) {
              miniWaterfallCallback();
            } else {
              bitmapLoaders[spriteResourceUrlPng] = new createjs.ImageLoader(new createjs.LoadItem().set({
                src: $rootScope.rootDir + "data/assets/" + spriteResourceUrlPng + ".png"
              }));

              bitmapLoaders[spriteResourceUrlPng].load();

              bitmapLoaders[spriteResourceUrlPng].on("complete", function (r) {
                $timeout(function () {
                  miniWaterfallCallback();
                });
              });
            }
          });
        });

        async.waterfall(waterfallFunctions, function (callback) {
          waterfallCallback();
        });

      }, function (waterfallCallback) {

        var waterfallFunctions = [];
        _.each($rootScope.book.lessonGroups, function (lessonGroup) {

          waterfallFunctions.push(function (miniWaterfallCallback) {

            var spriteUrl = $rootScope.rootDir + "data/assets/" + lessonGroup.groupButtonSprite;

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


                  var parallelFunctions = [];
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
                $scope.savedGroupButtonsArray[lessonGroup.groupId].y = $scope.yPosition;
                $scope.savedGroupButtonsArray[lessonGroup.groupId].x = -1500 * $scope.scale;

                createjs.Tween.get($scope.savedGroupButtonsArray[lessonGroup.groupId], {loop: false}).to({x: 120}, 1000, createjs.Ease.getPowIn(2));

                $scope.yPosition += $scope.buttonHeight;
                $scope.groupsMenuContainer.addChild($scope.savedGroupButtonsArray[lessonGroup.groupId]);

                $timeout(function () {
                  miniWaterfallCallback();
                }, 100);

              })
              .error(function (error) {
                console.log("Error on getting json data for group button...");
              });
          });
        }); //end of _.each (groupLessons)


        async.waterfall(waterfallFunctions, function (callback) {
          console.log("Lessons Of a group are  Inserted!");
          waterfallCallback();
        });

      }], function (err, response) {


        $scope.lessonsMenuContainer = new createjs.Container();

        /*It's important too define containers height before start calculating buttons*/
        $scope.lessonsMenuContainer.width = 236;
        $scope.lessonsMenuContainer.height = 480;

        $scope.lessonsMenuContainer.scaleX = $scope.lessonsMenuContainer.scaleY = $scope.scale;
        $scope.lessonsMenuContainer.x = $scope.backgroundPosition.x + ($scope.backgroundPosition.width / 1.4);
        $scope.lessonsMenuContainer.y = $scope.backgroundPosition.y + ($scope.backgroundPosition.height / 7);

        $scope.stage.addChild($scope.lessonsMenuContainer);


      });

    }, 500);//end of timeout


    function addSelectedGroupLessonsButtons(selectedGroupLessons) {

      $scope.lessonsMenuContainer.removeAllEventListeners();
      $scope.lessonsMenuContainer.removeAllChildren();
      console.log("$scope.lessonsMenuContainer", $scope.lessonsMenuContainer.numChildren);
      /*Array for saving the lesson buttons references*/
      $scope.yPosition = 150;

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
                        $ionicHistory.nextViewOptions({
                          historyRoot: true,
                          disableBack: true
                        });
                        $state.go("lesson", {}, {reload: true});
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
                            //Clearing Lesson after downloading for the first time!
                            $ionicHistory.nextViewOptions({
                              historyRoot: true,
                              disableBack: true
                            });
                            $state.go("lesson", {}, {reload: true});
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

              $scope.savedLessonButtonsArray[lesson.id].y = $scope.yPosition;
              $scope.savedLessonButtonsArray[lesson.id].x = 1500 * $scope.scale;

              createjs.Tween.get($scope.savedLessonButtonsArray[lesson.id], {loop: false}).wait($scope.yPosition)
                .to({x: 120}, 500, createjs.Ease.getPowIn(2));

              $scope.yPosition += 55;
              $scope.lessonsMenuContainer.addChild($scope.savedLessonButtonsArray[lesson.id]);
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
              $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
              });
              $state.go("lesson", {}, {reload: true});
            } else {
              showDownloadingError(lesson);
            }
          });
        } else {
          $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableBack: true
          });
          $state.go("lesson", {}, {reload: true});
        }
      });
    };

    var downloadLessonAssets = function (lesson, callback) {
      $rootScope.totalFilesLessonAssets = 2;
      $rootScope.downloadingLessonAsset = 0;

      Download.assets(["lesson.json", "lessonassets.json"], $rootScope.cdnUrl, "data/lessons", lesson.id, function (response) {
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

angular.module("bookbuilder2")
    .factory("LocalStorage",
        function LocalStorageFactory() {
            return {
                save: function (name, data) {
                    localStorage.setItem(name,data);
                },
                get: function(name){
                    return localStorage.getItem(name);
                }
            };
        }
    );
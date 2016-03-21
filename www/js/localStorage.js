angular.module("bookbuilder2")
    .factory("LocalStorage",
        function LocalStorageFactory() {
            return {
                set: function (name, data) {
                    localStorage.setItem(name,data);
                },
                get: function(name){
                    return localStorage.getItem(name);
                }
            };
        }
    );
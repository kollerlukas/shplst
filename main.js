/*<Firebase Code*/

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyCYcgykH7P7lv55TXXttWyfAFWdcEEDyFA",
        authDomain: "shopping-list-629b4.firebaseapp.com",
        databaseURL: "https://shopping-list-629b4.firebaseio.com",
        storageBucket: "shopping-list-629b4.appspot.com",
        messagingSenderId: "369869077853"
    };
    firebase.initializeApp(config);

    // Track the UID of the current user.
    var currentUid = null;
    firebase.auth().onAuthStateChanged(function(user) {
        // onAuthStateChanged listener triggers every time the user ID token changes.
        // This could happen when a new user signs in or signs out.
        // It could also happen when the current user ID token expires and is refreshed.
        if (user && user.uid != currentUid) {
            // Update the UI when a new user signs in.
            // Otherwise ignore if this is a token refresh.
            // Update the current user UID.
            currentUid = user.uid;
            console.log("user signed in: " + user.displayName + ", " + user.email);

            document.getElementById('sign_in_out_btn').innerHTML = 'Sign out';

            //listen for data
            checkIfUserExists(user.uid);
        } else {
            // Sign out operation. Reset the current user UID.
            currentUid = null;
            console.log("no user signed in");

            document.getElementById('sign_in_out_btn').innerHTML = 'Sign in';

            /*var uiConfig = {
                signInSuccessUrl: 'index.html',
                signInOptions: [
                // Specify providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID
                ],
                // Terms of service url can be specified and will show up in the widget.
                tosUrl: '<your-tos-url>'
            };
            // Initialize the FirebaseUI Widget using Firebase.
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            // The start method will wait until the DOM is loaded.
            ui.start('#firebaseui-auth-container', uiConfig);*/
        }
    });

    //click listner for sign_in_out_btn
    document.getElementById('sign_in_out_btn')
        .addEventListener('click', function() {
            window.open('signin.html')
        });

    var iSendTheNewData = false;
    function writeUserData(json_data) {
        if (currentUid != null) {
            iSendTheNewData = true;
            firebase.database().ref('users/' + currentUid).set({
                json_data: json_data
            });
        }
    }

    var json_data_ref = null;
    function attachUserDataListener(userId) {
        console.log("attachUserDataListener()");
        var json_data_ref = firebase.database().ref('users/' + userId + '/json_data');
        json_data_ref.on('value', function(snapshot) {
            if (!iSendTheNewData) {
                console.log("data changed: " + snapshot.val());
                handleJsonData(snapshot.val());
            } else {
                iSendTheNewData = false;
            }
        });
    }

    function checkIfUserExists(userId) {
        var usersRef = firebase.database().ref('users/');
        usersRef.child(userId).once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if (!exists) {
                var jsonData = '[]';
                writeUserData(jsonData);
            }
            attachUserDataListener(userId);
        });
    }
/*</Firebase Code>*/

app.controller('ShoppingList_controller', ['$scope',
    function($scope) {

    //init add item dialog
    var add_item_dialog = document.getElementById('add_item_dialog');

    var fab = document.getElementById('fab');
    if (!add_item_dialog.showModal) {
        dialogPolyfill.registerDialog(add_item_dialog);
    }

    //on click listener for add button
    fab.addEventListener('click', function() {
        add_item_dialog.showModal();
    });

    add_item_dialog.querySelector('.ok_button').addEventListener('click', function() {
        //add item
        $scope.addItem();
        //clear text field
        text_field.value = '';
        //close dialog
        add_item_dialog.close();
    });

    document.getElementById('cancel').addEventListener('click', function() {
        //close dialog
        add_item_dialog.close();
    });

    $scope.items = [];

    $scope.addItem = function() {
        /*check if new value is not empty*/
        if ($scope.newValue != '') {
            var newItem = {
                value: $scope.newValue,
                checked: false,
                id: new Date().getTime()
            };

            $scope.items.push(newItem);
            $scope.newValue = '';

            $scope.$digest();

            setTimeout(function() {
                componentHandler.upgradeDom('MaterialCheckbox');
            }, 0);

            if (currentUid != null){
                writeUserData(getJsonData());
            } else {
                $scope.saveDataLocal();
            }
        }
    }

    window.clearItems = function() {
        for (i = $scope.items.length -1 ; i >= 0; i--) {
            if($scope.items[i].checked) {
                $scope.removeItem(i);
                $scope.$digest();
            }
        }

        if (currentUid != null){
            writeUserData(getJsonData());
        } else {
            $scope.saveDataLocal();
        }
    }

    $scope.removeItem = function(index){
    	$scope.items.splice(index,1);
    }

    $scope.saveDataLocal = function() {
        //delete old data
        localStorage.removeItem('json_data');
        //write new data
        localStorage.setItem('json_data', /*$scope.*/getJsonData());
    }

    $scope.readLocalData = function() {
        if (localStorage.getItem('json_data')) {
            var json_data = localStorage.getItem('json_data');
            localStorage.clear();

            handleJsonData(json_data);
        }
        $scope.newValue = '';
    }

    getJsonData = function() {
        var json_data = '[';


        for (i = 0; i < $scope.items.length; i++) {
            json_data = json_data + '{';
            json_data = json_data + 'value:' + $scope.items[i].value;
            json_data = json_data + ',';
            json_data = json_data + 'checked:' + $scope.items[i].checked;
            json_data = json_data + ',';
            json_data = json_data + 'id:' + $scope.items[i].id;
            json_data = json_data + '}';

            if (i < $scope.items.length -1) {
                json_data += ', ';
            }
        }

        json_data += ']';

        console.log(json_data);

        return json_data;
    }

    handleJsonData = function(json_data) {
        console.log("handleJsonData: " + json_data);
        if (json_data != null && json_data != "[]") {

            //cut of brackets
            json_data = json_data.substring(1, json_data.length -1);

            var json_items = json_data.split(', ');

            var newItems = [];

            //parse json file
            for (i = 0; i < json_items.length; i++) {
                //cut of brackets
                if (json_items[i] != 'undefined') {
                    var json_item = json_items[i].substring(1, json_items[i].length -1);
                    var values = json_item.split(",");

                    if (values[0] != 'undefined' && values[1] != 'undefined' && values[2] != 'undefined') {
                        var value = values[0].split(':')[1];
                        var checked = (values[1].split(':')[1] == 'true');
                        var id = values[2].split(':')[1];

                        var newItem = {
                            value: value,
                            checked: checked,
                            id: id,
                        };

                        newItems.push(newItem);
                    }
                }
            }

            //check for new items & updated items
            for (i = 0; i < newItems.length; i++) {
                if (!$scope.doesItemsContainThisItem(newItems[i])) {
                    //new item

                    //$scope.items.splice(i, 0, newItems[i]);
                    $scope.items.push(newItems[i]);
                } else {
                    var index = $scope.getIndexOfItem(newItems[i].id);
                    if (index >= 0) {
                        var oldItem = $scope.items[index];

                        //update old item
                        oldItem.value = newItems[i].value;
                        oldItem.checked = newItems[i].checked;
                    }
                }
            }

            //check for deleted items
            for (i = $scope.items.length -1; i >= 0; i--) {
                var foundItem = false;
                for (k = 0; k < newItems.length; k++) {
                    if ($scope.items[i].id == newItems[k].id) {
                        foundItem = true;
                    }
                }

                if (!foundItem) {
                    //delete item
                    $scope.removeItem(i);
                }
            }
        }

        $scope.$digest();

        setTimeout(function() {
            componentHandler.upgradeDom('MaterialCheckbox');
        }, 0);
    }

    $scope.doesItemsContainThisItem = function(item) {
        for (i = 0; i < $scope.items.length; i++) {
            if ($scope.items[i].id == item.id) {
                return true;
            }
        }
        return false;
    }

    $scope.getIndexOfItem = function(id) {
        for (i = 0; i < $scope.items.length; i++) {
            if ($scope.items[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    $scope.onCheck = function(index) {
        console.log("onCheck(" + index + ")");
        if (currentUid != null) {
            writeUserData(getJsonData());
        } else {
            $scope.saveDataLocal();
        }
    }

    //try to restore data
    if (currentUid == null){
        $scope.readLocalData();
    }
}]);
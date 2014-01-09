var myApp = angular.module('myApp', []);

myApp.controller('ctrlOne', function($scope, $http){
    $http.jsonp("http://www.filltext.com/?callback=JSON_CALLBACK&rows=30&fname={firstName}&lname={lastName}").success(function(data){
	$scope.people = data;
    })
});
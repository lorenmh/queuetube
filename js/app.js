//Angular Application 'QueueTube'

var app = angular.module('queueTube', []);


//Service provider for search results
app.factory('searchService', function($http) {
  return {
    getSearchResults: function( q ) {
      var queryString = "http://gdata.youtube.com/feeds/videos?alt=json&start-index=" + q;
      return $http.get(queryString)
                    .then(function(response) {
                      return response.data;
                    });
    }
  }
});

function filterGoogleQueryData(data) {
  var _rtrn = {};
  _rtrn.startIndex = data.feed.openSearch$startIndex.$t;
  _rtrn.totalResults = data.feed.openSearch$totalResults.$t;
  _rtrn.itemsPerPage = data.feed.openSearch$itemsPerPage.$t;
  _rtrn.results = [];
  for (i in data.feed.entry) {
    var _oldObj = data.feed.entry[i];
    var _newObj = {};
    _newObj.id = _oldObj.id.$t.split('/').pop(); //old obj's id is a url, with the last section holding the video ID
    _newObj.author = _oldObj.author[0].name.$t;
    _newObj.title = _oldObj.title.$t;
    _newObj.thumbnail$url = _oldObj.media$group.media$thumbnail[0].url;
    _newObj.description = _oldObj.media$group.media$description.$t;
    _newObj.duration$seconds = _oldObj.media$group.yt$duration.seconds;

    _rtrn.results.push(_newObj);
  }

  return _rtrn;
}

var globalLoadMoreSearchResults;

app.controller('PlayerController', function( searchService, $scope ) {
  $scope.videoQueue = [];
  $scope.videoHistory = [];
  $scope.searchResults = [];
  var resultsPerQuery = 10;
  var storedSearchString;
  var firstSearchDone = false;

  $scope.addVideo = function() {
    $scope.videoQueue.push($scope.newVideo)
  };

  $scope.toggleSelection = function(id) {
    var index = $scope.videoQueue.indexOf(id);
    if (index > -1) {
      $scope.videoQueue.splice(index, 1);
    } else {
      $scope.videoQueue.push(id);
    }
  }

  $scope.playVideo = function() {
    player.playVideo();
  };

  $scope.pauseVideo = function() {
    player.pauseVideo();
  };

  $scope.playNextVideo = function() {
    if ($scope.videoQueue.length > 0) {
      var _nextVideo = $scope.videoQueue.splice(0,1)[0];
      $scope.videoHistory.push(_nextVideo);
      console.log(_nextVideo);
      player.loadVideoById(_nextVideo.id); //assumes videoQueue holds the video URL
    }
  };

  $scope.playPrevVideo = function() {
    if ($scope.videoHistory.length > 1) { //one element is the current video 
      var _prevVideo = $scope.videoHistory.pop();
      $scope.videoQueue.push(_prevVideo);
      console.log(_prevVideo);
      player.loadVideoById($scope.videoHistory[$scope.videoHistory.length - 1].id); 
    }
  };


  $scope.newSearch = function() {
    if ($scope.searchString) {
      firstSearchDone = false;
      $scope.searchResults = [];
      storedSearchString = escape($scope.searchString);
      var _queryString = "1&max-results=" + resultsPerQuery + "&q=" + storedSearchString;
      //.then is for the promise.  Once the request is sent, the promise is fulfilled once the response is returned
      searchService.getSearchResults( _queryString ).then(function(response) {
        $scope.searchResults.push(filterGoogleQueryData( response ));
        firstSearchDone = true;
      });
    }
  };

  $scope.loadMoreSearchResults = function() {
    if (firstSearchDone) {
      var _queryIndex = $scope.searchResults.length * resultsPerQuery + 1; //+1 because gdata starts with 1 not 0
      var _queryString = _queryIndex + "&max-results=" + resultsPerQuery + "&q=" + storedSearchString;
      var _promiseData;
      console.log(_queryString);
      //.then is for the promise.  Once the request is sent, the promise is fulfilled once the response is returned
      searchService.getSearchResults( _queryString ).then(function(response) {
        $scope.searchResults.push(filterGoogleQueryData( response ));
      });
    }
  };

  globalLoadMoreSearchResults = $scope.loadMoreSearchResults;

});

$(window).scroll(function(){ 
  if ($(window).scrollTop() == ($(document).height() - $(window).height())){
    globalLoadMoreSearchResults();
  }
});



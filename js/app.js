/**
 * Angular Application 'QueueTube'
 * Work in Progress, first created late Dec 2013
 * Created by Loren Howard, lorenhoward.com
 */
var app = angular.module('queueTube', []);

function formatSeconds(seconds) {
  var hours = Math.floor(seconds / 3600);

  var minutes = Math.floor( (seconds % 3600) / 60 );
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var modSeconds = seconds % 60;
  if (modSeconds < 10) {
    modSeconds = "0" + modSeconds;
  }

  return (hours + ":" + minutes + ":" + modSeconds);
}

/**
 * filterGoogleData takes Google's search results and puts some of the data into
 * a new object.  This new object is used in the template instead of Google's 
 * returned JSON object.
 */
function filterGoogleData(data) {
  var newData = {}; //the object to be returned
  newData.startIndex = data.feed.openSearch$startIndex.$t;
  newData.totalResults = data.feed.openSearch$totalResults.$t;
  newData.itemsPerPage = data.feed.openSearch$itemsPerPage.$t;
  newData.results = [];

  // These are the 'video objects' which are used later
  for (i in data.feed.entry) {
    var entry = data.feed.entry[i];
    var video = {};
    
    // old obj's id is a url, with the last section holding the video ID
    video.id = entry.id.$t.split('/').pop();

    video.author = entry.author[0].name.$t;
    video.title = entry.title.$t;
    video.thumbnailUrl = entry.media$group.media$thumbnail[1].url;
    video.description = entry.media$group.media$description.$t;

    video.durationSeconds = formatSeconds(
        entry.media$group.yt$duration.seconds);

    newData.results.push(video);
  }

  return newData;
}

/**
 * getSearchResults takes a shortened query string as its parameter, which would
 * include the start index, the results per page, and the escaped search string.
 * An example argument would be '1&max-results=10&q=Cats'.  When this string is 
 * appended to the end of the GET request, it would return the search results of
 * index 1 through 10 for the search 'Cats'.
 * Uses promises with the then function.
 */
app.factory('searchService', function($http) {
  return {
    getSearchResults: function( q ) {
      var queryString = "http://gdata.youtube.com" + 
        "/feeds/videos?alt=json&start-index=" + q;
      return $http.get(queryString)
          .then( function(response) {
            // then is a promise.  If the promise is fulfilled then
            // call the callback and return the data
            return response.data;
          });
    }
  }
});

// I'll look into using Angular to do this, but I want to be able to call 
// 'loadMoreSearchResults' outside of Angular's scope, so I created a global
// variable to hold the loadMoreSearchResults function.  It is currently called 
// by jQuery when the window reaches the bottom of the page.  This creates a 
// dynamic search load effect.
var globalLoadMoreSearchResults;

// Angular controller, uses the searchService for asynchronous search
app.controller('PlayerController', function( searchService, $scope ) {
  $scope.videoQueue = []; //Queue - holds the queue of videos
  $scope.videoHistory = []; //Stack - holds the video history
  
  // $scope.searchResults holds a list of search results. 
  // ex: [ [search results 1-10], [search results 11-20], ... etc ]
  $scope.searchResults = []; 
  
  var resultsPerQuery = 10;
  var storedSearchString;
  var currentlySearching = false;

  // This is to check the checkboxes in the search; If the video object is in
  // the videoQueue then the search box will be 'checked' need to revise by
  // using video objects that have a key as the id and the value as an object
  // with the video information, this would solve the issue of clearing a search
  // and making the same search, the check boxes are no longer checked!
  $scope.toggleSelection = function(video) {
    var index = $scope.videoQueue.indexOf(video);

    if (index > -1) {
      // if the video is already there remove it from the queue                       
      $scope.videoQueue.splice(index, 1);
    } else {
      // else the video is not there so add it to the queue
      $scope.videoQueue.push(video);
    }
  }

  // Plays the next video in videoQueue
  $scope.playNextVideo = function() {
    if ($scope.videoQueue.length > 0) {
      // get the next video
      var nextVideo = $scope.videoQueue.shift();
      // add the video to the history stack
      $scope.videoHistory.push(nextVideo);
      // loads and plays the video using the YouTube player API
      player.loadVideoById(nextVideo.id);
    }
  };

  $scope.playPrevVideo = function() {
    if ($scope.videoHistory.length > 1) {
      // get the previous video
      var prevVideo = $scope.videoHistory.pop();
      // add the previous video to the queue
      $scope.videoQueue.push(prevVideo);
      // play the video on the top of the stack
      // the current video is the topmost video on the history stack
      player.loadVideoById(
          $scope.videoHistory[$scope.videoHistory.length - 1].id);
    }   
  };

  $scope.playVideo = function() {
    player.playVideo();
  };

  $scope.pauseVideo = function() {
    player.pauseVideo();
  };

  $scope.newSearch = function() {
    if ($scope.searchString) {
      // set currentlySearching to true so we only do one search at a time
      currentlySearching = true;
      // clear the search results because we are doing a new search
      $scope.searchResults = [];
      // set the storedSearchString for future searches
      storedSearchString = escape($scope.searchString);

      var queryString = "1&max-results=" + resultsPerQuery + "&q=" + 
        storedSearchString;

      // calls searchService's function getSearchResults, if the promise is 
      // fulfilled it adds the filtered information to the searchResults list
      searchService.getSearchResults( queryString )
          .then( function(response) {
            // promise fulfilled, push the filtered results to the list
            $scope.searchResults.push( filterGoogleData(response) );
            currentlySearching = false;
          });
    }
  };

  $scope.loadMoreSearchResults = function() {
    if (storedSearchString && !currentlySearching) {
      currentlySearching = true;
      // queryIndex will start the search at the current location 
      // i.e. it will start the search at 41 if we've already done 4 searches
      // GData which is used for the searches starts at 1, not 0 (hence the +1)
      var queryIndex = $scope.searchResults.length * resultsPerQuery + 1;

      var queryString = queryIndex + "&max-results=" + resultsPerQuery +
        "&q=" + storedSearchString;

      // calls searchService's function getSearchResults, if the promise is 
      // fulfilled it adds the filtered information to the searchResults list
      searchService.getSearchResults( queryString )
        .then( function(response) {
          // promise fulfilled, push the filtered results to the list
          $scope.searchResults.push( filterGoogleData(response) );
          currentlySearching = false;
        });
    }
  };

  // sets the global variable as loadMoreSearchResults for use with jQuery
  globalLoadMoreSearchResults = $scope.loadMoreSearchResults;

});

// Simple jQuery function checks to see if the browser window is at the bottom
// of the page.  If the browser window is at the bottom of the page, then using
// the globalLoadMoreSearchResults function, will load more search results.
$(window).scroll(function(){ 
  // checks to see if the window is currently at the bottom of the content
  if ($(window).scrollTop() == ($(document).height() - $(window).height())) { 
    globalLoadMoreSearchResults();
  }
});



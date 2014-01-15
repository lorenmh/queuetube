/**
 * Angular Application 'QueueTube'
 * Work in Progress, first created late Dec 2013
 * Created by Loren Howard, lorenhoward.com
 */
var app = angular.module('queueTube', []);

/**
 * getSearchResults takes a shortened query string as its parameter, which would include the start index,
 * the results per page, and the escaped search string.
 * An example argument would be '1&max-results=10&q=Cats'.  When this string is appended to the end of the
 * GET request, it would return the search results of index 1 through 10 for the search 'Cats'
 * Uses promises with the then function
 */
app.factory('searchService', function($http) {
    return {
        getSearchResults: function( q ) {
            var queryString = "http://gdata.youtube.com/feeds/videos?alt=json&start-index=" + q;
                return $http.get(queryString)
                              .then( function(response) { //then is a promise.  If the promise is fulfilled, call the callback and return the data
                                  return response.data;
                              });
    }
    }
});

/**
 * filterGoogleQueryData takes Google's search results and puts some of the data into a new object.
 * This new object is used in the template instead of Google's returned JSON object.
 */
function filterGoogleQueryData(data) {
    var _rtrn = {}; //the object to be returned
    _rtrn.startIndex = data.feed.openSearch$startIndex.$t;
    _rtrn.totalResults = data.feed.openSearch$totalResults.$t;
    _rtrn.itemsPerPage = data.feed.openSearch$itemsPerPage.$t;
    _rtrn.results = [];

    //These are the 'video objects' which are used later
    for (i in data.feed.entry) {
        var _oldObj = data.feed.entry[i];
        var _video = {};
        _video.id = _oldObj.id.$t.split('/').pop(); //old obj's id is a url, with the last section holding the video ID
        _video.author = _oldObj.author[0].name.$t;
        _video.title = _oldObj.title.$t;
        _video.thumbnail$url = _oldObj.media$group.media$thumbnail[1].url;
        _video.description = _oldObj.media$group.media$description.$t;
        _video.duration$seconds = _oldObj.media$group.yt$duration.seconds;

        _rtrn.results.push(_video);
    }

    return _rtrn;
}

//I'll look into using Angular to do this, but I want to be able to call 'loadMoreSearchResults' outside of Angular's scope,
//so I created a global variable to hold the loadMoreSearchResults function.  Is currently called by jQuery when the window 
//reaches the bottom of the page.  This creates a dynamic search load effect.
var globalLoadMoreSearchResults;

//Angular controller, has the dependency of searchService for aynchronous search
app.controller('PlayerController', function( searchService, $scope ) {
    $scope.videoQueue = []; //Queue - holds the queue of videos
    $scope.videoHistory = []; //Stack - holds the video history
    $scope.searchResults = []; //holds a list of search results, i.e., [ [search results 1-10], [search results 11-20], ... etc ]
    var resultsPerQuery = 10;
    var storedSearchString;
    var firstSearchDone = false;

    //adds a video object from the search results to videoQueue
    $scope.addVideo = function() {
        $scope.videoQueue.push($scope.newVideo)
    };

    //This is to check the checkboxes in the search; If the video object is in the videoQueue then the search box will be 'checked'
    //need to revise by using video objects that have a key as the id and the value as an object with the video information,
    //this would solve the issue of clearing a search and making the same search, the check boxes are no longer checked!
    $scope.toggleSelection = function(id) {
        var index = $scope.videoQueue.indexOf(id);

        if (index > -1) {                           //1 - if the video is already there
            $scope.videoQueue.splice(index, 1);     //2 - remove it from the queue
        } else {                                    //3 - otherwise (the video is not there)
            $scope.videoQueue.push(id);             //4 - add it to the queue
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
            var _nextVideo = $scope.videoQueue.splice(0,1)[0];      //1 - we are using a queue so we want to grab from the front of the list
            $scope.videoHistory.push(_nextVideo);                   //2 - the video is instantly added to the history list
            player.loadVideoById(_nextVideo.id);                    //3 - loads (and plays) the video.
        }
    };

    $scope.playPrevVideo = function() {
        if ($scope.videoHistory.length > 1) {                       
            var _prevVideo = $scope.videoHistory.pop();             //1 - pop from the history stack
            $scope.videoQueue.push(_prevVideo);                     //2 - push the previous video to the queue
            player.loadVideoById($scope.videoHistory[$scope.videoHistory.length - 1].id);   //3 - the next video is the last item in the history stack
        }   
    };


    $scope.newSearch = function() {
        if ($scope.searchString) {
            firstSearchDone = false; //sets to false so a second search can't load until this search is done
            $scope.searchResults = []; //clears the searchResults
            storedSearchString = escape($scope.searchString);
            var _queryString = "1&max-results=" + resultsPerQuery + "&q=" + storedSearchString; //creates the string for querying
            
            //calls searchService's function getSearchResults, if the promise is fulfilled it adds the filtered information to the searchResults list
            searchService.getSearchResults( _queryString )
                            .then( function(response) {
                                $scope.searchResults.push( filterGoogleQueryData(response) );
                                firstSearchDone = true; //now that the first search is done a second search can be queried
                            });
        }
    };

    $scope.loadMoreSearchResults = function() {
        if (firstSearchDone) {
            //_queryIndex will start the search at the current location (i.e., will start the search at 41 if we've already done 4 searches)
            var _queryIndex = $scope.searchResults.length * resultsPerQuery + 1; //+1 because gdata starts with 1 not 0
            var _queryString = _queryIndex + "&max-results=" + resultsPerQuery + "&q=" + storedSearchString; //creates the string for querying

            //calls searchService's function getSearchResults, if the promise is fulfilled it adds the filtered information to the searchResults list
            searchService.getSearchResults( _queryString )
                            .then( function(response) {
                                $scope.searchResults.push( filterGoogleQueryData(response) );
                            });
        }
    };

    globalLoadMoreSearchResults = $scope.loadMoreSearchResults;  //sets the global variable as the loadMoreSearchResults function for use with jQuery

});

//Simple jQuery function checks to see if the browser window is at the bottom of the page.  If the browser window is at the bottom of the page,
//then using the globalLoadMoreSearchResults function, will load more search results.
$(window).scroll(function(){ 
    if ($(window).scrollTop() == ($(document).height() - $(window).height())){ //checks to see if the window is currently at the bottom of the content
        globalLoadMoreSearchResults();
    }
});



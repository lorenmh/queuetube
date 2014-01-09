// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'SJd4NOJlyRI',
    playerVars: {
      'controls': 1,
      'iv_load_policy': 3
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
      //this first part grabs the scope of the PlayerController
      var _scope = angular.element(document.getElementById('player-controller')).scope();
      
      if (_scope.videoQueue.length > 0) {
        //then the playNextVideo function is called
        _scope.playNextVideo()
        //then the $apply() function is called to update the changes in the scope
        _scope.$apply()
      }
    }
  }

  function stopVideo() {
    player.stopVideo();
  }


// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  if (event.data != YT.PlayerState.PAUSED) {
    event.target.playVideo();
  }
}
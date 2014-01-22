queuetube
=========

Notes about Node implementation, work in progress:

Channels
plutonium.io/channel/loren

A Channel comprises all of the data for a playlist
queue holds the videos, with queueIndex pointing to the current video
all videos before queueIndex are in the history, all after are in the queue
Push to add a video.
To remove, splice at that index.  All videos will remain in the queue until they are removed (no popping or shifting).
Special case for removing current video, play next video OR play previous video OR stop player THEN remove current video

:: CHANNEL SCHEMA ::
-"channel" = a user generated string, escaped or urlified
-"author" = string, pointing to the user
-"keyword" = string, to gain access to changing / updating / saving the channel
-"queue" = array of video objects (queue)


:: USER SCHEMA ::
-"user" = a user generated string, escaped or urlified
-"keyword" = a user generated string (gain access to user)
-"channels" = array of channel info
[ {channel, queueIndex (by videoId), seconds played}, ... ] queueIndex = number, secondsPlayed = seconds played for this video


}} VIDEO OBJECT PATTERN {{
{ "<YouTube ID>" : { ... get all of this info from the current video object }, ... }

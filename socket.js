module.exports = function (io) {
    io.on('connection', (socket) => {
        //logged in users
        socket.on('logIn', (data) => {
            io.emit('loggedIn', {activeUsers: io.sockets.server.engine.clientsCount});
        })

        //when user loggs out
        socket.on('disconnect', () => {
            io.emit('loggedOut',  {activeUsers: io.sockets.server.engine.clientsCount});
        });

        socket.on('logOut', (data) => {
            io.emit('loggedOut', {activeUsers: io.sockets.server.engine.clientsCount});
        })

        //for sharing hints
        socket.on('send', (data) => {
            data.friends.forEach(friend => {
                io.emit('share', friend);
            });
        });

        //for sharing news
        socket.on('inform', (data) => {
            data.friends.forEach(friend => {
                io.emit('informed', friend);
            });
        });

        //view notification
        socket.on('viewNotification', (ownerId) => {
            io.emit('notificationViewed', ownerId)
        });

        //for design review
        socket.on('designReview', (ownerId) => {
            io.emit('designReviewed', ownerId)
        });

        //after review
        socket.on('reviewDecide', (ownerId) => {
            io.emit('reviewDecision', ownerId)
        });

        //friend request
        socket.on('friendRequest', (friendId) => {
            io.emit('friendRequested', friendId)
        });

        //accept request
        socket.on('acceptRequest', (friendId) => {
            io.emit('requestAccepted', friendId)
        });
        
        //for adding comments
        socket.on('comment', (ownerId) => {
            io.emit('commented', ownerId)
        });

        //for deleting comments
        socket.on('deleteComment', (ownerId) => {
            io.emit('commentDeleted', ownerId)
        });

        //for adding news comments
        socket.on('newsComment', (ownerId) => {
            io.emit('newsCommented', ownerId)
        });

        //for deleting news comments
        socket.on('deletenewsComment', (ownerId) => {
            io.emit('newsCommentDeleted', ownerId)
        });

        //toggle liking news
        socket.on('toggleLike', (ownerId) => {
            io.emit('toggleLiked', ownerId)
        });

        //for deleting friends
        socket.on('deleteFriend', (ownerId) => {
            io.emit('friendDeleted', ownerId)
        });
    });
}
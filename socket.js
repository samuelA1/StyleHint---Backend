module.exports = function (io) {
    io.on('connection', (socket) => {
        //when a user loggs in
        var total = io.engine.clientsCount;
        io.emit('loggedIn', total)

        //when user loggs out
        socket.on('disconnect', () => {
            var total = io.engine.clientsCount;
            io.emit('loggedIn', total)        
        });

        //for sharing hints
        socket.on('send', (data) => {
            data.friends.forEach(friend => {
                io.emit('share', friend);
            });
        })

        //view notification
        socket.on('viewNotification', (ownerId) => {
            io.emit('notificationViewed', ownerId)
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

        //for deleting friends
        socket.on('deleteFriend', (ownerId) => {
            io.emit('friendDeleted', ownerId)
        });
    });
}
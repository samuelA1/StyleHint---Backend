module.exports = function (io) {
    io.on('connection', (socket) => {
        //logged in users
        socket.on('logIn', (data) => {
            io.emit('loggedIn', data)
        })

        var emitted = 0;

        //when user loggs out
        socket.on('disconnect', () => {
            if (emitted < 1) {
                io.emit('loggedOut',  {}); 
                emitted++ 
            }      
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
module.exports = function (io) {
    io.on('connection', (socket) => {
        //for sharing hints
        socket.on('send', (data) => {
            data.friends.forEach(friend => {
                io.emit('share', friend);
            });
        })

        //for adding comments
        socket.on('comment', (data) => {
            io.emit('commented', ownerId)
        });
    });
}
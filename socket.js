module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('send', (data) => {
            data.friends.forEach(friend => {
                socket.join(friend);
                // io.to(friend).emit('share', friend);
                io.emit('share', "let's play a game");

            });
        })
    });
}
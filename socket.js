module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('send', (data) => {
            console.log(data)
            data.friends.forEach(friend => {
                socket.join(friend);
                io.to(friend).emit('share', "let's play a game");
            });
            // io.emit('share', "let's play a game");
        })
    });
}
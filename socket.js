module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('send', (data) => {
            data.friends.forEach(friend => {
                io.emit('share', friend);
            });
        })
    });
}
module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('send', (data) => {
            console.log(data)
            data.friends.forEach(friend => {
                friend.join('share');
                socket.to('share').emit('share', "let's play a game");
            });
            // io.emit('share', "let's play a game");
        })
    });
}
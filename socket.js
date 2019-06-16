module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('send-hint', (friends) => {
            friends.forEach(friend => {
                friend.join('share');
                socket.to('share').emit('share hint', "let's play a game");
            });
        })
    });
}
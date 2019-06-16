// module.exports = function (io) {
//     io.on('connection', (socket) => {
//         socket.on('send-hint', (data) => {
//             data.friends.forEach(friend => {
//                 friend.join('share');
//                 socket.to('share').emit('share-hint', "let's play a game");
//             });
//         })
//     });
// }
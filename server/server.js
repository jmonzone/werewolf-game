const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {isRealString} = require('./utils/isRealString');
const {Users} = require('./utils/users');
const {GameManager} = require('./roles/gameManager.js');


const publicPath = path.join(__dirname,'/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();
let gms = new Map();

const roles = ['werewolf', 'seer', 'robber', 'troublemaker', 'villager'];

app.use(express.static(publicPath));

io.on('connect', (socket) => {
  console.log("A new user just connected.");

  socket.on('join', (params, callback) => {
    if(!isRealString(params.name) || !isRealString(params.room)){
      return callback('Name and room are required.');
    }

    socket.join(params.room);
    io.to(socket.id).emit('msgSent', 'Game: Hello! Welcome to room ' + params.room + '.');

    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    let user = users.getUser(socket.id);
    if(users.getRoomSize(params.room) == 1){
      user.isHost = true;
      gms.set(params.room, new GameManager(io, params.room));

      console.log(user.name + " is the host: " + user.isHost);
    }

    io.to(params.room).emit('updateUsersList', users.getUserList(params.room));

    let gm = gms.get(params.room);

    socket.on('startGame', function() {
      if(!user.isHost) return;

      gms.get(params.room).start(users.getUsers(params.room));
    });

    socket.on('actionPerformed', function() {
      if (gm.addReadyPlayer() == users.getRoomSize(params.room)){

        var players = users.getUsers(params.room);

        roles.forEach((role) => {
          players.forEach((player) => {
            if (player.role === role)
              io.to(player.id).emit('resolve', users.getUsers(params.room));
          });
        });

        gm.resetReadyPlayers();
      } else {
        io.to(socket.id).emit('msgSent', 'Game: Waiting for other players to finish their action.');
      }
    });

    socket.on('searchPlayersRequest', (role) => {
      console.log(role);
      var players = users.getUsers(params.room);
      for (var i = 0; i < players.length; i++){
        var player = players[i];
        if (player.originalRole === role && player.id !== socket.id)
          io.to(socket.id).emit('msgSent', 'Game: ' + player.name + ' is the ' + player.originalRole + ".");
      }
    });

    socket.on('viewCenter', function(selection) {
      for (var i = 0; i < selection.length; i++){
        var revealedCenter = gm.getCenterCard(selection[i]);
        io.to(socket.id).emit('msgSent', 'Game: Center card #' + (selection[i] + 1) + ' is the ' + revealedCenter + ".");
      }
    });

    socket.on('viewPlayerRequest', (selection) => {
      for (var i = 0; i < selection.length; i++){
        var revealedPlayer = users.getUser(selection[i]);
        io.to(socket.id).emit('msgSent', 'Game: ' + revealedPlayer.name + ' is the ' + revealedPlayer.role + ".");
      }
    });

    socket.on('swapSelfRequest', (targetId) => {
      var robber = users.getUser(socket.id);
      var target = users.getUser(targetId);
      var temp = robber.role;
      robber.role = target.role;
      target.role = temp;

      io.to(socket.id).emit('msgSent', 'Game: ' + "You robbed the " + robber.role + " from " + target.name);
    });

    socket.on('swapPlayersRequest', (targetIds) => {
      var target1 = users.getUser(targetIds[0]);
      var target2 = users.getUser(targetIds[1]);
      var temp = target1.role;
      target1.role = target2.role;
      target2.role = temp;

      io.to(socket.id).emit('msgSent', 'Game: ' + "You swapped " + target1.name + " and " + target2.name);

    });

    socket.on('voteCasted', (player) => {
      users.incrementVote(player);
      if (gm.addReadyPlayer() == users.getRoomSize(params.room)){
        io.to(params.room).emit('votesCalculated', gm.calculateMostVotes() );
      }
    });

    callback();
  });

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);

    if(user){
      io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
    }
  });

  socket.on('sendMsgReq', (msg) => {
    var user = users.getUser(socket.id);
    io.to(user.room).emit('msgSent', users.getUser(socket.id).name + ': ' + msg);
  });

  socket.on('sendPrivMsgReq', (msg) => {
    io.to(socket.id).emit('msgSent', 'Game: ' + msg);
  });

});

server.listen(port, () => {
  console.log('Server is up on port ' + port);
});

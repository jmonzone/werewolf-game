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

app.use(express.static(publicPath));

io.on('connect', (socket) => {
  console.log("A new user just connected.");

  socket.on('join', (params, callback) => {
    if(!isRealString(params.name) || !isRealString(params.room)){
      return callback('Name and room are required.');
    }

    socket.join(params.room);

    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    let user = users.getUser(socket.id);
    if(users.getRoomSize(params.room) == 1){
      user.isHost = true;
      gms.set(params.room, new GameManager(io));

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
        io.to(params.room).emit('resolve', users.getUsers(params.room));
        gm.resetReadyPlayers();
      }
    });

    socket.on('viewCenter', function(selection) {
      var center = [];
      for (var i = 0; i < selection.length; i++){
        var db = {
          "id": selection[i] + 1,
          "role": gm.getCenterCard(selection[i])
        }
        center.push(db);
      }
      io.to(socket.id).emit('revealCenter', center);
    });

    socket.on('viewPlayerRequest', (selection) => {
      var revealedPlayers = [];
      for (var i = 0; i < selection.length; i++){
        var revealedPlayer = users.getUser(selection[i]);
        revealedPlayers.push(revealedPlayer);
      }
      io.to(socket.id).emit('playersRevealed', revealedPlayers);
    });

    socket.on('robPlayer', (targetId) => {
      var robber = users.getUser(socket.id);
      var target = users.getUser(targetId);
      var temp = robber.role;

      robber.role = target.role;
      target.role = temp;

      var db = {
        stolenRole: robber.role,
        targetPlayer: target.name,
      }

      io.to(socket.id).emit('playerRobbed', db);
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

});

server.listen(port, () => {
  console.log('Server is up on port ' + port);
});

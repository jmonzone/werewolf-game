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


    socket.on('startGame', function() {
      if(!user.isHost) return;

      gms.get(params.room).start(users.getUsers(params.room));
    });

    socket.on('viewCenter', function(i) {
      io.to(socket.id).emit('revealCenter', i, gms.get(params.room).getCenterCard(i));
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

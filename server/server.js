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
      return callback('Name and room are required.', false);
    }

    socket.join(params.room);
    io.to(socket.id).emit('msgSent', 'Game: Hello! Welcome to room ' + params.room + '.');

    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    let user = users.getUser(socket.id);
    if(users.getRoomSize(params.room) == 1){
      gms.set(params.room, new GameManager(io, params.room));
      callback("", true);
    } else {
      io.to(socket.id).emit('msgSent', 'Game: Waiting for the game host to start the game.');
    }

    io.to(params.room).emit('updateUsersList', users.getUserList(params.room));

    let gm = gms.get(params.room);
    gm.addPlayer(socket,user.id, user.name);
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

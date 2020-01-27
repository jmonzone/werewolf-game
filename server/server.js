const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {isRealString} = require('./utils/isRealString');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname,'/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();

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

    io.to(params.room).emit('updateUsersList', users.getUserList(params.room), )

    // socket.emit('newMessage', generateMessage('Admin', 'Welcome to ${params.rom}!'));
    callback();
  });

  socket.on('createMessage', (message) => {
    console.log("createMessage", message);
  });

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);

    if(user){
      io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
      // io.to(user.room).emit('newMessage', generateMessage('Admin', user.name + ' has left ' + user.room + ' chat room.'));
    }
  });

});

server.listen(port, () => {
  console.log('Server is up on port ' + port);
});

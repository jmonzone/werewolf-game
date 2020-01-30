class Users {
  constructor(){
    this.users = [];
  }

  addUser(id, name, room){
    let user = {id, name, room};
    user.isHost = false;
    user.role = ""
    user.originalRole = ""
    user.numVotes = 0;
    this.users.push(user);

    return user;
  }

  getUserList(room){
    let users = this.users.filter((user) => user.room === room);
    let namesArray = users.map((user) => user.name);

    return namesArray;
  }

  getRoomSize(room){
    let users = this.users.filter((user) => user.room === room);
    let namesArray = users.map((user) => user.name);
    let size = 0;
    for(var i in namesArray){
      size++;
    }
    return size;
  }

  getUser(id) {
    return this.users.filter((user) => user.id === id)[0];
  }

  getUsers(room){
    let users = this.users.filter((user) => user.room === room);
    return users;
  }

  removeUser(id){
    let user = this.getUser(id);

    if(user){
      this.users = this.users.filter((user) => user.id !== id);
    }

    return user;
  }

  setRole(id, role){
    let user = this.getUser(id);

    if(user){
      user.role = role;
      user.originalRole = role;
    }
  }

  incrementVote(id){
    let user = this.getUser(id);

    if(user){
      user.numVotes++;
    }
  }
}

module.exports = {Users};

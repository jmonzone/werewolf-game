const roles = {
  WEREWOLF: 'werewolf',
  SEER: 'seer',
  ROBBER: 'robber',
  TROUBLEMAKER: 'troublemaker',
  VILLAGER: 'villager',
}

class GameManager {

  constructor(io, room) {
    this.players = new Map();
    this.center = new Array();
    this.io = io;
    this.room = room;
    this.readyPlayers = 0;
    this.votes = new Map();
  }

  addPlayer(socket, id, name){

    var player = {id, name};
    this.players.set(id, player);

    if(this.players.size == 1)
      this.host = player;

    socket.on('startGame', () => this.start(player));
    socket.on('actionPerformed', () => this.resolveActions(socket));
    socket.on('voteCasted', (id) => this.addVote(socket,id));

    socket.on('searchPlayersRequest', (role) => this.findPlayerRole(socket,role));
    socket.on('viewCenter', (selection) => this.viewCenterRole(socket, selection));
    socket.on('viewPlayerRequest', (selection) => this.viewPlayerRole(socket,selection));
    socket.on('swapSelfRequest', (selection) => this.swapSelfRole(socket, selection));
    socket.on('swapPlayersRequest', (selections) => this.swapPlayerRole(socket, selection));
  }

  start(player){
    if (player != this.host) return;
    this.assignRoles();
    this.announceRoles();
  }

  assignRoles(){
    let roles = this.getRolePreset();
    this.players.forEach((player) => {
      let i = Math.floor(Math.random() * roles.length);
      player.role = roles[i];
      player.originalRole = roles[i];
      roles.splice(i,1);
    });

    for(var j = 0; j < 3; j++){
      let k = Math.floor(Math.random() * roles.length);
      this.center.push(roles[k]);
      roles.splice(k,1);
    }
  }

  announceRoles(){
    this.players.forEach((player) => {

      var db = {
        role: player.role,
        players: Array.from(this.players.values()),
      };

      this.io.to(player.id).emit('gameHasBegun', db);
      this.io.to(player.id).emit('msgSent', "Game: Game Started.");
      this.io.to(player.id).emit('msgSent', "Game: You are the " + player.role + ".");
    });
  }

  viewCenterRole(socket, selection){
    selection.forEach((selection) => {
      this.io.to(socket.id).emit('msgSent', 'Game: Center card #' + (selection + 1) + ' is the ' + this.center[selection] + ".");
    });
  }

  findPlayerRole(socket, role){
    this.players.forEach((player) => {
      if (player.originalRole == role && socket.id != player.id)
        this.io.to(socket.id).emit('msgSent', 'Game: ' + player.name + ' is the ' + player.originalRole + ".");
    });
  }
  viewPlayerRole(socket, selection){
    selection.forEach((selection) => {
      var revealedPlayer = this.players.get(selection);
      this.io.to(socket.id).emit('msgSent', 'Game: ' + revealedPlayer.name + ' is the ' + revealedPlayer.role + ".");
    });
  }

  swapPlayerRole(socket, selection){
    var target1 = this.getPlayer(selection[0]);
    var target2 = this.getPlayer(selection[1]);
    var temp = target1.role;
    target1.role = target2.role;
    target2.role = temp;

    this.io.to(socket.id).emit('msgSent', 'Game: ' + "You swapped " + target1.name + " and " + target2.name);
  }

  swapSelfRole(socket, selection){
    var robber = this.players.get(socket.id);
    var target = this.players.get(selection);
    var temp = robber.role;
    robber.role = target.role;
    target.role = temp;

    this.io.to(socket.id).emit('msgSent', 'Game: ' + "You robbed the " + robber.role + " from " + target.name);
  }

  resolveActions(socket){
    if (++this.readyPlayers != this.players.size) {
      this.io.to(socket.id).emit('msgSent', 'Game: Waiting for other players to finish their action.');
      return;
    }

    const roles = ['werewolf', 'seer', 'robber', 'troublemaker', 'villager'];

    roles.forEach((role) => {
      this.players.forEach((player) => {
        if (player.role === role)
          this.io.to(player.id).emit('resolve', Array.from(this.players.values()));
      });
    });

    this.readyPlayers = 0;
  }

  addVote(socket, id){
    if (this.votes.get(id) === undefined) this.votes.set(id, 1);
    else this.votes.set(id, this.votes.get(id) + 1);

    if (++this.readyPlayers == this.players.size) this.io.to(this.room).emit('votesCalculated', this.calculateMostVotes());
    else this.io.to(socket.id).emit('msgSent', 'Game: Waiting for other players to vote.');
  }

  calculateMostVotes(){
    let highestVote = 0;

    this.votes.forEach((i) => {
      if (i > highestVote)
        highestVote = i;
    });

    let votedPlayers = [];

    this.votes.forEach((i, id) => {
      if (i == highestVote){
        votedPlayers.push(id);
      }
    });

    let werewolfDead = false;
    let results = ""

    votedPlayers.forEach((id) => {
      var player = this.players.get(id);
      results += "\n " + player.name + " has died.";
      if (player.role === 'werewolf')
        werewolfDead = true;
    });

    if(werewolfDead)
      this.io.to(this.room).emit('msgSent', "Game: A werewolf has been killed. The villager team wins.");
    else
      this.io.to(this.room).emit('msgSent', "Game: No werewolves have been killed. The werewolf team wins.");

    this.players.forEach((player) => {
      if (player.originalRole === player.role)
        this.io.to(this.room).emit('msgSent', "Game: " + player.name + " started as the " + player.originalRole + " and is still the " + player.role + ".");
      else {
        this.io.to(this.room).emit('msgSent', "Game: " + player.name + " started as the " + player.originalRole + " and is now the " + player.role + ".");
      }
    });


    return results;

  }

  getRolePreset(){
    switch(this.players.size) {
      case 1:
        return [roles.SEER, roles.SEER, roles.SEER, roles.SEER ];
        break;
      case 2:
        return [roles.WEREWOLF, roles.SEER, roles.SEER, roles.SEER, roles.VILLAGER ];
        break;
      case 3:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER ];
        break;
      case 4:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER ];
        break;
      case 5:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER];
        break;
      case 6:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER];
        break;
      case 7:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER];
        break;
      case 8:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER];
        break;
      case 9:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER];
        break;
      case 10:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.TROUBLEMAKER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.VILLAGER, roles.WEREWOLF];
        break;
    }
  }
}

module.exports = {GameManager};

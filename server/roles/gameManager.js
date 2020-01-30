const roles = {
  WEREWOLF: 'werewolf',
  SEER: 'seer',
  ROBBER: 'robber',
  TROUBLEMAKER: 'troublemaker',
  VILLAGER: 'villager',
}

class GameManager {

  constructor(io, room) {
    this.players = [];
    this.center = [];
    this.io = io;
    this.room = room;
    this.readyPlayers = 0;
    this.playerVotes = new Map();
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
      this.center[j] = roles[k]
      roles.splice(k,1);
    }
  }

  announceRoles(){
    this.players.forEach((player) => {

      var db = {
        role: player.role,
        players: this.players,
      };

      this.io.to(player.id).emit('gameHasBegun', db);
      this.io.to(player.id).emit('msgSent', "Game: Game Started.");
      this.io.to(player.id).emit('msgSent', "Game: You are the " + player.role + ".");
    });
  }

  start(players){
    this.players = players;
    this.assignRoles();
    this.announceRoles();
  }

  addReadyPlayer(){
    this.readyPlayers++;
    return this.readyPlayers;
  }

  resetReadyPlayers(){
    this.readyPlayers = 0;
  }

  calculateMostVotes(){
    let highestVote = 0;

    this.players.forEach((player) => {

      if (player.numVotes > highestVote){
        highestVote = player.numVotes;
      }
    });

    let votedPlayers = [];

    this.players.forEach((player) => {
      if (player.numVotes === highestVote){
        console.log("\n " + player.name);
        votedPlayers.push(player);
      }
    });

    let werewolfDead = false;
    let results = ""

    votedPlayers.forEach((player) => {
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


  getCenterCard(i){
    return this.center[i];
  }

  getRolePreset(){
    switch(this.players.length) {
      case 1:
        return [roles.WEREWOLF, roles.SEER, roles.SEER, roles.SEER ];
        break;
      case 2:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.ROBBER, roles.VILLAGER ];
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

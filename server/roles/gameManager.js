const roles = {
  WEREWOLF: 'werewolf',
  SEER: 'seer',
  ROBBER: 'robber',
  TROUBLEMAKER: 'troublemaker',
  VILLAGER: 'villager',
}

class GameManager {

  constructor(io) {
    this.players = [];
    this.center = [];
    this.io = io;
  }

  assignRoles(){
    let roles = this.getRolePreset();
    this.players.forEach((player) => {
      let i = Math.floor(Math.random() * roles.length);
      player.role = roles[i];
      roles.splice(i,1);
    });

    for(var j = 0; j < 3; j++){
      let k = Math.floor(Math.random() * roles.length);
      this.center[j] = roles[k]
      roles.splice(k,1);
    }
  }

  announceRoles(){
    this.players.forEach((x) => {
      this.io.to(x.id).emit('gameStarted', x.role);
    });
  }

  start(players){
    this.players = players;
    this.assignRoles();
    this.announceRoles();
  }

  getCenterCard(i){
    return this.center[i];
  }

  getRolePreset(){
    switch(this.players.length) {
      case 1:
        return [roles.WEREWOLF, roles.SEER, roles.SEER, roles.WEREWOLF ];
        break;
      case 2:
        return [roles.WEREWOLF, roles.WEREWOLF, roles.SEER, roles.VILLAGER, roles.VILLAGER ];
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
    }
  }


}



module.exports = {GameManager};

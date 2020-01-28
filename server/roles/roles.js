const roles = {
  // NULL: 'null',
  WEREWOLF: 'werewolf',
  SEER: 'seer',
  ROBBER: 'robber',
  TROUBLEMAKER: 'troublemaker',
  VILLAGER: 'villager',
}

const preset1 = [roles.VILLAGER];
const preset2 = [roles.WEREWOLF, roles.SEER];
const preset3 = [roles.WEREWOLF, roles.ROBBER, roles.TROUBLEMAKER];

const presets = [preset1, preset2, preset3];




module.exports = {roles, presets};

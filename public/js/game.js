let socket = io();

function selectOption(options) {

  var ol = document.createElement('ol');

  options.forEach((option) => {

    var button = document.createElement('button');
    button.innerHTML = option.description;

    button.addEventListener('click', () => {
      option.onSelect.apply(null, option.params)
    });

    ol.appendChild(button);
  });


  // for(var i = 0; i < options.length; i++){
  //
  //   var option = options[i];
  //
  //   var button = document.createElement('button');
  //   button.innerHTML = option.description;
  //   console.log(option.onSelect);
  //
  //   button.addEventListener('click', () => {
  //     option.onSelect.apply(null, option.params)
  //   });
  //
  //   ol.appendChild(button);
  // }

  let interactions = clearInteractions();
  interactions.appendChild(ol);
}

function selectPlayer(n, players, cachedSelected, onSelect){

  let ol = document.createElement('ol');

  for (var i = 0; i < players.length; i++) {

    var player = players[i];
    if (player.id === socket.id) continue;
    if (cachedSelected.includes(i)) continue;

    var button = document.createElement('button');
    button.innerHTML = player.name;

    var selected = cachedSelected.map((x) => x);
    selected.push(player.id);

    if(n > 1) {
      button.addEventListener('click', () => {
        selectPlayer(n - 1, users, selected, onSelect);
      });
    } else {
      button.addEventListener('click', () => {
        clearInteractions();
        onSelect(selected);
       });
    }

    ol.appendChild(button);
  }

  let interactions = clearInteractions();
  interactions.appendChild(ol);
}

function selectCenter(n, cachedSelected, onSelect){

  console.log("selecting center");
  let ol = document.createElement('ol');

  for(var i = 0; i < 3; i++){

    if (cachedSelected.includes(i)) continue;

    let button = document.createElement('button');
    button.innerHTML = 'Center Card #' + (i + 1);

    let selected = cachedSelected.map((x) => x);
    selected.push(i);

    if(n > 1) {
      button.addEventListener('click', () => {
        selectCenter(n - 1, selected, onSelect);
      });
    } else {
      button.addEventListener('click', () => {
        clearInteractions();
        onSelect(selected);
       });
    }

    ol.appendChild(button);
  }

  let interactions = clearInteractions();
  interactions.appendChild(ol);
}

function viewCenter(n) {
  selectCenter(n, new Array(), (selection) => {
    socket.on('resolve', (db) => {
      socket.emit('viewCenter', selection);
    });
    completeAction();
  });
}

function viewPlayer(n, players){
  selectPlayer(n, players, new Array(), (selection) => {
    socket.on('resolve', (db) => {
      socket.emit('viewPlayerRequest', selection);
    });
    completeAction();
  });
}

function robPlayer(players){
  selectPlayer(1, players, new Array(), (selection) => {
    socket.on('resolve', (db) => {
      socket.emit('robPlayer', selection[0]);
    });
    completeAction();
  });
}

function votePlayer(players){
  selectPlayer(1, players, new Array(), (selection) => {
    socket.on('votesCalculated', (results) => {
      clearAnnouncements();
      announce(results);
    });

    socket.emit('voteCasted', selection[0]);
  });
}

function clearInteractions(){
  var interactions = document.querySelector('#interactions');
  interactions.innerHTML = "";
  return interactions;
}

function clearAnnouncements(){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML = "";
}

function announce(message) {
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += message;
}

function completeAction(){
  socket.on('resolve', (players) => votePlayer(players));
  socket.emit('actionPerformed');
}

function werewolfAction(db){

  var werewolfPlayers = db.players.filter((player) => player.role == 'werewolf');

  if (werewolfPlayers.length == 1) {
    announce("You are the lone wolf. You may select one center role to view. ");
    viewCenter(1);
  } else {
    completeAction();
  }

}

function seerAction(db){
  announce("You may view one player's role or view two of the center roles. ");
  var options = [
    {
      "onSelect": viewPlayer,
      "params": [1, db.players],
      "description": "View a player",
    },
    {
      "onSelect": viewCenter,
      "params": [2],
      "description": "View the center",
    },
  ]
  selectOption(options);
}

function robberAction(db){
  announce("Select a player to exchange your role with. ");
  robPlayer(db.players);
}

socket.on('gameHasBegun', function(db) {

  clearInteractions();
  announce('Game Started. You are the ' + db.role + '. ');

  switch (db.role) {
    case 'werewolf':
      werewolfAction(db);
      break;
    case 'seer':
      seerAction(db);
      break;
    case 'robber':
      robberAction(db);
      break;
    default:
      completeAction();
  }
});

socket.on('revealCenter', function(center) {
  for (var i = 0; i < center.length; i++){
    announce('Center card #' + center[i].id + ' is the ' + center[i].role + ". \n");
  }
});

socket.on('playersRevealed', (revealedPlayers) => {
  console.log(revealedPlayers);

  for (var i = 0; i < revealedPlayers.length; i++){
    var revealedPlayer = revealedPlayers[i];
    announce(revealedPlayer.name + ' is the ' + revealedPlayer.role + ". \n");
  }
});

socket.on('playerRobbed', (db) => {
  announce("You robbed the " + db.stolenRole + " from " + db.targetPlayer);
});

socket.on('connect', function() {
  let searchQuery = window.location.search.substring(1);
  let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');

  socket.emit('join', params, function(err) {
    if(err){
      alert(err);
      window.location.href = '/';
    } else {
      console.log('Room joined.');
    }
  });

  var startButton = document.getElementById('start-button');
  startButton.addEventListener('click', () => {
    socket.emit('startGame');
  });

});

socket.on('disconnect', function() {
  console.log('Disconnected from server.');
});

socket.on('updateUsersList', function(users) {
  let ol = document.createElement('ol');

  users.forEach(function(user) {
    let li = document.createElement('li');
    li.innerHTML = user;
    ol.appendChild(li);
  });

  let usersList = document.querySelector('#users');
  usersList.innerHTML = "";
  usersList.appendChild(ol);
});

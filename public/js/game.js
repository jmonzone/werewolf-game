let socket = io();

function startGame(){
    socket.emit('startGame');
    console.log('Starting game.')
}

function selectVote(users){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += "\n Select someone to vote for...";

  let ol = document.createElement('ol');
  ol.id = 'center-vote-list';

  let i = 0;
  users.forEach(function(user) {

    if (user.id === socket.id) return;

    let button = document.createElement('button');
    button.id = 'vote-' + i;
    button.innerHTML = user.name;
    button.setAttribute( "onClick", "javascript: castVote(" + i + ");" );

    ol.appendChild(button);
    i++;
  });

  let usersList = document.querySelector('#center');
  usersList.innerHTML = "";
  usersList.appendChild(ol);
}

function castVote(i){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += "\n Waiting for the other players...";

  var voteButtons = document.getElementById('center-vote-list');
  voteButtons.remove();

  socket.on('votesCalculated', function(results){
    announceResults(results);
  });

  socket.emit('voteCasted', i);
}

function announceResults(results){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML = results;
}

function selectOptions(numOptions, descriptions){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += "Select an option (they the same rn)";

  let ol = document.createElement('ol');
  ol.id = 'center-option-list';

  for(i = 0; i < numOptions; i++){

      let button = document.createElement('button');
      button.id = 'option-' + (i + 1);
      button.innerHTML = 'Option #' + (i + 1);
      button.setAttribute( "onClick", descriptions[i] );
      ol.appendChild(button);
  }

    let center = document.querySelector('#center');
    center.innerHTML = "";
    center.appendChild(ol);
}

function selectCenter(numSelect, cachedSelected){
  let ol = document.createElement('ol');
  ol.id = 'center-list';

  for(i = 0; i < 3; i++){

    console.log(cachedSelected);

    if (cachedSelected.includes(i)){
      console.log("included.");
      continue;
    } else {
      console.log("not included.");
    }

    let button = document.createElement('button');
    button.id = 'center-card-' + (i + 1);
    button.innerHTML = 'Center Card #' + (i + 1);

    let selected = cachedSelected.map((x) => x);
    selected.push(i);

    if(numSelect > 1) {
      button.setAttribute( "onClick", "javascript: selectCenter(" + (numSelect - 1) +",[" + selected.toString() + "]" + ");" );
    } else {
      button.setAttribute( "onClick", "javascript: viewCenter([" + selected.toString() + "]);" );
    }

    ol.appendChild(button);
  }


  let center = document.querySelector('#center');
  center.innerHTML = "";
  center.appendChild(ol);
}

function completeAction(onResolve){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += "\n Waiting for the other players...";

  socket.on('resolve', function(users){
    onResolve();
    selectVote(users);
  });

  socket.emit('actionPerformed');
}

function viewCenter(selectedIndexes){
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML = "";

  var centerCards = document.getElementById('center-list');
  centerCards.remove();

  completeAction(function(){
    announcements.innerHTML = "";

    selectedIndexes.forEach((i) => {
      socket.emit('viewCenter', i);
    });
  });
}

socket.on('gameStarted', function(role) {
  var startButton = document.getElementById('game-start-button');
  startButton.remove();

  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML = 'Game Started.';
  announcements.innerHTML += '\nYou are the ' + role + '.';

  if(role === 'werewolf'){

    selectCenter(1, new Array());

  } else if (role === 'seer') {

    var descriptions = [
      "javascript: selectCenter(2,new Array());",
      "javascript: selectCenter(2,new Array());"
    ]
    selectOptions(2, descriptions);
  } else {
    completeAction(function(){});
  }
});

socket.on('revealCenter', function(i, centerCard) {
  var announcements = document.getElementById('announcements-text');
  announcements.innerHTML += 'Center card #' + (i + 1) + ' is the ' + centerCard + ". \n";
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

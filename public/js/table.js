socket.on('gameHasBegun', function(db) {

  for (var i = 0; i < 3; i++ ){
    var card = document.createElement('img');
    card.src = '../img/hidden-card.png'
    card.className = 'table-card'
    document.getElementById('table-center').appendChild(card);
  }

});

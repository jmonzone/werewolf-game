let socket = io();

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

socket.on('disconnect', function()
{
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
})

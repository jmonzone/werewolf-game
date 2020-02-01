socket.on('connect', function() {
  var chatInput = document.getElementById('chat-input');
  var chatForm = document.getElementById('chat-form');

  chatForm.onsubmit = function(e){
    e.preventDefault();
    if(chatInput.value[0] === '/')
      socket.emit('evalServer',chatInput.value.slice(1));
    else
      socket.emit('sendMsgReq',chatInput.value);
    chatInput.value = '';
  }

});

socket.on('msgSent',function(data){
  var chatText = document.getElementById('chat-text');
  chatText.innerHTML += '<div>' + data + '</div>';
  scrollToBottom();
});

function scrollToBottom(){
  var messages = document.querySelector('#chat-text').lastElementChild;
  messages.scrollIntoView();
}

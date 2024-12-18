
// Ask for username after joining room
var username = prompt('Enter your username:');    
var socket = io();
var room = '';

socket.emit('set username', username);

// Handle sending messages
var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', username + ': ' + input.value);
    input.value = '';
  }
});

// Display messages
socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  document.getElementById('messages').appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Display chat history
socket.on('chat history', function(messages) {
messages.forEach(function(message) {
  var item = document.createElement('li');
  item.textContent = message.timestamp + ' - ' + message.username + ': ' + message.message;
  document.getElementById('messages').appendChild(item);
});
});

// Update the user list
socket.on('user list', function(users) {
  var usersList = document.getElementById('users');
  usersList.innerHTML = ''; // Clear the current list
  users.forEach(function(user) {
    var item = document.createElement('li');
    item.textContent = user;
    usersList.appendChild(item);
  });
});

// Typing indicator
input.addEventListener('input', function() {
  socket.emit('typing', username); // Notify the server that the user is typing
});

socket.on('typing', function(username) {
  document.getElementById('typing').textContent = username + ' is typing...';
});

socket.on('stop typing', function() {
  document.getElementById('typing').textContent = '';
});
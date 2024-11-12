// messages.js

const socket = io();

// Get the username from localStorage
const username = localStorage.getItem('username');

if (!username) {
  window.location.href = '/signin';
} else {
  socket.emit('set username', username);
}

// Function to load conversations
function loadConversations() {
  fetch(`/get-conversations?username=${encodeURIComponent(username)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const conversationsList = document.getElementById('conversations');
        conversationsList.innerHTML = '';

        data.conversations.forEach(conversation => {
          const li = document.createElement('li');
          li.classList.add('conversation-item');
          li.textContent = conversation.participant; // Assuming 'participant' is the other user's username

          li.addEventListener('click', () => {
            loadChat(conversation.participant);
          });
          conversationsList.appendChild(li);
        });
      } else {
        console.error('Failed to load conversations:', data.message);
      }
    })
    .catch(error => console.error('Error fetching conversations:', error));
}

// Function to load chat messages
function loadChat(participant) {
  // Update the chat header
  document.getElementById('chat-with').textContent = `Chat with ${participant}`;

  // Fetch messages for this conversation
  fetch(`/get-messages?username=${encodeURIComponent(username)}&participant=${encodeURIComponent(participant)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        data.messages.forEach(message => {
          const messageDiv = document.createElement('div');
          messageDiv.classList.add('message');

          if (message.fromUser === username) {
            messageDiv.classList.add('sent');
          } else {
            messageDiv.classList.add('received');
          }

          messageDiv.textContent = message.message;
          chatMessages.appendChild(messageDiv);
        });

        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        console.error('Failed to load messages:', data.message);
      }
    })
    .catch(error => console.error('Error fetching messages:', error));

  // Handle sending messages
  const chatForm = document.getElementById('chat-form');
  chatForm.onsubmit = (e) => {
    e.preventDefault();
    sendMessage(participant);
  };
}

function loadContacts() {
  fetch(`/get-contacts?username=${encodeURIComponent(username)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const contactsList = document.getElementById('contacts-list');
        contactsList.innerHTML = '';

        data.contacts.forEach(contact => {
          const li = document.createElement('li');
          li.classList.add('contact-item');
          li.textContent = contact.username;

          li.addEventListener('click', () => {
            loadChat(contact.username);
          });
          contactsList.appendChild(li);
        });
      } else {
        console.error('Failed to load contacts:', data.message);
      }
    })
    .catch(error => console.error('Error fetching contacts:', error));
}

// Function to send message
function sendMessage(toUser) {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();

  if (message) {
    fetch('/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUser: username,
        toUser: toUser,
        message: message
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        chatInput.value = '';
        // Append the message to the chat window
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'sent');
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);

        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        alert('Failed to send message');
      }
    })
    .catch(error => console.error('Error sending message:', error));
  }
}

// Handle real-time messages with Socket.io
socket.on('new inbox message', (data) => {
  // Check if the message is from or to the current conversation
  const currentChatWith = document.getElementById('chat-with').textContent.replace('Chat with ', '');
  if (data.fromUser === currentChatWith || data.toUser === currentChatWith) {
    // Append the new message to the chat window
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (data.fromUser === username) {
      messageDiv.classList.add('sent');
    } else {
      messageDiv.classList.add('received');
    }

    messageDiv.textContent = data.message;
    chatMessages.appendChild(messageDiv);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    // Optionally, update the conversations list to indicate a new message
    loadConversations();
  }
});

// Load conversations when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  loadContacts();
});

// Sidebar toggle functionality (if not included in profile.js)
const sidebar = document.querySelector('.sidebar');
const toggle = document.querySelector('.toggle');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('close');
});

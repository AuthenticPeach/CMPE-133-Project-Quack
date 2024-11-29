// messages.js

const socket = io();
const username = localStorage.getItem('username');

if (!username) {
  window.location.href = '/signin';
} else {
  socket.emit('set username', username);
}

const replyPreview = document.getElementById('reply-preview');
let replyToMessage = null;
let isReply = false;
let isFile = false;

document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  loadContacts();

  // Emoji Picker Setup
  const picker = new EmojiButton();
  const emojiButton = document.getElementById('emoji-button');
  emojiButton.addEventListener('click', () => {
    picker.showPicker(emojiButton);
  });

  picker.on('emoji', emoji => {
    document.getElementById('chat-input').value += emoji;
  });

  // File Upload
  const input = document.getElementById("input");
  const imageInput = document.getElementById('image-input');
  const fileUploadButton = document.getElementById('uploadFileBtn');
  fileUploadButton.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', function () {
    if (this.files.length > 0) {
      isFile = true;
      const fileName = this.files[0].name;
      document.getElementById('file-name').textContent = fileName;
      document.getElementById('display-file').style.display = 'inline-flex';
    }
  });
});

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

          // Profile Picture
          const profilePic = conversation.profilePic || '/uploads/default-avatar.png';
          const img = document.createElement('img');
          img.src = profilePic;
          img.alt = `${conversation.participant}'s profile picture`;
          img.classList.add('profile-pic');

          // Participant Name
          const name = document.createElement('span');
          name.textContent = conversation.participant;

          li.appendChild(img);
          li.appendChild(name);

          // Friend Request Handling
          if (conversation.isFriendRequest && !conversation.isResolved) {
            handleFriendRequestUI(conversation, li);
          } else {
            // Load conversation on click
            li.addEventListener('click', () => {
              loadChat(conversation.participant);
            });
          }

          conversationsList.appendChild(li);
        });
      } else {
        console.error('Failed to load conversations:', data.message);
      }
    })
    .catch(error => console.error('Error fetching conversations:', error));
}

// Function to handle friend request UI
function handleFriendRequestUI(conversation, listItem) {
  // Add Friend Request Buttons
  const acceptBtn = document.createElement('button');
  acceptBtn.textContent = 'Accept';
  acceptBtn.classList.add('btn-accept');
  acceptBtn.onclick = () => {
    handleFriendRequest(conversation.participant, true, listItem);
  };

  const declineBtn = document.createElement('button');
  declineBtn.textContent = 'Decline';
  declineBtn.classList.add('btn-decline');
  declineBtn.onclick = () => {
    handleFriendRequest(conversation.participant, false, listItem);
  };

  listItem.appendChild(acceptBtn);
  listItem.appendChild(declineBtn);
}

// Function to handle friend request response
function handleFriendRequest(participant, accepted, listItem) {
  fetch('/respond-to-friend-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUser: participant, toUser: username, accepted })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);

        if (accepted) {
          // Remove buttons and load chat if accepted
          listItem.querySelectorAll('button').forEach(button => button.remove());
          loadChat(participant);
        } else {
          // Remove the request from the UI if declined
          listItem.remove();
        }
      } else {
        console.error('Failed to respond to friend request:', data.message);
      }
    })
    .catch(error => console.error('Error responding to friend request:', error));
}

// Function to load chat messages
function loadChat(participant) {
  document.getElementById('chat-with').textContent = `Chat with ${participant}`;

  fetch(`/get-messages?username=${encodeURIComponent(username)}&participant=${encodeURIComponent(participant)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        data.messages.forEach(message => {
          const messageDiv = createMessageElement(message);
          chatMessages.appendChild(messageDiv);
        });

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

function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  // Determine if the message is sent or received
  if (message.fromUser === username) {
    messageDiv.classList.add('sent');
  } else {
    messageDiv.classList.add('received');
  }

  // Profile picture
  const profileImg = document.createElement('img');
  profileImg.src = message.profilePic || '/uploads/default-avatar.png';
  profileImg.classList.add('profile-image');
  profileImg.alt = `${message.fromUser}'s profile picture`;

  // Message content
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = message.message;

  // Combine profile image and message content
  const contentWrapper = document.createElement('div');
  contentWrapper.classList.add('content-wrapper');
  contentWrapper.appendChild(profileImg);
  contentWrapper.appendChild(messageContent);

  // Add the content wrapper to the messageDiv
  messageDiv.appendChild(contentWrapper);

  // Add reactions (if any)
  if (message.reactions && message.reactions.length > 0) {
    const reactionsDiv = document.createElement('div');
    reactionsDiv.classList.add('reactions');
    message.reactions.forEach((reaction) => {
      const reactionSpan = document.createElement('span');
      reactionSpan.textContent = `${reaction.emoji} (${reaction.count})`;
      reactionsDiv.appendChild(reactionSpan);
    });
    messageDiv.appendChild(reactionsDiv);
  }

  return messageDiv;
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

          const profilePic = contact.profilePic || '/uploads/default-avatar.png';
          const img = document.createElement('img');
          img.src = profilePic;
          img.alt = `${contact.username}'s profile picture`;
          img.classList.add('profile-pic');

          const name = document.createElement('span');
          name.textContent = contact.username;

          li.appendChild(img);
          li.appendChild(name);

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
          const messageDiv = createMessageElement({
            fromUser: username,
            message: message,
            profilePic: '/uploads/default-avatar.png'
          });
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

function setReplyToMessage(message) {
  isReply = true;
  replyToMessage = message;
  replyPreview.innerHTML = `Replying to: ${message.message}`;
  replyPreview.style.display = 'block';

  document.getElementById('cancel-reply').addEventListener('click', () => {
    replyToMessage = null;
    isReply = false;
    replyPreview.style.display = 'none';
  });
}

// Handle real-time messages with Socket.io
socket.on('new inbox message', (data) => {
  const currentChatWith = document
    .getElementById('chat-with')
    .textContent.replace('Chat with ', '');

  // Check if the message is part of the current conversation
  if (
    (data.fromUser === currentChatWith && data.toUser === username) ||
    (data.fromUser === username && data.toUser === currentChatWith)
  ) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = createMessageElement(data);
    chatMessages.appendChild(messageDiv);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    // Optionally, update the conversations list to indicate a new message
    loadConversations();
  }
});

// Sidebar toggle functionality (if not included in profile.js)
const sidebar = document.querySelector('.sidebar');
const toggle = document.querySelector('.toggle');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('close');
});

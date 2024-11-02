
var socket = io();

// Get the username from localStorage
var username = localStorage.getItem('username');
if (!username) {
  window.location.href = '/signin';
} else {
  socket.emit('set username', username);
  document.querySelector('h2').textContent = `Welcome to Quack Chat, ${username}!`;

  // Fetch the profile data including profile picture
  fetch(`/get-user-profile?username=${username}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('profile-pic').src = data.profilePic;
      } else {
        console.error('Failed to load profile data');
      }
    })
    .catch(error => console.error('Error fetching profile:', error));
}
    // At the beginning of user-dashboard.js
    fetch(`/check-user-status?username=${encodeURIComponent(username)}`)
      .then(response => response.json())
      .then(data => {
        if (data.isBanned) {
          alert('Your account has been banned.');
          window.location.href = '/signin';
        } else if (data.isMuted) {
          alert(`You are muted until ${new Date(data.muteUntil).toLocaleString()}. Reason: ${data.muteReason || 'No reason provided.'}`);
        }
      })
      .catch(error => console.error('Error checking user status:', error));

socket.on('mute notification', (data) => {
  alert(data.message);
});

// Handle Sign Out
var signoutButton = document.getElementById('signout');
signoutButton.addEventListener('click', function() {
  socket.disconnect();
  localStorage.removeItem('username');
  window.location.href = '/signin';
});

// Display the list of users for private chats
socket.on('user list', function(users) {
  var userList = document.getElementById('user-list');
  userList.innerHTML = '';

  users.forEach(function(user) {
    if (user.username !== username) {
      var item = document.createElement('li');
      item.innerHTML = `<button onclick="startPrivateChat('${user.username}')">Chat with ${user.username}</button>`;
      userList.appendChild(item);
    }
  });
});

function startPrivateChat(toUser) {
  socket.emit('private chat', { fromUser: username, toUser: toUser });
  window.location.href = `/chat?room=${username}-${toUser}&username=${encodeURIComponent(username)}`;
}

function joinRoom(roomName) {
  socket.emit('join room', roomName);
  window.location.href = `/chat?room=${roomName}&username=${encodeURIComponent(username)}`;
}

function openSendMessageModal(toUsername) {
// Set the username for modal
var modalUsername = document.getElementById('modal-username');
var addFriendBtn = document.getElementById('add-friend-btn');
var startChatBtn = document.getElementById('start-chat-btn');

modalUsername.textContent = toUsername;
addFriendBtn.onclick = function() { addContact(toUsername); };
startChatBtn.onclick = function() { startPrivateChat(toUsername); };

// Set up the send message button
var sendMessageBtn = document.getElementById('send-message-btn');
sendMessageBtn.onclick = function() {
var messageText = document.getElementById('message-text').value;
sendMessage(toUsername, messageText);
};

// Display the modal
document.getElementById('userModal').style.display = 'block';
}

function viewUserProfile(contactUsername) {
// Fetch the user's profile data
fetch(`/get-user-profile?username=${encodeURIComponent(contactUsername)}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Populate the modal with the user's data
      document.getElementById('profile-modal-username').textContent = `${data.firstName} ${data.lastName}`;
      document.getElementById('profile-modal-pic').src = data.profilePic || '/uploads/default-avatar.png';
      document.getElementById('profile-modal-bio').textContent = data.bio || 'No bio available.';
      // Display the modal
      document.getElementById('profileModal').style.display = 'block';
    } else {
      alert('Failed to load profile.');
    }
  })
  .catch(error => console.error('Error fetching profile:', error));
}


// Modal script for Inbox and User Interaction
var inboxModal = document.getElementById('inboxModal');
var userModal = document.getElementById('userModal');
var inboxBtn = document.getElementById('inbox-button');

// Close the inbox modal when clicking x
var inboxClose = document.getElementsByClassName('close')[0]; // First close button
inboxClose.onclick = function() {
inboxModal.style.display = 'none';
};

// Close the user modal when clicking x
var userClose = document.getElementsByClassName('close')[1]; // Second close button
userClose.onclick = function() {
userModal.style.display = 'none';
};  

// Close the profile modal when clicking x
var profileModal = document.getElementById('profileModal');
var profileClose = document.getElementsByClassName('close')[2]; // Third close button
profileClose.onclick = function() {
profileModal.style.display = 'none';
};

// Open the inbox modal
inboxBtn.onclick = function() {
inboxModal.style.display = 'block';
}

// Close the inbox modal when clicking x
inboxClose.onclick = function() {
inboxModal.style.display = 'none';
}

// Close the user modal when clicking x
userClose.onclick = function() {
userModal.style.display = 'none';
}

// When the user clicks anywhere outside of any modal, close it
window.onclick = function(event) {
if (event.target == inboxModal) {
  inboxModal.style.display = 'none';
}
if (event.target == userModal) {
  userModal.style.display = 'none';
}
if (event.target == profileModal) {
  profileModal.style.display = 'none';
}
if (event.target == createGroupModal) {
  createGroupModal.style.display = 'none';
}
};

// Fetch inbox messages on load
fetch(`/inbox?username=${encodeURIComponent(username)}`)
.then(response => response.json())
.then(data => {
  if (data.success && data.threads) {
    let unreadCount = 0;
    // Iterate over each thread
    for (const fromUser in data.threads) {
      const messages = data.threads[fromUser];
      // Count unread messages in this thread
      messages.forEach(message => {
        if (!message.isRead) {
          unreadCount++;
        }
      });
    }

    if (unreadCount > 0) {
      // Update the inbox notification
      var inboxButton = document.getElementById('inbox-button');
      inboxButton.textContent = `Inbox (${unreadCount})`;
    } else {
      // Optionally reset the inbox text if no unread messages
      var inboxButton = document.getElementById('inbox-button');
      inboxButton.textContent = 'Inbox';
    }
  }
})
.catch(error => console.error('Error fetching inbox:', error));

// Listen for real-time inbox notifications
socket.on('new inbox message', (data) => {
alert(`You have a new message from ${data.fromUser}: "${data.message}"`);
// Optionally, update the inbox button
var inboxButton = document.getElementById('inbox-button');
var currentCount = parseInt(inboxButton.textContent.match(/\d+/)) || 0;
inboxButton.textContent = `Inbox (${currentCount + 1})`;
});

// Open the inbox modal
inboxBtn.onclick = function() {
inboxModal.style.display = 'block';

// Fetch inbox messages
fetch(`/inbox?username=${encodeURIComponent(username)}`)
.then(response => response.json())
.then(async data => {
  var inboxMessagesList = document.getElementById('inbox-messages-list');
  inboxMessagesList.innerHTML = ''; // Clear existing messages

  if (data.success && Object.keys(data.threads).length > 0) {
    // For each thread (sender)
    for (const fromUser in data.threads) {
      const messages = data.threads[fromUser];

      // Fetch sender's profile picture
      const userData = await fetch(`/get-user-profile?username=${encodeURIComponent(fromUser)}`)
        .then(res => res.json());

      const profilePic = userData.success ? userData.profilePic : '/uploads/default-avatar.png';

      // Create a container for the thread
      const threadDiv = document.createElement('div');
      threadDiv.classList.add('thread');

      // Header for the thread
      const threadHeader = document.createElement('div');
      threadHeader.classList.add('thread-header');

      const profileImg = document.createElement('img');
      profileImg.src = profilePic;
      profileImg.classList.add('thread-profile-pic');

      const senderName = document.createElement('span');
      senderName.textContent = fromUser;
      senderName.classList.add('thread-sender-name');

      // "Delete Thread" button
      const deleteThreadBtn = document.createElement('button');
      deleteThreadBtn.textContent = 'Delete Thread';
      deleteThreadBtn.classList.add('delete-thread-btn');
      deleteThreadBtn.addEventListener('click', function() {
        deleteThread(fromUser);
        threadDiv.remove();
      });

      // Append header elements
      threadHeader.appendChild(profileImg);
      threadHeader.appendChild(senderName);
      threadHeader.appendChild(deleteThreadBtn);

      // Messages container
      const messagesList = document.createElement('ul');
      messagesList.classList.add('messages-list');

      // Sort messages by timestamp (optional)
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // For each message in the thread
      messages.forEach(function(message) {
        const li = document.createElement('li');
        li.textContent = message.message;

        // Visually distinguish read/unread
        li.style.fontWeight = message.isRead ? 'normal' : 'bold';

        // Mark as Read button
        const markAsReadBtn = document.createElement('button');
        markAsReadBtn.textContent = message.isRead ? 'Mark as Unread' : 'Mark as Read';
        markAsReadBtn.addEventListener('click', function() {
          toggleReadStatus(message._id, !message.isRead);
          message.isRead = !message.isRead;
          li.style.fontWeight = message.isRead ? 'normal' : 'bold';
          markAsReadBtn.textContent = message.isRead ? 'Mark as Unread' : 'Mark as Read';
        });

        li.appendChild(markAsReadBtn);
        messagesList.appendChild(li);
      });

      threadDiv.appendChild(threadHeader);
      threadDiv.appendChild(messagesList);
      inboxMessagesList.appendChild(threadDiv);
    }
  } else {
    inboxMessagesList.innerHTML = '<li>Your inbox is looking pretty empty!</li>';
  }
})
.catch(error => console.error('Error fetching inbox messages:', error));
};


// Fetch inbox messages
fetch(`/inbox?username=${encodeURIComponent(username)}`)
.then(response => response.json())
.then(data => {
  var inboxMessagesList = document.getElementById('inbox-messages-list');
  inboxMessagesList.innerHTML = ''; // Clear existing messages

  if (data.success && data.messages.length > 0) {
    data.messages.forEach(function(message) {
      var li = document.createElement('li');
      li.textContent = `${message.fromUser}: ${message.message}`;

      // Mark message as read when clicked
      li.addEventListener('click', function() {
        markMessageAsRead(message._id);
        li.style.fontWeight = 'normal'; // Visually indicate it's read
      });

      inboxMessagesList.appendChild(li);
    });
  } else {
    inboxMessagesList.innerHTML = '<li>Your inbox is looking pretty empty!</li>';
  }
})
.catch(error => console.error('Error fetching inbox messages:', error));


function markMessageAsRead(messageId) {
fetch('/mark-as-read', {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({ messageId: messageId })
})
.then(response => response.json())
.then(data => {
if (data.success) {
  console.log('Message marked as read');
  // Optionally update the inbox count
} else {
  console.error('Failed to mark message as read');
}
})
.catch(error => console.error('Error marking message as read:', error));
}


// Search functionality for finding users
var searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', function() {
  var query = searchInput.value.trim();

  // Check if the input is a phone number
  var isPhoneNumber = /^[0-9+()-\s]{7,15}$/.test(query);

  if (isPhoneNumber) {
    // If it's a phone number and length is sufficient, perform search
    // Only search when the length matches your phone number format
    searchUsers(query, 'phoneNumber');
  } else if (query.length > 0) {
    // Assume it's a username search
    searchUsers(query, 'username');
  } else {
    document.getElementById('search-results').innerHTML = '';
  }
});


function sendMessage(toUser, message) {
  fetch('/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fromUser: username, // 'username' should be defined earlier in your script
      toUser: toUser,
      message: message
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Message sent successfully');
      // Clear the message textarea
      document.getElementById('message-text').value = '';
    } else {
      alert('Failed to send message');
    }
  })
  .catch(error => console.error('Error sending message:', error));
}


function searchUsers(query, type) {
  fetch(`/search-users?query=${encodeURIComponent(query)}&type=${type}`)
    .then(response => response.json())
    .then(data => {
      var searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '';

      if (data.length > 0) {
        data.forEach(function(user) {
          var li = document.createElement('li');
          li.textContent = user.username;
          li.addEventListener('click', function() {
          // Set the username for modal
          var modalUsername = document.getElementById('modal-username');
          var addFriendBtn = document.getElementById('add-friend-btn');
          var startChatBtn = document.getElementById('start-chat-btn');

          modalUsername.textContent = user.username;
          addFriendBtn.onclick = function() { addContact(user.username); };
          startChatBtn.onclick = function() { startPrivateChat(user.username); };

          // Set up the send message button
          var sendMessageBtn = document.getElementById('send-message-btn');
          sendMessageBtn.onclick = function() {
            var messageText = document.getElementById('message-text').value;
            sendMessage(user.username, messageText);
          };

          // Display the modal
          document.getElementById('userModal').style.display = 'block';
        });

          searchResults.appendChild(li);
        });
      } else {
        searchResults.innerHTML = '<li>No users found</li>';
      }
    });
}

function addContact(contactUsername) {
  fetch(`/add-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      contact: contactUsername
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`Added ${contactUsername} to your contacts!`);
    } else {
      alert('Failed to add contact.');
    }
  });
}

// Display the contacts list when clicking "contacts"
var contactsBtn = document.getElementById('contacts-button');
contactsBtn.addEventListener('click', function() {
var contactsList = document.getElementById('contacts-list');
contactsList.style.display = (contactsList.style.display === 'none') ? 'block' : 'none';

// Fetch and display the contacts list
fetch(`/get-contacts?username=${username}`)
.then(response => response.json())
.then(data => {
  contactsList.innerHTML = ''; // Clear the previous list

  if (data.contacts.length === 0) {
    // Display a message if contacts list is empty
    var emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'Your contacts list is empty.';
    emptyMessage.style.fontStyle = 'italic';
    contactsList.appendChild(emptyMessage);
  } else {
    data.contacts.forEach(function(contact) {
      // Existing code to create list items
      var li = document.createElement('li');

      // Create the profile picture element
      var profileImg = document.createElement('img');
      profileImg.src = contact.profilePic || '/uploads/default-avatar.png';
      profileImg.style.width = '30px';
      profileImg.style.height = '30px';
      profileImg.style.borderRadius = '50%';
      profileImg.style.marginRight = '10px';

      // Create the contact name element
      var contactName = document.createElement('span');
      contactName.textContent = contact.username;

      // Create the "Send Message" button
      var sendMessageButton = document.createElement('button');
      sendMessageButton.textContent = 'Send Message';
      sendMessageButton.style.marginLeft = '10px';
      sendMessageButton.style.backgroundColor = '#007bff';
      sendMessageButton.style.color = 'white';
      sendMessageButton.style.border = 'none';
      sendMessageButton.style.borderRadius = '5px';
      sendMessageButton.style.cursor = 'pointer';
      sendMessageButton.addEventListener('click', function() {
        openSendMessageModal(contact.username);
      });

      // Create the remove button
      var removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.style.marginLeft = '10px';
      removeButton.style.backgroundColor = '#ff0000';
      removeButton.style.color = 'white';
      removeButton.style.border = 'none';
      removeButton.style.borderRadius = '5px';
      removeButton.style.cursor = 'pointer';
      removeButton.addEventListener('click', function() {
        removeContact(contact.username);
      });

        // Create the "View Profile" button
      var viewProfileButton = document.createElement('button');
      viewProfileButton.textContent = 'View Profile';
      viewProfileButton.style.marginLeft = '10px';
      viewProfileButton.style.backgroundColor = '#28a745';
      viewProfileButton.style.color = 'white';
      viewProfileButton.style.border = 'none';
      viewProfileButton.style.borderRadius = '5px';
      viewProfileButton.style.cursor = 'pointer';
      viewProfileButton.addEventListener('click', function() {
        viewUserProfile(contact.username);
      });

      // Create the favorite/unfavorite button
      var favoriteButton = document.createElement('button');
      favoriteButton.style.marginLeft = '10px';
      favoriteButton.style.border = 'none';
      favoriteButton.style.borderRadius = '5px';
      favoriteButton.style.cursor = 'pointer';
      favoriteButton.textContent = contact.isFavorite ? 'Unfavorite' : 'Favorite';
      favoriteButton.style.backgroundColor = contact.isFavorite ? '#ffcc00' : '#cccccc';

      // Handle adding/removing from favorites
      favoriteButton.addEventListener('click', function() {
        if (contact.isFavorite) {
          removeFavorite(contact.username);
        } else {
          addFavorite(contact.username);
        }
      });

      // Append the profile picture, contact name, and buttons to the list item
      li.appendChild(profileImg);
      li.appendChild(contactName);
      li.appendChild(sendMessageButton);
      li.appendChild(viewProfileButton);
      li.appendChild(favoriteButton);
      li.appendChild(removeButton);

      contactsList.appendChild(li);
    });
  }
})
.catch(error => console.error('Error fetching contacts:', error));
});

// Display the favorite contacts list when clicking "Favorites"
var favoritesBtn = document.getElementById('favorites-button');
favoritesBtn.addEventListener('click', function() {
var favoritesList = document.getElementById('favorites-list');
favoritesList.style.display = (favoritesList.style.display === 'none') ? 'block' : 'none';

// Fetch and display the favorites list
fetch(`/get-contacts?username=${username}`)
.then(response => response.json())
.then(data => {
  favoritesList.innerHTML = ''; // Clear the previous list

  // Filter contacts to get favorites
  var favoritecontacts = data.contacts.filter(contact => contact.isFavorite);

  if (favoritecontacts.length === 0) {
    // Display a message if favorites list is empty
    var emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'Your favorites list is empty.';
    emptyMessage.style.fontStyle = 'italic';
    favoritesList.appendChild(emptyMessage);
  } else {
    favoritecontacts.forEach(function(contact) {
      var li = document.createElement('li');

      // Create the profile picture element
      var profileImg = document.createElement('img');
      profileImg.src = contact.profilePic || '/uploads/default-avatar.png';
      profileImg.style.width = '30px';
      profileImg.style.height = '30px';
      profileImg.style.borderRadius = '50%';
      profileImg.style.marginRight = '10px';

      // Create the contact name element
      var contactName = document.createElement('span');
      contactName.textContent = contact.username;

      // **Add "Send Message" Button**
      var sendMessageButton = document.createElement('button');
      sendMessageButton.textContent = 'Send Message';
      sendMessageButton.style.marginLeft = '10px';
      sendMessageButton.style.backgroundColor = '#007bff';
      sendMessageButton.style.color = 'white';
      sendMessageButton.style.border = 'none';
      sendMessageButton.style.borderRadius = '5px';
      sendMessageButton.style.cursor = 'pointer';
      sendMessageButton.addEventListener('click', function() {
        openSendMessageModal(contact.username);
      });

      // **Add "View Profile" Button**
      var viewProfileButton = document.createElement('button');
      viewProfileButton.textContent = 'View Profile';
      viewProfileButton.style.marginLeft = '10px';
      viewProfileButton.style.backgroundColor = '#28a745';
      viewProfileButton.style.color = 'white';
      viewProfileButton.style.border = 'none';
      viewProfileButton.style.borderRadius = '5px';
      viewProfileButton.style.cursor = 'pointer';
      viewProfileButton.addEventListener('click', function() {
        viewUserProfile(contact.username);
      });

      // Create the unfavorite button
      var unfavoriteButton = document.createElement('button');
      unfavoriteButton.textContent = 'Unfavorite';
      unfavoriteButton.style.marginLeft = '10px';
      unfavoriteButton.style.backgroundColor = '#ffcc00';
      unfavoriteButton.style.color = 'white';
      unfavoriteButton.style.border = 'none';
      unfavoriteButton.style.borderRadius = '5px';
      unfavoriteButton.style.cursor = 'pointer';
      unfavoriteButton.addEventListener('click', function() {
        removeFavorite(contact.username);
      });

      // Append elements to the list item
      li.appendChild(profileImg);
      li.appendChild(contactName);
      li.appendChild(sendMessageButton);
      li.appendChild(viewProfileButton);
      li.appendChild(unfavoriteButton);

      favoritesList.appendChild(li);
    });
  }
})
.catch(error => console.error('Error fetching favorite contacts:', error));
});


// Function to add a contact to favorites
function addFavorite(contactUsername) {
fetch(`/add-favorite`, {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  username: username,
  contactUsername: contactUsername
})
})
.then(response => response.json())
.then(data => {
if (data.success) {
  alert(`${contactUsername} has been added to your favorites.`);
  contactsBtn.click(); // Refresh contacts
  favoritesBtn.click(); // Open favorites
  favoritesBtn.click(); // Close favorites to trigger refresh
} else {
  alert('Failed to add to favorites.');
}
})
.catch(error => console.error('Error adding to favorites:', error));
}

function removeFavorite(contactUsername) {
fetch(`/remove-favorite`, {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  username: username,
  contactUsername: contactUsername
})
})
.then(response => response.json())
.then(data => {
if (data.success) {
  alert(`${contactUsername} has been removed from your favorites.`);
  contactsBtn.click(); // Refresh contacts
  favoritesBtn.click(); // Open favorites
  favoritesBtn.click(); // Close favorites to trigger refresh
} else {
  alert('Failed to remove from favorites.');
}
})
.catch(error => console.error('Error removing from favorites:', error));
}

// Function to remove contact
function removeContact(contactUsername) {
  fetch(`/remove-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      contactUsername: contactUsername
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`${contactUsername} has been removed from your contacts.`);
      contactsBtn.click(); // Simulate another click to refresh the list
    } else {
      alert('Failed to remove contact.');
    }
  })
  .catch(error => console.error('Error removing contact:', error));
}

function openSendMessageModal(toUsername) {
  // Set the username for modal
  var modalUsername = document.getElementById('modal-username');
  var addFriendBtn = document.getElementById('add-friend-btn');
  var startChatBtn = document.getElementById('start-chat-btn');

  modalUsername.textContent = toUsername;
  addFriendBtn.onclick = function() { addContact(toUsername); };
  startChatBtn.onclick = function() { startPrivateChat(toUsername); };

  // Set up the send message button
  var sendMessageBtn = document.getElementById('send-message-btn');
  sendMessageBtn.onclick = function() {
    var messageText = document.getElementById('message-text').value;
    sendMessage(toUsername, messageText);
  };

  // Display the modal
  document.getElementById('userModal').style.display = 'block';
}


function toggleReadStatus(messageId, isRead) {
fetch('/toggle-read-status', {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({ messageId: messageId, isRead: isRead })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Message read status updated');
    // Optionally update the inbox count
  } else {
    console.error('Failed to update message read status');
  }
})
.catch(error => console.error('Error updating message read status:', error));
}

function deleteThread(fromUser) {
  fetch('/delete-thread', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: username, fromUser: fromUser })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Thread with ${fromUser} has been deleted.`);
        // Optionally refresh the inbox
      } else {
        alert('Failed to delete thread.');
      }
    })
    .catch(error => console.error('Error deleting thread:', error));
}

// Modal script for Group Creation
document.addEventListener('DOMContentLoaded', () => {
  var createGroupModal = document.getElementById('createGroupModal');
  var createGroupForm = document.getElementById('create-group-form');
  var searchInput = document.getElementById('search-users');
  var searchResults = document.getElementById('search-results');
  var friendsList = document.getElementById('friends-list');
  var createGroupBtn = document.getElementById('create-group-chat');

  // Open the Group Creation Modal
  createGroupBtn.onclick = function() {
    createGroupModal.style.display = 'block';
    loadContacts();
  };

  // Close the Group Creation modal when clicking x
  var groupClose = document.getElementsByClassName('close')[3]; // Fourth close button 
  groupClose.onclick = function() {
  createGroupModal.style.display = 'none';
  }

  // Load the user's contacts into the modal
  function loadContacts() {
    fetch(`/get-contacts?username=${encodeURIComponent(username)}`)
      .then(response => response.json())
      .then(data => {
        friendsList.innerHTML = ''; // Clear existing contacts
        if (data.success && data.contacts.length > 0) {
          data.contacts.forEach(contact => {
            const li = document.createElement('li');
            li.innerHTML = `<input type="checkbox" value="${contact.username}"> ${contact.username}`;
            friendsList.appendChild(li);
          });
        } else {
          friendsList.innerHTML = '<li>No contacts found</li>';
        }
      })
      .catch(error => console.error('Error loading contacts:', error));
  }
  
});





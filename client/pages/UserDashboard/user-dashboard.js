
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
    .then(response => {
      if (response.status === 403) {
        return response.json().then(data => {
          alert(data.message);
          window.location.href = '/signin'; // Redirect the user
        });
      } else if (!response.ok) {
        // Handle other non-OK responses
        return response.json().then(data => {
          console.error('Error checking user status:', data.message);
        });
      } else {
        return response.json();
      }
    })
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
// Fetch the profile data including profile picture
fetch(`/get-user-profile?username=${encodeURIComponent(username)}`)
  .then(response => {
    if (response.status === 403) {
      return response.json().then(data => {
        alert(data.message);
        window.location.href = '/signin'; // Redirect the user
      });
    } else if (!response.ok) {
      // Handle other non-OK responses
      return response.json().then(data => {
        console.error('Error fetching profile:', data.message);
      });
    } else {
      return response.json();
    }
  })
  .then(data => {
    if (data && data.success) {
      document.getElementById('profile-pic').src = data.profilePic;
    }
  })
  .catch(error => console.error('Error fetching profile:', error));

}

// Close the profile modal when clicking x
var profileModal = document.getElementById('profileModal');
var profileClose = document.getElementsByClassName('close')[2]; // Third close button
profileClose.onclick = function() {
profileModal.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  const inboxBtn = document.getElementById('inbox-button');
  const inboxModal = document.getElementById('inboxModal');
  const userModal = document.getElementById('userModal');
  const profileModal = document.getElementById('profileModal');
  const createGroupModal = document.getElementById('createGroupModal');

  // Open the inbox modal
  if (inboxBtn) {
    inboxBtn.onclick = function () {
      if (inboxModal) {
        inboxModal.style.display = 'block';
      } else {
        console.error('Inbox modal element not found');
      }
    };
  }

  // Close the inbox modal
  const inboxClose = document.querySelector('.close'); // Adjust selector if needed
  if (inboxClose) {
    inboxClose.onclick = function () {
      if (inboxModal) {
        inboxModal.style.display = 'none';
      }
    };
  }

  // Close the user modal
  const userClose = document.querySelector('.close'); // Adjust selector if needed
  if (userClose) {
    userClose.onclick = function () {
      if (userModal) {
        userModal.style.display = 'none';
      }
    };
  }

  // Close modals when clicking outside
  window.onclick = function (event) {
    if (event.target == inboxModal) inboxModal.style.display = 'none';
    if (event.target == userModal) userModal.style.display = 'none';
    if (event.target == profileModal) profileModal.style.display = 'none';
    if (event.target == createGroupModal) createGroupModal.style.display = 'none';
  };
});



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
function handleFriendRequest(fromUser, toUser, accepted) {
  fetch('/respond-to-friend-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUser, toUser, accepted })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      // Optionally, refresh or update UI to show the new friend in contacts list
    } else {
      console.error('Failed to respond to friend request');
    }
  })
  .catch(error => console.error('Error responding to friend request:', error));
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
            window.location.href = `/messages?participant=${encodeURIComponent(user.username)}`;

        });

          searchResults.appendChild(li);
        });
      } else {
        searchResults.innerHTML = '<li>No users found</li>';
      }
    });
}

function addContact(toUsername) {
  fetch('/send-friend-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUser: username, toUser: toUsername })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Friend request sent!');
    } else {
      alert('Failed to send friend request.');
    }
  })
  .catch(error => console.error('Error sending friend request:', error));
}

// Display the contacts list and search bar when clicking "Friends"
var contactsBtn = document.getElementById('contacts-button');
contactsBtn.addEventListener('click', function() {
  var contactsList = document.getElementById('contacts-list');
  var searchContainer = document.getElementById('search-container');
  var isVisible = (contactsList.style.display === 'none' || contactsList.style.display === '');

  if (isVisible) {
    contactsList.style.display = 'block';
    searchContainer.style.display = 'block';

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
  } else {
    contactsList.style.display = 'none';
    searchContainer.style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
  }
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
  window.location.href = `/messages?participant=${encodeURIComponent(toUsername)}`;
}


// Modal script for Group Creation
document.addEventListener('DOMContentLoaded', () => {
  var createGroupModal = document.getElementById('createGroupModal');
  var createGroupForm = document.getElementById('create-group-form');
  var searchUsers = document.getElementById('invite-users');
  var searchResults = document.getElementById('invite-results');
  var friendsList = document.getElementById('friends-list');
  var createGroupBtn = document.getElementById('create-group-chat');
  var selectedUsers = [];

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

  searchUsers.addEventListener('input', function() {
    var query = searchUsers.value.trim();
    if (query.length > 0) {
      searchUser(query, 'username');
    } else {
      searchResults.innerHTML = '';
    }
  });

  friendsList.addEventListener('change', (event) => {
    const checkbox = event.target;
    const username = checkbox.value;
  
    if (checkbox.checked) {
      addUser(username);
    } else {
      removeUser(username);
    }
  });

  // Load the user's contacts into the modal
  function loadContacts() {
    fetch(`/get-contacts?username=${encodeURIComponent(username)}`)
      .then(response => response.json())
      .then(data => {
        friendsList.innerHTML = '';
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

  function searchUser(query, type) {
    fetch(`/search-users?query=${encodeURIComponent(query)}&type=${type}`)
      .then(response => response.json())
      .then(data => {
        searchResults.innerHTML = '';
        if (data.length > 0) {
          data.forEach(function(user) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${user.username}</span>`;

            // Testing add button for searching users
            var addButton = document.createElement('button');
            addButton.textContent = 'Add';
            addButton.onclick = function() {
              event.preventDefault();
              event.stopPropagation();
              addUser(user.username);
              searchResults.innerHTML = '';
              searchUsers.value = '';
            };
            li.appendChild(addButton);

            searchResults.appendChild(li);
          });
        } else {
          searchResults.innerHTML = '<li>No users found</li>';
        }
      })
      .catch(error => console.error('Error in searchUser:', error));
  }
  
  // Function to add a user to the selected users list
  function addUser(username) {
    if (!selectedUsers.includes(username)) {
      selectedUsers.push(username);
      updateSelectedUsersDisplay();

      const friendCheckbox = friendsList.querySelector(`input[type="checkbox"][value="${username}"]`);
      if (friendCheckbox) {
        friendCheckbox.checked = true;
      }
    }
  }
  
  // Update the display of selected users in the form
  function updateSelectedUsersDisplay() {
    const selectedUsersContainer = document.querySelector('.selected-users');
    selectedUsersContainer.innerHTML = '';
    selectedUsers.forEach(username => {
      const userTag = document.createElement('span');
      userTag.className = 'user-tag';
      userTag.textContent = username;

      // Remove button for each selected user
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.className = 'remove-btn';
      removeButton.onclick = function() {
        removeUser(username);
      };

      userTag.appendChild(removeButton);
      selectedUsersContainer.appendChild(userTag);
    });
  }
  
  // Remove a user from the selected users list
  function removeUser(username) {
    selectedUsers = selectedUsers.filter(user => user !== username);
    updateSelectedUsersDisplay();

    const friendCheckbox = friendsList.querySelector(`input[type="checkbox"][value="${username}"]`);
    if (friendCheckbox) {
      friendCheckbox.checked = false;
    }
  }

});





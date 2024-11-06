
document.addEventListener('DOMContentLoaded', function() {    
  var socket = io();
  const defaultProfilePicUrl = 'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/default-avatar.png';


  // Extract the username from the URL query parameter
  var urlParams = new URLSearchParams(window.location.search);
  var username = urlParams.get('username');
  var roomName = urlParams.get('room');

  if (!username) {
    // If no username is found, redirect to sign-in page
    window.location.href = '/signin';
  } else {
    // Send the username to the server
    socket.emit('set username', username);

    // Join the specified room
    socket.emit('join room', roomName);
  }
  let oldestTimestamp = null;
  const input = document.getElementById('input');
  const emojiButton = document.getElementById('emoji-button');

  // Initialize the emoji picker
  const picker = new EmojiButton();
  console.log('Emoji picker initialized');  // Debugging statement

  // Toggle the emoji picker when the button is clicked
  emojiButton.addEventListener('click', () => {
    console.log('Emoji button clicked');  // Debugging statement
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
    console.log('EmojiButton:', picker);

  });

  // When an emoji is selected, add it to the input field
  picker.on('emoji', emoji => {
    console.log('Emoji selected:', emoji);  // Debugging statement
    input.value += emoji;
  });

  // Send a message with the username
  var form = document.getElementById('form');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const message = input.value;
    const imageInput = document.getElementById('image-input');
    const imageFile = imageInput.files[0];

    if (message || imageFile) {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('roomName', roomName);
      if (message) {
        formData.append('message', message);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (replyToMessage) {
        formData.append('replyTo', replyToMessage._id);
      }

      fetch('/upload-chat', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      })
      .then(data => {
        input.value = '';
        imageInput.value = '';
        replyToMessage = null;
        document.getElementById('reply-preview').style.display = 'none';
      })
      .catch(error => {
        console.error('Error uploading image:', error);
        alert('Error: ' + (error.message || 'An error occurred while uploading the file.'));
      });
    }
  });


  // Function to convert URLs in messages into embedded content
  function autoEmbedMessage(message) {
    // Regex for detecting YouTube links
    const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/;

    // Replace YouTube URLs with an iframe
    if (youtubeRegex.test(message)) {
      const videoId = message.match(youtubeRegex)[2];
      const embedHTML = `
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>`;
      return message.replace(youtubeRegex, embedHTML);
    }

    // Return the message if no link was found or transformed
    return message;
  }

  socket.on('chat message', function(msg) {
    console.log('Received message:', msg);
    const item = createMessageElement(msg);
    document.getElementById('messages').appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });

  socket.on('mute notification', function(data) {
    alert(data.message);
  });

  // Client-side: Display chat history when joining a room
  socket.on('chat history', function(messages) {
    const messagesList = document.getElementById('messages');

    if (messages.length > 0) {
      oldestTimestamp = messages[0].timestamp;

      messages.forEach(function(msg) {
        const item = createMessageElement(msg);
        messagesList.appendChild(item);
      });

  // Show the "Load More" button
      document.getElementById('load-more').style.display = 'block';
    } else {
  // Hide the "Load More" button if no messages are received
      document.getElementById('load-more').style.display = 'none';
    }

    window.scrollTo(0, document.body.scrollHeight);
  });

  function createMessageElement(msg) {
    const item = document.createElement('li');
    item.classList.add('message-item');
    item.dataset.messageId = msg._id;

    // Create a container for the profile image and message content
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    // Create profile image element
    const profileImg = document.createElement('img');
    profileImg.src = msg.profilePic || defaultProfilePicUrl;
    profileImg.classList.add('profile-image');

    // Create a container for the message content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content-div');

    // Create timestamp element
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const timestampSpan = document.createElement('span');
    timestampSpan.textContent = `[${timestamp}] `;
    timestampSpan.classList.add('timestamp');

    // Create username element
    const usernameSpan = document.createElement('strong');
    usernameSpan.textContent = msg.username + ': ';

    // Use the autoEmbedMessage function to process the message
    const content = autoEmbedMessage(msg.message);

    // Create message content element
    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = content;

    // Append elements to contentDiv
    contentDiv.appendChild(timestampSpan);
    contentDiv.appendChild(usernameSpan);
    contentDiv.appendChild(messageSpan);

    // If the message is a reply, display the quoted message
    if (msg.replyToMessage) {
      const replyDiv = document.createElement('div');
      replyDiv.classList.add('reply-message');

      const replyUsername = document.createElement('strong');
      replyUsername.textContent = msg.replyToMessage.username + ': ';

      const replyContent = document.createElement('span');
      replyContent.textContent = msg.replyToMessage.message || msg.replyToMessage.fileName || '[File]';

      replyDiv.appendChild(replyUsername);
      replyDiv.appendChild(replyContent);

      contentDiv.insertBefore(replyDiv, contentDiv.firstChild);
    }

    if (msg.edited) {
      const editedTag = document.createElement('span');
      editedTag.classList.add('edited-tag');
      editedTag.textContent = ' (edited)';
      messageSpan.appendChild(editedTag);
    }
    
    // Append profile image and contentDiv to messageContainer
    messageContainer.appendChild(profileImg);
    messageContainer.appendChild(contentDiv);

    // Add Edit Button if the message belongs to the current user
    if (msg.username === username) {
      const editButton = document.createElement('button');
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.classList.add('edit-button');

      // Add event listener for editing
      editButton.addEventListener('click', () => {
        editMessage(msg);
      });

      // Append editButton to messageContainer
      messageContainer.appendChild(editButton);
    }

    // Add Delete Button if the message belongs to the current user
    if (msg.username == username){
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.classList.add('delete-button');
  
      // Add event listener for deleting
      deleteButton.addEventListener('click', () => {
        deleteMessage(msg._id, item);
      });
  
      // Append deleteButton to messageContainer
      messageContainer.appendChild(deleteButton);
    }

    // **Add a Reply button**
    const replyButton = document.createElement('button');
    replyButton.innerHTML = '<i class="fas fa-reply"></i>';
    replyButton.classList.add('reply-button');
    
    // Add Reaction Button
    const reactionButton = document.createElement('button');
    reactionButton.innerHTML = '😄'; // This can be a generic emoji to open the picker
    reactionButton.classList.add('reaction-button');

  // Event listener for adding reactions
  reactionButton.addEventListener('click', () => {
    picker.showPicker(reactionButton); // Show emoji picker when clicked
    picker.on('emoji', (emoji) => {
      // Emit the reaction to the server without adding it as a new message
      socket.emit('add reaction', { messageId: msg._id, emoji: emoji, roomName });

      // Update the UI with the selected emoji right under the message
      let reactionSpan = Array.from(reactionsDiv.children).find(span => span.textContent.startsWith(emoji));
      
      if (reactionSpan) {
        const currentCount = parseInt(reactionSpan.getAttribute('data-count')) || 0;
        reactionSpan.setAttribute('data-count', currentCount + 1);
        reactionSpan.textContent = `${emoji} (${currentCount + 1})`;
      } else {
        const newReactionSpan = document.createElement('span');
        newReactionSpan.textContent = `${emoji} (1)`;
        newReactionSpan.setAttribute('data-count', 1);
        reactionsDiv.appendChild(newReactionSpan);
      }
    });
  });

  // Append reaction button to message container
  messageContainer.appendChild(reactionButton);

  // Display reactions under the message
  const reactionsDiv = document.createElement('div');
  reactionsDiv.classList.add('reactions');
  msg.reactions?.forEach(reaction => {
    const reactionSpan = document.createElement('span');
    reactionSpan.textContent = `${reaction.emoji} (${reaction.count})`;
    reactionsDiv.appendChild(reactionSpan);
  });
  messageContainer.appendChild(reactionsDiv);

    
    // Add event listener for replying
    replyButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering any parent event handlers
      setReplyToMessage(msg);
    });

    // Append replyButton to messageContainer
    messageContainer.appendChild(replyButton);

    // Append messageContainer to item
    item.appendChild(messageContainer);

// If there's a file in the message
    if (msg.fileUrl) {
      let fileElement;

      if (msg.fileType.startsWith('image/')) {
        // Display image
        fileElement = document.createElement('img');
        fileElement.src = msg.fileUrl;
        fileElement.style.maxWidth = '200px';
        fileElement.style.display = 'block';
        contentDiv.appendChild(fileElement);
      } else if (['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(msg.fileType)) {
        // Display file link with file name
        fileElement = document.createElement('a');
        fileElement.href = msg.fileUrl;
        fileElement.textContent = msg.fileName || 'View File';
        fileElement.target = '_blank';

        // Create download button
        const downloadButton = document.createElement('a');
        downloadButton.href = msg.fileUrl;
        downloadButton.download = msg.fileName || 'file';
        downloadButton.innerHTML = '⬇';
        downloadButton.style.marginLeft = '10px';
        downloadButton.style.cursor = 'pointer';

        // Append file link and download button
        contentDiv.appendChild(fileElement);
        contentDiv.appendChild(downloadButton);
      } else {
        // Handle other types
        fileElement = document.createElement('span');
        fileElement.textContent = 'Unsupported file type.';
        contentDiv.appendChild(fileElement);
      }
    }


    item.addEventListener('click', () => {
      setReplyToMessage(msg);
    });

    return item;
  }

  let replyToMessage = null;

  function setReplyToMessage(msg) {
    replyToMessage = msg;

    // Update the reply message to reflect the latest edited content
    const updatedMessageContent = msg.message;

    // Display the quoted message
    const replyPreview = document.getElementById('reply-preview');
    replyPreview.innerHTML = `
      <div class="reply-preview-content">
    <strong>${msg.username}</strong>: ${msg.message || msg.fileName || ''}
        <button id="cancel-reply">✕</button>
      </div>
    `;

    replyPreview.style.display = 'block';

    // Handle cancel reply
    document.getElementById('cancel-reply').addEventListener('click', () => {
      replyToMessage = null;
      replyPreview.style.display = 'none';
    });
  }

  function deleteMessage(messageId, messageElement) {
    if (confirm('Are you sure you want to delete this message?')) {
      fetch(`/delete-message/${messageId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Remove the message element from the DOM
            messageElement.remove();
          } else {
            alert('Failed to delete message: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error deleting message:', error);
          alert('Error: ' + (error.message || 'An error occurred while deleting the message.'));
        });
    }
  }

  function editMessage(msg) {
    // Get the current message element
    const item = document.querySelector(`[data-message-id="${msg._id}"]`);
    const contentDiv = item.querySelector('.content-div');

    // Replace the message content with an input field for editing
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = msg.message;
    editInput.classList.add('edit-input');

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.classList.add('save-button');

    // Event listener for saving the edited message
    saveButton.addEventListener('click', () => {
      const newContent = editInput.value;

      // Emit the edited message to the server
      socket.emit('edit message', { messageId: msg._id, newContent, roomName });

      // Replace the input field with the updated message content
      contentDiv.innerHTML = '';
      contentDiv.appendChild(document.createTextNode(`[${new Date().toLocaleString()}] ${msg.username}: ${newContent}`));
      const editedTag = document.createElement('span');
      editedTag.classList.add('edited-tag');
      editedTag.textContent = ' (edited)';
      contentDiv.appendChild(editedTag);
    });

    // Clear contentDiv and add editInput and saveButton
    contentDiv.innerHTML = '';
    contentDiv.appendChild(editInput);
    contentDiv.appendChild(saveButton);
  }

  socket.on('message edited', ({ messageId, newContent }) => {
    const item = document.querySelector(`[data-message-id="${messageId}"]`);
    if (item) {
      const contentDiv = item.querySelector('.content-div');
      const timestampSpan = contentDiv.querySelector('.timestamp');
      const usernameSpan = contentDiv.querySelector('strong');
  
      // Update the message content
      const messageSpan = contentDiv.querySelector('.message-content');
      messageSpan.textContent = newContent;
  
      // Add '(edited)' tag if not already present
      if (!contentDiv.querySelector('.edited-tag')) {
        const editedTag = document.createElement('span');
        editedTag.classList.add('edited-tag');
        editedTag.textContent = ' (edited)';
        contentDiv.appendChild(editedTag);
      }
    }
  });
  

  socket.on('reaction added', function({ messageId, emoji, count }) {
    const messageItem = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageItem) {
      const reactionsDiv = messageItem.querySelector('.reactions');
      let reactionSpan = Array.from(reactionsDiv.children).find(span => span.textContent.startsWith(emoji));
      
      if (reactionSpan) {
        reactionSpan.textContent = `${emoji} (${count})`;
      } else {
        const newReactionSpan = document.createElement('span');
        newReactionSpan.textContent = `${emoji} (${count})`;
        reactionsDiv.appendChild(newReactionSpan);
      }
    }
  });  

  socket.on('more chat history', function(messages) {
    const messagesList = document.getElementById('messages');

    if (messages.length > 0) {
  // Update oldestTimestamp
      oldestTimestamp = messages[0].timestamp;

      messages.forEach(function(msg) {
        const item = createMessageElement(msg);
        messagesList.insertBefore(item, messagesList.firstChild);
      });
    } else {
  // Hide the "Load More" button if no more messages are available
      document.getElementById('load-more').style.display = 'none';
    }
  });

  document.getElementById('load-more').addEventListener('click', function() {
    if (oldestTimestamp) {
      socket.emit('load more messages', { roomName: roomName, lastTimestamp: oldestTimestamp });
    }
  });

  // Typing indicator
  input.addEventListener('input', function() {
    socket.emit('typing', username);
  });


  socket.on('typing', function(username) {
    document.getElementById('typing').textContent = username + ' is typing...';
  });

  socket.on('stop typing', function() {
    document.getElementById('typing').textContent = '';
  });

  // Handle Sign Out
  var signoutButton = document.getElementById('signout');
  signoutButton.addEventListener('click', function() {
    socket.disconnect();  // Disconnect the user
    window.location.href = '/signin';  // Redirect to signin page
  });

  // Receive and display the user list
  socket.on('user list', function(users) {
    var usersList = document.getElementById('users');
    usersList.innerHTML = '';  // Clear the current list

    users.forEach(function(user) {
      var item = document.createElement('li');        // Create a list item for each user

      // Create the profile picture element
      const profileImg = document.createElement('img');
      profileImg.src = user.profilePic || '/uploads/default-avatar.png'; // Use default avatar if no profile pic
      profileImg.style.width = '40px';
      profileImg.style.height = '40px';
      profileImg.style.borderRadius = '50%';
      profileImg.style.marginRight = '10px';

      // Create the username element
      const text = document.createElement('span');
      text.textContent = user.username || 'Unknown User'; // Display 'Unknown User' if username is missing

      // Append the profile picture and username to the list item
      item.appendChild(profileImg);
      item.appendChild(text);

      // Append the list item to the users list
      usersList.appendChild(item);
    });
  });
});    

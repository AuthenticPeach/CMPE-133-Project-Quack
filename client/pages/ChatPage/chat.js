// Retrieve the username from localStorage
const username = localStorage.getItem("username");  

// Redirect to the sign-in page if the username is not found
if (!username) {
  window.location.href = "/signin";
}

const body = document.querySelector("body"),
  sidebar = body.querySelector("nav"),
  sidebar2 = document.querySelector(".sidebar2"),
  toggle = body.querySelector(".toggle"),
  contactsBtn = document.querySelector(".contact-btn"),
  contactIcon = document.querySelector(".bxs-contact"),
  contactText = document.getElementById("contactText");
favoriteBtn = document.querySelector(".favorite-btn");
(favoriteIcon = document.querySelector(".bx-heart")),
  (favoriteText = document.getElementById("favoriteText"));

const contactsList = document.getElementsByClassName("contactList")[0];
const favoriteList = document.getElementsByClassName("favoriteList")[0];

let isReply = false; // Check if the user click the reply button

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close");
  adjustSidebar2();
});

contactsBtn.addEventListener("click", () => {
  document.getElementById("title").textContent = "CONTACT";
  if (
    sidebar2.classList.contains("open") &
    (contactsList.style.display === "block")
  ) {
    contactsList.style.display = "none";
    sidebar2.classList.toggle("open");
    contactsBtn.style.backgroundColor = "";
    contactIcon.style.color = "";
    contactText.style.color = "";
    adjustSidebar2(); // Adjust position of content
  } else if (
    sidebar2.classList.contains("open") &
    (favoriteList.style.display === "block")
  ) {
    contactsList.style.display = "block";
    favoriteList.style.display = "none";
    contactsBtn.style.backgroundColor = "var(--text-color)";
    contactIcon.style.color = "var(--sidebar-color)";
    contactText.style.color = "var(--sidebar-color)";
    favoriteBtn.style.backgroundColor = "";
    favoriteIcon.style.color = "";
    favoriteText.style.color = "";
    adjustSidebar2();
  } else {
    sidebar2.classList.toggle("open");
    contactsList.style.display = "block";
    favoriteList.style.display = "none";
    contactsBtn.style.backgroundColor = "var(--text-color)";
    contactIcon.style.color = "var(--sidebar-color)";
    contactText.style.color = "var(--sidebar-color)";
    adjustSidebar2();
  }

  // Fetch and display the contacts list
  fetch(`/get-contacts?username=${username}`)
    .then((response) => response.json())
    .then((data) => {
      contactsList.innerHTML = ""; // Clear the previous list

      if (data.contacts.length === 0) {
        // Display a message if contacts list is empty
        var emptyMessage = document.createElement("li");
        emptyMessage.textContent = "Your contacts list is empty.";
        emptyMessage.style.fontStyle = "italic";
        contactsList.appendChild(emptyMessage);
      } else {
        data.contacts.forEach(function (contact) {
          var div1 = document.createElement("div");
          var profileImg = document.createElement("img");
          profileImg.src = contact.profilePic || "/uploads/default-avatar.png";
          var name = document.createElement("p");
          name.textContent = contact.username;
          div1.appendChild(profileImg);
          div1.appendChild(name);

          var div2 = document.createElement("div");
          div2.style.marginRight = "9px";
          var favoriteImg = document.createElement("img");
          favoriteImg.src = contact.isFavorite
            ? "https://res.cloudinary.com/dxseoqcpb/image/upload/v1728990835/base/kislo9bww6jfnvoagsgz.jpg"
            : "https://res.cloudinary.com/dxseoqcpb/image/upload/v1728990834/base/g9e7wjf9lc2gnqpizlsd.jpg";
          var deleteBtn = document.createElement("i");
          deleteBtn.className = "bx bxs-x-circle";
          deleteBtn.addEventListener("click", function () {
            removeContact(contact.username);
          });
          div2.appendChild(favoriteImg);
          div2.appendChild(deleteBtn);

          var div3 = document.createElement("div");
          div3.className = "contact_list";
          div3.appendChild(div1);
          div3.appendChild(div2);

          var li = document.createElement("li");
          li.style.marginTop = "30px";

          li.appendChild(div3);

          // Handle adding/removing from favorites
          favoriteImg.addEventListener("click", function () {
            if (contact.isFavorite) {
              removeFavorite(contact.username);
            } else {
              addFavorite(contact.username);
            }
          });

          contactsList.appendChild(li);
        });
      }
    })
    .catch((error) => console.error("Error fetching contacts:", error));
});

document.addEventListener("DOMContentLoaded", () => {
  contactsBtn.click();
});

function addFavorite(contactUsername) {
  fetch(`/add-favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      contactUsername: contactUsername,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(`${contactUsername} has been added to your favorites.`);
        contactsBtn.click(); // Refresh contacts
        favoriteBtn.click(); // Open favorites
        favoriteBtn.click(); // Close favorites to trigger refresh
      } else {
        alert("Failed to add to favorites.");
      }
    })
    .catch((error) => console.error("Error adding to favorites:", error));
}

function removeFavorite(contactUsername) {
  fetch(`/remove-favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      contactUsername: contactUsername,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(`${contactUsername} has been removed from your favorites.`);
        contactsBtn.click(); // Refresh contacts
        favoriteBtn.click(); // Open favorites
        favoriteBtn.click(); // Close favorites to trigger refresh
      } else {
        alert("Failed to remove from favorites.");
      }
    })
    .catch((error) => console.error("Error removing from favorites:", error));
}

// Function to remove contact
function removeContact(contactUsername) {
  fetch(`/remove-contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      contactUsername: contactUsername,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(`${contactUsername} has been removed from your contacts.`);
        contactsBtn.click(); // Simulate another click to refresh the list
      } else {
        alert("Failed to remove contact.");
      }
    })
    .catch((error) => console.error("Error removing contact:", error));
}

favoriteBtn.addEventListener("click", () => {
  document.getElementById("title").textContent = "FAVORITE";
  if (
    sidebar2.classList.contains("open") &
    (favoriteList.style.display === "block")
  ) {
    favoriteList.style.display = "none";
    sidebar2.classList.toggle("open");
    favoriteBtn.style.backgroundColor = "";
    favoriteIcon.style.color = "";
    favoriteText.style.color = "";
    adjustSidebar2(); // Adjust position of content
  } else if (
    sidebar2.classList.contains("open") &
    (contactsList.style.display === "block")
  ) {
    contactsList.style.display = "none";
    favoriteList.style.display = "block";
    favoriteBtn.style.backgroundColor = "var(--text-color)";
    favoriteIcon.style.color = "var(--sidebar-color)";
    favoriteText.style.color = "var(--sidebar-color";
    contactsBtn.style.backgroundColor = "";
    contactIcon.style.color = "";
    contactText.style.color = "";
    adjustSidebar2();
  } else {
    sidebar2.classList.toggle("open");
    contactsList.style.display = "none";
    favoriteList.style.display = "block";
    favoriteBtn.style.backgroundColor = "var(--text-color)";
    favoriteIcon.style.color = "var(--sidebar-color)";
    favoriteText.style.color = "var(--sidebar-color";
    adjustSidebar2();
  }

  // Fetch and display the favorites list
  fetch(`/get-contacts?username=${username}`)
    .then((response) => response.json())
    .then((data) => {
      favoriteList.innerHTML = ""; // Clear the previous list

      // Filter contacts to get favorites
      var favoriteContacts = data.contacts.filter(
        (contact) => contact.isFavorite
      );

      if (favoriteContacts.length === 0) {
        // Display a message if favorites list is empty
        var emptyMessage = document.createElement("li");
        emptyMessage.textContent = "Your favorites list is empty.";
        emptyMessage.style.fontStyle = "italic";
        favoriteList.appendChild(emptyMessage);
      } else {
        favoriteContacts.forEach(function (contact) {
          var div1 = document.createElement("div");
          div1.style.display = "flex";
          var profileImg = document.createElement("img");
          profileImg.src = contact.profilePic || "/uploads/default-avatar.png";
          var name = document.createElement("p");
          name.textContent = contact.username;
          div1.appendChild(profileImg);
          div1.appendChild(name);

          var unfavoriteBtn = document.createElement("img");
          unfavoriteBtn.src =
            "https://res.cloudinary.com/dxseoqcpb/image/upload/v1728990835/base/kislo9bww6jfnvoagsgz.jpg";
          unfavoriteBtn.style.cursor = "pointer";
          unfavoriteBtn.addEventListener("click", function () {
            removeFavorite(contact.username);
          });

          var div2 = document.createElement("div");
          div2.className = "favorite_list";
          div2.appendChild(unfavoriteBtn);
          div2.appendChild(div1);

          var li = document.createElement("li");
          li.appendChild(div2);
          li.style.marginTop = "30px";

          favoriteList.appendChild(li);
        });
      }
    })
    .catch((error) =>
      console.error("Error fetching favorite contacts:", error)
    );
});

function adjustSidebar2() {
  if (sidebar.classList.contains("close")) {
    sidebar2.style.left = "88px";
    document.querySelector(".home").style.left = sidebar2.classList.contains(
      "open"
    )
      ? "388px"
      : "88px";
    if (sidebar2.classList.contains("open")) {
      document.querySelector(".home").style.width = "calc(100% - 390px)";
    } else {
      document.querySelector(".home").style.width = "calc(100% - 88px)";
    }
  } else {
    sidebar2.style.left = "250px";
    document.querySelector(".home").style.left = sidebar2.classList.contains(
      "open"
    )
      ? "550px"
      : "250px";
    if (sidebar2.classList.contains("open")) {
      document.querySelector(".home").style.width = "calc(100% - 550px)";
      document.querySelector(".home").style.overflowX = "hidden";
    } else {
      document.querySelector(".home").style.width = "calc(100% - 250px)";
    }
  }
}

// Load the existing profile picture
const profilePicElement = document.getElementsByClassName("profile-pic");
fetch(`/get-user-profile?username=${username}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.profilePic) {
      profilePicElement[0].src = data.profilePic;
    } else {
      profilePicElement[0].src = "/uploads/default-avatar.png";
    }

    // Display the user's full name
    document.getElementsByClassName(
      "full-name"
    )[0].textContent = `${data.firstName} ${data.lastName}`;
  });

document.addEventListener("DOMContentLoaded", function () {
  var socket = io();
  const defaultProfilePicUrl =
    "https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/default-avatar.png";

  // Extract the username from the URL query parameter
  var urlParams = new URLSearchParams(window.location.search);
  var username = urlParams.get("username");
  var roomName = urlParams.get("room");

  document.getElementById('roomName').textContent = roomName.charAt(0).toUpperCase() + roomName.slice(1) + " Room";

  if (!username) {
    // If no username is found, redirect to sign-in page
    window.location.href = "/signin";
  } else {
    // Send the username to the server
    socket.emit("set username", username);

    // Join the specified room
    socket.emit("join room", roomName);
  }
  let oldestTimestamp = null;
  const input = document.getElementById("input");
  const emojiButton = document.getElementById("emoji-button");

  // Initialize the emoji picker
  const picker = new EmojiButton();
  console.log("Emoji picker initialized"); // Debugging statement

  // Toggle the emoji picker when the button is clicked
  emojiButton.addEventListener("click", () => {
    console.log("Emoji button clicked"); // Debugging statement
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
    console.log("EmojiButton:", picker);
  });


  // When an emoji is selected, add it to the input field
  picker.on("emoji", (emoji) => {
    console.log("Emoji selected:", emoji); // Debugging statement
    input.value += emoji;
  });

  // Send a message with the username
  var form = document.getElementById("form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const message = input.value;
    const imageInput = document.getElementById("image-input");
    const imageFile = imageInput.files[0];

    if (message || imageFile) {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("roomName", roomName);
      if (message) {
        formData.append("message", message);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (replyToMessage) {
        formData.append("replyTo", replyToMessage._id);
      }

      fetch("/upload-chat", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((err) => Promise.reject(err));
          }
          isFile = false;
          isReply = false;
          document.getElementById("image-input").value = "";
          document.getElementById("display-file").style.display = "none";
          document.getElementById("input").style.paddingTop = "10px";
          document.getElementById("emoji-button").style.paddingTop = "0";
          document.getElementById("emoji-button").style.marginTop = "0";
          document.getElementById("uploadFileBtn").style.marginTop = "0";
          document.getElementById("sendBtn").style.marginTop = "0";
          document.getElementById("message_container").style.height = "calc(100% - 150px)";
          setTimeout(() => {
            document.getElementById("message_container").scrollTop =
              document.getElementById("message_container").scrollHeight;
          }, 300);
          return response.json();
        })
        .then((data) => {
          input.value = "";
          imageInput.value = "";
          replyToMessage = null;
          document.getElementById("reply-preview").style.display = "none";
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
          alert(
            "Error: " +
              (error.message || "An error occurred while uploading the file.")
          );
        });
    }
  });

  // Function to convert URLs in messages into embedded content
  function autoEmbedMessage(message) {
    // Regex for detecting YouTube links
    const youtubeRegex =
      /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/;

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

  socket.on("chat message", function (msg) {
    console.log("Received message:", msg);
    const item = createMessageElement(msg);
    document.getElementById("messages").appendChild(item);
    document.getElementById("message_container").scrollTop =
      document.getElementById("message_container").scrollHeight;
  });

  // Client-side: Display chat history when joining a room
  socket.on("chat history", function (messages) {
    const messagesList = document.getElementById("messages");

    if (messages.length > 0) {
      oldestTimestamp = messages[0].timestamp;

      for (let i = 0; i < messages.length - 1; i++) {
        messagesList.appendChild(createMessageElement(messages[i]));

        // Insert a timeline if the date changes between consecutive messages
        if (createDate(messages[i].timestamp) !== createDate(messages[i + 1].timestamp)) {
          messagesList.appendChild(createTimeline(messages[i + 1]));
        }
      }

      // Append the last message in the list
      messagesList.appendChild(createMessageElement(messages[messages.length - 1]));

      // Scroll to the bottom after loading the chat history
      document.getElementById("message_container").scrollTop = document.getElementById("message_container").scrollHeight;
    }
  });


  function createTimeline(msg) {
    const item = document.createElement("li");
    const date = new Date(msg.timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    item.textContent = date;
    item.classList.add("timeline");
    return item;
  }

  function createDate (messageTimestamp) {
    const date = new Date(messageTimestamp);
    const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    return formattedDate;
  };

  
  function createMessageElement(msg) {
    const item = document.createElement("li");
    item.classList.add("message-item");
    item.dataset.messageId = msg._id;

    // Create a container for the profile image and message content
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container");

    // Create profile image element
    const profileImg = document.createElement("img");
    profileImg.src = msg.profilePic || defaultProfilePicUrl;
    profileImg.classList.add("profile-image");

    // Create a container for the message content
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("content-div");

    // Create timestamp element
    const timestamp = new Date(msg.timestamp).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    const timestampSpan = document.createElement("span");
    timestampSpan.textContent = timestamp;
    timestampSpan.classList.add("timestamp");

    // Create username element
    const usernameSpan = document.createElement("strong");
    usernameSpan.textContent = msg.username + " ";
    usernameSpan.style.paddingLeft = '7px';

    // Create a group for message and button
    const div1 = document.createElement("div");
    div1.classList.add("messageAndButton");
    div1.style.display = 'flex';

    // Use the autoEmbedMessage function to process the message
    const content = autoEmbedMessage(msg.message);

    // Create message content element
    const messageSpan = document.createElement("p");
    messageSpan.classList = 'messageSpan';
    messageSpan.innerHTML = content;
    messageSpan.style.padding = '7px';
    messageSpan.style.borderRadius = '12px';
    messageSpan.style.border = '0.5px solid #ccc';
    messageSpan.style.backgroundColor = 'white';
    messageSpan.style.color = 'black';
    messageSpan.style.width = 'fit-content';
    div1.appendChild(messageSpan);

    // Append elements to contentDiv
    contentDiv.appendChild(usernameSpan);
    contentDiv.appendChild(timestampSpan);
    contentDiv.appendChild(div1);

    // If the message is a reply, display the quoted message
    if (msg.replyToMessage) {
      const replyDiv = document.createElement("div");
      replyDiv.classList.add("reply-message");

      const replyUsername = document.createElement("strong");
      replyUsername.textContent = msg.replyToMessage.username + ": ";

      const replyContent = document.createElement("span");
      replyContent.textContent =
        msg.replyToMessage.message || msg.replyToMessage.fileName || "[File]";
      replyContent.classList.add('replyContent');

      replyDiv.appendChild(replyUsername);
      replyDiv.appendChild(replyContent);

      contentDiv.insertBefore(replyDiv, contentDiv.firstChild);
    }

    if (msg.edited) {
      const editedTag = document.createElement("span");
      editedTag.classList.add("edited-tag");
      editedTag.textContent = " (edited)";
      messageSpan.appendChild(editedTag);
    }

    // Append profile image and contentDiv to messageContainer
    messageContainer.appendChild(profileImg);
    messageContainer.appendChild(contentDiv);

    // Add Edit Button if the message belongs to the current user
    if (msg.username === username && !msg.fileUrl) {
      const editButton = document.createElement("button");
      editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
      editButton.classList.add("edit-button");

      // Add event listener for editing
      editButton.addEventListener("click", () => {
        editMessage(msg);
      });

      // Append editButton to group for message and button (div1)
      div1.appendChild(editButton);
    }

    // Add Delete Button if the message belongs to the current user
    if (msg.username == username){
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = "<i class='bx bx-trash' ></i>";
      deleteButton.classList.add('delete-button');

      // Add event listener for deleting
      deleteButton.addEventListener('click', () => {
        deleteMessage(msg._id, item);
      });

      // Append deleteButton to message and button (div1)
      div1.appendChild(deleteButton);
    }

    // **Add a Reply button**
    const replyButton = document.createElement("button");
    replyButton.innerHTML = '<i class="fas fa-reply"></i>';
    replyButton.classList.add("reply-button");

    // Add Reaction Button
    const reactionButton = document.createElement("button");
    reactionButton.innerHTML = '<i class="fa-regular fa-face-smile"></i>'; // This can be a generic emoji to open the picker
    reactionButton.classList.add("reaction-button");

    const pickerReaction = new EmojiButton();
    // Event listener for adding reactions
    reactionButton.addEventListener("click", () => {
      pickerReaction.showPicker(reactionButton); // Show emoji picker when clicked
      pickerReaction.on("emoji", (emoji) => {
        // Emit the reaction to the server without adding it as a new message
        socket.emit("add reaction", {
          messageId: msg._id,
          emoji: emoji,
          roomName,
        });

        // Update the UI with the selected emoji right under the message
        let reactionSpan = Array.from(reactionsDiv.children).find((p) =>
          p.textContent.startsWith(emoji)
        );

        if (reactionSpan) {
          const currentCount =
            parseInt(reactionSpan.getAttribute("data-count")) || 0;
          reactionSpan.setAttribute("data-count", currentCount + 1);
          reactionSpan.textContent = `${emoji} (${currentCount + 1})`;
        } else {
          const newReactionSpan = document.createElement("p");
          newReactionSpan.textContent = `${emoji} (1)`;
          newReactionSpan.setAttribute("data-count", 1);
          reactionsDiv.appendChild(newReactionSpan);
        }
      });
    });

    // Append reaction button to message and button (div1)
    div1.appendChild(reactionButton);

    // Display reactions under the message
    const reactionsDiv = document.createElement("div");
    reactionsDiv.classList.add("reactions");
    msg.reactions?.forEach((reaction) => {
      const reactionSpan = document.createElement("p");
      reactionSpan.textContent = `${reaction.emoji} (${reaction.count})`;
      reactionsDiv.appendChild(reactionSpan);
    });
    contentDiv.appendChild(reactionsDiv);

    // Add event listener for replying
    replyButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent triggering any parent event handlers
      setReplyToMessage(msg);
    });

    // Append replyButton to message and button (div1)
    div1.appendChild(replyButton);

    // Append messageContainer to item
    item.appendChild(messageContainer);

    // If there's a file in the message
    if (msg.fileUrl) {
      let fileElement;

      if (msg.fileType.startsWith("image/")) {
        // Display image
        fileElement = document.createElement("img");
        fileElement.src = msg.fileUrl;
        fileElement.style.maxWidth = "200px";
        fileElement.style.display = "block";
        messageSpan.appendChild(fileElement);
        messageSpan.style.backgroundColor = "";
        messageSpan.style.border = "none";
      } else if (
        [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(msg.fileType)
      ) {
        // Display file link with file name
        fileElement = document.createElement("a");
        fileElement.href = msg.fileUrl;
        fileElement.textContent = msg.fileName || "View File";
        fileElement.target = "_blank";
        fileElement.style.textDecoration = 'none';

        // Create a file image
        const fileImage = document.createElement('p');
        fileImage.innerHTML = "<i class='bx bxs-file'></i>";
        fileImage.style.margin = 'auto';

        // Create download button
        const downloadButton = document.createElement("a");
        downloadButton.href = msg.fileUrl;
        downloadButton.download = msg.fileName || "file";
        downloadButton.innerHTML = "⬇";
        downloadButton.style.marginLeft = "10px";
        downloadButton.style.cursor = "pointer";
        downloadButton.style.color = "blue";

        // Append file link and download button
        messageSpan.appendChild(fileImage);
        messageSpan.appendChild(fileElement);
        messageSpan.appendChild(downloadButton);
        messageSpan.style.display = 'flex';
      } else {
        // Handle other types
        fileElement = document.createElement("span");
        fileElement.textContent = "Unsupported file type.";
        contentDiv.appendChild(fileElement);
      }
      
    }

    return item;
  }

  let replyToMessage = null;

  function setReplyToMessage(msg) {
    isReply = true;
    replyToMessage = msg;

    // Update the reply message to reflect the latest edited content
    const updatedMessageContent = msg.message;

    // Display the quoted message
    const replyPreview = document.getElementById('reply-preview');
    replyPreview.innerHTML = `
        <div style="display: flex; font-size: 14px; gap: 5px;">
          <i class="fas fa-reply"></i> 
          <p> Replying to <strong>${msg.username}</strong> </p>
          <button type="button" id="cancel-reply"><i class="bx bxs-x-circle" style="font-size:16px;"></i></button>
        </div>
        <p style="display:block; padding-right: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${msg.message || msg.fileName || ''}</p>
    `;
    document.getElementById("input").style.paddingTop = "75px";
    document.getElementById("emoji-button").style.marginTop = "65px";
    document.getElementById("uploadFileBtn").style.marginTop = "65px";
    document.getElementById("sendBtn").style.marginTop = "65px";
    document.getElementById("message_container").style.height = "calc(100% - 215px)";
    document.getElementById("message_container").scrollTop =
    document.getElementById("message_container").scrollHeight;
    replyPreview.style.display = 'block';
    if (isFile) {
      document.getElementById("display-file").style.marginTop = "70px";
      document.getElementById("input").style.paddingTop = "125px";
      document.getElementById("emoji-button").style.marginTop = "115px";
      document.getElementById("uploadFileBtn").style.marginTop = "115px";
      document.getElementById("sendBtn").style.marginTop = "115px";
      document.getElementById("message_container").style.height = "calc(100% - 265px)";
      document.getElementById("message_container").scrollTop =
      document.getElementById("message_container").scrollHeight;
    }
    // Handle cancel reply
    document.getElementById("cancel-reply").addEventListener("click", () => {
      replyToMessage = null;
      isReply = false;
      document.getElementById("input").style.paddingTop = "10px";
      document.getElementById("emoji-button").style.marginTop = "0";
      document.getElementById("uploadFileBtn").style.marginTop = "0";
      document.getElementById("sendBtn").style.marginTop = "0";
      document.getElementById("message_container").style.height = "calc(100% - 150px)";
      replyPreview.style.display = 'none';
      if (isFile) {
        document.getElementById("display-file").style.marginTop = "10px";
        document.getElementById("input").style.paddingTop = "65px";
        document.getElementById("emoji-button").style.marginTop = "55px";
        document.getElementById("uploadFileBtn").style.marginTop = "55px";
        document.getElementById("sendBtn").style.marginTop = "55px";
        document.getElementById("message_container").style.height = "calc(100% - 205px)";
        document.getElementById("message_container").scrollTop =
        document.getElementById("message_container").scrollHeight;
      }
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
    const contentDiv = item.querySelector(".content-div");
    const message = item.querySelector(".messageSpan");
    const messageAndButton = item.querySelector(".messageAndButton");
    const reaction = item.querySelector(".reactions");
     
    // Replace the message content with an input field for editing
    const editTextarea = document.createElement("textarea");
    editTextarea.value = msg.message;
    editTextarea.classList.add("edit-textarea");
    

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("save-button");

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.classList.add("cancel-button");

    const buttonGroup = document.createElement("div");
    buttonGroup.style.alignSelf = "flex-end";
    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(saveButton);
    
    // Event listener for saving the edited message
    saveButton.addEventListener("click", () => {
      const newContent = editTextarea.value;

      // Emit the edited message to the server
      socket.emit("edit message", { messageId: msg._id, newContent, roomName });

      // Update msg.message with the new content
      msg.message = newContent;

      // Replace the input field with the updated message content
      message.textContent = newContent;

      contentDiv.removeChild(editContainer);
      messageAndButton.style.display = "flex";
      reaction.style.display = "ruby";

      const editedTag = document.createElement("span");
      editedTag.classList.add("edited-tag");
      editedTag.textContent = " (edited)";
      editedTag.style.fontStyle = "italic";
      message.appendChild(editedTag);
    });

    // Cancel button functionality
    cancelButton.addEventListener("click", () => {
      messageAndButton.style.display = "flex";
      reaction.style.display = "ruby";
      contentDiv.removeChild(editContainer);
    });

    // Group the textarea and buttonGroup
    const editContainer = document.createElement("div");
    editContainer.classList.add("edit-container");
    editContainer.appendChild(editTextarea);
    editContainer.appendChild(buttonGroup);

    // Hide the (message and button) and reaction
    messageAndButton.style.display = "none";
    reaction.style.display = "none";
    
    // Add editContainer into contentDiv
    contentDiv.appendChild(editContainer);
    contentDiv.style.width = "100%";

    // Adjust the height based on content
    editTextarea.style.height = `${editTextarea.scrollHeight}px`;
  }

  socket.on("message edited", ({ messageId, newContent }) => {
    const item = document.querySelector(`[data-message-id="${messageId}"]`);
    if (item) {
      const contentDiv = item.querySelector(".content-div");

      // Update the message content
      // const messageSpan = contentDiv.querySelector(".message-content");
      // messageSpan.textContent = newContent;

      // Add '(edited)' tag if not already present
      if (!contentDiv.querySelector(".edited-tag")) {
        const editedTag = document.createElement("span");
        editedTag.classList.add("edited-tag");
        editedTag.textContent = " (edited)";
        contentDiv.appendChild(editedTag);
      }
    }
  });

  socket.on("reaction added", function ({ messageId, emoji, count }) {
    const messageItem = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (messageItem) {
      const reactionsDiv = messageItem.querySelector(".reactions");
      let reactionSpan = Array.from(reactionsDiv.children).find((span) =>
        span.textContent.startsWith(emoji)
      );

      if (reactionSpan) {
        reactionSpan.textContent = `${emoji} (${count})`;
      } else {
        const newReactionSpan = document.createElement("span");
        newReactionSpan.textContent = `${emoji} (${count})`;
        reactionsDiv.appendChild(newReactionSpan);
      }
    }
  });

  socket.on("more chat history", function (messages) {
    const messagesList = document.getElementById("messages");
    const previousScrollHeight = document.getElementById("message_container").scrollHeight;
  
    if (messages.length > 0) {
      // Make sure insert the timeline when the earliestTime of this history is not the same with the oldestTime of old history
      const oldestTimestampLastHistory = oldestTimestamp
      const ealiestTimeStamp = messages[messages.length - 1].timestamp;
      if (createDate(oldestTimestampLastHistory) != createDate(ealiestTimeStamp)) {
        const item = document.createElement("li");
        const date = new Date(oldestTimestampLastHistory).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        item.textContent = date;
        item.classList.add("timeline");
        messagesList.insertBefore(item, messagesList.firstChild);
      }

      // Update oldestTimestamp
      oldestTimestamp = messages[0].timestamp;

      // Insert messages in reverse order to keep them chronological
      for (let i = messages.length - 1; i >= 0; i--) {
        const currentMessage = messages[i];
        const previousMessage = messages[i - 1];
  
        // Insert the message element at the beginning of the list
        messagesList.insertBefore(createMessageElement(currentMessage), messagesList.firstChild);
  
        // Insert timeline if there's a date change between messages
        if (previousMessage && createDate(currentMessage.timestamp) !== createDate(previousMessage.timestamp)) {
          messagesList.insertBefore(createTimeline(currentMessage), messagesList.firstChild);
        }
      }
      console.log(messages.length)
  
      // Adjust scroll position to keep view stable
      document.getElementById("message_container").scrollTop =
        document.getElementById("message_container").scrollHeight - previousScrollHeight;
    } 
  });

  // Track if the timeline has been added already
  let timelineInserted = false;
  // Insert the timeline when there is no more history
  socket.on("no more history", function () {
    if (!timelineInserted) { // Check if the timeline was already added
      const messagesList = document.getElementById("messages");
      const item = document.createElement("li");
      const date = new Date(oldestTimestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      item.textContent = date;
      item.classList.add("timeline");
      messagesList.insertBefore(item, messagesList.firstChild);

      // Set the flag to true so this code only runs once
      timelineInserted = true;
    }
  });

  // Scroll up to load more messages
  document
    .getElementById("message_container")
    .addEventListener("scroll", function () {
      if (
        document.getElementById("message_container").scrollTop === 0 &&
        oldestTimestamp
      ) {
        socket.emit("load more messages", {
          roomName: roomName,
          lastTimestamp: oldestTimestamp,
        });
      }
    });

  // Typing indicator
  input.addEventListener("input", function () {
    socket.emit("typing", username);
  });

  socket.on("typing", function (username) {
    document.getElementById("typing").textContent = username + " is typing...";
  });

  socket.on("stop typing", function () {
    document.getElementById("typing").textContent = "";
  });

  // Receive and display the user list
  socket.on("user list", function (users) {
    var usersList = document.getElementById("users");
    usersList.innerHTML = ""; // Clear the current list
    users.forEach(function (user) {
        // Check if the user is already in the list
        const existingUser = Array.from(usersList.children).find(item => {
          const spans = item.querySelectorAll("div > span");
          return spans[1]?.textContent === user.username; // Compare with the second span for the username
      });
        
        // If the user is already listed, skip to the next user
        if (existingUser) return;

        var item = document.createElement("li"); // Create a list item for each user
        item.classList.add("users")
        item.style.display = "flex";

        // Create the profile picture element
        const profileImg = document.createElement("img");
        profileImg.src = user.profilePic || "/uploads/default-avatar.png"; // Use default avatar if no profile pic
        profileImg.style.width = "40px";
        profileImg.style.height = "40px";
        profileImg.style.borderRadius = "50%";
        profileImg.style.border = "0.5px solid #ccc";

        // Create the username element
        const text = document.createElement("span");
        text.textContent = user.username || "Unknown User"; // Display 'Unknown User' if username is missing
        text.style.margin = "auto 0";
        text.style.width = "180px";
        text.style.fontSize = "14px";
        text.style.overflow = "hidden";
        text.style.textOverflow = "ellipsis";
        text.style.fontStyle = 'italic';

        // Create the firstname + lastname element
        const name = document.createElement("span");
        name.textContent = user.firstName + " " + user.lastName || "Unknown User";
        name.style.margin = "auto 0";
        name.style.width = "180px";
        name.style.fontSize = "16px";
        name.style.overflow = "hidden";
        name.style.textOverflow = "ellipsis";
        name.style.display = 'block';
        name.style.fontWeight = '600';

        // Group name and username
        const group = document.createElement("div");
        group.style.lineHeight = 1;
        group.style.margin = 'auto 10px';
        group.appendChild(name);
        group.appendChild(text);

        // Append the profile picture and username to the list item
        item.appendChild(profileImg);
        item.appendChild(group);

        // Append the list item to the users list
        usersList.appendChild(item);

        item.addEventListener("click", function() {
          viewUserProfile(user.username);
        });
    });
});
});

let isFile = false;
function getFile(input) {
  isFile = true;
  const fileName = input.replace(/^.*\\/, "");
  document.getElementById("file-name").textContent = fileName;
  document.getElementById("display-file").style.display = "inline-flex";
  document.getElementById("input").style.paddingTop = "65px";
  document.getElementById("emoji-button").style.marginTop = "55px";
  document.getElementById("uploadFileBtn").style.marginTop = "55px";
  document.getElementById("sendBtn").style.marginTop = "55px";
  document.getElementById("message_container").style.height = "calc(100% - 205px)";
  document.getElementById("message_container").scrollTop =
    document.getElementById("message_container").scrollHeight;
  if (document.getElementById("file-name").textContent == "") {
    isFile = false;
    document.getElementById("display-file").style.display = "none";
    document.getElementById("input").style.paddingTop = "10px";
    document.getElementById("emoji-button").style.marginTop = "0";
    document.getElementById("uploadFileBtn").style.marginTop = "0";
    document.getElementById("sendBtn").style.marginTop = "0";
    document.getElementById("message_container").style.height = "calc(100% - 150px)";
    if (isReply) {
      document.getElementById("display-file").style.marginTop = "10px";
      document.getElementById("input").style.paddingTop = "75px";
      document.getElementById("emoji-button").style.marginTop = "65px";
      document.getElementById("uploadFileBtn").style.marginTop = "65px";
      document.getElementById("sendBtn").style.marginTop = "65px";
      document.getElementById("message_container").style.height = "calc(100% - 215px)";
      document.getElementById("message_container").scrollTop =
      document.getElementById("message_container").scrollHeight;
      return;
    }
  }
  if (isReply) {
    document.getElementById("display-file").style.marginTop = "70px";
    document.getElementById("input").style.paddingTop = "125px";
    document.getElementById("emoji-button").style.marginTop = "115px";
    document.getElementById("uploadFileBtn").style.marginTop = "115px";
    document.getElementById("sendBtn").style.marginTop = "115px";
    document.getElementById("message_container").style.height = "calc(100% - 265px)";
    document.getElementById("message_container").scrollTop =
    document.getElementById("message_container").scrollHeight;
  } 
}

function cancelFileUpload() {
  isFile = false;
  document.getElementById("image-input").value = "";
  document.getElementById("display-file").style.display = "none";
  document.getElementById("input").style.paddingTop = "10px";
  document.getElementById("emoji-button").style.marginTop = "0";
  document.getElementById("uploadFileBtn").style.marginTop = "0";
  document.getElementById("sendBtn").style.marginTop = "0";
  document.getElementById("message_container").style.height = "calc(100% - 150px)";
  if (isReply) {
    document.getElementById("display-file").style.marginTop = "10px";
    document.getElementById("input").style.paddingTop = "75px";
    document.getElementById("emoji-button").style.marginTop = "65px";
    document.getElementById("uploadFileBtn").style.marginTop = "65px";
    document.getElementById("sendBtn").style.marginTop = "65px";
    document.getElementById("message_container").style.height = "calc(100% - 215px)";
    document.getElementById("message_container").scrollTop =
    document.getElementById("message_container").scrollHeight;
  }
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

        const social_media = document.getElementById('social_media');
        if (data.connectedAccounts.youtube) {
          // Create a link element
          const youtubeLink = document.createElement('a');
          youtubeLink.href = data.connectedAccounts.youtube; // Set the YouTube link
          youtubeLink.target = "_blank"; // Open the link in a new tab
      
          // Create the image element
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptNC40NDEgMTYuODkyYy0yLjEwMi4xNDQtNi43ODQuMTQ0LTguODgzIDAtMi4yNzYtLjE1Ni0yLjU0MS0xLjI3LTIuNTU4LTQuODkyLjAxNy0zLjYyOS4yODUtNC43MzYgMi41NTgtNC44OTIgMi4wOTktLjE0NCA2Ljc4Mi0uMTQ0IDguODgzIDAgMi4yNzcuMTU2IDIuNTQxIDEuMjcgMi41NTkgNC44OTItLjAxOCAzLjYyOS0uMjg1IDQuNzM2LTIuNTU5IDQuODkyem0tNi40NDEtNy4yMzRsNC45MTcgMi4zMzgtNC45MTcgMi4zNDZ2LTQuNjg0eiIvPjwvc3ZnPg==';
      
          // Append the image inside the link element
          youtubeLink.appendChild(iconImg);
      
          // Append the link to the social media container
          social_media.appendChild(youtubeLink);
        } 
        
        if (data.connectedAccounts.twitch) {
          // Create a link element
          const twitchLink = document.createElement('a');
          twitchLink.href = data.connectedAccounts.twitch;
          twitchLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTAuMjI0IDE3LjgwNmwxLjc3Ni0xLjc3NmgzLjM0M2wyLjA5LTIuMDl2LTYuNjg2aC0xMC4wM3Y4Ljc3NmgyLjgyMXYxLjc3NnptMy44NjYtOC4xNDloMS4yNTR2My42NTNoLTEuMjU0di0zLjY1M3ptLTMuMzQ0IDBoMS4yNTR2My42NTNoLTEuMjU0di0zLjY1M3ptMS4yNTQtOS42NTdjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bTYuNjg3IDE0LjU2N2wtMy42NTcgMy42NTdoLTIuNzE2bC0xLjc3NyAxLjc3NmgtMS44OHYtMS43NzZoLTMuMzQ0di05LjgyMWwuOTQxLTIuNDAzaDEyLjQzM3Y4LjU2N3oiLz48L3N2Zz4=';

          // Append the image inside the link element
          twitchLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(twitchLink);
        }

        if (data.connectedAccounts.twitter) {
          // Create a link element
          const twitterLink = document.createElement('a');
          twitterLink.href = data.connectedAccounts.twitch;
          twitterLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730918882/twitter_1_wiijlx.png';

          // Append the image inside the link element
          twitterLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(twitterLink);
        }

        if (data.connectedAccounts.instagram) {
          // Create a link element
          const instagramLink = document.createElement('a');
          instagramLink.href = data.connectedAccounts.twitch;
          instagramLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQuODI5IDYuMzAyYy0uNzM4LS4wMzQtLjk2LS4wNC0yLjgyOS0uMDRzLTIuMDkuMDA3LTIuODI4LjA0Yy0xLjg5OS4wODctMi43ODMuOTg2LTIuODcgMi44Ny0uMDMzLjczOC0uMDQxLjk1OS0uMDQxIDIuODI4cy4wMDggMi4wOS4wNDEgMi44MjljLjA4NyAxLjg3OS45NjcgMi43ODMgMi44NyAyLjg3LjczNy4wMzMuOTU5LjA0MSAyLjgyOC4wNDEgMS44NyAwIDIuMDkxLS4wMDcgMi44MjktLjA0MSAxLjg5OS0uMDg2IDIuNzgyLS45ODggMi44Ny0yLjg3LjAzMy0uNzM4LjA0LS45Ni4wNC0yLjgyOXMtLjAwNy0yLjA5LS4wNC0yLjgyOGMtLjA4OC0xLjg4My0uOTczLTIuNzgzLTIuODctMi44N3ptLTIuODI5IDkuMjkzYy0xLjk4NSAwLTMuNTk1LTEuNjA5LTMuNTk1LTMuNTk1IDAtMS45ODUgMS42MS0zLjU5NCAzLjU5NS0zLjU5NHMzLjU5NSAxLjYwOSAzLjU5NSAzLjU5NGMwIDEuOTg1LTEuNjEgMy41OTUtMy41OTUgMy41OTV6bTMuNzM3LTYuNDkxYy0uNDY0IDAtLjg0LS4zNzYtLjg0LS44NCAwLS40NjQuMzc2LS44NC44NC0uODQuNDY0IDAgLjg0LjM3Ni44NC44NCAwIC40NjMtLjM3Ni44NC0uODQuODR6bS0xLjQwNCAyLjg5NmMwIDEuMjg5LTEuMDQ1IDIuMzMzLTIuMzMzIDIuMzMzcy0yLjMzMy0xLjA0NC0yLjMzMy0yLjMzM2MwLTEuMjg5IDEuMDQ1LTIuMzMzIDIuMzMzLTIuMzMzczIuMzMzIDEuMDQ0IDIuMzMzIDIuMzMzem0tMi4zMzMtMTJjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bTYuOTU4IDE0Ljg4NmMtLjExNSAyLjU0NS0xLjUzMiAzLjk1NS00LjA3MSA0LjA3Mi0uNzQ3LjAzNC0uOTg2LjA0Mi0yLjg4Ny4wNDJzLTIuMTM5LS4wMDgtMi44ODYtLjA0MmMtMi41NDQtLjExNy0zLjk1NS0xLjUyOS00LjA3Mi00LjA3Mi0uMDM0LS43NDYtLjA0Mi0uOTg1LS4wNDItMi44ODYgMC0xLjkwMS4wMDgtMi4xMzkuMDQyLTIuODg2LjExNy0yLjU0NCAxLjUyOS0zLjk1NSA0LjA3Mi00LjA3MS43NDctLjAzNS45ODUtLjA0MyAyLjg4Ni0uMDQzczIuMTQuMDA4IDIuODg3LjA0M2MyLjU0NS4xMTcgMy45NTcgMS41MzIgNC4wNzEgNC4wNzEuMDM0Ljc0Ny4wNDIuOTg1LjA0MiAyLjg4NiAwIDEuOTAxLS4wMDggMi4xNC0uMDQyIDIuODg2eiIvPjwvc3ZnPg==';

          // Append the image inside the link element
          instagramLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(instagramLink);
        }

        if (data.connectedAccounts.tiktok) {
          // Create a link element
          const tiktokLink = document.createElement('a');
          tiktokLink.href = data.connectedAccounts.twitch;
          tiktokLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730918291/tiktok_qipjuq.png';

          // Append the image inside the link element
          tiktokLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(tiktokLink);
        }

        if (data.connectedAccounts.whatsapp) {
          // Create a link element
          const whatsappLink = document.createElement('a');
          whatsappLink.href = data.connectedAccounts.twitch;
          whatsappLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIuMDMxIDYuMTcyYy0zLjE4MSAwLTUuNzY3IDIuNTg2LTUuNzY4IDUuNzY2LS4wMDEgMS4yOTguMzggMi4yNyAxLjAxOSAzLjI4N2wtLjU4MiAyLjEyOCAyLjE4Mi0uNTczYy45NzguNTggMS45MTEuOTI4IDMuMTQ1LjkyOSAzLjE3OCAwIDUuNzY3LTIuNTg3IDUuNzY4LTUuNzY2LjAwMS0zLjE4Ny0yLjU3NS01Ljc3LTUuNzY0LTUuNzcxem0zLjM5MiA4LjI0NGMtLjE0NC40MDUtLjgzNy43NzQtMS4xNy44MjQtLjI5OS4wNDUtLjY3Ny4wNjMtMS4wOTItLjA2OS0uMjUyLS4wOC0uNTc1LS4xODctLjk4OC0uMzY1LTEuNzM5LS43NTEtMi44NzQtMi41MDItMi45NjEtMi42MTctLjA4Ny0uMTE2LS43MDgtLjk0LS43MDgtMS43OTNzLjQ0OC0xLjI3My42MDctMS40NDZjLjE1OS0uMTczLjM0Ni0uMjE3LjQ2Mi0uMjE3bC4zMzIuMDA2Yy4xMDYuMDA1LjI0OS0uMDQuMzkuMjk4LjE0NC4zNDcuNDkxIDEuMi41MzQgMS4yODcuMDQzLjA4Ny4wNzIuMTg4LjAxNC4zMDQtLjA1OC4xMTYtLjA4Ny4xODgtLjE3My4yODlsLS4yNi4zMDRjLS4wODcuMDg2LS4xNzcuMTgtLjA3Ni4zNTQuMTAxLjE3NC40NDkuNzQxLjk2NCAxLjIwMS42NjIuNTkxIDEuMjIxLjc3NCAxLjM5NC44NnMuMjc0LjA3Mi4zNzYtLjA0M2MuMTAxLS4xMTYuNDMzLS41MDYuNTQ5LS42OC4xMTYtLjE3My4yMzEtLjE0NS4zOS0uMDg3czEuMDExLjQ3NyAxLjE4NC41NjQuMjg5LjEzLjMzMi4yMDJjLjA0NS4wNzIuMDQ1LjQxOS0uMS44MjR6bS0zLjQyMy0xNC40MTZjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bS4wMjkgMTguODhjLTEuMTYxIDAtMi4zMDUtLjI5Mi0zLjMxOC0uODQ0bC0zLjY3Ny45NjQuOTg0LTMuNTk1Yy0uNjA3LTEuMDUyLS45MjctMi4yNDYtLjkyNi0zLjQ2OC4wMDEtMy44MjUgMy4xMTMtNi45MzcgNi45MzctNi45MzcgMS44NTYuMDAxIDMuNTk4LjcyMyA0LjkwNyAyLjAzNCAxLjMxIDEuMzExIDIuMDMxIDMuMDU0IDIuMDMgNC45MDgtLjAwMSAzLjgyNS0zLjExMyA2LjkzOC02LjkzNyA2LjkzOHoiLz48L3N2Zz4=';

          // Append the image inside the link element
          whatsappLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(whatsappLink);
        }

        if (data.connectedAccounts.snapchat) {
          // Create a link element
          const snapchatLink = document.createElement('a');
          snapchatLink.href = data.connectedAccounts.twitch;
          snapchatLink.target = "_blank";

          // Create the image elemment
          const iconImg = document.createElement('img');
          iconImg.classList.add("iconImg");
          iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptNS4xMjYgMTYuNDc1Yy0uMDU3LjA3Ny0uMTAzLjQtLjE3OC42NTUtLjA4Ni4yOTUtLjM1Ni4yNjItLjY1Ni4yMDMtLjQzNy0uMDg1LS44MjctLjEwOS0xLjI4MS0uMDM0LS43ODUuMTMxLTEuNjAxIDEuMjkyLTIuOTY5IDEuMjkyLTEuNDcyIDAtMi4yMzgtMS4xNTYtMy4wNTQtMS4yOTItLjgzMi0uMTM4LTEuMzEuMDg0LTEuNTk3LjA4NC0uMjIxIDAtLjMwNy0uMTM1LS4zNC0uMjQ3LS4wNzQtLjI1MS0uMTItLjU4MS0uMTc4LS42Ni0uNTY1LS4wODctMS44NC0uMzA5LTEuODczLS44NzgtLjAwOC0uMTQ4LjA5Ni0uMjc5LjI0My0uMzAzIDEuODcyLS4zMDggMy4wNjMtMi40MTkgMi44NjktMi44NzctLjEzOC0uMzI1LS43MzUtLjQ0Mi0uOTg2LS41NDEtLjY0OC0uMjU2LS43MzktLjU1LS43LS43NTIuMDUzLS4yOC4zOTUtLjQ2OC42OC0uNDY4LjI3NSAwIC43Ni4zNjcgMS4xMzguMTU4LS4wNTUtLjk4Mi0uMTk0LTIuMzg3LjE1Ni0zLjE3MS42NjctMS40OTYgMi4xMjktMi4yMzYgMy41OTItMi4yMzYgMS40NzMgMCAyLjk0Ni43NSAzLjYwOCAyLjIzNS4zNDkuNzgzLjIxMiAyLjE4MS4xNTYgMy4xNzIuMzU3LjE5Ny43OTktLjE2NyAxLjEwNy0uMTY3LjMwMiAwIC43MTIuMjA0LjcxOS41NDUuMDA1LjI2Ny0uMjMzLjQ5Ny0uNzA4LjY4NC0uMjU1LjEwMS0uODQ4LjIxNy0uOTg2LjU0MS0uMTk4LjQ2OCAxLjAzIDIuNTczIDIuODY5IDIuODc2LjE0Ni4wMjQuMjUxLjE1NC4yNDMuMzAzLS4wMzMuNTY5LTEuMzE0Ljc5MS0xLjg3NC44Nzh6Ii8+PC9zdmc+';

          // Append the image inside the link element
          snapchatLink.appendChild(iconImg);

          // Append the link to the social media container
          social_media.appendChild(snapchatLink);
        }

        // Display the modal
        document.getElementById('profileModal').style.display = 'block';
      } else {
        alert('Failed to load profile.');
      }
    })
    .catch(error => console.error('Error fetching profile:', error));
}

// Close the profile modal when clicking x
var profileModal = document.getElementById('profileModal');
var profileClose = document.getElementsByClassName('closeBtn')[0];
profileClose.onclick = function() {
  profileModal.style.display = 'none';
  document.getElementById('social_media').innerHTML = "";
};

// When the user clicks anywhere outside of any modal, close it
window.onclick = function(event) {
  if (event.target == profileModal) {
    profileModal.style.display = 'none';
    document.getElementById('social_media').innerHTML = "";
  }
};
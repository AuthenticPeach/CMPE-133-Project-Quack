const socket = io();

const body = document.querySelector("body"),
  sidebar = body.querySelector("nav"),
  sidebar2 = document.querySelector(".sidebar2"),
  toggle = body.querySelector(".toggle"),
  contactsBtn = document.querySelectorAll(".contact-btn"),
  contactIcon = document.querySelectorAll(".bxs-contact"),
  contactText = document.querySelectorAll(".contactText"),
  favoriteBtn = document.querySelectorAll(".favorite-btn"),
  favoriteIcon = document.querySelectorAll(".bx-heart"),
  favoriteText = document.querySelectorAll(".favoriteText"),
  contactsList = document.getElementsByClassName("contactList")[0],
  favoriteList = document.getElementsByClassName("favoriteList")[0],
  profilePicElement = document.getElementsByClassName("profile-pic");

let userData = {};
const homeElement = document.getElementsByClassName('home')[0];
const username = localStorage.getItem("username");

// Element for Seting Modal
const settingsBtn = document.querySelectorAll(".settings-btn");
const settingsModal = document.getElementById("settingsModal");
const backgroundImg = document.getElementById("backgroundImg");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const backgroundPreview = document.getElementById("backgroundPreview");
const uploadBackgroundForm = document.getElementById("upload-background-form");
const backgroundMessage = document.getElementById("background-message");
resetBackgroundBtn.addEventListener("click", resetBackground);

// Redirect to the sign-in page if the username is not found
if (!username) {
    window.location.href = "/signin";
} else {
  socket.emit('set username', username);
}

// Open settings modal
// Open the modal when settings button is clicked
settingsBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("menu_bar").checked = false;
    settingsModal.style.display = "block";
  });
});
  
// Close the modal when the close button (×) is clicked
const closeSettingsModal = document.getElementsByClassName("closeBtn")[0];
closeSettingsModal.onclick = function () {
  backgroundMessage.textContent = "";
  settingsModal.style.display = "none";
  backgroundPreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
  backgroundImg.value = "";
  saveSettingsBtn.style.display = "none";
};

function resetBackground() {
  const confirmation = confirm("Are you sure you want to reset the background to the default image?");
  
  if (!confirmation) {
    return; // Exit the function if the user cancels
  }

  const backgroundImg = "https://res.cloudinary.com/dxseoqcpb/image/upload/v1729122093/base/t2laawx0hmk39czdqqgk.png"

  // Send data to the server
  fetch("/reset-background", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, backgroundImg }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        homeElement.style.background = `linear-gradient(
          rgba(220, 216, 216, 0.5),
          rgba(220, 216, 216, 0.5)
        ), url("https://res.cloudinary.com/dxseoqcpb/image/upload/v1729122093/base/t2laawx0hmk39czdqqgk.png")`;
        homeElement.style.backgroundSize = "cover";
        backgroundImg.value = "";
        saveSettingsBtn.style.display = "none";
        backgroundMessage.textContent = "";
        settingsModal.style.display = "none";
        backgroundPreview.src =
          "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
      } else {
        backgroundMessage.textContent =
          data.message || "Failed to update connected accounts.";
      }
    })
    .catch((error) => {
      console.error("Error uploading background image:", error);
      backgroundMessage.textContent =
        "An error occurred while uploading the background image.";
    });
}

// Event listener for profile picture upload
uploadBackgroundForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(uploadBackgroundForm);
  formData.append("username", username);

  fetch("/upload-background", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        homeElement.style.background = `linear-gradient(
          rgba(220, 216, 216, 0.5),
          rgba(220, 216, 216, 0.5)
        ), url(${data.backgroundImg})`;
        homeElement.style.backgroundSize = "cover";
        backgroundImg.value = "";
        saveSettingsBtn.style.display = "none";
        backgroundMessage.style.display = "none";
        settingsModal.style.display = "none";
        backgroundPreview.src =
          "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
      } else {
        backgroundMessage.textContent = "Failed to upload background image.";
      }
    })
    .catch((error) => {
      console.error("Error uploading background image:", error);
      backgroundMessage.textContent =
        "An error occurred while uploading the background image.";
    });
});

// Elements for frame customization
const frameCustomizationSection = document.getElementById("frameCustomization");
const frameColorPicker = document.getElementById("frame-color-picker");
const frameStyleSelect = document.getElementById("frame-style-select");
const applyFrameBtn = document.getElementById("applyFrameBtn");
const resetFrameBtn = document.getElementById("resetFrameBtn");

// Profile container element
const profileContainer = document.querySelector(".profile-container");

// Event listener for file selection
backgroundImg.addEventListener("change", function () {
  backgroundMessage.textContent = "";
  const file = backgroundImg.files[0];
  if (file) {
    const reader = new FileReader();
    saveSettingsBtn.style.display = "inline-block";
    reader.onload = function (e) {
      backgroundPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    backgroundPreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
      backgroundImg.value = "";
      saveSettingsBtn.style.display = "none";
  }
});

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close");
  adjustSidebar2();
});

contactsBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("title").textContent = "CONTACT";
    if (
      sidebar2.classList.contains("open") &
      (contactsList.style.display === "block")
    ) {
      searchInput.style.display = 'none';
      searchInput.value = '';
      contactsList.style.display = "none";
      sidebar2.classList.toggle("open");
      contactsBtn.forEach((button) => {
        button.style.backgroundColor = "";
      });
      contactIcon.forEach((icon) => {
        icon.style.color = "";
      });
      contactText.forEach((text) => {
        text.style.color = "";
      });
      adjustSidebar2(); // Adjust position of content
    } else if (
      sidebar2.classList.contains("open") &
      (favoriteList.style.display === "block")
    ) {
      searchInput.style.display = 'block';
      searchInput.value = '';
      contactsList.style.display = "block";
      favoriteList.style.display = "none";
      contactsBtn.forEach((button) => {
        button.style.backgroundColor = "var(--text-color)";
      });
      contactIcon.forEach((icon) => {
        icon.style.color = "var(--sidebar-color)";
      });
      contactText.forEach((text) => {
        text.style.color = "var(--sidebar-color)";
      });
      favoriteBtn.forEach((button) => {
        button.style.backgroundColor = "";
      });
      favoriteIcon.forEach((icon) => {
        icon.style.color = "";
      });
      favoriteText.forEach((text) => {
        text.style.color = "";
      });
      adjustSidebar2();
    } else {
      sidebar2.classList.toggle("open");
      contactsList.style.display = "block";
      favoriteList.style.display = "none";
      searchInput.style.display = 'block';
      searchInput.value = '';
      contactsBtn.forEach((button) => {
        button.style.backgroundColor = "var(--text-color)";
      });
      contactIcon.forEach((icon) => {
        icon.style.color = "var(--sidebar-color)";
      });
      contactText.forEach((text) => {
        text.style.color = "var(--sidebar-color)";
      });
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
            profileImg.src =
              contact.profilePic || "/uploads/default-avatar.png";
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
        contactsBtn.forEach((button) => {
          button.click(); // Refresh contacts
        });
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
        favoriteBtn.forEach((button) => {
          button.click(); // Refresh favorites 
        });
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

favoriteBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("title").textContent = "FAVORITE";
    if (
      sidebar2.classList.contains("open") &
      (favoriteList.style.display === "block")
    ) {
      searchInput.style.display = 'none';
      searchInput.value = '';
      favoriteList.style.display = "none";
      sidebar2.classList.toggle("open");
      favoriteBtn.forEach((button) => {
        button.style.backgroundColor = "";
      });
      favoriteIcon.forEach((icon) => {
        icon.style.color = "";
      });
      favoriteText.forEach((text) => {
        text.style.color = "";
      });
      adjustSidebar2(); // Adjust position of content
    } else if (
      sidebar2.classList.contains("open") &
      (contactsList.style.display === "block")
    ) {
      searchInput.style.display = 'none';
      searchInput.value = '';
      contactsList.style.display = "none";
      favoriteList.style.display = "block";
      favoriteBtn.forEach((button) => {
        button.style.backgroundColor = "var(--text-color)";
      });
      favoriteIcon.forEach((icon) => {
        icon.style.color = "var(--sidebar-color)";
      });
      favoriteText.forEach((text) => {
        text.style.color = "var(--sidebar-color)";
      });
      contactsBtn.forEach((button) => {
        button.style.backgroundColor = "";
      });
      contactIcon.forEach((icon) => {
        icon.style.color = "";
      });
      contactText.forEach((text) => {
        text.style.color = "";
      });
      adjustSidebar2();
    } else {
      sidebar2.classList.toggle("open");
      contactsList.style.display = "none";
      favoriteList.style.display = "block";
      searchInput.style.display = 'none';
      searchInput.value = '';
      favoriteBtn.forEach((button) => {
        button.style.backgroundColor = "var(--text-color)";
      });
      favoriteIcon.forEach((icon) => {
        icon.style.color = "var(--sidebar-color)";
      });
      favoriteText.forEach((text) => {
        text.style.color = "var(--sidebar-color)";
      });
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
            profileImg.src =
              contact.profilePic || "/uploads/default-avatar.png";
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
  checkHomeWidth();
}

// Load the existing profile picture, bio, and background image
fetch(`/get-user-profile?username=${username}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.profilePic) {
      profilePicElement[0].src = data.profilePic;
      profilePicElement[1].src = data.profilePic;
      homeElement.style.background = `linear-gradient(
        rgba(220, 216, 216, 0.5),
        rgba(220, 216, 216, 0.5)
      ), url(${data.backgroundImg})`;
      homeElement.style.backgroundSize = 'cover';
    } else {
      profilePicElement[0].src = "/uploads/default-avatar.png";
      profilePicElement[1].src = "/uploads/default-avatar.png";
      homeElement.style.background = `linear-gradient(
        rgba(220, 216, 216, 0.5),
        rgba(220, 216, 216, 0.5)
      ), url("https://res.cloudinary.com/dxseoqcpb/image/upload/v1729122093/base/t2laawx0hmk39czdqqgk.png")`;
      homeElement.style.backgroundSize = 'cover';
    }

    // Display the user's full name
    document.getElementsByClassName(
      "full-name"
    )[0].textContent = `${data.firstName} ${data.lastName}`;
    document.getElementsByClassName(
      "full-name"
    )[1].textContent = `${data.firstName} ${data.lastName}`;

    // Store the user data for connected accounts
    userData = data;

  })
  .catch((error) => {
    console.error("Error fetching profile:", error);
  });

// When the user clicks anywhere outside of any modal, close it
window.onclick = function (event) {
  if (event.target == settingsModal) {
    settingsModal.style.display = "none";
    backgroundPreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
    backgroundImg.value = "";
    saveSettingsBtn.style.display = "none";
    backgroundMessage.textContent = "";
  } else if (event.target == profileModal) {
    profileModal.style.display = 'none';
    document.getElementById('social_media').innerHTML = "";
  }
};

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

  // Show the search-results when input is clicked
  searchInput.addEventListener('focus', () => {
    document.getElementById('search-results').style.display = 'block';
  });

  // Hide the search-results when clicking outside the search container
  document.addEventListener('click', (event) => {
      const isClickInside = document.getElementById('search-container').contains(event.target);
      if (!isClickInside) {
        document.getElementById('search-results').style.display = 'none';
      }
  });

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
          
          // Add event listener to profile on click
          li.addEventListener('click', function() {
            viewUserProfile(user.username);
          });

          searchResults.appendChild(li);
        });
      } else {
        searchResults.innerHTML = '<li>No users found</li>';
      }
    })
    .catch(error => console.error('Error searching users:', error));
}

// Add New Friend
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
      profileClose.onclick();
    } else {
      alert('Failed to send friend request.');
    }
  })
  .catch(error => console.error('Error sending friend request:', error));
}

// View User Profile
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

    var addFriendBtn = document.getElementById('addFriendBtn');
    // Check if the user is already a friend
    fetch(`/is-friend?username=${encodeURIComponent(username)}&friend=${encodeURIComponent(contactUsername)}`)
    .then(response => response.json())
    .then(data => {
      if (data.isFriend) {
        // Hide the Add Friend button and center Start Chat button
        addFriendBtn.style.display = 'none';
      } else {
        // Show the Add Friend button and add event listener
        addFriendBtn.style.display = 'inline-block';
        addFriendBtn.onclick = function() { addContact(contactUsername); };
      }
    })
    .catch(error => console.error('Error checking friendship status:', error));
}

// Close the profile modal when clicking x
var profileModal = document.getElementById('profileModal');
var profileClose = document.getElementsByClassName('closeBtn')[1];
profileClose.onclick = function() {
  profileModal.style.display = 'none';
  document.getElementById('social_media').innerHTML = "";
};

function checkHomeWidth() {
  const homeElement = document.querySelector(".home");
  if (homeElement) {
    if (homeElement.offsetWidth <= 1000) {
      homeElement.classList.add("is-small");
    } else {
      homeElement.classList.remove("is-small");
    }
  }

  if (window.innerWidth <= 1000) {
    homeElement.style.width = "100%";
    document.getElementsByClassName("sidebar2")[0].style.left = "0";
  } else {
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
}

// Run on load and on resize
window.addEventListener("resize", checkHomeWidth);
window.addEventListener("load", checkHomeWidth);

const replyPreview = document.getElementById('reply-preview');
let replyToMessage = null;
let isReply = false;
let isFile = false;
let userProfilePic = ''; // Store profile picture globally

document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  loadContacts();

  // Emoji Picker Setup
  const picker = new EmojiButton();
  const emojiButton = document.getElementById('emoji-button');

  let pickerVisible = false; // Track the visibility of the picker

  emojiButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click from propagating to document
    if (pickerVisible) {
      picker.hidePicker();
      pickerVisible = false;
    } else {
      picker.showPicker(emojiButton);
      pickerVisible = true;
    }
  });

  picker.on('emoji', (emoji) => {
    document.getElementById('chat-input').value += emoji;
    picker.hidePicker(); // Hide picker after selecting an emoji
    pickerVisible = false;
  });

  // Hide the picker when clicking outside
  document.addEventListener('click', () => {
    if (pickerVisible) {
      picker.hidePicker();
      pickerVisible = false;
    }
  });
  
    // Fetch the user's profile picture
    fetch(`/get-user-profile?username=${username}`)
    .then((response) => response.json())
    .then((data) => {
      userProfilePic = data.profilePic || '/uploads/default-avatar.png';
    })
    .catch((error) => console.error('Error fetching profile:', error))

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
        message: message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          chatInput.value = '';

          // Append the message to the chat window
          const chatMessages = document.getElementById('chat-messages');
          const messageDiv = createMessageElement({
            fromUser: username,
            message: message,
            profilePic: userProfilePic, // Use the globally stored profile picture
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
    const messageDiv = createMessageElement({
      fromUser: data.fromUser,
      message: data.message,
      profilePic: data.profilePic || '/uploads/default-avatar.png', // Ensure profilePic is passed with each message
    });
    chatMessages.appendChild(messageDiv);

    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    // Optionally, update the conversations list to indicate a new message
    loadConversations();
  }
});


function getFile(input) {
  isFile = true;
  const fileName = input.replace(/^.*\\/, "");
  document.getElementById("file-name").textContent = fileName;
  document.getElementById("display-file").style.display = "inline-flex";
  document.getElementById("chat-input").style.paddingTop = "65px";
  document.getElementById("emoji-button").style.marginTop = "55px";
  document.getElementById("uploadFileBtn").style.marginTop = "55px";
  document.getElementById("sendBtn").style.marginTop = "55px";
  if (document.getElementById("file-name").textContent == "") {
    isFile = false;
    document.getElementById("display-file").style.display = "none";
    document.getElementById("chat-input").style.paddingTop = "10px";
    document.getElementById("emoji-button").style.marginTop = "0";
    document.getElementById("uploadFileBtn").style.marginTop = "0";
    document.getElementById("sendBtn").style.marginTop = "0";
  }
}

function cancelFileUpload() {
  isFile = false;
  document.getElementById("image-input").value = "";
  document.getElementById("display-file").style.display = "none";
  document.getElementById("chat-input").style.paddingTop = "10px";
  document.getElementById("emoji-button").style.marginTop = "0";
  document.getElementById("uploadFileBtn").style.marginTop = "0";
  document.getElementById("sendBtn").style.marginTop = "0";
}
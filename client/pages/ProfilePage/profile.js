
const body = document.querySelector("body"),
  sidebar = body.querySelector("nav"),
  sidebar2 = document.querySelector(".sidebar2"),
  toggle = body.querySelector(".toggle"),
  contactsBtn = document.querySelector(".contact-btn"),
  contactIcon = document.querySelector(".bxs-contact"),
  contactText = document.getElementById('contactText')
  favoriteBtn = document.querySelector(".favorite-btn");
  favoriteIcon = document.querySelector(".bx-heart"),
  favoriteText = document.getElementById('favoriteText')

contactsList = document.getElementsByClassName("contactList")[0];
favoriteList = document.getElementsByClassName("favoriteList")[0];
let userData = {};

// Connected Accounts Elements
const connectedAccountsDisplay = document.getElementById('connected-accounts-display');
const editAccountsBtn = document.getElementById('edit-accounts-btn');
const connectedAccountsForm = document.getElementById('connected-accounts-form');
const saveAccountsBtn = document.getElementById('save-accounts-btn');
const cancelAccountsBtn = document.getElementById('cancel-accounts-btn');
const accountsMessage = document.getElementById('accounts-message');

// Elements for profile and bio
const uploadForm = document.getElementById("upload-form");
const profilePicElement = document.getElementsByClassName("profile-pic");
const messageElement = document.getElementById("message");
const bioElement = document.getElementById("bio");
const bioDisplayElement = document.getElementById("bio-display"); // Bio display element
const bioMessageElement = document.getElementById("bio-message");
const editBioBtn = document.getElementById("edit-bio-btn");
const saveBioBtn = document.getElementById("save-bio-btn");
const emojiButton = document.getElementById("emoji-button");

const firstNameElement = document.getElementById("firstName");
const lastNameElement = document.getElementById("lastName");
const usernameElement = document.getElementById("username");
const emailElement = document.getElementById("email");
const phoneElement = document.getElementById("phoneNumber");

// Elements for password changing
const passwordChangeSection = document.getElementById("password-change-section");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmNewPasswordInput = document.getElementById("confirm-new-password");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordMessage = document.getElementById("password-message");

// Elements for delete account
const deleteMessage = document.getElementById("delete-message");
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteAccountModal = document.getElementById('deleteAccountModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');  

// Event Listeners for Connected Accounts
editAccountsBtn.addEventListener('click', showConnectedAccountsForm);
saveAccountsBtn.addEventListener('click', saveConnectedAccounts);
cancelAccountsBtn.addEventListener('click', cancelConnectedAccountsEdit);

// profile.js

const username = localStorage.getItem('username');


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
    contactsBtn.style.backgroundColor = '';
    contactIcon.style.color = '';
    contactText.style.color = '';
    adjustSidebar2(); // Adjust position of content
  } else if (
    sidebar2.classList.contains("open") &
    (favoriteList.style.display === "block")
  ) {
    contactsList.style.display = "block";
    favoriteList.style.display = "none";
    contactsBtn.style.backgroundColor = 'var(--text-color)';
    contactIcon.style.color = 'var(--sidebar-color)';
    contactText.style.color = 'var(--sidebar-color)';
    favoriteBtn.style.backgroundColor = '';
    favoriteIcon.style.color = '';
    favoriteText.style.color = ''
    adjustSidebar2();
  } else {
    sidebar2.classList.toggle("open");
    contactsList.style.display = "block";
    favoriteList.style.display = "none";
    contactsBtn.style.backgroundColor = 'var(--text-color)';
    contactIcon.style.color = 'var(--sidebar-color)';
    contactText.style.color = 'var(--sidebar-color)';
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
          div2.style.marginRight = "9px"
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

// Function to show the Connected Accounts form
function showConnectedAccountsForm() {
  connectedAccountsForm.style.display = 'block';
  editAccountsBtn.style.display = 'none';
  connectedAccountsDisplay.style.display = 'none';

  // Load existing accounts into the form
  const accounts = userData.connectedAccounts || {};
  document.getElementById('youtube').value = accounts.youtube || '';
  document.getElementById('twitch').value = accounts.twitch || '';
  document.getElementById('twitter').value = accounts.twitter || '';
  document.getElementById('instagram').value = accounts.instagram || '';
  document.getElementById('tiktok').value = accounts.tiktok || '';
  document.getElementById('whatsapp').value = accounts.whatsapp || '';
  document.getElementById('snapchat').value = accounts.snapchat || '';
}

// Function to cancel editing Connected Accounts
function cancelConnectedAccountsEdit() {
  connectedAccountsForm.style.display = 'none';
  editAccountsBtn.style.display = 'block';
  connectedAccountsDisplay.style.display = 'block';
  accountsMessage.textContent = '';
}

// Function to save Connected Accounts
function saveConnectedAccounts() {
  const connectedAccounts = {
    youtube: document.getElementById('youtube').value.trim(),
    twitch: document.getElementById('twitch').value.trim(),
    twitter: document.getElementById('twitter').value.trim(),
    instagram: document.getElementById('instagram').value.trim(),
    tiktok: document.getElementById('tiktok').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    snapchat: document.getElementById('snapchat').value.trim()
  };
  console.log('Saving connected accounts:', connectedAccounts);

// Send data to the server
fetch('/save-connected-accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ username, connectedAccounts })
})        
.then(response => response.json())
  .then(data => {
    if (data.success) {
      accountsMessage.style.color = 'green';
      accountsMessage.textContent = 'Connected accounts updated successfully.';
      connectedAccountsForm.style.display = 'none';
      editAccountsBtn.style.display = 'block';
      // Update the display
      userData.connectedAccounts = connectedAccounts;
      displayConnectedAccounts();
    } else {
      accountsMessage.style.color = 'red';
      accountsMessage.textContent = data.message || 'Failed to update connected accounts.';
    }
  })
  .catch(error => {
    console.error('Error saving connected accounts:', error);
    accountsMessage.style.color = 'red';
    accountsMessage.textContent = 'An error occurred while saving connected accounts.';
  });
}

// Function to display Connected Accounts
function displayConnectedAccounts() {
  connectedAccountsDisplay.innerHTML = ''; // Clear existing content
  const accounts = userData.connectedAccounts || {};

  const platforms = [
    {
      name: 'YouTube',
      key: 'youtube',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/lpuwky4wf5o5wbcf2wxn.webp',
    },
    {
      name: 'Twitch',
      key: 'twitch',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/xcrwvzrjrj4dw1yya56r.jpg',
    },
    {
      name: 'Twitter/X',
      key: 'twitter',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/tgfgmgjurtazvy9scjdb.jpg',
    },
    {
      name: 'Instagram',
      key: 'instagram',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223970/base/peoeigfk0yy9jbvpgrt3.png',
    },
    {
      name: 'TikTok',
      key: 'tiktok',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/m3evlfqli9pt3h4k61za.webp',
    },
    {
      name: 'WhatsApp',
      key: 'whatsapp',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730224314/base/tzghijqdnn7kofrqtghf.png',
    },
    {
      name: 'Snapchat',
      key: 'snapchat',
      icon: 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/k04o0c2jesojaxfxkedq.jpg',
    },
  ];

  platforms.forEach(platform => {
    const url = accounts[platform.key];
    if (url) {
      const accountDiv = document.createElement('div');
      accountDiv.className = 'account-item';

      const iconImg = document.createElement('img');
      iconImg.src = platform.icon;
      iconImg.alt = platform.name;
      iconImg.className = 'social-icon';

      const accountLink = document.createElement('a');
      accountLink.href = url;
      accountLink.target = '_blank';
      accountLink.textContent = `My ${platform.name} Account`;

      accountDiv.appendChild(iconImg);
      accountDiv.appendChild(accountLink);

      connectedAccountsDisplay.appendChild(accountDiv);
    }
  });


  // Twitter Embed
  if (accounts.twitter) {
    const twitterEmbed = document.createElement('a');
    twitterEmbed.className = 'twitter-timeline';
    twitterEmbed.href = accounts.twitter;
    twitterEmbed.dataset.width = '400';
    twitterEmbed.dataset.height = '600';
    twitterEmbed.textContent = `Tweets by ${accounts.twitter.split('/').pop()}`;

    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-item';

    accountDiv.appendChild(twitterEmbed);          
    connectedAccountsDisplay.appendChild(twitterEmbed);

    // Load Twitter widgets script
    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.charset = 'utf-8';
    document.head.appendChild(script);
  }

  // Twitch Embed
  if (accounts.twitch) {
    const twitchUrl = new URL(accounts.twitch);
    const pathname = twitchUrl.pathname.split('/').filter(Boolean);
    let twitchChannel = null;

    if (pathname[0]) {
      twitchChannel = pathname[0];
    }

    if (twitchChannel) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}`;
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.scrolling = 'no';
      iframe.width = '560';
      iframe.height = '315';
      connectedAccountsDisplay.appendChild(iframe);
    } else {
      const twitchLink = document.createElement('a');
      twitchLink.href = accounts.twitch;
      twitchLink.target = '_blank';
      twitchLink.textContent = 'My Twitch Channel';
      connectedAccountsDisplay.appendChild(twitchLink);
    }
  }

  // Instagram Embed
  if (accounts.instagram) {
    const instagramEmbed = document.createElement('blockquote');
    instagramEmbed.className = 'instagram-media';
    instagramEmbed.setAttribute('data-instgrm-permalink', accounts.instagram);
    instagramEmbed.style.width = '100%';
    connectedAccountsDisplay.appendChild(instagramEmbed);

    // Load Instagram Embed Script
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.head.appendChild(script);
  }


  // TikTok Embed with Sandbox
  if (accounts.tiktok) {
    const tiktokUrl = accounts.tiktok;
    
    const tiktokDiv = document.createElement('div');
    tiktokDiv.className = 'account-item';
    
    const iconImg = document.createElement('img');
    iconImg.src = 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1730223969/base/m3evlfqli9pt3h4k61za.webp';
    iconImg.alt = 'TikTok';
    iconImg.style.width = '40px'; // Adjust size as needed

    const tiktokLink = document.createElement('a');
    tiktokLink.href = tiktokUrl;
    tiktokLink.target = '_blank';
    tiktokLink.textContent = 'View my TikTok';
    
    tiktokDiv.appendChild(iconImg);
    tiktokDiv.appendChild(tiktokLink);
    connectedAccountsDisplay.appendChild(tiktokDiv);
  }

  // For WhatsApp, display a clickable phone number
  if (accounts.whatsapp) {
    const whatsappLink = document.createElement('a');
    whatsappLink.href = `https://wa.me/${accounts.whatsapp.replace(/\D/g, '')}`;
    whatsappLink.target = '_blank';
    whatsappLink.textContent = `Chat with me on WhatsApp`;

    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-item';

    const iconImg = document.createElement('img');
    iconImg.src = platforms.find(p => p.key === 'whatsapp').icon;
    iconImg.alt = 'WhatsApp';
    iconImg.className = 'social-icon';

    accountDiv.appendChild(iconImg);
    accountDiv.appendChild(whatsappLink);
    connectedAccountsDisplay.appendChild(accountDiv);
  }

  // For Snapchat, provide a link to the Snapchat profile
  if (accounts.snapchat) {
    const snapchatLink = document.createElement('a');
    snapchatLink.href = `https://www.snapchat.com/add/${accounts.snapchat}`;
    snapchatLink.target = '_blank';
    snapchatLink.textContent = `Add me on Snapchat`;

    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-item';

    const iconImg = document.createElement('img');
    iconImg.src = platforms.find(p => p.key === 'snapchat').icon;
    iconImg.alt = 'Snapchat';
    iconImg.className = 'social-icon';

    accountDiv.appendChild(iconImg);
    accountDiv.appendChild(snapchatLink);
    connectedAccountsDisplay.appendChild(accountDiv);
  }

  // Repeat similar blocks for other platforms (Twitch, Twitter, etc.)

  // Re-display the connected accounts section
  connectedAccountsDisplay.style.display = 'block';
}    

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
    .catch((error) =>
      console.error("Error removing from favorites:", error)
    );
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
    favoriteBtn.style.backgroundColor = '';
    favoriteIcon.style.color = '';
    favoriteText.style.color = ''
    adjustSidebar2(); // Adjust position of content
  } else if (
    sidebar2.classList.contains("open") &
    (contactsList.style.display === "block")
  ) {
    contactsList.style.display = "none";
    favoriteList.style.display = "block";
    favoriteBtn.style.backgroundColor = 'var(--text-color)';
    favoriteIcon.style.color = 'var(--sidebar-color)';
    favoriteText.style.color = 'var(--sidebar-color';
    contactsBtn.style.backgroundColor = '';
    contactIcon.style.color = '';
    contactText.style.color = '';
    adjustSidebar2();
  } else {
    sidebar2.classList.toggle("open");
    contactsList.style.display = "none";
    favoriteList.style.display = "block";
    favoriteBtn.style.backgroundColor = 'var(--text-color)';
    favoriteIcon.style.color = 'var(--sidebar-color)';
    favoriteText.style.color = 'var(--sidebar-color';
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
          unfavoriteBtn.src = "https://res.cloudinary.com/dxseoqcpb/image/upload/v1728990835/base/kislo9bww6jfnvoagsgz.jpg";
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
    document.querySelector(".home").style.left =
      sidebar2.classList.contains("open") ? "388px" : "88px";
    if (sidebar2.classList.contains("open")) {
      document.querySelector(".home").style.width = "calc(100% - 390px)";
    } else {
      document.querySelector(".home").style.width = "calc(100% - 88px)";
    }
  } else {
    sidebar2.style.left = "250px";
    document.querySelector(".home").style.left =
      sidebar2.classList.contains("open") ? "550px" : "250px";
    if (sidebar2.classList.contains("open")) {
      document.querySelector(".home").style.width = "calc(100% - 550px)";
      document.querySelector(".home").style.overflowX = "hidden";
    } else {
      document.querySelector(".home").style.width = "calc(100% - 250px)";
    }
  }
}

// Redirect to the sign-in page if the username is not found
if (!username) {
  window.location.href = "/signin";
}

function autoEmbedBio(bioText) {
  // Regex for detecting YouTube video links
  const youtubeVideoRegex =
    /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g;

  // Regex for detecting YouTube channel/profile links
  const youtubeChannelRegex =
    /(https?:\/\/www\.youtube\.com\/(user|channel|c)\/([a-zA-Z0-9_-]+))/g;

  // Regex for detecting Twitter/X profile links
  const twitterRegex =
    /(https?:\/\/(x\.com|twitter\.com)\/([a-zA-Z0-9_]+))/g;

  // Replace YouTube video URLs with an iframe embed
  bioText = bioText.replace(youtubeVideoRegex, (url, _, videoId) => {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
allowfullscreen></iframe>`;
  });

  // Replace YouTube channel/profile links with a clickable YouTube button
  bioText = bioText.replace(
    youtubeChannelRegex,
    (url, type, channelId) => {
      return `<a href="${url}" target="_blank">
        <img src="https://www.youtube.com/about/static/svgs/icons/brand-resources/YouTube-logo-full_color_light.svg" alt="YouTube" width="120">
        Visit my YouTube Channel
      </a>`;
    }
  );

  // Replace Twitter/X profile links with a clickable Twitter button
  bioText = bioText.replace(twitterRegex, (url, _, username) => {
    return `<a class="twitter-timeline" href="${url}" data-width="400" data-height="600" target="_blank">Tweets by @${username}</a>`;
  });

  return bioText;
}

// Load the existing profile picture and bio
fetch(`/get-user-profile?username=${username}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.profilePic) {
    profilePicElement[0].src = data.profilePic;
    profilePicElement[1].src = data.profilePic;
  } else {
    profilePicElement[0].src = "/uploads/default-avatar.png";
    profilePicElement[1].src = "/uploads/default-avatar.png";
  }
  if (data.bio) {
    bioDisplayElement.innerHTML = autoEmbedBio(data.bio);
    // Append Twitter widget script if needed...
  } else {
    bioDisplayElement.textContent = "No bio available";
  }


    // Display the user's full name
    document.getElementsByClassName("full-name")[0].textContent = `${data.firstName} ${data.lastName}`;
    document.getElementsByClassName("full-name")[1].textContent = `${data.firstName} ${data.lastName}`;

    // Store firstname, lastname, username, email, phonenumber in inputs
    firstNameElement.value = data.firstName;
    lastNameElement.value = data.lastName;
    usernameElement.value = username;
    emailElement.value = data.email;
    phoneElement.value = data.phoneNumber;

    // Store the user data for connected accounts
    userData = data;

    // Display connected accounts
    displayConnectedAccounts();
  })
  .catch(error => {
    console.error('Error fetching profile:', error);
});

// Event listener for profile picture upload
uploadForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  formData.append("username", username);

  fetch("/upload-profile-pic", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        profilePicElement[0].src = data.profilePic;
        profilePicElement[1].src = data.profilePic;
        messageElement.style.display = "none";
      } else {
        messageElement.textContent = "Failed to upload profile picture.";
      }
    })
    .catch((error) => {
      console.error("Error uploading profile picture:", error);
      messageElement.textContent =
        "An error occurred while uploading the profile picture.";
    });
});

// Show the editable bio text area and upload form when "Edit Profile" is clicked
editBioBtn.addEventListener("click", function () {
  bioElement.value = bioDisplayElement.textContent; // Set the text area to the current bio text
  bioElement.style.display = "block"; // Show the editable text area
  bioDisplayElement.style.display = "none"; // Hide the non-editable display

  messageElement.style.display = "block"; // Show any messages

  editBioBtn.style.display = "none"; // Hide the "Edit Profile" button
  saveBioBtn.style.display = "block"; // Show the "Save Profile" button
  emojiButton.style.display = "inline-block"; // Show the emoji button
});

// Initialize the emoji picker for the bio
const picker = new EmojiButton();
emojiButton.addEventListener("click", () => {
  picker.pickerVisible
    ? picker.hidePicker()
    : picker.showPicker(emojiButton);
});
picker.on("emoji", (emoji) => {
  bioElement.value += emoji;
});

// Handle saving the bio and hiding the upload form
saveBioBtn.addEventListener("click", function () {
  const bioData = {
    username: username,
    bio: bioElement.value.trim(),
  };

  fetch("/save-bio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bioData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        bioDisplayElement.innerHTML = autoEmbedBio(bioElement.value); // Update the bio with embedded links
        bioElement.style.display = "none"; // Hide the editable text area
        bioDisplayElement.style.display = "block"; // Show the updated bio display

        messageElement.style.display = "none"; // Hide any messages
        bioMessageElement.style.display = "none"; // Hide any messages

        editBioBtn.style.display = "inline"; // Show the "Edit Bio" button
        saveBioBtn.style.display = "none"; // Hide the "Save Profile" button
        emojiButton.style.display = "none"; // Hide the emoji button
      } else {
        bioMessageElement.textContent = "Failed to update profile.";
      }
    })
    .catch((error) => {
      bioMessageElement.textContent = "An error occurred.";
      console.error(error);
    });
});

// Show and Hide Button of the profile information
document.getElementById("showBtn").addEventListener("click", function () {
  if (document.getElementById("showBtn").textContent === "Show Profile") {
    usernameElement.style.display = "inline";
    emailElement.style.display = "inline";
    phoneElement.style.display = "inline";
    deleteAccountBtn.style.display = 'block';
    document.getElementById("showBtn").textContent = "Hide Profile";
  } else {
    usernameElement.style.display = "none";
    emailElement.style.display = "none";
    phoneElement.style.display = "none";
    deleteAccountBtn.style.display = 'none';
    document.getElementById("showBtn").textContent = "Show Profile";
  }
});

// Display the edit button
document.getElementById("editBtn").addEventListener("click", function () {
  usernameElement.style.display = "inline";
  emailElement.style.display = "inline";
  phoneElement.style.display = "inline";
  deleteAccountBtn.style.display = 'block';
  document.getElementById("showBtn").style.display = "none";
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("updateBtn").style.display = "block";
  document.getElementById("cancelBtn").style.display = "block";

  firstNameElement.removeAttribute("readonly");
  lastNameElement.removeAttribute("readonly");
  phoneElement.removeAttribute("readonly");
});

// Cancel edit button
document
  .getElementById("cancelBtn")
  .addEventListener("click", function () {
    window.location.href = "/profile";
  });

// Edit password button
document
  .getElementById("editPasswordBtn")
  .addEventListener("click", function () {
    document.getElementsByClassName("button-container")[1].style.display =
      "block";
    passwordChangeSection.style.display = "block";
    document.getElementById("editPasswordBtn").style.display = "none";
  });

// Cancel password button
document
  .getElementById("cancelPasswordBtn")
  .addEventListener("click", function () {
    document.getElementsByClassName("button-container")[1].style.display =
      "none";
    passwordChangeSection.style.display = "none";
    document.getElementById("editPasswordBtn").style.display = "block";
    document.getElementById("editPasswordBtn").style.top = "0";
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmNewPasswordInput.value = '';
    passwordMessage.style.display = "none";
  });

// Update the profile
document
  .getElementById("updateBtn")
  .addEventListener("click", function () {
    event.preventDefault();

    const newFirstName = firstNameElement.value.trim();
    const newLastName = lastNameElement.value.trim();
    const newPhoneNumber = phoneElement.value.trim();

    // Validate first name
    if (!newFirstName.match(/[A-Za-z ]{1,50}/)) {
      alert("Please enter a valid first name.");
      return;
    }

    // Validate last name
    if (!newLastName.match(/[A-Za-z ]{1,50}/)) {
      alert("Please enter a valid last name.");
      return;
    }

    // Validate phone number
    if (!newPhoneNumber.match(/[0-9+()-\s]{7,15}/)) {
      alert("Please enter a valid phone number.");
      return;
    }

    fetch("/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        firstName: newFirstName,
        lastName: newLastName,
        phoneNumber: newPhoneNumber,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          firstNameElement.value = newFirstName;
          lastNameElement.value = newLastName;
          phoneElement.value = newPhoneNumber;

          alert("Success to update profile");
          window.location.href = "/profile";
        } else {
          alert("Failed to update profile");
        }
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert("An error occurred while updating the profile.");
      });
  });

// Change the new password
changePasswordBtn.addEventListener("click", function () {
  passwordMessage.style.display = "block";

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmNewPassword = confirmNewPasswordInput.value.trim();

  // Validate passwords
  if (newPassword !== confirmNewPassword) {
    passwordMessage.textContent = "New passwords do not match.";
    return;
  }

  if (newPassword.length < 8) {
    passwordMessage.textContent =
      "✖ New password must be at least 8 characters long.";
    return;
  } else if (!/[A-Z]/.test(newPassword)) {
    passwordMessage.textContent =
      "✖ New password must be contain upper case letters (A-Z).";
    return;
  } else if (!/[a-z]/.test(newPassword)) {
    passwordMessage.textContent =
      "✖ New password must be contain lower case letters (a-z).";
    return;
  } else if (!/\d/.test(newPassword)) {
    passwordMessage.textContent =
      "✖ New password must be contain number (0-9).";
    return;
  } else if (!/[!@#$%^&*()\-\+=|{};:?.\\_]/.test(newPassword)) {
    passwordMessage.textContent =
      "✖ New password must be contain special character.";
    return;
  } else {
    passwordMessage.textContent =
      "";
  }

  // Additional password strength validations can be added here

  fetch("/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, currentPassword, newPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        passwordChangeSection.style.display = "none";
        changePasswordBtn.textContent = "Change Password";
        passwordMessage.textContent = "";
        alert("Password changed successfully.");
        window.location.href = "/profile";
      } else {
        passwordMessage.textContent =
          data.message || "Failed to change password.";
      }
    })
    .catch((error) => {
      console.error("Error changing password:", error);
      passwordMessage.textContent =
        "An error occurred while changing the password.";
    });
});

// Delete Account 
deleteAccountBtn.addEventListener('click', function() {
// Show the modal when the delete account button is clicked
  deleteAccountModal.style.display = 'block';
});

// Close the inbox modal when clicking x
var deleteAccountClose = document.getElementsByClassName('closeBtn')[0]; 
deleteAccountClose.onclick = function() {
  deleteAccountModal.style.display = 'none';
  const passwordInput = document.getElementById('currentPassword');
  passwordInput.value = '';
  deleteMessage.textContent = "";
};

// When the user clicks anywhere outside of any modal, close it
window.onclick = function(event) {
  if (event.target == deleteAccountModal) {
    deleteAccountModal.style.display = 'none';
    const passwordInput = document.getElementById('currentPassword');
    passwordInput.value = '';
    deleteMessage.textContent = "";
  }
};

confirmDeleteBtn.addEventListener("click", function() {
  const currentPassword = document.getElementById('currentPassword').value;

  if (!currentPassword) {
    alert('Please enter your password.');
    return;
  }

  fetch("/delete-account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({username, currentPassword}),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      alert("Your account has been deleted");
      window.location.href = '/signin';
    } else {
      deleteMessage.textContent =
          data.message || "Failed to delete account.";
    }
  }) 
  .catch((error) => {
    console.error("Error deleting account:", error);
  });
}) 
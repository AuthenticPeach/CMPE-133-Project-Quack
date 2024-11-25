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
  favoriteList = document.getElementsByClassName("favoriteList")[0];
let userData = {};

// Connected Accounts Elements
const connectedAccountsDisplay = document.getElementById(
  "connected-accounts-display"
);
const editAccountsBtn = document.getElementById("edit-accounts-btn");
const connectedAccountsForm = document.getElementById(
  "connected-accounts-form"
);
const saveAccountsBtn = document.getElementById("save-accounts-btn");
const cancelAccountsBtn = document.getElementById("cancel-accounts-btn");
const accountsMessage = document.getElementById("accounts-message");
const connectedAccountModal = document.getElementById("connectedAccountModal");

// Elements for profile and bio
const uploadForm = document.getElementById("upload-form");
const profilePicElement = document.getElementsByClassName("profile-pic");
const profilePictureBtn = document.getElementById("profile-button");
const profilePictureModal = document.getElementById("profilePictureModal");
const imagePreview = document.getElementById("imagePreview");
const profilePic = document.getElementById("profilePic");
const uploadBtn = document.getElementById("uploadBtn");
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
const passwordChangeSection = document.getElementById(
  "password-change-section"
);
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmNewPasswordInput = document.getElementById("confirm-new-password");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordMessage = document.getElementById("password-message");

// Elements for delete account
const deleteMessage = document.getElementById("delete-message");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const deleteAccountModal = document.getElementById("deleteAccountModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");

// Event Listeners for Connected Accounts
editAccountsBtn.addEventListener("click", showConnectedAccountsForm);
saveAccountsBtn.addEventListener("click", saveConnectedAccounts);
cancelAccountsBtn.addEventListener("click", cancelConnectedAccountsEdit);

const username = localStorage.getItem("username");

const settingsBtn = document.querySelectorAll(".settings-btn");
const settingsModal = document.getElementById("settingsModal");
const backgroundImg = document.getElementById("backgroundImg");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
resetBackgroundBtn.addEventListener("click", resetBackground);
const backgroundPreview = document.getElementById("backgroundPreview");
const uploadBackgroundForm = document.getElementById("upload-background-form");
const backgroundMessage = document.getElementById("background-message");
const homeElement = document.getElementsByClassName('home')[0];

// Open settings modal
// Open the modal when settings button is clicked
settingsBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("menu_bar").checked = false;
    settingsModal.style.display = "block";
  });
});
  
// Close the modal when the close button (×) is clicked
const closeSettingsModal = document.getElementsByClassName("closeBtn")[1];
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

// Close the Connected Accounts form modal when clicking x
var connectedAccountClose = document.getElementsByClassName("closeBtn")[3];
connectedAccountClose.onclick = function () {
  connectedAccountModal.style.display = "none";
  accountsMessage.textContent = "";
};

// Function to show the Connected Accounts form
function showConnectedAccountsForm() {
  connectedAccountModal.style.display = "block";
  // Load existing accounts into the form
  const accounts = userData.connectedAccounts || {};
  document.getElementById("youtube").value = accounts.youtube || "";
  document.getElementById("twitch").value = accounts.twitch || "";
  document.getElementById("twitter").value = accounts.twitter || "";
  document.getElementById("instagram").value = accounts.instagram || "";
  document.getElementById("tiktok").value = accounts.tiktok || "";
  document.getElementById("whatsapp").value = accounts.whatsapp || "";
  document.getElementById("snapchat").value = accounts.snapchat || "";
}

// Function to cancel editing Connected Accounts
function cancelConnectedAccountsEdit() {
  connectedAccountModal.style.display = "none";
  accountsMessage.textContent = "";
}

// Function to save Connected Accounts
function saveConnectedAccounts() {
  const connectedAccounts = {
    youtube: document.getElementById("youtube").value.trim(),
    twitch: document.getElementById("twitch").value.trim(),
    twitter: document.getElementById("twitter").value.trim(),
    instagram: document.getElementById("instagram").value.trim(),
    tiktok: document.getElementById("tiktok").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    snapchat: document.getElementById("snapchat").value.trim(),
  };
  console.log("Saving connected accounts:", connectedAccounts);

  // Send data to the server
  fetch("/save-connected-accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, connectedAccounts }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Connected accounts updated successfully.");
        connectedAccountModal.style.display = "none";
        // Update the display
        userData.connectedAccounts = connectedAccounts;
        displayConnectedAccounts();
      } else {
        accountsMessage.style.color = "red";
        accountsMessage.textContent =
          data.message || "Failed to update connected accounts.";
      }
    })
    .catch((error) => {
      console.error("Error saving connected accounts:", error);
      accountsMessage.style.color = "red";
      accountsMessage.textContent =
        "An error occurred while saving connected accounts.";
    });
}

// Function to display Connected Accounts
function displayConnectedAccounts() {
  connectedAccountsDisplay.innerHTML = ""; // Clear existing content
  const accounts = userData.connectedAccounts || {};

  if (accounts.youtube) {
    // Create a link element
    const youtubeLink = document.createElement("a");
    youtubeLink.href = accounts.youtube; // Set the YouTube link
    youtubeLink.target = "_blank"; // Open the link in a new tab

    // Create the image element
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptNC40NDEgMTYuODkyYy0yLjEwMi4xNDQtNi43ODQuMTQ0LTguODgzIDAtMi4yNzYtLjE1Ni0yLjU0MS0xLjI3LTIuNTU4LTQuODkyLjAxNy0zLjYyOS4yODUtNC43MzYgMi41NTgtNC44OTIgMi4wOTktLjE0NCA2Ljc4Mi0uMTQ0IDguODgzIDAgMi4yNzcuMTU2IDIuNTQxIDEuMjcgMi41NTkgNC44OTItLjAxOCAzLjYyOS0uMjg1IDQuNzM2LTIuNTU5IDQuODkyem0tNi40NDEtNy4yMzRsNC45MTcgMi4zMzgtNC45MTcgMi4zNDZ2LTQuNjg0eiIvPjwvc3ZnPg==";

    // Append the image inside the link element
    youtubeLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(youtubeLink);
  }

  if (accounts.twitch) {
    // Create a link element
    const twitchLink = document.createElement("a");
    twitchLink.href = accounts.twitch;
    twitchLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTAuMjI0IDE3LjgwNmwxLjc3Ni0xLjc3NmgzLjM0M2wyLjA5LTIuMDl2LTYuNjg2aC0xMC4wM3Y4Ljc3NmgyLjgyMXYxLjc3NnptMy44NjYtOC4xNDloMS4yNTR2My42NTNoLTEuMjU0di0zLjY1M3ptLTMuMzQ0IDBoMS4yNTR2My42NTNoLTEuMjU0di0zLjY1M3ptMS4yNTQtOS42NTdjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bTYuNjg3IDE0LjU2N2wtMy42NTcgMy42NTdoLTIuNzE2bC0xLjc3NyAxLjc3NmgtMS44OHYtMS43NzZoLTMuMzQ0di05LjgyMWwuOTQxLTIuNDAzaDEyLjQzM3Y4LjU2N3oiLz48L3N2Zz4=";

    // Append the image inside the link element
    twitchLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(twitchLink);
  }

  if (accounts.twitter) {
    // Create a link element
    const twitterLink = document.createElement("a");
    twitterLink.href = accounts.twitch;
    twitterLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1730918882/twitter_1_wiijlx.png";

    // Append the image inside the link element
    twitterLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(twitterLink);
  }

  if (accounts.instagram) {
    // Create a link element
    const instagramLink = document.createElement("a");
    instagramLink.href = accounts.twitch;
    instagramLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQuODI5IDYuMzAyYy0uNzM4LS4wMzQtLjk2LS4wNC0yLjgyOS0uMDRzLTIuMDkuMDA3LTIuODI4LjA0Yy0xLjg5OS4wODctMi43ODMuOTg2LTIuODcgMi44Ny0uMDMzLjczOC0uMDQxLjk1OS0uMDQxIDIuODI4cy4wMDggMi4wOS4wNDEgMi44MjljLjA4NyAxLjg3OS45NjcgMi43ODMgMi44NyAyLjg3LjczNy4wMzMuOTU5LjA0MSAyLjgyOC4wNDEgMS44NyAwIDIuMDkxLS4wMDcgMi44MjktLjA0MSAxLjg5OS0uMDg2IDIuNzgyLS45ODggMi44Ny0yLjg3LjAzMy0uNzM4LjA0LS45Ni4wNC0yLjgyOXMtLjAwNy0yLjA5LS4wNC0yLjgyOGMtLjA4OC0xLjg4My0uOTczLTIuNzgzLTIuODctMi44N3ptLTIuODI5IDkuMjkzYy0xLjk4NSAwLTMuNTk1LTEuNjA5LTMuNTk1LTMuNTk1IDAtMS45ODUgMS42MS0zLjU5NCAzLjU5NS0zLjU5NHMzLjU5NSAxLjYwOSAzLjU5NSAzLjU5NGMwIDEuOTg1LTEuNjEgMy41OTUtMy41OTUgMy41OTV6bTMuNzM3LTYuNDkxYy0uNDY0IDAtLjg0LS4zNzYtLjg0LS44NCAwLS40NjQuMzc2LS44NC44NC0uODQuNDY0IDAgLjg0LjM3Ni44NC44NCAwIC40NjMtLjM3Ni44NC0uODQuODR6bS0xLjQwNCAyLjg5NmMwIDEuMjg5LTEuMDQ1IDIuMzMzLTIuMzMzIDIuMzMzcy0yLjMzMy0xLjA0NC0yLjMzMy0yLjMzM2MwLTEuMjg5IDEuMDQ1LTIuMzMzIDIuMzMzLTIuMzMzczIuMzMzIDEuMDQ0IDIuMzMzIDIuMzMzem0tMi4zMzMtMTJjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bTYuOTU4IDE0Ljg4NmMtLjExNSAyLjU0NS0xLjUzMiAzLjk1NS00LjA3MSA0LjA3Mi0uNzQ3LjAzNC0uOTg2LjA0Mi0yLjg4Ny4wNDJzLTIuMTM5LS4wMDgtMi44ODYtLjA0MmMtMi41NDQtLjExNy0zLjk1NS0xLjUyOS00LjA3Mi00LjA3Mi0uMDM0LS43NDYtLjA0Mi0uOTg1LS4wNDItMi44ODYgMC0xLjkwMS4wMDgtMi4xMzkuMDQyLTIuODg2LjExNy0yLjU0NCAxLjUyOS0zLjk1NSA0LjA3Mi00LjA3MS43NDctLjAzNS45ODUtLjA0MyAyLjg4Ni0uMDQzczIuMTQuMDA4IDIuODg3LjA0M2MyLjU0NS4xMTcgMy45NTcgMS41MzIgNC4wNzEgNC4wNzEuMDM0Ljc0Ny4wNDIuOTg1LjA0MiAyLjg4NiAwIDEuOTAxLS4wMDggMi4xNC0uMDQyIDIuODg2eiIvPjwvc3ZnPg==";

    // Append the image inside the link element
    instagramLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(instagramLink);
  }

  if (accounts.tiktok) {
    // Create a link element
    const tiktokLink = document.createElement("a");
    tiktokLink.href = accounts.twitch;
    tiktokLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1730918291/tiktok_qipjuq.png";

    // Append the image inside the link element
    tiktokLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(tiktokLink);
  }

  if (accounts.whatsapp) {
    // Create a link element
    const whatsappLink = document.createElement("a");
    whatsappLink.href = accounts.twitch;
    whatsappLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIuMDMxIDYuMTcyYy0zLjE4MSAwLTUuNzY3IDIuNTg2LTUuNzY4IDUuNzY2LS4wMDEgMS4yOTguMzggMi4yNyAxLjAxOSAzLjI4N2wtLjU4MiAyLjEyOCAyLjE4Mi0uNTczYy45NzguNTggMS45MTEuOTI4IDMuMTQ1LjkyOSAzLjE3OCAwIDUuNzY3LTIuNTg3IDUuNzY4LTUuNzY2LjAwMS0zLjE4Ny0yLjU3NS01Ljc3LTUuNzY0LTUuNzcxem0zLjM5MiA4LjI0NGMtLjE0NC40MDUtLjgzNy43NzQtMS4xNy44MjQtLjI5OS4wNDUtLjY3Ny4wNjMtMS4wOTItLjA2OS0uMjUyLS4wOC0uNTc1LS4xODctLjk4OC0uMzY1LTEuNzM5LS43NTEtMi44NzQtMi41MDItMi45NjEtMi42MTctLjA4Ny0uMTE2LS43MDgtLjk0LS43MDgtMS43OTNzLjQ0OC0xLjI3My42MDctMS40NDZjLjE1OS0uMTczLjM0Ni0uMjE3LjQ2Mi0uMjE3bC4zMzIuMDA2Yy4xMDYuMDA1LjI0OS0uMDQuMzkuMjk4LjE0NC4zNDcuNDkxIDEuMi41MzQgMS4yODcuMDQzLjA4Ny4wNzIuMTg4LjAxNC4zMDQtLjA1OC4xMTYtLjA4Ny4xODgtLjE3My4yODlsLS4yNi4zMDRjLS4wODcuMDg2LS4xNzcuMTgtLjA3Ni4zNTQuMTAxLjE3NC40NDkuNzQxLjk2NCAxLjIwMS42NjIuNTkxIDEuMjIxLjc3NCAxLjM5NC44NnMuMjc0LjA3Mi4zNzYtLjA0M2MuMTAxLS4xMTYuNDMzLS41MDYuNTQ5LS42OC4xMTYtLjE3My4yMzEtLjE0NS4zOS0uMDg3czEuMDExLjQ3NyAxLjE4NC41NjQuMjg5LjEzLjMzMi4yMDJjLjA0NS4wNzIuMDQ1LjQxOS0uMS44MjR6bS0zLjQyMy0xNC40MTZjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bS4wMjkgMTguODhjLTEuMTYxIDAtMi4zMDUtLjI5Mi0zLjMxOC0uODQ0bC0zLjY3Ny45NjQuOTg0LTMuNTk1Yy0uNjA3LTEuMDUyLS45MjctMi4yNDYtLjkyNi0zLjQ2OC4wMDEtMy44MjUgMy4xMTMtNi45MzcgNi45MzctNi45MzcgMS44NTYuMDAxIDMuNTk4LjcyMyA0LjkwNyAyLjAzNCAxLjMxIDEuMzExIDIuMDMxIDMuMDU0IDIuMDMgNC45MDgtLjAwMSAzLjgyNS0zLjExMyA2LjkzOC02LjkzNyA2LjkzOHoiLz48L3N2Zz4=";

    // Append the image inside the link element
    whatsappLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(whatsappLink);
  }

  if (accounts.snapchat) {
    // Create a link element
    const snapchatLink = document.createElement("a");
    snapchatLink.href = accounts.twitch;
    snapchatLink.target = "_blank";

    // Create the image elemment
    const iconImg = document.createElement("img");
    iconImg.classList.add("iconImg");
    iconImg.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptNS4xMjYgMTYuNDc1Yy0uMDU3LjA3Ny0uMTAzLjQtLjE3OC42NTUtLjA4Ni4yOTUtLjM1Ni4yNjItLjY1Ni4yMDMtLjQzNy0uMDg1LS44MjctLjEwOS0xLjI4MS0uMDM0LS43ODUuMTMxLTEuNjAxIDEuMjkyLTIuOTY5IDEuMjkyLTEuNDcyIDAtMi4yMzgtMS4xNTYtMy4wNTQtMS4yOTItLjgzMi0uMTM4LTEuMzEuMDg0LTEuNTk3LjA4NC0uMjIxIDAtLjMwNy0uMTM1LS4zNC0uMjQ3LS4wNzQtLjI1MS0uMTItLjU4MS0uMTc4LS42Ni0uNTY1LS4wODctMS44NC0uMzA5LTEuODczLS44NzgtLjAwOC0uMTQ4LjA5Ni0uMjc5LjI0My0uMzAzIDEuODcyLS4zMDggMy4wNjMtMi40MTkgMi44NjktMi44NzctLjEzOC0uMzI1LS43MzUtLjQ0Mi0uOTg2LS41NDEtLjY0OC0uMjU2LS43MzktLjU1LS43LS43NTIuMDUzLS4yOC4zOTUtLjQ2OC42OC0uNDY4LjI3NSAwIC43Ni4zNjcgMS4xMzguMTU4LS4wNTUtLjk4Mi0uMTk0LTIuMzg3LjE1Ni0zLjE3MS42NjctMS40OTYgMi4xMjktMi4yMzYgMy41OTItMi4yMzYgMS40NzMgMCAyLjk0Ni43NSAzLjYwOCAyLjIzNS4zNDkuNzgzLjIxMiAyLjE4MS4xNTYgMy4xNzIuMzU3LjE5Ny43OTktLjE2NyAxLjEwNy0uMTY3LjMwMiAwIC43MTIuMjA0LjcxOS41NDUuMDA1LjI2Ny0uMjMzLjQ5Ny0uNzA4LjY4NC0uMjU1LjEwMS0uODQ4LjIxNy0uOTg2LjU0MS0uMTk4LjQ2OCAxLjAzIDIuNTczIDIuODY5IDIuODc2LjE0Ni4wMjQuMjUxLjE1NC4yNDMuMzAzLS4wMzMuNTY5LTEuMzE0Ljc5MS0xLjg3NC44Nzh6Ii8+PC9zdmc+";

    // Append the image inside the link element
    snapchatLink.appendChild(iconImg);

    // Append the link to the social media container
    connectedAccountsDisplay.appendChild(snapchatLink);
  }
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
  const twitterRegex = /(https?:\/\/(x\.com|twitter\.com)\/([a-zA-Z0-9_]+))/g;

  // Replace YouTube video URLs with an iframe embed
  bioText = bioText.replace(youtubeVideoRegex, (url, _, videoId) => {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
allowfullscreen></iframe>`;
  });

  // Replace YouTube channel/profile links with a clickable YouTube button
  bioText = bioText.replace(youtubeChannelRegex, (url, type, channelId) => {
    return `<a href="${url}" target="_blank">
        <img src="https://www.youtube.com/about/static/svgs/icons/brand-resources/YouTube-logo-full_color_light.svg" alt="YouTube" width="120">
        Visit my YouTube Channel
      </a>`;
  });

  // Replace Twitter/X profile links with a clickable Twitter button
  bioText = bioText.replace(twitterRegex, (url, _, username) => {
    return `<a class="twitter-timeline" href="${url}" data-width="400" data-height="600" target="_blank">Tweets by @${username}</a>`;
  });

  return bioText;
}

// Load the existing profile picture, bio, and background image
fetch(`/get-user-profile?username=${username}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.profilePic) {
      profilePicElement[0].src = data.profilePic;
      profilePicElement[1].src = data.profilePic;
      profilePicElement[2].src = data.profilePic;
      homeElement.style.background = `linear-gradient(
        rgba(220, 216, 216, 0.5),
        rgba(220, 216, 216, 0.5)
      ), url(${data.backgroundImg})`;
      homeElement.style.backgroundSize = 'cover';
    } else {
      profilePicElement[0].src = "/uploads/default-avatar.png";
      profilePicElement[1].src = "/uploads/default-avatar.png";
      profilePicElement[2].src = "/uploads/default-avatar.png";
      homeElement.style.background = `linear-gradient(
        rgba(220, 216, 216, 0.5),
        rgba(220, 216, 216, 0.5)
      ), url("https://res.cloudinary.com/dxseoqcpb/image/upload/v1729122093/base/t2laawx0hmk39czdqqgk.png")`;
      homeElement.style.backgroundSize = 'cover';
    }
    if (data.bio) {
      bioDisplayElement.innerHTML = autoEmbedBio(data.bio);
      // Append Twitter widget script if needed...
    } else {
      bioDisplayElement.textContent = "No bio available";
    }

    // Display the user's full name
    document.getElementsByClassName(
      "full-name"
    )[0].textContent = `${data.firstName} ${data.lastName}`;
    document.getElementsByClassName(
      "full-name"
    )[1].textContent = `${data.firstName} ${data.lastName}`;
    document.getElementsByClassName(
      "full-name"
    )[2].textContent = `${data.firstName} ${data.lastName}`;

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
  .catch((error) => {
    console.error("Error fetching profile:", error);
  });

//Show the profile picture edit window
profilePictureBtn.addEventListener("click", function () {
  profilePictureModal.style.display = "block";
});

// Close the profile picture edit window modal when clicking x
var profilePictureClose = document.getElementsByClassName("closeBtn")[2];
profilePictureClose.onclick = function () {
  profilePictureModal.style.display = "none";
  uploadBtn.style.display = "none";
  imagePreview.src =
    "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
  profilePic.value = "";
};

// Event listener for file selection
profilePic.addEventListener("change", function () {
  const file = profilePic.files[0];
  if (file) {
    uploadBtn.style.display = "inline";
    const reader = new FileReader();

    reader.onload = function (e) {
      imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
    profilePic.value = "";
    uploadBtn.style.display = "none";
  }
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
        profilePicElement[2].src = data.profilePic;
        messageElement.style.display = "none";
        profilePictureModal.style.display = "none";
        imagePreview.src =
          "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
        profilePic.value = "";
        uploadBtn.style.display = "none";
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
  picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
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

let isDeleteAccountBtn = false; //Check the delete account button is on or off
// Show and Hide Button of the profile information
document.getElementById("showBtn").addEventListener("click", function () {
  if (document.getElementById("showBtn").textContent === "Show Profile") {
    usernameElement.style.display = "inline";
    emailElement.style.display = "inline";
    phoneElement.style.display = "inline";
    deleteAccountBtn.style.display = "block";
    isDeleteAccountBtn = true;
    document.getElementById("showBtn").textContent = "Hide Profile";
    document.getElementsByClassName("grid-container")[0].style.marginTop =
      "10px";
  } else {
    usernameElement.style.display = "none";
    emailElement.style.display = "none";
    phoneElement.style.display = "none";
    deleteAccountBtn.style.display = "none";
    isDeleteAccountBtn = false;
    document.getElementById("showBtn").textContent = "Show Profile";
    if (window.innerWidth <= 1000) {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "110px";
    } else {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "30px";
    }
  }
});

// Display the edit button
document.getElementById("editBtn").addEventListener("click", function () {
  usernameElement.style.display = "inline";
  emailElement.style.display = "inline";
  phoneElement.style.display = "inline";
  deleteAccountBtn.style.display = "block";
  isDeleteAccountBtn = true;
  document.getElementById("showBtn").style.display = "none";
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("updateBtn").style.display = "block";
  document.getElementById("cancelBtn").style.display = "block";
  document.getElementsByClassName("grid-container")[0].style.marginTop = "10px";

  firstNameElement.removeAttribute("readonly");
  lastNameElement.removeAttribute("readonly");
  phoneElement.removeAttribute("readonly");
});

// Cancel edit button
document.getElementById("cancelBtn").addEventListener("click", function () {
  window.location.href = "/profile";
});

// Edit password button
document
  .getElementById("editPasswordBtn")
  .addEventListener("click", function () {
    document.getElementsByClassName("button-container")[1].style.display =
      "flex";
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
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmNewPasswordInput.value = "";
    passwordMessage.style.display = "none";
  });

// Update the profile
document.getElementById("updateBtn").addEventListener("click", function () {
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
    passwordMessage.textContent = "";
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
deleteAccountBtn.addEventListener("click", function () {
  // Show the modal when the delete account button is clicked
  deleteAccountModal.style.display = "block";
});

// Close the inbox modal when clicking x
var deleteAccountClose = document.getElementsByClassName("closeBtn")[0];
deleteAccountClose.onclick = function () {
  deleteAccountModal.style.display = "none";
  const passwordInput = document.getElementById("currentPassword");
  passwordInput.value = "";
  deleteMessage.textContent = "";
};

// When the user clicks anywhere outside of any modal, close it
window.onclick = function (event) {
  if (event.target == deleteAccountModal) {
    deleteAccountModal.style.display = "none";
    const passwordInput = document.getElementById("currentPassword");
    passwordInput.value = "";
    deleteMessage.textContent = "";
  } else if (event.target == profilePictureModal) {
    profilePictureModal.style.display = "none";
    imagePreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
    profilePic.value = "";
    uploadBtn.style.display = "none";
  } else if (event.target == connectedAccountModal) {
    connectedAccountModal.style.display = "none";
    accountsMessage.textContent = "";
  } else if (event.target == settingsModal) {
    settingsModal.style.display = "none";
    backgroundPreview.src =
      "https://res.cloudinary.com/dxseoqcpb/image/upload/v1731477138/imageUpload_jgwzeb.png";
    backgroundImg.value = "";
    saveSettingsBtn.style.display = "none";
    backgroundMessage.textContent = "";
  }
};

confirmDeleteBtn.addEventListener("click", function () {
  const currentPassword = document.getElementById("currentPassword").value;

  if (!currentPassword) {
    alert("Please enter your password.");
    return;
  }

  fetch("/delete-account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, currentPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Your account has been deleted");
        window.location.href = "/signin";
      } else {
        deleteMessage.textContent = data.message || "Failed to delete account.";
      }
    })
    .catch((error) => {
      console.error("Error deleting account:", error);
    });
});

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
    if (isDeleteAccountBtn) {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "10px";
    } else {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "110px";
    }
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

    if (isDeleteAccountBtn) {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "10px";
    } else {
      document.getElementsByClassName("grid-container")[0].style.marginTop =
        "30px";
    }
  }
}

// Run on load and on resize
window.addEventListener("resize", checkHomeWidth);
window.addEventListener("load", checkHomeWidth);

// sidebar.js

// Ensure the user is logged in
const username = localStorage.getItem('username');

if (!username) {
  window.location.href = "/signin";
}

// Elements for profile picture and full name
const profilePicElements = document.getElementsByClassName("profile-pic");
const fullNameElements = document.getElementsByClassName("full-name");

// Fetch user profile and update profile picture and name
fetch(`/get-user-profile?username=${encodeURIComponent(username)}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      // Update profile pictures
      for (let i = 0; i < profilePicElements.length; i++) {
        profilePicElements[i].src = data.profilePic || "/uploads/default-avatar.png";
      }

      // Update full names
      for (let i = 0; i < fullNameElements.length; i++) {
        fullNameElements[i].textContent = `${data.firstName} ${data.lastName}`;
      }
    } else {
      console.error("Failed to load profile:", data.message);
    }
  })
  .catch((error) => {
    console.error("Error fetching profile:", error);
  });

 // Check if elements exist before proceeding
if (profilePicElements.length > 0 && fullNameElements.length > 0) {
    // Fetch user profile and update profile picture and name
    fetch(`/get-user-profile?username=${encodeURIComponent(username)}`)
      // ... rest of the code ...
  } else {
    console.warn("Sidebar profile elements not found.");
  } 

// sidebar.js

function updateSidebarProfilePic(newProfilePicUrl) {
  // Update profile pictures
  for (let i = 0; i < profilePicElements.length; i++) {
    profilePicElements[i].src = newProfilePicUrl || "/uploads/default-avatar.png";
  }
}
if (data.success) {
  profilePicElement[0].src = data.profilePic;
  profilePicElement[1].src = data.profilePic;
  messageElement.style.display = "none";

  // Dispatch an event to update the sidebar profile picture
  const event = new CustomEvent('profilePicUpdated', { detail: { profilePic: data.profilePic } });
  document.dispatchEvent(event);
}
// sidebar.js

document.addEventListener('profilePicUpdated', (event) => {
  const newProfilePicUrl = event.detail.profilePic;
  // Update profile pictures
  for (let i = 0; i < profilePicElements.length; i++) {
    profilePicElements[i].src = newProfilePicUrl || "/uploads/default-avatar.png";
  }
});


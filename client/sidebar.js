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
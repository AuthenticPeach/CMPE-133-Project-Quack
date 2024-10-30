
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const socket = io();

signupForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the form from doing a traditional submit

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Check if passwords match
  if (password !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match';
    return;
  }
  
  // Check if password strength
   if (checkPasswordStrength() == -1) {
    return;
   };

  const data = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    phoneNumber: document.getElementById('phoneNumber').value.trim(),
    password: password.trim(),
    confirmPassword: confirmPassword.trim()
  };

  fetch('/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(response => {
    if (response.success) {
      // Redirect to user-dashboard.html
      window.location.href = '/pages/UserDashboard/user-dashboard.html';
    } else {
      errorMessage.textContent = response.message; // Show the error message
    }
  })
  .catch(error => {
    console.error('Error during signup:', error);
    errorMessage.textContent = 'An error occurred during signup.';
  });
});

const passwordInput = document.getElementById('password');
const passwordStrength = document.getElementById('password-strength');

// Function to check the strength of the password
function checkPasswordStrength() {
  const password = passwordInput.value;
  
  if (password.length < 8) {
    passwordStrength.style.display = 'block';
    passwordStrength.textContent = '✖ At least 8 characters in length';
    return -1;
  } else if (!/[A-Z]/.test(password)) {
    passwordStrength.style.display = 'block';
    passwordStrength.textContent = '✖ Should contain upper case letters (A-Z)';
    return -1;
  } else if (!/[a-z]/.test(password)) {
    passwordStrength.style.display = 'block';
    passwordStrength.textContent = '✖ Should contain lower case letters (a-z)';
    return -1;
  } else if (!/\d/.test(password)) {
    passwordStrength.style.display = 'block';
    passwordStrength.textContent = '✖ Should contain number (0-9)';
    return -1;
  } else if (!/[!@#$%^&*()\-\+=|{};:?.\\_]/.test(password)) {
    passwordStrength.style.display = 'block';
    passwordStrength.textContent = '✖ Should contain special character';
    return -1;
  } else {
    passwordStrength.style.display = 'none';
  }    
}

// Add event listener to the password input
passwordInput.addEventListener('input', checkPasswordStrength);

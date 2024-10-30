
const signinForm = document.getElementById('signin-form');
const errorMessage = document.getElementById('error-message');
const socket = io();

signinForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the form from doing a traditional submit

  const data = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  };

  // Emit the signin data via Socket.IO
  socket.emit('signin', data);

  // After receiving a successful sign-in response, emit the 'set username' event
  socket.on('signin response', function(response) {
    if (response.success) {
        const username = document.getElementById('username').value; // Get the username from the input field
        localStorage.setItem('username', username); // Store the username in localStorage
        socket.emit('set username', username); // Emit the set username event
        window.location.href = '/pages/UserDashboard/user-dashboard.html'; // Redirect to the user dashboard
    } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = response.message; // Show the error message
    }
  });

});
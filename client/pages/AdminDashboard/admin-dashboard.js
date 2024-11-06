function fetchUsers() {
    fetch('/admin/get-users')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          populateUsersTable(data.users);
        } else {
          alert('Failed to load users.');
        }
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }
  
// Fetch the list of users when the page loads
window.onload = function() {
    fetchUsers();
  
    // Handle the confirm button click
    document.getElementById('mute-confirm-btn').addEventListener('click', function() {
        const days = parseInt(document.getElementById('mute-days').value);
        const hours = parseInt(document.getElementById('mute-hours').value);
        const minutes = parseInt(document.getElementById('mute-minutes').value);
        const reason = document.getElementById('mute-reason').value.trim();
  
    // Validate inputs
    if (
        isNaN(days) ||
        isNaN(hours) ||
        isNaN(minutes) ||
        (days === 0 && hours === 0 && minutes === 0) ||
        days < 0 ||
        hours < 0 ||
        minutes < 0
      ) {
        alert('Invalid duration. Please enter valid non-negative numbers.');
        return;
      }
  
      if (!reason) {
        alert('Please provide a reason for the mute.');
        return;
      }

      const username = window.userToMute;
  
      // Send a request to the server to mute the user
      fetch('/admin/mute-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, days, hours, minutes, reason }),
      })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
            alert(`User ${username} has been muted for ${days} day(s), ${hours} hour(s), and ${minutes} minute(s).`);
            // Refresh the users table
            fetchUsers();
            } else {
            alert(`Failed to mute user: ${data.message}`);
            }
        })
        .catch(error => console.error('Error muting user:', error));
    
      // Close the modal
      document.getElementById('muteModal').style.display = 'none';
    });
  
    // Handle the cancel button click
    document.getElementById('mute-cancel-btn').addEventListener('click', function() {
      // Close the modal
      document.getElementById('muteModal').style.display = 'none';
    });
  
    // Add event listener for the complaints modal close button
    document.querySelector('#complaintsModal .close').addEventListener('click', function() {
      document.getElementById('complaintsModal').style.display = 'none';
    });
  
    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
      const complaintsModal = document.getElementById('complaintsModal');
      const muteModal = document.getElementById('muteModal');
      if (event.target === complaintsModal) {
        complaintsModal.style.display = 'none';
      } else if (event.target === muteModal) {
        muteModal.style.display = 'none';
      }
    });
  
    // Close modals on Escape key press
    window.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        document.getElementById('complaintsModal').style.display = 'none';
        document.getElementById('muteModal').style.display = 'none';
      }
    });
  };  
  
  function populateUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = ''; // Clear existing rows
  
    users.forEach(user => {
      const tr = document.createElement('tr');
  
      // Username
      const usernameTd = document.createElement('td');
      usernameTd.textContent = user.username;
      tr.appendChild(usernameTd);
  
      // Email
      const emailTd = document.createElement('td');
      emailTd.textContent = user.email;
      tr.appendChild(emailTd);
  
      // First Name
      const firstNameTd = document.createElement('td');
      firstNameTd.textContent = user.firstName;
      tr.appendChild(firstNameTd);
  
      // Last Name
      const lastNameTd = document.createElement('td');
      lastNameTd.textContent = user.lastName;
      tr.appendChild(lastNameTd);
  
      // Phone Number
      const phoneTd = document.createElement('td');
      phoneTd.textContent = user.phoneNumber;
      tr.appendChild(phoneTd);
  
      // Messages Count
      const messagesCountTd = document.createElement('td');
      messagesCountTd.textContent = user.messagesCount;
      tr.appendChild(messagesCountTd);
  
      // Delete Messages (In the case of banning)
      const deleteMessagesTd = document.createElement('td');
      const deleteMessagesButton = document.createElement('button');
      deleteMessagesButton.textContent = 'Delete Messages';
      deleteMessagesButton.classList.add('delete-messages-button'); // Add a class for styling
      deleteMessagesButton.addEventListener('click', function() {
        deleteUserMessages(user.username);
      });
      deleteMessagesTd.appendChild(deleteMessagesButton);
      tr.appendChild(deleteMessagesTd);

      // Reports
      const reportsTd = document.createElement('td');
      if (user.reportsCount > 0) {
        const reportsLink = document.createElement('a');
        reportsLink.href = '#'; // Replace with actual link to reports page
        reportsLink.textContent = `${user.reportsCount} Report(s)`;
        reportsLink.addEventListener('click', function(event) {
          event.preventDefault();
          // Handle viewing reports for this user
          viewUserReports(user.username);
        });
        reportsTd.appendChild(reportsLink);
      } else {
        reportsTd.textContent = 'No Reports';
      }
      tr.appendChild(reportsTd);
  
      // Status
      const statusTd = document.createElement('td');
      const isMuted = user.muteUntil && new Date(user.muteUntil) > new Date();
      if (user.isBanned) {
        statusTd.textContent = 'Banned';
        statusTd.style.color = 'red';
      } else if (isMuted) {
        const muteExpiry = new Date(user.muteUntil);
        statusTd.textContent = `Muted until ${muteExpiry.toLocaleString()}`;
        statusTd.style.color = 'orange';
      } else {
        statusTd.textContent = 'Active';
        statusTd.style.color = 'green';
      }
  
      // Actions
      const actionsTd = document.createElement('td');
  
      // Ban/Unban Button
      const banButton = document.createElement('button');
      if (user.isBanned) {
        banButton.textContent = 'Unban';
        banButton.addEventListener('click', function() {
          unbanUser(user.username);
        });
      } else {
        banButton.textContent = 'Ban';
        banButton.addEventListener('click', function() {
          banUser(user.username);
        });
      }
      actionsTd.appendChild(banButton);
  
      // Mute/Unmute Button
      const muteButton = document.createElement('button');
      if (isMuted) {
        muteButton.textContent = 'Unmute';
        muteButton.addEventListener('click', function() {
          unmuteUser(user.username);
        });
      } else {
        muteButton.textContent = 'Mute';
        muteButton.addEventListener('click', function() {
          muteUser(user.username);
        });
      }
      actionsTd.appendChild(muteButton);
  
      tr.appendChild(actionsTd);

      tr.appendChild(statusTd);
  
      // Append the row to the table body
      tbody.appendChild(tr);
    });
  }

  function deleteUserMessages(username) {
    if (confirm(`Are you sure you want to delete all messages from user ${username}? This action cannot be undone.`)) {
      fetch('/admin/delete-user-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`All messages from user ${username} have been deleted.`);
          // Optionally, refresh the users table or update the messages count
          fetchUsers();
        } else {
          alert(`Failed to delete messages: ${data.message}`);
        }
      })
      .catch(error => console.error('Error deleting user messages:', error));
    }
  }
  
  
  // Placeholder functions for actions
  function viewUserReports(username) {
    alert(`Viewing reports for user: ${username}`);
    // Implement viewing reports functionality
  }
  
  // Function to open the mute modal
  function muteUser(username) {
    // Store the username for use in the confirm function
    window.userToMute = username;
    // Open the modal
    document.getElementById('muteModal').style.display = 'block';
  }
  
  function banUser(username) {
    const reason = prompt(`Please enter a reason for banning ${username}:`);
    if (!reason || reason.trim() === '') {
      alert('You must provide a reason for banning the user.');
      return;
    }
  
    if (confirm(`Are you sure you want to ban user ${username}?`)) {
      // Send a request to the server to ban the user
      fetch('/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, reason }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert(`User ${username} has been banned.`);
            // Refresh the users table
            fetchUsers();
          } else {
            alert(`Failed to ban user: ${data.message}`);
          }
        })
        .catch(error => console.error('Error banning user:', error));
    }
  }
  
  
  function unbanUser(username) {
    if (confirm(`Are you sure you want to unban user ${username}?`)) {
      fetch('/admin/unban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`User ${username} has been unbanned.`);
          // Refresh the users table
          fetchUsers();
        } else {
          alert(`Failed to unban user: ${data.message}`);
        }
      })
      .catch(error => console.error('Error unbanning user:', error));
    }
  }
  
  function unmuteUser(username) {
    if (confirm(`Are you sure you want to unmute user ${username}?`)) {
      fetch('/admin/unmute-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`User ${username} has been unmuted.`);
          // Refresh the users table
          fetchUsers();
        } else {
          alert(`Failed to unmute user: ${data.message}`);
        }
      })
      .catch(error => console.error('Error unmuting user:', error));
    }
  }
  
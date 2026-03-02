document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // always ask the server for fresh data; browsers can cache GETs aggressively
      const response = await fetch("/activities", { cache: "no-cache" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // also reset the activity selection dropdown so we don't duplicate options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li data-activity="${name}" data-email="${email}"><span class="participant-avatar">${email
                        .charAt(0)
                        .toUpperCase()}</span> ${email} <span class="delete-icon" title="Remove participant" data-activity="${name}" data-email="${email}">&#x2716;</span></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <span class="no-participants">No one signed up yet.</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // attach delete handlers for any icons we just created
        activityCard.querySelectorAll('.delete-icon').forEach(icon => {
          icon.addEventListener('click', async (evt) => {
            // prevent bubbling and form submission etc.
            evt.stopPropagation();

            const activityName = icon.getAttribute('data-activity');
            const email = icon.getAttribute('data-email');

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const data = await res.json();

              if (res.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'success';
                // refresh list so UI stays up to date
                fetchActivities();
              } else {
                messageDiv.textContent = data.detail || 'Failed to unregister';
                messageDiv.className = 'error';
              }
            } catch (error) {
              messageDiv.textContent = 'Error performing unregister request';
              messageDiv.className = 'error';
              console.error('Unregister error:', error);
            }

            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // reload activities so we can show the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

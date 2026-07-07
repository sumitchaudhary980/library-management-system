async function loadProfile() {
  try {
    const response = await fetch("/api/user/profile", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message, "error");
      return;
    }

    const user = data.user;

    // Left Card
    document.getElementById("fullName").textContent =
      `${user.first_name} ${user.last_name}`;

    document.getElementById("profileEmail").textContent = user.email;

    document.getElementById("roleBadge").textContent =
      capitalize(user.role);

    // Personal Information
    document.getElementById("firstName").textContent =
      user.first_name;

    document.getElementById("lastName").textContent =
      user.last_name;

    document.getElementById("gender").textContent =
      capitalize(user.gender);

    document.getElementById("email").textContent =
      user.email;

    document.getElementById("phone").textContent =
      user.phone || "Not Provided";

    document.getElementById("address").textContent =
      user.address || "Not Provided";

    document.getElementById("role").textContent =
      capitalize(user.role);

    document.getElementById("createdAt").textContent =
      formatDate(user.created_at);

    // Profile Image
    if (user.profile_image) {
      document.getElementById("profileImageContainer").innerHTML = `
        <img
          src="${user.profile_image}"
          class="profile-avatar"
          alt="Profile Image"
        >
      `;
    }

  } catch (err) {
    console.error(err);
    showToast("Something went wrong", "error");
  }
}

function capitalize(text) {
  if (!text) return "-";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

loadProfile();
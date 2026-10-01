document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  // Add loading state
  const loginButton = document.querySelector('#loginForm button[type="submit"]');
  const originalButtonText = loginButton.innerHTML;

  loginButton.disabled = true;
  loginButton.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    Authenticating...
  `;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // First login - force password change
      if (data.requirePasswordChange) {
        showToast("Please change your temporary password.", "info");

        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1000);

        return;
      }

      showToast("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
    } else {
      // Restore button if login fails
      loginButton.disabled = false;
      loginButton.innerHTML = originalButtonText;

      showToast(data.message || "Invalid credentials.", "error");
    }
  } catch (err) {
    console.error("Login error:", err);

    // Restore button if request fails
    loginButton.disabled = false;
    loginButton.innerHTML = originalButtonText;

    showToast("Something went wrong. Try again.", "error");
  }
});


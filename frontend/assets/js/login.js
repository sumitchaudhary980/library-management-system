document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.currentTarget;
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = form.querySelector('button[type="submit"]');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  // Save original button content
  const originalButtonContent = loginButton.innerHTML;

  // Authentication loading state
  loginButton.disabled = true;
  loginButton.innerHTML = `
    <span
      class="spinner-border spinner-border-sm me-2"
      role="status"
      aria-hidden="true"
    ></span>
    Authenticating...
  `;

  // Prevent changing credentials while authenticating
  emailInput.disabled = true;
  passwordInput.disabled = true;

  try {
    const res = await fetch("/api/auth/admin/login", {
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
      showToast("Login successful! Redirecting...", "success");

      // Keep the button in loading state until redirect
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
    } else {
      // Server responded with an authentication error
      loginButton.disabled = false;
      loginButton.innerHTML = originalButtonContent;

      emailInput.disabled = false;
      passwordInput.disabled = false;

      showToast(data.message || "Invalid credentials.", "error");
    }
  } catch (err) {
    console.error("Login error:", err);

    // Restore form if the request itself failed
    loginButton.disabled = false;
    loginButton.innerHTML = originalButtonContent;

    emailInput.disabled = false;
    passwordInput.disabled = false;

    showToast("Something went wrong. Try again.", "error");
  }
});


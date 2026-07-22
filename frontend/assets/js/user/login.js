document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showToast("Please fill in all fields.", "error");
    return;
  }

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
      showToast(data.message || "Invalid credentials.", "error");
    }
  } catch (err) {
    console.error("Login error:", err);
    showToast("Something went wrong. Try again.", "error");
  }
});
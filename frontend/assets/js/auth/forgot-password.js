function showToast(message, type = "error") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 4000,
    timerProgressBar: true,
    customClass: {
      popup: "small-toast",
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

const params = new URLSearchParams(window.location.search);
const error = params.get("error");

if (error === "expired") {
  showToast(
    "Your password reset link has expired. Please request a new one.",
    "error"
  );

  window.history.replaceState(
    {},
    document.title,
    "/forgot-password"
  );
}

if (error === "invalid") {
  showToast(
    "Invalid password reset link.",
    "error"
  );

  window.history.replaceState(
    {},
    document.title,
    "/forgot-password"
  );
}

const email = document.getElementById("email");
const form = document.getElementById("forgotPasswordForm");
const submitBtn = document.getElementById("submitBtn");

let submitted = false;

function clearErrors() {
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => {
      el.classList.remove("is-invalid");
    });

  document
    .querySelectorAll(".invalid-feedback")
    .forEach((el) => {
      const def = el.getAttribute("data-default");

      if (def) {
        el.textContent = def;
      }

      el.style.display = "";
    });
}

function setError(input, message) {
  input.classList.add("is-invalid");

  const feedback =
    input.closest(".mb-4")?.querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent = message;
    feedback.style.display = "block";
  }
}

function clearError(input) {
  input.classList.remove("is-invalid");

  const feedback =
    input.closest(".mb-4")?.querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent =
      feedback.getAttribute("data-default") || "";

    feedback.style.display = "";
  }
}

function validateEmail() {
  const value = email.value.trim();

  if (!value) {
    setError(email, "Email is required");
    return false;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(value)) {
    setError(
      email,
      "Enter a valid email address"
    );
    return false;
  }

  clearError(email);
  return true;
}

email.addEventListener("input", () => {
  if (submitted) {
    validateEmail();
  }
});

email.addEventListener("blur", () => {
  if (submitted) {
    validateEmail();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateEmail()) {
    return;
  }

  setButtonLoading(submitBtn, true);

  try {
    const res = await fetch(
      "/api/auth/forgot-password",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.value.trim(),
        }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      showToast(
        data.message,
        "success"
      );

      form.reset();
      submitted = false;
      clearErrors();

      return;
    }

    if (data.errors?.email) {
      setError(
        email,
        data.errors.email
      );

      return;
    }

    showToast(
      data.message || "Something went wrong.",
      "error"
    );
  } catch (err) {
    console.error(err);

    showToast(
      "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
function showToast(message, type = "error") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 4000,
    timerProgressBar: true,
    customClass: { popup: "small-toast" }
  });

  Toast.fire({ icon: type, title: message });
}

const name = document.getElementById("name");
const biography = document.getElementById("biography");

let submitted = false;

function setError(input, message) {
  input.classList.add("is-invalid");

  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) feedback.textContent = message;
}

function clearError(input) {
  input.classList.remove("is-invalid");

  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) {
    const def = feedback.getAttribute("data-default");
    feedback.textContent = def || "";
  }
}

function clearErrors() {
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((el) => {
    const def = el.getAttribute("data-default");
    if (def) el.textContent = def;
  });
}

function validateName() {
  if (!name.value.trim()) {
    setError(name, "Author name is required");
    return false;
  }

  clearError(name);
  return true;
}

function validateForm() {
  clearErrors();
  return validateName();
}

// LIVE VALIDATION — only kicks in after the first submit attempt
name.addEventListener("input", () => {
  if (submitted) validateName();
});
name.addEventListener("blur", () => {
  if (submitted) validateName();
});

document.getElementById("authorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateForm()) return;

  try {
    const response = await fetch("/api/admin/authors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: name.value.trim(),
        biography: biography.value.trim()
      })
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Author added successfully", "success");
      setTimeout(() => {
        window.location.href = "/authors";
      }, 1000);
      return;
    }

    if (data.errors) {
      if (data.errors.name) setError(name, data.errors.name);
      if (data.errors.biography) setError(biography, data.errors.biography);
    }

    showToast(data.message || "Something went wrong", "error");
  } catch (err) {
    console.log(err);
    showToast("Server error", "error");
  }
});
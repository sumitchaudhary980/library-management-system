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

function validateName() {
  if (!name.value.trim()) {
    setError(name, "Genre name is required");
    return false;
  }

  clearError(name);
  return true;
}

// LIVE VALIDATION — only kicks in after the first submit attempt
name.addEventListener("input", () => {
  if (submitted) validateName();
});
name.addEventListener("blur", () => {
  if (submitted) validateName();
});

document.getElementById("genreForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateName()) return;

  try {
    const response = await fetch("/api/admin/genres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: name.value.trim()
      })
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Genre added successfully", "success");

      setTimeout(() => {
        window.location.href = "/genres";
      }, 1000);
      return;
    }

    if (data.errors?.name) setError(name, data.errors.name);

    showToast(data.message || "Something went wrong", "error");
  } catch (err) {
    console.log(err);
    showToast("Server error", "error");
  }
});
const genreId = window.location.pathname.split("/").pop();

const nameInput = document.getElementById("name");

let submitted = false;

function sweetToast(message, type = "error") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 3000,
    timerProgressBar: true,
    customClass: { popup: "small-toast" }
  });

  Toast.fire({ icon: type, title: message });
}

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
  if (!nameInput.value.trim()) {
    setError(nameInput, "Genre name is required");
    return false;
  }

  clearError(nameInput);
  return true;
}

// LIVE VALIDATION — only kicks in after the first submit attempt
nameInput.addEventListener("input", () => {
  if (submitted) validateName();
});
nameInput.addEventListener("blur", () => {
  if (submitted) validateName();
});

// LOAD GENRE
async function loadGenre() {
  try {
    const res = await fetch(`/api/admin/genres/${genreId}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) {
      nameInput.value = data.name;
    } else {
      sweetToast(data.message || "Failed to load genre", "error");
    }
  } catch (err) {
    console.log(err);
    sweetToast("Server error", "error");
  }
}

loadGenre();

// UPDATE GENRE
document.getElementById("genreForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateName()) return;

  try {
    const res = await fetch(`/api/admin/genres/${genreId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        name: nameInput.value.trim()
      })
    });

    const data = await res.json();

    if (res.ok) {
      sweetToast("Genre updated successfully", "success");

      setTimeout(() => {
        window.location.href = "/genres";
      }, 1000);
      return;
    }

    if (data.errors?.name) setError(nameInput, data.errors.name);

    sweetToast(data.message || "Failed to update genre", "error");
  } catch (err) {
    console.log(err);
    sweetToast("Server error", "error");
  }
});
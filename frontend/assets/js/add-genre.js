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


const nameInput = document.getElementById("name");
const submitBtn = document.getElementById("submitBtn");

let submitted = false;


/* ---------- Error Handling ---------- */

function setError(input, message) {
  input.classList.add("is-invalid");

  const feedback =
    input.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent = message;
  }
}


function clearError(input) {
  input.classList.remove("is-invalid");

  const feedback =
    input.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent =
      feedback.getAttribute("data-default") || "";
  }
}


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
    });
}



/* ---------- Validation ---------- */

function validateName() {
  if (!nameInput.value.trim()) {
    setError(nameInput, "Genre name is required");
    return false;
  }

  clearError(nameInput);
  return true;
}


function validateForm() {
  clearErrors();

  return validateName();
}



/* ---------- Live Validation ---------- */

nameInput.addEventListener("input", () => {
  if (submitted) {
    validateName();
  }
});


nameInput.addEventListener("blur", () => {
  if (submitted) {
    validateName();
  }
});
document.getElementById("genreForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateForm()) return;

  if (submitBtn.disabled) return;

  setButtonLoading(submitBtn, true);

  try {

    const response = await fetch("/api/admin/genres", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput.value.trim(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast(
        data.message || "Genre added successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "/genres";
      }, 1500);

      return;
    }

    clearErrors();

    if (data.errors?.name) {
      setError(nameInput, data.errors.name);
    }

    if (!data.errors) {
      showToast(
        data.message || "Something went wrong.",
        "error"
      );
    }

  } catch (err) {

    console.error(err);

    showToast(
      "Server error. Please try again.",
      "error"
    );

  } finally {

    setButtonLoading(
      submitBtn,
      false
    );

  }
});
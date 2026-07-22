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

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const gender = document.getElementById("gender");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const address = document.getElementById("address");

let submitted = false;

function clearErrors() {
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((el) => {
    const def = el.getAttribute("data-default");
    if (def) el.textContent = def;
  });
}

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

/* ---------- Validators ---------- */

function validateFirstName() {
  if (!firstName.value.trim()) {
    setError(firstName, "First name is required");
    return false;
  }

  clearError(firstName);
  return true;
}

function validateLastName() {
  if (!lastName.value.trim()) {
    setError(lastName, "Last name is required");
    return false;
  }

  clearError(lastName);
  return true;
}

function validateGender() {
  if (!gender.value) {
    setError(gender, "Gender is required");
    return false;
  }

  clearError(gender);
  return true;
}

function validateEmail() {
  const value = email.value.trim();

  if (!value) {
    setError(email, "Email is required");
    return false;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(value)) {
    setError(email, "Enter a valid email");
    return false;
  }

  clearError(email);
  return true;
}

function validatePhone() {
  const value = phone.value.trim();

  if (!value) {
    clearError(phone);
    return true;
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(value)) {
    setError(phone, "Enter a valid phone number");
    return false;
  }

  clearError(phone);
  return true;
}

function validateForm() {
  clearErrors();

  return [
    validateFirstName(),
    validateLastName(),
    validateGender(),
    validateEmail(),
    validatePhone(),
  ].every(Boolean);
}

/* ---------- Live Validation ---------- */

firstName.addEventListener("input", () => {
  if (submitted) validateFirstName();
});

firstName.addEventListener("blur", () => {
  if (submitted) validateFirstName();
});

lastName.addEventListener("input", () => {
  if (submitted) validateLastName();
});

lastName.addEventListener("blur", () => {
  if (submitted) validateLastName();
});

gender.addEventListener("change", () => {
  if (submitted) validateGender();
});

email.addEventListener("input", () => {
  if (submitted) validateEmail();
});

email.addEventListener("blur", () => {
  if (submitted) validateEmail();
});

phone.addEventListener("input", () => {
  if (submitted) validatePhone();
});

phone.addEventListener("blur", () => {
  if (submitted) validatePhone();
});

document
  .getElementById("readerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    submitted = true;

    if (!validateForm()) return;

    const body = {
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      gender: gender.value,
      email: email.value.trim(),
      phone: phone.value.trim(),
      address: address.value.trim(),
    };

    try {
      const response = await fetch("/api/admin/readers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          "Reader created successfully. Temporary password has been emailed.",
          "success"
        );

        setTimeout(() => {
          location.href = "/readers";
        }, 1200);

        return;
      }

      clearErrors();

      if (data.errors?.first_name)
        setError(firstName, data.errors.first_name);

      if (data.errors?.last_name)
        setError(lastName, data.errors.last_name);

      if (data.errors?.gender)
        setError(gender, data.errors.gender);

      if (data.errors?.email)
        setError(email, data.errors.email);

      if (data.errors?.phone)
        setError(phone, data.errors.phone);

      if (!data.errors) {
        showToast(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong");
    }
  });
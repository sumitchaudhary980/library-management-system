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
const submitBtn = document.getElementById("submitBtn");

const readerId = window.location.pathname.split("/").pop();

let submitted = false;

function clearErrors() {
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((el) => {
    const def = el.getAttribute("data-default");

    if (def) {
      el.textContent = def;
    }
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
firstName.addEventListener("input", validateFirstName);
firstName.addEventListener("blur", validateFirstName);

lastName.addEventListener("input", validateLastName);
lastName.addEventListener("blur", validateLastName);

gender.addEventListener("change", validateGender);

email.addEventListener("input", validateEmail);
email.addEventListener("blur", validateEmail);

phone.addEventListener("input", validatePhone);
phone.addEventListener("blur", validatePhone);
async function loadReader() {
  try {
    const response = await fetch(`/api/admin/readers/${readerId}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load reader");

      setTimeout(() => {
        location.href = "/readers";
      }, 1200);

      return;
    }

    const reader = data.reader;

    firstName.value = reader.first_name || "";
    lastName.value = reader.last_name || "";
    gender.value = reader.gender || "";
    email.value = reader.email || "";
    phone.value = reader.phone || "";
    address.value = reader.address || "";
  } catch (err) {
    console.error(err);
    showToast("Failed to load reader");
  }
}

loadReader();
document
  .getElementById("readerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitBtn.disabled) return;

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

    setButtonLoading(submitBtn, true);

    try {
      const response = await fetch(`/api/admin/readers/${readerId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Reader updated successfully.", "success");

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
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
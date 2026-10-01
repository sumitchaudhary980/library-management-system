const form = document.getElementById("changePasswordForm");

const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnIcon = document.getElementById("btnIcon");

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});


async function loadProfile() {
  try {
    const response = await fetch("/api/user/profile", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message, "error");
      return;
    }

    const user = data.user;

    document.getElementById("fullName").textContent =
      `${user.first_name} ${user.last_name}`;

    document.getElementById("profileEmail").textContent =
      user.email;

    document.getElementById("roleBadge").textContent =
      capitalize(user.role);


    if (user.profile_image) {
      document.getElementById("profileImageContainer").innerHTML = `
        <img
          src="${user.profile_image}"
          class="profile-avatar"
          alt="${user.first_name} ${user.last_name} profile image"
          loading="lazy"
          decoding="async"
        >
      `;
    }

  } catch (error) {
    console.error(error);
    showToast("Something went wrong", "error");
  }
}


function capitalize(text) {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
}


function clearValidation(input) {

  input.classList.remove("is-invalid");

  const feedback =
    input
      .closest(".col-12, .col-md-6")
      .querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent = "";
  }

}



function showValidation(input, message) {

  input.classList.add("is-invalid");

  const feedback =
    input
      .closest(".col-12, .col-md-6")
      .querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent = message;
    feedback.style.display = "block";
  }

}
currentPassword.addEventListener("input", () => {
  validateCurrentPassword();
});


newPassword.addEventListener("input", () => {
  validateNewPassword();
  validateConfirmPassword();
});


confirmPassword.addEventListener("input", () => {
  validateConfirmPassword();
});



function validateCurrentPassword() {

  clearValidation(currentPassword);


  if (!currentPassword.value.trim()) {

    showValidation(
      currentPassword,
      "Current password is required"
    );

    return false;
  }


  return true;
}



function validateNewPassword() {

  clearValidation(newPassword);


  if (!newPassword.value.trim()) {

    showValidation(
      newPassword,
      "New password is required"
    );

    return false;
  }


  if (newPassword.value.length < 8) {

    showValidation(
      newPassword,
      "Password must be at least 8 characters"
    );

    return false;
  }


  return true;
}



function validateConfirmPassword() {

  clearValidation(confirmPassword);


  if (!confirmPassword.value.trim()) {

    showValidation(
      confirmPassword,
      "Confirm your new password"
    );

    return false;
  }


  if (
    confirmPassword.value !== newPassword.value
  ) {

    showValidation(
      confirmPassword,
      "Passwords do not match"
    );

    return false;
  }


  return true;
}



function setLoading(loading) {

  if (loading) {

    submitBtn.disabled = true;

    btnText.textContent = "Updating...";

    btnIcon.innerHTML =
      `<i class="fas fa-spinner fa-spin ms-2"></i>`;

  } else {

    submitBtn.disabled = false;

    btnText.textContent = "Update Password";

    btnIcon.innerHTML =
      `<i class="fas fa-key ms-2"></i>`;
  }
}



form.addEventListener("submit", async (e) => {

  e.preventDefault();


  const valid =
    validateCurrentPassword() &&
    validateNewPassword() &&
    validateConfirmPassword();


  if (!valid) return;



  try {

    setLoading(true);


    const response = await fetch(
      "/api/user/change-password",
      {
        method: "POST",

        headers:{
          "Content-Type":"application/json",
        },

        credentials:"include",

        body:JSON.stringify({

          currentPassword:
            currentPassword.value,

          password:
            newPassword.value,

          confirmPassword:
            confirmPassword.value,

        }),
      }
    );


    const data = await response.json();



    if (!response.ok) {

      showToast(
        data.message,
        "error"
      );

      return;
    }



    showToast(
      data.message,
      "success"
    );


    form.reset();


    clearValidation(currentPassword);
    clearValidation(newPassword);
    clearValidation(confirmPassword);



  } catch(error) {

    console.error(error);

    showToast(
      "Something went wrong",
      "error"
    );


  } finally {

    setLoading(false);

  }

});

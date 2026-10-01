// Toast
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

document.querySelectorAll(".password-toggle").forEach((toggle) => {
  const togglePasswordField = () => {
    const targetId = toggle.dataset.target;
    togglePassword(targetId, toggle);
  };

  toggle.addEventListener("click", togglePasswordField);

  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePasswordField();
    }
  });
});
//Password toggle

function togglePassword(id, icon) {
  const input = document.getElementById(id);

  if (input.type === "password") {
    input.type = "text";

    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";

    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}
document.getElementById("logoutBtn").addEventListener("click", () => {
  logout();
});
// Logout
async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/";
}
document.querySelectorAll(".menu-item").forEach((item) => {
  const href = item.getAttribute("href");

  if (!href) return;

  if (window.location.pathname === href) {
    item.classList.add("active");
  } else {
    item.classList.remove("active");
  }
});

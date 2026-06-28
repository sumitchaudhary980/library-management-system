// ── Toast ──
const toastWrapper = document.createElement("div");
toastWrapper.className = "toast-wrapper";
document.body.appendChild(toastWrapper);

function showToast(message, type = "error") {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check" };

  const toast = document.createElement("div");
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <span>${message}</span>
    <i class="fas fa-xmark toast-close" onclick="removeToast(this.parentElement)"></i>
  `;

  toastWrapper.appendChild(toast);
  setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
  toast.classList.add("hide");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ── Password toggle ──
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

// ── Logout ──
async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/";
}
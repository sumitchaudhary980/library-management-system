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

document.getElementById("authorForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name");
  const biography = document.getElementById("biography");

  name.classList.remove("is-invalid");

  if (!name.value.trim()) {
    name.classList.add("is-invalid");
    return;
  }

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
    } else {
      showToast(data.message || "Something went wrong", "error");
    }
  } catch (err) {
    console.log(err);
    showToast("Server error", "error");
  }
});
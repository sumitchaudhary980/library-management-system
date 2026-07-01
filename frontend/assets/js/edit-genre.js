const genreId = window.location.pathname.split("/").pop();

const nameInput = document.getElementById("name");

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

  nameInput.classList.remove("is-invalid");

  if (!nameInput.value.trim()) {
    nameInput.classList.add("is-invalid");
    return;
  }

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
    } else {
      sweetToast(data.message || "Failed to update genre", "error");
    }
  } catch (err) {
    console.log(err);
    sweetToast("Server error", "error");
  }
});
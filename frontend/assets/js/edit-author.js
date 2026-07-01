const authorId = window.location.pathname.split("/").pop();
const nameInput = document.getElementById("name");
const biographyInput = document.getElementById("biography");

function sweetToast(message, type = "error") {
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

async function loadAuthor() {
    try {
        const response = await fetch(`/api/admin/authors/${authorId}`, {
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            nameInput.value = data.name;
            biographyInput.value = data.biography || "";
        } else {
            sweetToast(data.message || "Unable to load author", "error");
        }
    } catch (err) {
        console.log(err);
        sweetToast("Server error", "error");
    }
}

loadAuthor();

document.getElementById("authorForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    nameInput.classList.remove("is-invalid");

    if (!nameInput.value.trim()) {
        nameInput.classList.add("is-invalid");
        return;
    }

    try {
        const response = await fetch(`/api/admin/authors/${authorId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                name: nameInput.value.trim(),
                biography: biographyInput.value.trim()
            })
        });

        const data = await response.json();

        if (response.ok) {
            sweetToast("Author updated successfully", "success");
            setTimeout(() => {
                window.location.href = "/authors";
            }, 1000);
        } else {
            sweetToast(data.message || "Failed to update author", "error");
        }
    } catch (err) {
        console.log(err);
        sweetToast("Server error", "error");
    }
});
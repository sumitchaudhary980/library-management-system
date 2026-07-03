const authorId = window.location.pathname.split("/").pop();
const nameInput = document.getElementById("name");
const biographyInput = document.getElementById("biography");

let submitted = false;

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

function clearErrors() {
    document.querySelectorAll(".is-invalid").forEach((el) => {
        el.classList.remove("is-invalid");
    });

    document.querySelectorAll(".invalid-feedback").forEach((el) => {
        const def = el.getAttribute("data-default");
        if (def) el.textContent = def;
    });
}

function validateName() {
    if (!nameInput.value.trim()) {
        setError(nameInput, "Author name is required");
        return false;
    }

    clearError(nameInput);
    return true;
}

function validateForm() {
    clearErrors();
    return validateName();
}

// LIVE VALIDATION — only kicks in after the first submit attempt
nameInput.addEventListener("input", () => {
    if (submitted) validateName();
});
nameInput.addEventListener("blur", () => {
    if (submitted) validateName();
});

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

    submitted = true;

    if (!validateForm()) return;

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
            return;
        }

        if (data.errors) {
            if (data.errors.name) setError(nameInput, data.errors.name);
            if (data.errors.biography) setError(biographyInput, data.errors.biography);
        }

        sweetToast(data.message || "Failed to update author", "error");
    } catch (err) {
        console.log(err);
        sweetToast("Server error", "error");
    }
});
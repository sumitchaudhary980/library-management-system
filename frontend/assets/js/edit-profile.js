function showToast(message, type = "error") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        customClass: { popup: "small-toast" },
    });

    Toast.fire({ icon: type, title: message });
}
const submitBtn = document.getElementById("submitBtn");
const profileFieldIds = ["first_name", "last_name", "gender", "phone", "address", "profileImage"];
const profilePlaceholders = {};

profileFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) profilePlaceholders[id] = input.placeholder;
});

function setProfileFormLoading(loading) {
    profileFieldIds.forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;

        input.disabled = loading;
        if (loading && input.placeholder !== undefined) {
            input.placeholder = "Loading...";
        } else if (input.placeholder !== undefined) {
            input.placeholder = profilePlaceholders[id] || "";
        }
    });

    submitBtn.disabled = loading;
}

// SET ERROR
function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.classList.add("is-invalid");

    const feedback = input.nextElementSibling;

    if (feedback?.classList.contains("invalid-feedback")) {
        feedback.textContent = message;
    }
}

function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.classList.remove("is-invalid");

    const feedback = input.nextElementSibling;

    if (feedback?.classList.contains("invalid-feedback")) {
        feedback.textContent = feedback.dataset.default || "";
    }
}

function clearErrors() {
    document.querySelectorAll(".author-input").forEach(input => {
        input.classList.remove("is-invalid");
    });
}


// PER-FIELD VALIDATORS — return an error message string, or null if valid
const validators = {
    first_name: (value) => {
        if (!value.trim()) return "First name is required";
        return null;
    },
    last_name: (value) => {
        if (!value.trim()) return "Last name is required";
        return null;
    },
    gender: (value) => {
        if (!value) return "Gender is required";
        return null;
    },
    phone: (value) => {
        const v = value.trim();
        if (!v) return "Phone is required";
        if (!/^\d{10}$/.test(v)) return "Phone must be exactly 10 digits";
        return null;
    },
    address: (value) => {
        if (!value.trim()) return "Address is required";
        return null;
    },
};

// VALIDATE ONE FIELD AND REFLECT RESULT IN THE UI
function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return true;

    const validator = validators[fieldId];
    if (!validator) return true;

    const message = validator(input.value);

    if (message) {
        setError(fieldId, message);
        return false;
    }

    clearError(fieldId);
    return true;
}

// LOAD PROFILE
async function loadProfile() {
    setProfileFormLoading(true);

    try {
        const res = await fetch("/api/admin/profile", {
            credentials: "include",
        });
        const data = await res.json();

        const user = data.user;

        document.getElementById("first_name").value = user.first_name || "";
        document.getElementById("last_name").value = user.last_name || "";
        document.getElementById("gender").value = user.gender || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("address").value = user.address || "";

        if (user.profile_image) {
            const img = document.getElementById("imagePreview");
            const placeholder = document.getElementById("placeholder");

            img.src = user.profile_image;
            img.style.display = "block";
            placeholder.style.display = "none";
        }

    } catch (err) {
        showToast("Failed to load profile");
    } finally {
        setProfileFormLoading(false);
    }
}

// DYNAMIC (LIVE) VALIDATION — validate on blur, and re-validate on input
// once a field has already been touched/marked invalid, so the message
// clears as soon as the user fixes it.
["first_name", "last_name", "address"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => validateField(id));
    input.addEventListener("input", () => {
        if (input.classList.contains("is-invalid")) validateField(id);
    });
});

const genderInput = document.getElementById("gender");
if (genderInput) {
    genderInput.addEventListener("change", () => validateField("gender"));
}

const phoneInput = document.getElementById("phone");
if (phoneInput) {
    // Only allow digits to be typed, capped at 10
    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        if (phoneInput.classList.contains("is-invalid")) validateField("phone");
    });
    phoneInput.addEventListener("blur", () => validateField("phone"));
}

// IMAGE VALIDATION + PREVIEW
document.getElementById("profileImage").addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
        clearError("profileImage");
        return;
    }

    const allowed = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ];

    if (!allowed.includes(file.type)) {
        setError("profileImage", "Only JPG, PNG, WEBP, HEIC allowed");
        this.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        setError("profileImage", "Image must be under 5MB");
        this.value = "";
        return;
    }

    clearError("profileImage");

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("imagePreview").src = e.target.result;
        document.getElementById("imagePreview").style.display = "block";
        document.getElementById("placeholder").style.display = "none";
    };
    reader.readAsDataURL(file);
});

// SUBMIT
document.getElementById("profileForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    clearErrors();

    const first_name = document.getElementById("first_name");
    const last_name = document.getElementById("last_name");
    const gender = document.getElementById("gender");
    const phone = document.getElementById("phone");
    const address = document.getElementById("address");
    const image = document.getElementById("profileImage");

    // RUN ALL FIELD VALIDATORS
    const validFlags = [
        validateField("first_name"),
        validateField("last_name"),
        validateField("gender"),
        validateField("phone"),
        validateField("address"),
    ];

    let valid = validFlags.every(Boolean);

    // IMAGE VALIDATION (optional)
    const file = image.files[0];
    if (file) {
        const allowed = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
        ];

        if (!allowed.includes(file.type)) {
            setError("profileImage", "Invalid image format");
            valid = false;
        } else if (file.size > 5 * 1024 * 1024) {
            setError("profileImage", "Image must be under 5MB");
            valid = false;
        }
    }

    // STOP IF INVALID
    if (!valid) return;

    if (submitBtn.disabled) return;

    setButtonLoading(submitBtn, true);

    const formData = new FormData();
    formData.append("first_name", first_name.value.trim());
    formData.append("last_name", last_name.value.trim());
    formData.append("gender", gender.value);
    formData.append("phone", phone.value.trim());
    formData.append("address", address.value.trim());

    if (file) formData.append("profileImage", file);

    try {
        const res = await fetch("/api/admin/profile", {
            method: "PUT",
            credentials: "include",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            // Map field-level errors from the server back onto the form
            if (data.errors) {
                Object.entries(data.errors).forEach(([field, message]) => {
                    setError(field, message);
                });
            }

            showToast(data.message || "Update failed");
            return;
        }

        showToast(data.message, "success");

        setTimeout(() => {
            location.href = "/profile";
        }, 800);

    } catch (err) {

        showToast("Something went wrong");

    } finally {

        setButtonLoading(
            submitBtn,
            false
        );

    }
});

loadProfile();

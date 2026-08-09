const id = window.location.pathname.split("/").pop();
document.getElementById("borrowBookButton")?.addEventListener("click", () => {
    borrowBook();
  });
function setBookDetailsLoading(loading) {
    const coverImage = document.getElementById("coverImage");
    const placeholders = [
        ["bookTitle", "Loading book title", "65%"],
        ["bookAuthor", "Loading author", "55%"],
        ["bookStock", "Loading stock", "45%"],
        ["bookDescription", "Loading description", "100%"],
    ];

    placeholders.forEach(([id, text, width]) => {
        const el = document.getElementById(id);

        if (loading) {
            el.textContent = text;
            el.classList.add("loading-placeholder");
            el.style.width = width;
        } else {
            el.classList.remove("loading-placeholder");
            el.style.width = "";
            if (el.textContent === text) el.textContent = "";
        }
    });

    if (loading) {
        document.getElementById("bookGenreBadge").textContent = "Loading";
        document.getElementById("bookStockBadge").innerHTML =
            `<span class="badge px-3 py-2 loading-placeholder" style="border-radius:30px;">Loading</span>`;
    }

    document.getElementById("bookGenreBadge").classList.toggle("loading-placeholder", loading);
    if (!loading && document.getElementById("bookGenreBadge").textContent === "Loading") {
        document.getElementById("bookGenreBadge").textContent = "";
    }
    if (!loading && document.getElementById("bookStockBadge").textContent.trim() === "Loading") {
        document.getElementById("bookStockBadge").innerHTML = "";
    }
    coverImage.classList.toggle("image-loading", loading);
}

async function loadBook() {
    setBookDetailsLoading(true);

    try {
        const response = await fetch(`/api/user/books/${id}`, {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message);

            setTimeout(() => {
                location.href = "/books";
            }, 1000);

            return;
        }

        // Cover image
        document.getElementById("coverImage").src =
            data.cover_image || "/assets/images/default-book.png";

        // Book title
        document.getElementById("bookTitle").textContent =
            data.title;

        // Author
        document.getElementById("bookAuthor").textContent =
            data.author_name;

        // Genre badge
        document.getElementById("bookGenreBadge").textContent =
            data.genre_name;

        // Description
        document.getElementById("bookDescription").textContent =
            data.description || "No description available for this book.";

        // Stock quantity
        const stock = Number(data.stock_quantity);

        document.getElementById("bookStock").textContent =
            stock === 0
                ? "0 available"
                : `${stock} available`;

        // Availability badge
        document.getElementById("bookStockBadge").innerHTML = `
            <span
                class="badge ${
                    stock > 0
                        ? "bg-success"
                        : "bg-danger"
                } px-3 py-2"
                style="border-radius:30px;"
            >
                ${
                    stock > 0
                        ? "Available"
                        : "Out of Stock"
                }
            </span>
        `;

        // Borrow button
        const borrowButton =
            document.getElementById("borrowBookButton");

        if (stock <= 0) {
            borrowButton.disabled = true;
            borrowButton.innerHTML = `
                <i class="fas fa-ban me-2"></i>
                Unavailable
            `;
        } else {
            borrowButton.disabled = false;
            borrowButton.innerHTML = `
                <i class="fas fa-book-reader me-2"></i>
                Borrow Book
            `;
        }

    } catch (err) {
        console.log(err);
        showToast("Failed to load book");
    } finally {
        setBookDetailsLoading(false);
    }
}

async function borrowBook() {
    const borrowButton =
        document.getElementById("borrowBookButton");

    borrowButton.disabled = true;
    borrowButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Borrow Book
    `;

    try {
        const response = await fetch(`/api/user/books/${id}/borrow`, {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
            showToast(
                data.message || "Book borrowed successfully",
                "success"
            );

            loadBook();
        } else {
            showToast(data.message || "Unable to borrow book");

            borrowButton.disabled = false;
            borrowButton.innerHTML = `
                <i class="fas fa-book-reader me-2"></i>
                Borrow Book
            `;
        }
    } catch (err) {
        console.log(err);
        showToast("Something went wrong");

        borrowButton.disabled = false;
        borrowButton.innerHTML = `
            <i class="fas fa-book-reader me-2"></i>
            Borrow Book
        `;
    }
}

loadBook();

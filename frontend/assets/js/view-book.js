const id = window.location.pathname.split("/").pop();

document.getElementById("editBookButton").href = `/books/edit/${id}`;

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
    }
    document.getElementById("bookGenreBadge").classList.toggle("loading-placeholder", loading);
    if (!loading && document.getElementById("bookGenreBadge").textContent === "Loading") {
        document.getElementById("bookGenreBadge").textContent = "";
    }
    if (loading) {
        document.getElementById("bookStockBadge").innerHTML =
            `<span class="badge px-3 py-2 loading-placeholder" style="border-radius:30px;">Loading</span>`;
    } else if (document.getElementById("bookStockBadge").textContent.trim() === "Loading") {
        document.getElementById("bookStockBadge").innerHTML = "";
    }

    coverImage.classList.toggle("image-loading", loading);
    coverImage.style.minHeight = loading ? "380px" : "";
}

async function loadBook() {
    setBookDetailsLoading(true);

    try {
        const response = await fetch(`/api/admin/books/${id}`, {
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

    } catch (err) {
        console.log(err);
        showToast("Failed to load book");
    } finally {
        setBookDetailsLoading(false);
    }
}

loadBook();

const id = window.location.pathname.split("/").pop();

async function loadBook() {
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
        }

    } catch (err) {
        console.log(err);
        showToast("Failed to load book");
    }
}

async function borrowBook() {
    const borrowButton =
        document.getElementById("borrowBookButton");

    borrowButton.disabled = true;

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
        }
    } catch (err) {
        console.log(err);
        showToast("Something went wrong");

        borrowButton.disabled = false;
    }
}

loadBook();
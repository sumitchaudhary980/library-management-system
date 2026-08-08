const id = window.location.pathname.split("/").pop();

document.getElementById("editBookButton").href = `/books/edit/${id}`;
async function loadBook() {
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
    }
}

loadBook();
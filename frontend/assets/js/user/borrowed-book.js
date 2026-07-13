function showToast(message, type = "error") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        showCloseButton: true,
        timer: 4000,
        timerProgressBar: true,
        customClass: { popup: "small-toast" },
    });

    Toast.fire({ icon: type, title: message });
}

let currentTitle = "";
let currentAuthor = "";
let currentGenre = "";
let currentPage = 1;
let searchTimer;

async function loadBorrowedBooks(page = 1) {
    currentPage = page;

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        author: currentAuthor,
        genre: currentGenre,
    });

    try {
        const response = await fetch(`/api/user/borrowed-books?${params}`);
        const data = await response.json();

        const table = document.getElementById("borrowedBookTable");
        table.innerHTML = "";

        if (data.books.length === 0) {
            table.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            No borrowed books found
          </td>
        </tr>
      `;
        }

        data.books.forEach((book) => {
            const today = new Date();
            const dueDate = new Date(book.due_date);

            const daysRemaining = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            let remainingBadge = "";

            if (daysRemaining > 5) {
                remainingBadge = `<span class="badge bg-success">${daysRemaining} Days</span>`;
            } else if (daysRemaining > 0) {
                remainingBadge = `<span class="badge bg-danger">${daysRemaining} Days</span>`;
            } else if (daysRemaining === 0) {
                remainingBadge = `<span class="badge bg-warning text-dark">Due Today</span>`;
            } else {
                remainingBadge = `<span class="badge bg-dark">Overdue</span>`;
            }

            table.innerHTML += `
      <tr>

        <td class="py-3 px-4">
          <img
            src="${book.cover_image}"
            style="width:60px;height:80px;object-fit:cover;border-radius:8px;"
          >
        </td>

        <td class="py-3 px-4">
          <h6 class="fw-bold mb-0 text-primary-dark">
            ${book.title}
          </h6>
        </td>

        <td class="py-3 px-4">
          ${book.author}
        </td>

        <td class="py-3 px-4">
          ${new Date(book.borrowed_at).toLocaleDateString()}
        </td>

        <td class="py-3 px-4">
          ${new Date(book.due_date).toLocaleDateString()}
        </td>

        <td class="py-3 px-4">
          ${remainingBadge}
        </td>

        <td class="py-3 px-4 text-center">
          ${book.renewed
                    ? `
                <button
                  class="btn btn-secondary btn-sm px-3"
                  disabled
                  style="border-radius:10px;min-width:110px;"
                >
                  Renewed
                </button>
              `
                    : `
                <button
                  class="btn btn-sm px-3 text-white"
                  style="background:#c5a059;border-radius:10px;min-width:110px;"
                  onclick="renewBook(${book.borrowed_id})"
                >
                  <i class="fas fa-rotate me-2"></i>
                  Renew
                </button>
              `
                }
        </td>

        <td class="py-3 px-4 text-center">
          <button
            class="btn btn-sm px-3 text-white"
            style="background:var(--primary-dark);border-radius:10px;min-width:110px;"
            onclick="returnBook(${book.borrowed_id})"
          >
            <i class="fas fa-right-from-bracket me-2"></i>
            Return
          </button>
        </td>

      </tr>
      `;
        });

        document.getElementById("entryText").innerHTML =
            `Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1
            } to ${Math.min(page * 10, data.total)} of ${data.total
            } entries`;

        const pagination = document.getElementById("pagination");
        pagination.innerHTML = "";

        if (data.totalPages > 1) {
            pagination.innerHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
          <button class="page-link" onclick="loadBorrowedBooks(${page - 1})">
            Previous
          </button>
        </li>
      `;

            for (let i = 1; i <= data.totalPages; i++) {
                pagination.innerHTML += `
          <li class="page-item ${page === i ? "active" : ""}">
            <button class="page-link" onclick="loadBorrowedBooks(${i})">
              ${i}
            </button>
          </li>
        `;
            }

            pagination.innerHTML += `
        <li class="page-item ${page === data.totalPages ? "disabled" : ""
                }">
          <button class="page-link" onclick="loadBorrowedBooks(${page + 1})">
            Next
          </button>
        </li>
      `;
        }
    } catch (err) {
        console.log(err);
        showToast("Failed to load borrowed books");
    }
}

async function renewBook(id) {
    try {
        const response = await fetch(`/api/user/borrowed-books/${id}/renew`, {
            method: "PUT",
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, "success");
            loadBorrowedBooks(currentPage);
        } else {
            showToast(data.message);
        }
    } catch (err) {
        console.log(err);
        showToast("Something went wrong");
    }
}

async function returnBook(id) {
    const result = await Swal.fire({
        title: "Return this book?",
        text: "This will mark the book as returned.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#002147",
        cancelButtonColor: "#c5a059",
        confirmButtonText: "Return",
        cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/api/user/borrowed-books/${id}/return`, {
            method: "PUT",
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, "success");
            loadBorrowedBooks(currentPage);
        } else {
            showToast(data.message);
        }
    } catch (err) {
        console.log(err);
        showToast("Something went wrong");
    }
}

function triggerSearch() {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        currentTitle = document.getElementById("searchBook").value.trim();
        currentAuthor = document.getElementById("searchAuthor").value.trim();
        currentGenre = document.getElementById("searchGenre").value.trim();

        loadBorrowedBooks(1);
    }, 500);
}

document
    .getElementById("searchBook")
    .addEventListener("input", triggerSearch);

document
    .getElementById("searchAuthor")
    .addEventListener("input", triggerSearch);

document
    .getElementById("searchGenre")
    .addEventListener("input", triggerSearch);

document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("searchBook").value = "";
    document.getElementById("searchAuthor").value = "";
    document.getElementById("searchGenre").value = "";

    currentTitle = "";
    currentAuthor = "";
    currentGenre = "";

    loadBorrowedBooks(1);
});

loadBorrowedBooks();
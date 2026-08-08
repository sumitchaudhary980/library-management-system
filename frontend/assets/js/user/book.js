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

  Toast.fire({
    icon: type,
    title: message,
  });
}

let currentTitle = "";
let currentAuthor = "";
let currentGenre = "";
let currentPage = 1;
let searchTimer;

async function loadBooks(page = 1) {
  currentPage = page;

  const params = new URLSearchParams({
    page,
    title: currentTitle,
    author: currentAuthor,
    genre: currentGenre,
  });

  try {
    const response = await fetch(`/api/user/books?${params}`);
    const data = await response.json();

    const table = document.getElementById("bookTable");
    table.innerHTML = "";

    if (data.books.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5 text-muted">
            No books found
          </td>
        </tr>
      `;
    }

    data.books.forEach((book) => {
      const stock = Number(book.stock_quantity);

      const available =
        stock === 0
          ? `<span class="badge bg-danger px-3 py-2">Unavailable</span>`
          : stock < 5
            ? `<span class="badge bg-danger px-3 py-2">${stock} available</span>`
            : `<span class="badge bg-success px-3 py-2">${stock} available</span>`;

      const borrowButton =
        stock > 0
          ? `
      <button
        class="btn btn-sm px-3 py-2 fw-semibold shadow-sm"
        style="
          background:var(--primary-dark);
          color:#fff;
          border:none;
          border-radius:10px;
          min-width:110px;
        "
        onclick="borrowBook(${book.id})"
      >
        <i class="fas fa-book-reader me-2"></i>
        Borrow
      </button>
    `
          : `
      <button
        class="btn btn-sm btn-secondary px-3 py-2 fw-semibold"
        disabled
        style="
          border-radius:10px;
          min-width:110px;
        "
      >
        <i class="fas fa-ban me-2"></i>
        Unavailable
      </button>
    `;

      table.innerHTML += `
      <tr class="book-row">

        <td class="py-3 px-4 text-nowrap">
          <img
            src="${book.cover_image}"
            alt="${book.title} book cover"
            loading="lazy"
            decoding="async"
            style="
              width:60px;
              height:80px;
              object-fit:cover;
              border-radius:8px;
            "
          >
        </td>

        <td class="py-3 px-4 text-nowrap">
          <a
            href="/books/${book.id}"
            class="fw-bold text-primary-dark text-decoration-none"
          >
            ${book.title}
          </a>
        </td>

        <td class="py-3 px-4 text-nowrap">
          ${book.author}
        </td>

        <td class="py-3 px-4 text-nowrap">
          ${book.genre}
        </td>

        <td class="py-3 px-4 text-nowrap">
          ${available}
        </td>

        <td class="py-3 px-4 text-center text-nowrap">
          ${borrowButton}
        </td>

      </tr>
    `;
    });

    document.getElementById(
      "entryText"
    ).innerHTML = `Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1
    } to ${Math.min(page * 10, data.total)} of ${data.total
      } entries`;

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (data.totalPages > 1) {
      pagination.innerHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
          <button class="page-link" onclick="loadBooks(${page - 1})">
            Previous
          </button>
        </li>
      `;

      for (let i = 1; i <= data.totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${page === i ? "active" : ""}">
            <button class="page-link" onclick="loadBooks(${i})">
              ${i}
            </button>
          </li>
        `;
      }

      pagination.innerHTML += `
        <li class="page-item ${page === data.totalPages ? "disabled" : ""
        }">
          <button class="page-link" onclick="loadBooks(${page + 1})">
            Next
          </button>
        </li>
      `;
    }
  } catch (err) {
    console.log(err);
    showToast("Failed to load books");
  }
}

async function borrowBook(id) {
  try {
    const response = await fetch(`/api/user/books/${id}/borrow`, {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      showToast(data.message || "Book borrowed successfully", "success");
      loadBooks(currentPage);
    } else {
      showToast(data.message || "Unable to borrow book");
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

    loadBooks(1);
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

  loadBooks(1);
});

loadBooks();

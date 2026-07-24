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

async function loadBooks(page = 1) {
  currentPage = page;
  const params = new URLSearchParams({ page, title: currentTitle, author: currentAuthor, genre: currentGenre });

  try {
    const response = await fetch(`/api/admin/books?${params}`);
    const data = await response.json();
    const table = document.getElementById("bookTable");
    table.innerHTML = "";

    if (data.books.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5 text-muted">No books found</td>
        </tr>
      `;
    }

    data.books.forEach((book) => {
      table.innerHTML += `
    <tr
      class="book-row"
      style="cursor:pointer;"
      onclick="window.location.href='/books/${book.id}'"
    >
      <td class="py-3 px-4">
        <img
          src="${book.cover_image}"
          style="width:60px;height:80px;object-fit:cover;border-radius:8px;"
        >
      </td>

      <td class="py-3 px-4 text-nowrap">
        <h6 class="fw-bold mb-0 text-primary-dark">${book.title}</h6>
      </td>

      <td class="py-3 px-4 text-nowrap">
        ${book.author}
      </td>

      <td class="py-3 px-4 text-nowrap">
        ${book.genre}
      </td>

      <td class="py-3 px-4 text-nowrap">
        <span class="badge ${book.stock_quantity < 5 ? "bg-danger" : "bg-success"
        }">
          ${book.stock_quantity}
        </span>
      </td>

      <td class="py-3 px-4 text-end text-nowrap">
        <div class="action-wrapper">
          <a
            href="/books/edit/${book.id}"
            class="action-btn edit-btn"
            title="Edit"
            onclick="event.stopPropagation();"
          >
            <i class="fas fa-pen"></i>
          </a>

          <button
            type="button"
            class="action-btn delete-btn"
            title="Delete"
            onclick="event.stopPropagation(); deleteBook(${book.id});"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
    });

    document.getElementById("entryText").innerHTML =
      `Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1} to ${Math.min(page * 10, data.total)} of ${data.total} entries`;

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (data.totalPages > 1) {
      pagination.innerHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
          <button class="page-link" onclick="loadBooks(${page - 1})">Previous</button>
        </li>
      `;

      for (let i = 1; i <= data.totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${page === i ? "active" : ""}">
            <button class="page-link" onclick="loadBooks(${i})">${i}</button>
          </li>
        `;
      }

      pagination.innerHTML += `
        <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
          <button class="page-link" onclick="loadBooks(${page + 1})">Next</button>
        </li>
      `;
    }
  } catch (err) {
    console.log(err);
    showToast("Failed to load books");
  }
}

async function deleteBook(id) {
  const result = await Swal.fire({
    title: "Delete book?",
    text: "This book will be permanently removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#002147",
    cancelButtonColor: "#c5a059",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message, "success");
      loadBooks(currentPage);
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
    loadBooks(1);
  }, 500);
}

document.getElementById("searchBook").addEventListener("input", triggerSearch);
document.getElementById("searchAuthor").addEventListener("input", triggerSearch);
document.getElementById("searchGenre").addEventListener("input", triggerSearch);

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
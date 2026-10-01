let currentSearch = "";
let searchTimer;

function showAuthorTableLoading() {
  document.getElementById("authorTable").innerHTML = `
    <tr class="loading-row">
      <td colspan="3" class="text-center py-4 text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading authors...
      </td>
    </tr>
  `;
  document.getElementById("entryText").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
}

async function loadAuthors(page = 1, search = currentSearch) {
  currentSearch = search;
  showAuthorTableLoading();

  const response = await fetch(`/api/admin/authors?page=${page}&search=${search}`);
  const data = await response.json();

  const table = document.getElementById("authorTable");
  table.innerHTML = "";

  if (data.authors.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-4 text-muted">No authors found</td>
      </tr>
    `;
  }

  data.authors.forEach((author) => {
    table.innerHTML += `
      <tr>
        <td class="py-3 px-4 text-nowrap">
          <div class="d-flex align-items-center">
            <div class="stat-icon-wrapper bg-primary-light me-3 flex-shrink-0">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold text-primary-dark">${author.name}</h6>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 ">
          <div class="biography-box">
            ${author.biography || "No biography available"}
          </div>
        </td>
        <td class="py-3 px-4 text-nowrap">
          <div class="action-wrapper">
            <a href="/authors/edit/${author.id}" class="action-btn edit-btn" title="Edit">
              <i class="fas fa-pen"></i>
            </a>
            <button onclick="deleteAuthor(${author.id}, this)" class="action-btn delete-btn" title="Delete">
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
        <button class="page-link" onclick="loadAuthors(${page - 1})">Previous</button>
      </li>
    `;

    for (let i = 1; i <= data.totalPages; i++) {
      pagination.innerHTML += `
        <li class="page-item ${page === i ? "active" : ""}">
          <button class="page-link" onclick="loadAuthors(${i})">${i}</button>
        </li>
      `;
    }

    pagination.innerHTML += `
      <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
        <button class="page-link" onclick="loadAuthors(${page + 1})">Next</button>
      </li>
    `;
  }
}

async function deleteAuthor(id, button) {
  const result = await Swal.fire({
    title: "Delete author?",
    text: "This author will be permanently removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#002147",
    cancelButtonColor: "#c5a059",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;
  if (button) button.disabled = true;

  try {
    const response = await fetch(`/api/admin/authors/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message, "success");
      loadAuthors();
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.log(err);
    showToast("Something went wrong", "error");
  } finally {
    if (button) button.disabled = false;
  }
}

document.getElementById("searchAuthor").addEventListener("input", function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadAuthors(1, this.value);
  }, 500);
});

loadAuthors();

let currentSearch = "";
let searchTimer;

async function loadAuthors(page = 1, search = currentSearch) {
  currentSearch = search;

  const response = await fetch(
    `/api/admin/authors?page=${page}&search=${search}`,
  );
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
        <td class="py-3 px-4">
          <div class="d-flex align-items-center">
            <div class="stat-icon-wrapper bg-primary-light me-3">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold text-primary-dark text-truncate" style="max-width:220px">
                ${author.name}
              </h6>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 text-muted">
          <span class="text-truncate d-block" style="max-width:320px">
            ${author.biography || "No biography available"}
          </span>
        </td>
        <td class="py-3 px-4 text-end">
          <a href="/authors/edit/${author.id}" class="btn btn-light me-1 text-primary-dark shadow-sm" title="Edit">
            <i class="fas fa-pen"></i>
          </a>
          <button onclick="deleteAuthor(${author.id})" class="btn btn-light text-danger shadow-sm" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
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

async function deleteAuthor(id) {
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

  try {
    const response = await fetch(`/api/admin/authors/${id}`, {
      method: "DELETE",
    });
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
  }
}

document.getElementById("searchAuthor").addEventListener("input", function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadAuthors(1, this.value);
  }, 500);
});

loadAuthors();

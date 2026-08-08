let currentSearch = "";
let searchTimer;

function showGenreTableLoading() {
  document.getElementById("genreTable").innerHTML = `
    <tr class="loading-row">
      <td colspan="2" class="text-center py-4 text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading genres...
      </td>
    </tr>
  `;
  document.getElementById("entryText").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
}

async function loadGenres(page = 1, search = currentSearch) {
  currentSearch = search;
  showGenreTableLoading();

  const response = await fetch(`/api/admin/genres?page=${page}&search=${search}`);
  const data = await response.json();

  const table = document.getElementById("genreTable");
  table.innerHTML = "";

  if (!data || !data.genres) {
    table.innerHTML = `
      <tr>
        <td colspan="2" class="text-center py-4 text-muted">No genres found</td>
      </tr>
    `;
    return;
  }

  if (data.genres.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="2" class="text-center py-4 text-muted">No genres found</td>
      </tr>
    `;
  }

  data.genres.forEach((genre) => {
    table.innerHTML += `
      <tr>
        <td class="py-3 px-4 text-nowrap">
          <h6 class="mb-0 fw-bold text-primary-dark">${genre.name}</h6>
        </td>

        <td class="py-3 px-4 text-end text-nowrap">
          <div class="action-wrapper">
            <a href="/genres/edit/${genre.id}" class="action-btn edit-btn" title="Edit">
              <i class="fas fa-pen"></i>
            </a>

            <button onclick="deleteGenre(${genre.id}, this)" class="action-btn delete-btn" title="Delete">
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
        <button class="page-link" onclick="loadGenres(${page - 1})">Previous</button>
      </li>
    `;

    for (let i = 1; i <= data.totalPages; i++) {
      pagination.innerHTML += `
        <li class="page-item ${page === i ? "active" : ""}">
          <button class="page-link" onclick="loadGenres(${i})">${i}</button>
        </li>
      `;
    }

    pagination.innerHTML += `
      <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
        <button class="page-link" onclick="loadGenres(${page + 1})">Next</button>
      </li>
    `;
  }
}

// DELETE
async function deleteGenre(id, button) {
  const result = await Swal.fire({
    title: "Delete genre?",
    text: "This genre will be permanently removed.",
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
    const response = await fetch(`/api/admin/genres/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Genre deleted successfully", "success");
      loadGenres(); // refresh table
    } else {
      showToast(data.message || "Failed to delete genre", "error");
    }
  } catch (err) {
    console.log(err);
    showToast("Server error", "error");
  } finally {
    if (button) button.disabled = false;
  }
}

// SEARCH 
document.getElementById("searchGenre").addEventListener("input", function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadGenres(1, this.value);
  }, 500);
});

loadGenres();

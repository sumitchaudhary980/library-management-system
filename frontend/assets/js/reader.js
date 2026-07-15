function showToast(message, type = "error") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 4000,
    timerProgressBar: true,
    customClass: {
      popup: "small-toast",
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

let currentFirstName = "";
let currentLastName = "";
let currentEmail = "";
let currentPhone = "";
let currentGender = "";
let currentSort = "newest";

let currentPage = 1;
let searchTimer;

async function loadReaders(page = 1) {
  currentPage = page;

  const params = new URLSearchParams({
    page,
    first_name: currentFirstName,
    last_name: currentLastName,
    email: currentEmail,
    phone: currentPhone,
    gender: currentGender,
    sort: currentSort,
  });

  try {
    const response = await fetch(`/api/admin/readers?${params}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load readers");
      return;
    }

    const table = document.getElementById("readerTable");
    table.innerHTML = "";

    if (data.readers.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            No readers found
          </td>
        </tr>
      `;

      document.getElementById("entryText").innerHTML =
        "Showing 0 to 0 of 0 entries";

      document.getElementById("pagination").innerHTML = "";

      return;
    }

    data.readers.forEach((reader) => {
      table.innerHTML += `
        <tr>

          <td class="py-3 px-4 text-nowrap">
            <img
              src="${
                reader.profile_image || "/assets/images/default-user.png"
              }"
              style="width:55px;height:55px;border-radius:50%;object-fit:cover;"
            >
          </td>

          <td class="py-3 px-4 fw-semibold text-nowrap">
            ${reader.first_name} ${reader.last_name}
          </td>

          <td class="py-3 px-4 text-capitalize text-nowrap">
            ${reader.gender}
          </td>

          <td class="py-3 px-4 text-nowrap">
            ${reader.email}
          </td>

          <td class="py-3 px-4 text-nowrap">
            ${reader.phone || "-"}
          </td>

          <td class="py-3 px-4 text-nowrap">
            ${reader.address || "-"}
          </td>

          <td class="py-3 px-4 text-nowrap">
            ${new Date(reader.created_at).toLocaleDateString()}
          </td>

          <td class="py-3 px-4 text-end text-nowrap">
            <div class="action-wrapper">

              <a
                href="/readers/edit/${reader.id}"
                class="action-btn edit-btn"
                title="Edit"
              >
                <i class="fas fa-pen"></i>
              </a>

              <button
                type="button"
                class="action-btn delete-btn"
                title="Delete"
                onclick="deleteReader(${reader.id})"
              >
                <i class="fas fa-trash"></i>
              </button>

            </div>
          </td>

        </tr>
      `;
    });

    document.getElementById(
      "entryText"
    ).innerHTML = `Showing ${
      data.total === 0 ? 0 : (page - 1) * 10 + 1
    } to ${Math.min(page * 10, data.total)} of ${
      data.total
    } entries`;

    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (data.totalPages > 1) {
      pagination.innerHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
          <button class="page-link" onclick="loadReaders(${
            page - 1
          })">Previous</button>
        </li>
      `;

      for (let i = 1; i <= data.totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${page === i ? "active" : ""}">
            <button class="page-link" onclick="loadReaders(${i})">${i}</button>
          </li>
        `;
      }

      pagination.innerHTML += `
        <li class="page-item ${
          page === data.totalPages ? "disabled" : ""
        }">
          <button class="page-link" onclick="loadReaders(${
            page + 1
          })">Next</button>
        </li>
      `;
    }
  } catch (err) {
    console.log(err);
    showToast("Failed to load readers");
  }
}

async function deleteReader(id) {
  const result = await Swal.fire({
    title: "Delete reader?",
    text: "This reader will be permanently removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#002147",
    cancelButtonColor: "#c5a059",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/api/admin/readers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      showToast(data.message, "success");
      loadReaders(currentPage);
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
    currentFirstName = document
      .getElementById("searchFirstName")
      .value.trim();

    currentLastName = document
      .getElementById("searchLastName")
      .value.trim();

    currentEmail = document
      .getElementById("searchEmail")
      .value.trim();

    currentPhone = document
      .getElementById("searchPhone")
      .value.trim();

    currentGender =
      document.getElementById("searchGender").value;

    currentSort =
      document.getElementById("sortBy").value;

    loadReaders(1);
  }, 500);
}

document
  .getElementById("searchFirstName")
  .addEventListener("input", triggerSearch);

document
  .getElementById("searchLastName")
  .addEventListener("input", triggerSearch);

document
  .getElementById("searchEmail")
  .addEventListener("input", triggerSearch);

document
  .getElementById("searchPhone")
  .addEventListener("input", triggerSearch);

document
  .getElementById("searchGender")
  .addEventListener("change", triggerSearch);

document
  .getElementById("sortBy")
  .addEventListener("change", triggerSearch);

document
  .getElementById("clearFilters")
  .addEventListener("click", () => {
    document.getElementById("searchFirstName").value = "";
    document.getElementById("searchLastName").value = "";
    document.getElementById("searchEmail").value = "";
    document.getElementById("searchPhone").value = "";
    document.getElementById("searchGender").value = "";
    document.getElementById("sortBy").value = "newest";

    currentFirstName = "";
    currentLastName = "";
    currentEmail = "";
    currentPhone = "";
    currentGender = "";
    currentSort = "newest";

    loadReaders(1);
  });

loadReaders();
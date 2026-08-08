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

function showReaderTableLoading() {
  document.getElementById("readerTable").innerHTML = `
    <tr class="loading-row">
      <td colspan="9" class="text-center py-5 text-muted">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading readers...
      </td>
    </tr>
  `;
  document.getElementById("entryText").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";
}

async function loadReaders(page = 1) {
  currentPage = page;
  showReaderTableLoading();

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
      const isActive = reader.status === "active";

      table.innerHTML += `
    <tr>

      <td class="py-3 px-4 text-nowrap">
       ${reader.profile_image
          ? `
      <img
        src="${reader.profile_image}"
        alt="${reader.first_name} ${reader.last_name} profile image"
        loading="lazy"
        decoding="async"
        style="width:55px;height:55px;border-radius:50%;object-fit:cover;"
      >
    `
          : `
      <div 
        style="
          width:55px;
          height:55px;
          border-radius:50%;
          background:#f1f1f1;
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <i class="fas fa-user text-muted"></i>
      </div>
    `
        }
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
        ${isActive
          ? `<span class="badge bg-success">Active</span>`
          : `<span class="badge bg-danger">Inactive</span>`
        }
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
            class="action-btn ${isActive ? "delete-btn" : "edit-btn"}"
            title="${isActive ? "Deactivate Reader" : "Activate Reader"}"
            onclick="toggleReaderStatus(${reader.id}, '${reader.status}', this)"
          >
            <i class="fas ${isActive ? "fa-user-slash" : "fa-user-check"
        }"></i>
          </button>

        </div>

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
          <button class="page-link" onclick="loadReaders(${page - 1
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
        <li class="page-item ${page === data.totalPages ? "disabled" : ""
        }">
          <button class="page-link" onclick="loadReaders(${page + 1
        })">Next</button>
        </li>
      `;
    }
  } catch (err) {
    console.log(err);
    showToast("Failed to load readers");
  }
}

async function toggleReaderStatus(id, currentStatus, button) {
  const activate = currentStatus === "inactive";

  const result = await Swal.fire({
    title: activate ? "Activate Reader?" : "Deactivate Reader?",
    text: activate
      ? "This reader will be able to log in again."
      : "This reader will no longer be able to log in.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#002147",
    cancelButtonColor: "#c5a059",
    confirmButtonText: activate ? "Activate" : "Deactivate",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;
  if (button) button.disabled = true;

  try {
    const response = await fetch(`/api/admin/readers/${id}/status`, {
      method: "PUT",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Something went wrong");
      return;
    }

    showToast(data.message, "success");
    loadReaders(currentPage);

  } catch (err) {
    console.log(err);
    showToast("Something went wrong");
  } finally {
    if (button) button.disabled = false;
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

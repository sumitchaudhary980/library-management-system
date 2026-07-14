function showToast(message, type = "error") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        showCloseButton: true,
        timer: 4000,
        timerProgressBar: true,
        customClass: {
            popup: "small-toast"
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

let currentTitle = "";
let currentStatus = "";
let currentReturnedFrom = "";
let currentReturnedTo = "";
let currentSort = "latest";

let currentPage = 1;
let searchTimer;

const today = new Date().toISOString().split("T")[0];

document.getElementById("returnedFrom").max = today;
document.getElementById("returnedTo").max = today;

async function loadFines(page = 1) {

    currentPage = page;

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        status: currentStatus,
        returned_from: currentReturnedFrom,
        returned_to: currentReturnedTo,
        sort: currentSort
    });

    try {

        const response = await fetch(`/api/user/fines?${params}`);
        const data = await response.json();

        const table = document.getElementById("fineTable");
        table.innerHTML = "";

        if (data.fines.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        No fines found
                    </td>
                </tr>
            `;

        }

        data.fines.forEach(fine => {

            table.innerHTML += `
                <tr>

                    <td class="py-3 px-4">
                        <img src="${fine.cover_image}"
                             style="width:60px;height:80px;object-fit:cover;border-radius:8px;">
                    </td>

                    <td class="py-3 px-4">
                        <h6 class="fw-bold mb-0 text-primary-dark">
                            ${fine.title}
                        </h6>
                    </td>

                    <td class="py-3 px-4">
    ${new Date(fine.due_date).toLocaleDateString()}
</td>
                    <td class="py-3 px-4 fw-semibold text-danger">
                        Rs. ${Number(fine.fine_amount).toLocaleString()}
                    </td>

                    <td class="py-3 px-4">

                        ${fine.fine_paid
                    ?
                    `<span class="badge bg-success">Paid</span>`
                    :
                    `<span class="badge bg-danger">Unpaid</span>`
                }

                    </td>

                    <td class="py-3 px-4 text-center">

                        ${fine.fine_paid
                    ?
                    `<button class="btn btn-secondary btn-sm px-3" disabled>
                                Paid
                            </button>`
                    :
                    `<button class="btn btn-sm text-white px-3"
                                     style="background:#002147;border-radius:10px;"
                                     onclick="payFine(${fine.id})">
                                <i class="fas fa-credit-card me-2"></i>
                                Pay
                            </button>`
                }

                    </td>

                </tr>
            `;

        });

        document.getElementById("entryText").innerHTML = `
            Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1}
            to ${Math.min(page * 10, data.total)}
            of ${data.total} entries
        `;

        const pagination = document.getElementById("pagination");
        pagination.innerHTML = "";

        if (data.totalPages > 1) {

            pagination.innerHTML += `
                <li class="page-item ${page === 1 ? "disabled" : ""}">
                    <button class="page-link"
                        onclick="loadFines(${page - 1})">
                        Previous
                    </button>
                </li>
            `;

            for (let i = 1; i <= data.totalPages; i++) {

                pagination.innerHTML += `
                    <li class="page-item ${page === i ? "active" : ""}">
                        <button class="page-link"
                            onclick="loadFines(${i})">
                            ${i}
                        </button>
                    </li>
                `;

            }

            pagination.innerHTML += `
                <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
                    <button class="page-link"
                        onclick="loadFines(${page + 1})">
                        Next
                    </button>
                </li>
            `;

        }

    } catch (err) {

        console.log(err);
        showToast("Failed to load fines");

    }

}

async function payFine(id) {

    const result = await Swal.fire({
        title: "Pay Fine?",
        text: "Once paid, the librarian can return your book.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#002147",
        cancelButtonColor: "#c5a059",
        confirmButtonText: "Pay",
        cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {

        const response = await fetch(`/api/user/fines/${id}/pay`, {
            method: "PUT",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message);
            return;
        }

        showToast(data.message, "success");
        loadFines(currentPage);

    } catch (err) {

        console.log(err);
        showToast("Failed to pay fine");

    }

}

function triggerSearch() {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {

        currentTitle = document.getElementById("searchBook").value.trim();

        currentStatus = document.getElementById("fineStatus").value;

        currentReturnedFrom = document.getElementById("returnedFrom").value;

        currentReturnedTo = document.getElementById("returnedTo").value;

        currentSort = document.getElementById("sortBy").value;

        loadFines(1);

    }, 300);

}

document.getElementById("searchBook").addEventListener("input", triggerSearch);
document.getElementById("fineStatus").addEventListener("change", triggerSearch);
document.getElementById("returnedFrom").addEventListener("change", triggerSearch);
document.getElementById("returnedTo").addEventListener("change", triggerSearch);
document.getElementById("sortBy").addEventListener("change", triggerSearch);

document.getElementById("returnedFrom").addEventListener("change", () => {

    const from = document.getElementById("returnedFrom").value;
    const to = document.getElementById("returnedTo");

    to.min = from || "";

    if (to.value && to.value < from) {
        to.value = "";
    }

});

document.getElementById("clearFilters").addEventListener("click", () => {

    document.getElementById("searchBook").value = "";
    document.getElementById("fineStatus").value = "";
    document.getElementById("returnedFrom").value = "";
    document.getElementById("returnedTo").value = "";
    document.getElementById("sortBy").value = "latest";

    currentTitle = "";
    currentStatus = "";
    currentReturnedFrom = "";
    currentReturnedTo = "";
    currentSort = "latest";

    loadFines(1);

});

loadFines();
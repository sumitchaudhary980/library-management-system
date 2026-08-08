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
let currentBorrowedFrom = "";
let currentBorrowedTo = "";
let currentReturnedFrom = "";
let currentReturnedTo = "";
let currentSort = "returned_desc";

let currentPage = 1;
let searchTimer;

function showBorrowHistoryLoading() {
    document.getElementById("borrowHistoryTable").innerHTML = `
        <tr class="loading-row">
            <td colspan="7" class="text-center py-5 text-muted">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading borrow history...
            </td>
        </tr>
    `;
    document.getElementById("entryText").innerHTML = "";
    document.getElementById("pagination").innerHTML = "";
}

async function loadBorrowHistory(page = 1) {
    currentPage = page;
    showBorrowHistoryLoading();

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        borrowed_from: currentBorrowedFrom,
        borrowed_to: currentBorrowedTo,
        returned_from: currentReturnedFrom,
        returned_to: currentReturnedTo,
        sort: currentSort
    });

    try {
        const response = await fetch(`/api/user/borrow-history?${params}`);
        const data = await response.json();

        const table = document.getElementById("borrowHistoryTable");
        table.innerHTML = "";

        if (data.books.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        No borrow history found
                    </td>
                </tr>
            `;
        }

        data.books.forEach(book => {
            table.innerHTML += `
                <tr>
                    <td class="py-3 px-4">
                        <img src="${book.cover_image}"
                             alt="${book.title} book cover"
                             loading="lazy"
                             decoding="async"
                             style="width:60px; height:80px; object-fit:cover; border-radius:8px;">
                    </td>
                    <td class="py-3 px-4 text-nowrap">
                        <h6 class="fw-bold mb-0 text-primary-dark">${book.title}</h6>
                    </td>
                    <td class="py-3 px-4 text-nowrap">${book.author}</td>
                    <td class="py-3 px-4 text-nowrap">${new Date(book.borrowed_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-nowrap">${new Date(book.due_date).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-nowrap">${new Date(book.returned_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-center text-nowrap">
                        ${new Date(book.returned_at) <= new Date(book.due_date)
                    ? `<span class="badge bg-success">Returned On Time</span>`
                    : `<span class="badge bg-danger">Returned Late</span>`
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
                    <button class="page-link" onclick="loadBorrowHistory(${page - 1})">
                        Previous
                    </button>
                </li>
            `;

            for (let i = 1; i <= data.totalPages; i++) {
                pagination.innerHTML += `
                    <li class="page-item ${page === i ? "active" : ""}">
                        <button class="page-link" onclick="loadBorrowHistory(${i})">
                            ${i}
                        </button>
                    </li>
                `;
            }

            pagination.innerHTML += `
                <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
                    <button class="page-link" onclick="loadBorrowHistory(${page + 1})">
                        Next
                    </button>
                </li>
            `;
        }
    } catch (err) {
        console.log(err);
        showToast("Failed to load borrow history");
    }
}

function triggerSearch() {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {

        currentTitle = document.getElementById("searchBook").value.trim();

        currentBorrowedFrom =
            document.getElementById("borrowedFrom").value;

        currentBorrowedTo =
            document.getElementById("borrowedTo").value;

        currentReturnedFrom =
            document.getElementById("returnedFrom").value;

        currentReturnedTo =
            document.getElementById("returnedTo").value;

        currentSort =
            document.getElementById("sortBy").value;

        loadBorrowHistory(1);

    }, 300);

}

document.getElementById("searchBook")
    .addEventListener("input", triggerSearch);

document.getElementById("borrowedFrom")
    .addEventListener("change", triggerSearch);

document.getElementById("borrowedTo")
    .addEventListener("change", triggerSearch);

document.getElementById("returnedFrom")
    .addEventListener("change", triggerSearch);

document.getElementById("returnedTo")
    .addEventListener("change", triggerSearch);

document.getElementById("sortBy")
    .addEventListener("change", triggerSearch);

document.getElementById("clearFilters").addEventListener("click", () => {

    document.getElementById("searchBook").value = "";

    document.getElementById("borrowedFrom").value = "";

    document.getElementById("borrowedTo").value = "";

    document.getElementById("returnedFrom").value = "";

    document.getElementById("returnedTo").value = "";

    document.getElementById("sortBy").value = "returned_desc";

    currentTitle = "";
    currentBorrowedFrom = "";
    currentBorrowedTo = "";
    currentReturnedFrom = "";
    currentReturnedTo = "";
    currentSort = "returned_desc";


    loadBorrowHistory(1);

});
const today = new Date().toISOString().split("T")[0];

const borrowedFrom = document.getElementById("borrowedFrom");
const borrowedTo = document.getElementById("borrowedTo");
const returnedFrom = document.getElementById("returnedFrom");
const returnedTo = document.getElementById("returnedTo");

// Prevent selecting future dates
borrowedFrom.max = today;
borrowedTo.max = today;
returnedFrom.max = today;
returnedTo.max = today;

// Borrowed date range
borrowedFrom.addEventListener("change", () => {
    borrowedTo.min = borrowedFrom.value;

    if (borrowedTo.value && borrowedTo.value < borrowedFrom.value) {
        borrowedTo.value = "";
    }
});

// Returned date range
returnedFrom.addEventListener("change", () => {
    returnedTo.min = returnedFrom.value;

    if (returnedTo.value && returnedTo.value < returnedFrom.value) {
        returnedTo.value = "";
    }
});
loadBorrowHistory();

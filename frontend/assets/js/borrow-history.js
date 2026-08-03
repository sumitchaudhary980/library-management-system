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

const userId = window.location.pathname.split("/").pop();

let currentTitle = "";
let currentBorrowedFrom = "";
let currentBorrowedTo = "";
let currentReturnedFrom = "";
let currentReturnedTo = "";
let currentSort = "";

let currentPage = 1;
let searchTimer;

async function loadFineDetails(page = 1) {

    currentPage = page;

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

        const response = await fetch(
            `/api/admin/borrow-history/${userId}?${params}`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || "Failed to load borrow history");
            return;
        }

        document.getElementById("totalBorrowedBooks").textContent =
            data.totalBorrowedBooks;

        const table = document.getElementById("fineTable");
        table.innerHTML = "";

        if (data.books.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        No books found
                    </td>
                </tr>
            `;

            document.getElementById("entryText").innerHTML =
                "Showing 0 to 0 of 0 entries";

            document.getElementById("pagination").innerHTML = "";

            return;
        }

        data.books.forEach(book => {

            const returned = Number(book.returned) === 1;
            const finePaid = Number(book.fine_paid) === 1;
            const fineAmount = Number(book.fine_amount || 0);
            const paidAmount = Number(book.fine_paid_amount || 0);
            const remainingFine = fineAmount - paidAmount;

            table.innerHTML += `
            <tr>

                <td class="py-3 px-4">
                    <img
                        src="${book.cover_image || "/assets/images/default-book.png"}"
                        style="width:60px;height:80px;object-fit:cover;border-radius:8px;">
                </td>

                <td class="py-3 px-4 text-nowrap">
                    <h6 class="fw-bold mb-0">${book.title}</h6>
                    <small class="text-muted">
                        ${book.author || "Unknown"}
                    </small>
                </td>

                <td class="py-3 px-4 text-nowrap">
                    ${new Date(book.borrowed_at).toLocaleDateString()}
                </td>

                <td class="py-3 px-4 text-nowrap">
                    ${new Date(book.due_date).toLocaleDateString()}
                </td>

                <td class="py-3 px-4 text-center text-nowrap">

                    ${returned
                    ? new Date(book.returned_at).toLocaleDateString()
                    : `<span class="text-muted">Not Returned</span>`
                }

                </td>

               <td class="py-3 px-4 fw-bold text-center text-nowrap">

${fineAmount > 0
?
`
<div>

    <span class="badge bg-danger mb-1">
        Fine: Rs. ${fineAmount.toLocaleString()}
    </span>

    <br>

    <span class="badge bg-success mb-1">
        Paid: Rs. ${paidAmount.toLocaleString()}
    </span>

    ${
        remainingFine > 0
        ?
        `
        <br>
        <span class="badge bg-warning text-dark">
            Due: Rs. ${remainingFine.toLocaleString()}
        </span>
        `
        :
        ""
    }

</div>
`
:
`
<span class="text-muted">
No Fine
</span>
`

}

</td>

                <td class="py-3 px-4 text-center text-nowrap">

                    ${returned
                    ? `
                            <button
                                class="btn btn-secondary btn-sm"
                                disabled>
                                Returned
                            </button>
                            `
                    : remainingFine > 0
? `
<button
    class="btn btn-sm text-white"
    style="background:#002147;border-radius:8px;"
    onclick="collectCash(${book.id})">
    
    <i class="fas fa-money-bill-wave me-1"></i>
    Collect Cash

</button>
`
                        : `
                            <button
                                class="btn btn-sm text-white"
                                style="background:#002147;border-radius:8px;"
                                onclick="returnBook(${book.id})">

                                <i class="fas fa-rotate-left me-1"></i>
                                Return

                            </button>
                            `
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
                        onclick="loadFineDetails(${page - 1})">
                        Previous
                    </button>
                </li>
            `;

            for (let i = 1; i <= data.totalPages; i++) {

                pagination.innerHTML += `
                    <li class="page-item ${page === i ? "active" : ""}">
                        <button class="page-link"
                            onclick="loadFineDetails(${i})">
                            ${i}
                        </button>
                    </li>
                `;

            }

            pagination.innerHTML += `
                <li class="page-item ${page === data.totalPages ? "disabled" : ""}">
                    <button class="page-link"
                        onclick="loadFineDetails(${page + 1})">
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
async function collectCash(id) {

    const result = await Swal.fire({
        title: "Collect Cash?",
        text: "Confirm that the fine has been collected.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#002147",
        cancelButtonColor: "#c5a059",
        confirmButtonText: "Collect",
        cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {

        const response = await fetch(
            `/api/admin/fines/${id}/pay`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message);
            return;
        }

        showToast(data.message, "success");

        loadFineDetails(currentPage);

    } catch (err) {

        console.log(err);
        showToast("Failed to collect cash.");

    }

}

async function returnBook(id) {

    const result = await Swal.fire({

        title: "Return book?",
        text: "The book will be marked as returned.",
        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#002147",
        cancelButtonColor: "#c5a059",

        confirmButtonText: "Return",
        cancelButtonText: "Cancel"

    });

    if (!result.isConfirmed) return;

    try {

        const response = await fetch(
            `/api/admin/return-book/${id}`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            showToast(data.message);

            return;

        }

        showToast(data.message, "success");

        loadFineDetails(currentPage);

    } catch (err) {

        console.log(err);

        showToast("Failed to return book");

    }

}

function triggerSearch() {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {

        currentTitle =
            document.getElementById("searchBook").value.trim();

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

        loadFineDetails(1);

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

document.getElementById("clearFilters")
    .addEventListener("click", () => {

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
        currentSort = "";

        loadFineDetails(1);

    });

const today = new Date().toISOString().split("T")[0];

const borrowedFrom = document.getElementById("borrowedFrom");
const borrowedTo = document.getElementById("borrowedTo");
const returnedFrom = document.getElementById("returnedFrom");
const returnedTo = document.getElementById("returnedTo");

borrowedFrom.max = today;
borrowedTo.max = today;
returnedFrom.max = today;
returnedTo.max = today;

borrowedFrom.addEventListener("change", () => {

    borrowedTo.min = borrowedFrom.value;

    if (
        borrowedTo.value &&
        borrowedTo.value < borrowedFrom.value
    ) {
        borrowedTo.value = "";
    }

});

returnedFrom.addEventListener("change", () => {

    returnedTo.min = returnedFrom.value;

    if (
        returnedTo.value &&
        returnedTo.value < returnedFrom.value
    ) {
        returnedTo.value = "";
    }

});

loadFineDetails();
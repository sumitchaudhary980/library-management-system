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
let currentSort = "due_asc";
let currentTitle = "";
let currentBorrowedFrom = "";
let currentBorrowedTo = "";

let currentPage = 1;
let searchTimer;

// Disable future dates
const today = new Date().toISOString().split("T")[0];

document.getElementById("borrowedFrom").max = today;
document.getElementById("borrowedTo").max = today;

async function loadBorrowedBooks(page = 1) {
    currentPage = page;

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        borrowed_from: currentBorrowedFrom,
        borrowed_to: currentBorrowedTo,
        sort: currentSort
    });

    try {
        const response = await fetch(`/api/user/borrowed-books?${params}`);
        const data = await response.json();

        const table = document.getElementById("borrowedBookTable");
        table.innerHTML = "";

        if (data.books.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        No borrowed books found
                    </td>
                </tr>
            `;
        }
console.log(data.books);
        data.books.forEach((book) => {
            const today = new Date();
            const dueDate = new Date(book.due_date);

            const daysRemaining = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            let remainingBadge;

            if (daysRemaining > 5) {
                remainingBadge = `
                    <span class="badge bg-success">
                        ${daysRemaining} Days
                    </span>`;
            } else if (daysRemaining > 0) {
                remainingBadge = `
                    <span class="badge bg-danger">
                        ${daysRemaining} Days
                    </span>`;
            } else if (daysRemaining === 0) {
                remainingBadge = `
                    <span class="badge bg-warning text-dark">
                        Due Today
                    </span>`;
            } else {
                remainingBadge = `
                    <span class="badge bg-dark">
                        Overdue
                    </span>`;
            }

            table.innerHTML += `
                <tr>
                    <td class="py-3 px-4 text-nowrap">
                        <img src="${book.cover_image}"
                             style="width:60px; height:80px; object-fit:cover; border-radius:8px;">
                    </td>
                    <td class="py-3 px-4 text-nowrap">
                        <h6 class="fw-bold mb-0 text-primary-dark">${book.title}</h6>
                    </td>
                    <td class="py-3 px-4 text-nowrap">${book.author}</td>
                    <td class="py-3 px-4 text-nowrap">${new Date(book.borrowed_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-nowrap">${new Date(book.due_date).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-nowrap">${remainingBadge}</td>
                    <td class="py-3 px-4 text-center text-nowrap">
                       ${book.renewed
                    ? `
            <button class="btn btn-secondary btn-sm px-3" disabled
                    style="border-radius:10px; min-width:110px;">
                Renewed
            </button>
        `
                    : (book.fine_amount > 0 && book.fine_paid === 0)
                        ? `
                <button class="btn btn-danger btn-sm px-3" disabled
                        title="Please clear your fine before renewing this book."
                        style="border-radius:10px; min-width:110px;">
                    <i class="fas fa-ban me-2"></i>Fine Due
                </button>
            `
                        : `
                <button class="btn btn-sm px-3 text-white"
                        onclick="renewBook(${book.borrowed_id})"
                        style="background:#c5a059; border-radius:10px; min-width:110px;">
                    <i class="fas fa-rotate me-2"></i>Renew
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
            for (let i = 1; i <= data.totalPages; i++) {
                pagination.innerHTML += `
                    <li class="page-item ${page === i ? "active" : ""}">
                        <button class="page-link" onclick="loadBorrowedBooks(${i})">
                            ${i}
                        </button>
                    </li>
                `;
            }
        }
    } catch (err) {
        console.log(err);
        showToast("Failed to load borrowed books");
    }
}
async function renewBook(id) {

    const result = await Swal.fire({
        title: "Renew book?",
        text: "The due date will be extended by 7 days.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#002147",
        cancelButtonColor: "#c5a059",
        confirmButtonText: "Renew",
        cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {

        const response = await fetch(`/api/user/borrowed-books/${id}/renew`, {
            method: "PUT"
        });

        const data = await response.json();

        if (!response.ok) {
            return showToast(data.message || "Failed to renew book");
        }

        showToast(data.message, "success");
        loadBorrowedBooks(currentPage);

    } catch (err) {

        console.error(err);
        showToast("Something went wrong.");

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

        currentSort =
            document.getElementById("sortBy").value;

        loadBorrowedBooks(1);

    }, 500);

}

document.getElementById("borrowedFrom").addEventListener("change", () => {

    const from = document.getElementById("borrowedFrom").value;
    const borrowedTo = document.getElementById("borrowedTo");

    borrowedTo.min = from || "";
    borrowedTo.max = today;

    if (borrowedTo.value && borrowedTo.value < from) {
        borrowedTo.value = "";
    }

    triggerSearch();

});


document.getElementById("borrowedTo").addEventListener("change", () => {

    const to = document.getElementById("borrowedTo").value;
    const borrowedFrom = document.getElementById("borrowedFrom");

    borrowedFrom.max = to || today;

    if (borrowedFrom.value && borrowedFrom.value > to) {
        borrowedFrom.value = "";
    }

    triggerSearch();

});
document.getElementById("sortBy").addEventListener("change", triggerSearch);
document.getElementById("searchBook").addEventListener("input", triggerSearch);

document.getElementById("clearFilters").addEventListener("click", () => {

    document.getElementById("searchBook").value = "";
    document.getElementById("borrowedFrom").value = "";
    document.getElementById("borrowedTo").value = "";
    document.getElementById("sortBy").value = "due_asc";

    currentTitle = "";
    currentBorrowedFrom = "";
    currentBorrowedTo = "";
    currentSort = "due_asc";

    document.getElementById("borrowedFrom").max = today;
    document.getElementById("borrowedFrom").min = "";

    document.getElementById("borrowedTo").max = today;
    document.getElementById("borrowedTo").min = "";

    loadBorrowedBooks(1);

});

loadBorrowedBooks();
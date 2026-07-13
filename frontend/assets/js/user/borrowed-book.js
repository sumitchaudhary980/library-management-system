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
                    <td colspan="8" class="text-center py-5 text-muted">
                        No borrowed books found
                    </td>
                </tr>
            `;
        }

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
                    <td class="py-3 px-4">
                        <img src="${book.cover_image}"
                             style="width:60px; height:80px; object-fit:cover; border-radius:8px;">
                    </td>
                    <td class="py-3 px-4">
                        <h6 class="fw-bold mb-0 text-primary-dark">${book.title}</h6>
                    </td>
                    <td class="py-3 px-4">${book.author}</td>
                    <td class="py-3 px-4">${new Date(book.borrowed_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4">${new Date(book.due_date).toLocaleDateString()}</td>
                    <td class="py-3 px-4">${remainingBadge}</td>
                    <td class="py-3 px-4 text-center">
                        ${
                            book.renewed
                                ? `
                                <button class="btn btn-secondary btn-sm px-3" disabled
                                        style="border-radius:10px; min-width:110px;">
                                    Renewed
                                </button>`
                                : `
                                <button class="btn btn-sm px-3 text-white"
                                        onclick="renewBook(${book.borrowed_id})"
                                        style="background:#c5a059; border-radius:10px; min-width:110px;">
                                    <i class="fas fa-rotate me-2"></i>Renew
                                </button>`
                        }
                    </td>
                    <td class="py-3 px-4 text-center">
                        <button class="btn btn-sm px-3 text-white"
                                onclick="returnBook(${book.borrowed_id})"
                                style="background:var(--primary-dark); border-radius:10px; min-width:110px;">
                            <i class="fas fa-right-from-bracket me-2"></i>Return
                        </button>
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
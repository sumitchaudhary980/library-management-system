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
let currentAuthor = "";
let currentGenre = "";
let currentPage = 1;
let searchTimer;

async function loadBorrowHistory(page = 1) {
    currentPage = page;

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        author: currentAuthor,
        genre: currentGenre
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
                             style="width:60px; height:80px; object-fit:cover; border-radius:8px;">
                    </td>
                    <td class="py-3 px-4">
                        <h6 class="fw-bold mb-0 text-primary-dark">${book.title}</h6>
                    </td>
                    <td class="py-3 px-4">${book.author}</td>
                    <td class="py-3 px-4">${new Date(book.borrowed_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4">${new Date(book.due_date).toLocaleDateString()}</td>
                    <td class="py-3 px-4">${new Date(book.returned_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="badge bg-success">Returned</span>
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
        currentAuthor = document.getElementById("searchAuthor").value.trim();
        currentGenre = document.getElementById("searchGenre").value.trim();

        loadBorrowHistory(1);
    }, 500);
}

document.getElementById("searchBook").addEventListener("input", triggerSearch);
document.getElementById("searchAuthor").addEventListener("input", triggerSearch);
document.getElementById("searchGenre").addEventListener("input", triggerSearch);

document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("searchBook").value = "";
    document.getElementById("searchAuthor").value = "";
    document.getElementById("searchGenre").value = "";

    currentTitle = "";
    currentAuthor = "";
    currentGenre = "";

    loadBorrowHistory(1);
});

loadBorrowHistory();
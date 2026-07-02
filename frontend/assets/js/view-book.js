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

const id = window.location.pathname.split("/").pop();

async function loadBook() {
    try {
        const response = await fetch(`/api/admin/books/${id}`, {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message);
            setTimeout(() => {
                location.href = "/books";
            }, 1000);
            return;
        }

        document.getElementById("coverImage").src =
            data.cover_image;

        document.getElementById("bookTitle").textContent =
            data.title;

        document.getElementById("bookAuthor").textContent =
            data.author;

        document.getElementById("bookGenre").textContent =
            data.genre;

        document.getElementById("bookStock").innerHTML = `
      <span class="badge ${data.stock_quantity < 5
                ? "bg-danger"
                : "bg-success"
            }">
        ${data.stock_quantity}
      </span>
    `;

       
    } catch (err) {
        console.log(err);
        showToast("Failed to load book");
    }
}

loadBook();
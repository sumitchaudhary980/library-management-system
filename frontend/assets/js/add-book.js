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

const title = document.getElementById("title");
const authorSearch = document.getElementById("authorSearch");
const authorId = document.getElementById("authorId");
const authorSuggestions = document.getElementById("authorSuggestions");

const genreSearch = document.getElementById("genreSearch");
const genreId = document.getElementById("genreId");
const genreSuggestions = document.getElementById("genreSuggestions");

const stock = document.getElementById("stock");
const cover = document.getElementById("cover");

let authors = [];
let genres = [];

async function loadLookupData() {
  try {
    const [authorRes, genreRes] = await Promise.all([
      fetch("/api/admin/authors/all", {
        credentials: "include",
      }),
      fetch("/api/admin/genres/all", {
        credentials: "include",
      }),
    ]);

    authors = await authorRes.json();
    genres = await genreRes.json();
  } catch (err) {
    console.log(err);
    showToast("Failed to load authors and genres");
  }
}

function renderSuggestions(input, hiddenInput, list, data) {
  list.innerHTML = "";

  const keyword = input.value.trim().toLowerCase();

  if (!keyword) {
    return;
  }

  const filtered = data
    .filter((item) =>
      item.name.toLowerCase().includes(keyword)
    )
    .slice(0, 8);

  if (!filtered.length) {
    return;
  }

  filtered.forEach((item) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className =
      "list-group-item list-group-item-action";

    button.textContent = item.name;

    button.onclick = () => {
      input.value = item.name;
      hiddenInput.value = item.id;
      list.innerHTML = "";
    };

    list.appendChild(button);
  });
}

authorSearch.addEventListener("input", () => {
  authorId.value = "";

  renderSuggestions(
    authorSearch,
    authorId,
    authorSuggestions,
    authors
  );
});

genreSearch.addEventListener("input", () => {
  genreId.value = "";

  renderSuggestions(
    genreSearch,
    genreId,
    genreSuggestions,
    genres
  );
});

document.addEventListener("click", (e) => {
  if (!authorSuggestions.contains(e.target) && e.target !== authorSearch) {
    authorSuggestions.innerHTML = "";
  }

  if (!genreSuggestions.contains(e.target) && e.target !== genreSearch) {
    genreSuggestions.innerHTML = "";
  }
});

document
  .getElementById("bookForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    [
      title,
      authorSearch,
      genreSearch,
      stock,
      cover,
    ].forEach((input) =>
      input.classList.remove("is-invalid")
    );

    let valid = true;

    if (!title.value.trim()) {
      title.classList.add("is-invalid");
      valid = false;
    }

    if (!authorId.value) {
      authorSearch.classList.add("is-invalid");
      valid = false;
    }

    if (!genreId.value) {
      genreSearch.classList.add("is-invalid");
      valid = false;
    }

    if (
      stock.value === "" ||
      Number(stock.value) < 0
    ) {
      stock.classList.add("is-invalid");
      valid = false;
    }

    if (!cover.files.length) {
      cover.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      return;
    }

    const formData = new FormData();

    formData.append("title", title.value.trim());
    formData.append("authorId", authorId.value);
    formData.append("genreId", genreId.value);
    formData.append("stock", stock.value);
    formData.append("cover", cover.files[0]);

    try {
      const response = await fetch("/api/admin/books", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message, "success");

        setTimeout(() => {
          location.href = "/books";
        }, 1000);
      } else {
        showToast(data.message);
      }
    } catch (err) {
      console.log(err);
      showToast("Server error");
    }
  });

loadLookupData();
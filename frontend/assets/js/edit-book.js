function showToast(message, type = "error") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 4000,
    timerProgressBar: true,
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
const coverPreview = document.getElementById("coverPreview");
const removeCoverBtn = document.getElementById("removeCoverBtn");

const bookForm = document.getElementById("bookForm");

const bookId = window.location.pathname.split("/").pop();

let authors = [];
let genres = [];
let currentCover = "";

async function loadLookupData() {
  const [authorRes, genreRes] = await Promise.all([
    fetch("/api/admin/authors/all", { credentials: "include" }),
    fetch("/api/admin/genres/all", { credentials: "include" }),
  ]);

  authors = await authorRes.json();
  genres = await genreRes.json();
}

function clearErrors() {
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((el) => {
    const def = el.dataset.default;
    if (def) el.textContent = def;
  });
}

function setError(input, message) {
  input.classList.add("is-invalid");

  const feedback = input.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    feedback.textContent = message;
  }
}

function renderSuggestions(input, hidden, list, data) {
  list.innerHTML = "";

  const keyword = input.value.trim().toLowerCase();

  if (!keyword) return;

  data
    .filter((item) => item.name.toLowerCase().includes(keyword))
    .slice(0, 8)
    .forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-group-item list-group-item-action";
      btn.textContent = item.name;

      btn.onclick = () => {
        input.value = item.name;
        hidden.value = item.id;
        list.innerHTML = "";
      };

      list.appendChild(btn);
    });
}

authorSearch.addEventListener("input", () => {
  authorId.value = "";
  renderSuggestions(authorSearch, authorId, authorSuggestions, authors);
});

genreSearch.addEventListener("input", () => {
  genreId.value = "";
  renderSuggestions(genreSearch, genreId, genreSuggestions, genres);
});

document.addEventListener("click", (e) => {
  if (!authorSuggestions.contains(e.target) && e.target !== authorSearch) {
    authorSuggestions.innerHTML = "";
  }

  if (!genreSuggestions.contains(e.target) && e.target !== genreSearch) {
    genreSuggestions.innerHTML = "";
  }
});

async function loadBook() {
  const res = await fetch(`/api/admin/books/${bookId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    showToast("Book not found");
    setTimeout(() => (location.href = "/books"), 1000);
    return;
  }

  const book = await res.json();

  title.value = book.title;
  authorSearch.value = book.author_name;
  authorId.value = book.author_id;

  genreSearch.value = book.genre_name;
  genreId.value = book.genre_id;

  stock.value = book.stock_quantity;

  currentCover = book.cover_image;
  coverPreview.src = currentCover;
}

cover.addEventListener("change", () => {
  if (!cover.files.length) {
    coverPreview.src = currentCover;
    removeCoverBtn.style.display = "none";
    return;
  }

  const file = cover.files[0];

  const reader = new FileReader();

  reader.onload = (e) => {
    coverPreview.src = e.target.result;
    removeCoverBtn.style.display = "flex";
    removeCoverBtn.style.alignItems = "center";
    removeCoverBtn.style.justifyContent = "center";
  };

  reader.readAsDataURL(file);
});

removeCoverBtn.addEventListener("click", () => {
  cover.value = "";
  coverPreview.src = currentCover;
  removeCoverBtn.style.display = "none";
});

bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearErrors();

  let valid = true;

  if (!title.value.trim()) {
    setError(title, "Book title is required");
    valid = false;
  }

  if (!authors.find((a) => a.id == authorId.value)) {
    setError(authorSearch, "Invalid author selected");
    valid = false;
  }

  if (!genres.find((g) => g.id == genreId.value)) {
    setError(genreSearch, "Invalid genre selected");
    valid = false;
  }

  if (stock.value === "") {
    setError(stock, "Stock quantity is required");
    valid = false;
  } else if (Number(stock.value) < 0) {
    setError(stock, "Stock cannot be negative");
    valid = false;
  }

  if (!valid) return;

  const formData = new FormData();

  formData.append("title", title.value.trim());
  formData.append("authorId", authorId.value);
  formData.append("genreId", genreId.value);
  formData.append("stock", stock.value);

  if (cover.files.length) {
    formData.append("cover", cover.files[0]);
  }

  const res = await fetch(`/api/admin/books/${bookId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  const data = await res.json();

  if (res.ok) {
    showToast("Book updated successfully", "success");
    setTimeout(() => (location.href = "/books"), 1000);
    return;
  }

  if (data.errors) {
    if (data.errors.title) setError(title, data.errors.title);
    if (data.errors.authorId) setError(authorSearch, data.errors.authorId);
    if (data.errors.genreId) setError(genreSearch, data.errors.genreId);
    if (data.errors.stock) setError(stock, data.errors.stock);
    if (data.errors.cover) setError(cover, data.errors.cover);
  } else {
    showToast(data.message || "Failed to update book");
  }
});

(async () => {
  await loadLookupData();
  await loadBook();
})();
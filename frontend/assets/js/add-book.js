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

let authors = [];
let genres = [];
let submitted = false;

async function loadLookupData() {
  const [a, g] = await Promise.all([
    fetch("/api/admin/authors/all", { credentials: "include" }),
    fetch("/api/admin/genres/all", { credentials: "include" }),
  ]);

  authors = await a.json();
  genres = await g.json();
}

function clearErrors() {
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((el) => {
    const def = el.getAttribute("data-default");
    if (def) el.textContent = def;
  });
}

function setError(input, message) {
  input.classList.add("is-invalid");
  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) feedback.textContent = message;
}

function validateForm() {
  clearErrors();

  let ok = true;

  if (!title.value.trim()) {
    setError(title, "Book title is required");
    ok = false;
  }

  if (!authorId.value) {
    setError(authorSearch, "Invalid author selected");
    ok = false;
  }

  if (!genres.find((g) => g.id == genreId.value)) {
    setError(genreSearch, "Invalid genre selected");
    ok = false;
  }

  const stockVal = Number(stock.value);

  if (stock.value === "") {
    setError(stock, "Stock quantity is required");
    ok = false;
  } else if (stockVal < 0) {
    setError(stock, "Stock cannot be negative");
    ok = false;
  }

  if (!cover.files.length) {
    setError(cover, "Cover image is required");
    ok = false;
  }

  return ok;
}

authorSearch.addEventListener("input", () => {
  authorId.value = "";
});

genreSearch.addEventListener("input", () => {
  genreId.value = "";
});

function renderSuggestions(input, hidden, list, data) {
  list.innerHTML = "";

  const keyword = input.value.trim().toLowerCase();
  if (!keyword) return;

  const filtered = data
    .filter((i) => i.name.toLowerCase().includes(keyword))
    .slice(0, 8);

  filtered.forEach((item) => {
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
  renderSuggestions(authorSearch, authorId, authorSuggestions, authors);
});

genreSearch.addEventListener("input", () => {
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

document.getElementById("bookForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitted = true;

  if (!validateForm()) return;

  const formData = new FormData();
  formData.append("title", title.value.trim());
  formData.append("authorId", authorId.value);
  formData.append("genreId", genreId.value);
  formData.append("stock", stock.value);
  formData.append("cover", cover.files[0]);

  const res = await fetch("/api/admin/books", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json();

  if (res.ok) {
    showToast("Book added successfully", "success");
    setTimeout(() => (location.href = "/books"), 1000);
  } else {
    clearErrors();

    if (data.errors?.title) setError(title, data.errors.title);
    if (data.errors?.authorId) setError(authorSearch, data.errors.authorId);
    if (data.errors?.genreId) setError(genreSearch, data.errors.genreId);
    if (data.errors?.stock) setError(stock, data.errors.stock);
    if (data.errors?.cover) setError(cover, data.errors.cover);
  }
});

loadLookupData();
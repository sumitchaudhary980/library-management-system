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
const submitBtn = document.getElementById("submitBtn");
const bookId = window.location.pathname.split("/").pop();

let authors = [];
let genres = [];
let currentCover = "";
const originalPlaceholders = {
  title: title.placeholder,
  authorSearch: authorSearch.placeholder,
  genreSearch: genreSearch.placeholder,
  stock: stock.placeholder,
};

function setInitialDataLoading(loading) {
  [title, authorSearch, genreSearch, stock, cover, submitBtn].forEach((el) => {
    el.disabled = loading;
  });

  if (loading) {
    title.placeholder = "Loading book title...";
    authorSearch.placeholder = "Loading author...";
    genreSearch.placeholder = "Loading genre...";
    stock.placeholder = "Loading stock...";
    coverPreview.classList.add("image-loading");
    return;
  }

  title.placeholder = originalPlaceholders.title;
  authorSearch.placeholder = originalPlaceholders.authorSearch;
  genreSearch.placeholder = originalPlaceholders.genreSearch;
  stock.placeholder = originalPlaceholders.stock;
  coverPreview.classList.remove("image-loading");
}

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

function clearError(input) {
  input.classList.remove("is-invalid");

  const feedback = input.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    const def = feedback.dataset.default;
    feedback.textContent = def || "";
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
        clearError(input);
      };

      list.appendChild(btn);
    });
}

// ---- FIELD VALIDATORS (reused by both live validation and submit) ----

function validateTitle() {
  if (!title.value.trim()) {
    setError(title, "Book title is required");
    return false;
  }

  clearError(title);
  return true;
}

function validateAuthor() {
  if (!authors.find((a) => a.id == authorId.value)) {
    setError(authorSearch, "Invalid author selected");
    return false;
  }

  clearError(authorSearch);
  return true;
}

function validateGenre() {
  if (!genres.find((g) => g.id == genreId.value)) {
    setError(genreSearch, "Invalid genre selected");
    return false;
  }

  clearError(genreSearch);
  return true;
}

function validateStock() {
  if (stock.value === "") {
    setError(stock, "Stock quantity is required");
    return false;
  }

  if (Number(stock.value) < 0) {
    setError(stock, "Stock cannot be negative");
    return false;
  }

  clearError(stock);
  return true;
}

// ---- LIVE / DYNAMIC VALIDATION ----

title.addEventListener("blur", validateTitle);
title.addEventListener("input", () => {
  if (title.classList.contains("is-invalid")) validateTitle();
});

authorSearch.addEventListener("input", () => {
  authorId.value = "";
  renderSuggestions(authorSearch, authorId, authorSuggestions, authors);

  if (authorSearch.classList.contains("is-invalid")) validateAuthor();
});
authorSearch.addEventListener("blur", () => {
  // small delay so a suggestion click can register before we validate
  setTimeout(validateAuthor, 150);
});

genreSearch.addEventListener("input", () => {
  genreId.value = "";
  renderSuggestions(genreSearch, genreId, genreSuggestions, genres);

  if (genreSearch.classList.contains("is-invalid")) validateGenre();
});
genreSearch.addEventListener("blur", () => {
  setTimeout(validateGenre, 150);
});

stock.addEventListener("input", () => {
  if (stock.classList.contains("is-invalid")) validateStock();
});
stock.addEventListener("blur", validateStock);

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
    const data = await res.json();

    showToast(data.message || "Book not found.", "error");

    setTimeout(() => {
      location.href = "/books";
    }, 1500);

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
  if (submitBtn.disabled) return;
  clearErrors();

  const validFlags = [
    validateTitle(),
    validateAuthor(),
    validateGenre(),
    validateStock(),
  ];

  const valid = validFlags.every(Boolean);

  if (!valid) return;

  const formData = new FormData();

  formData.append("title", title.value.trim());
  formData.append("authorId", authorId.value);
  formData.append("genreId", genreId.value);
  formData.append("stock", stock.value);

  if (cover.files.length) {
    formData.append("cover", cover.files[0]);
  }
  setButtonLoading(submitBtn, true);
  try {
    const res = await fetch(`/api/admin/books/${bookId}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      showToast(data.message || "Book updated successfully.", "success");

      setTimeout(() => {
        location.href = "/books";
      }, 1200);

      return;
    }

    clearErrors();

    if (data.errors?.title)
      setError(title, data.errors.title);

    if (data.errors?.authorId)
      setError(authorSearch, data.errors.authorId);

    if (data.errors?.genreId)
      setError(genreSearch, data.errors.genreId);

    if (data.errors?.stock)
      setError(stock, data.errors.stock);

    if (data.errors?.cover)
      setError(cover, data.errors.cover);

    if (!data.errors) {
      showToast(data.message || "Something went wrong.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast(
      "An error occurred while updating the book. Please try again.",
      "error"
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

(async () => {
  setInitialDataLoading(true);
  try {
    await loadLookupData();
    await loadBook();
  } finally {
    setInitialDataLoading(false);
  }
})();

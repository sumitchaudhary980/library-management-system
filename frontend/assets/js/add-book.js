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

const submitBtn = document.getElementById("submitBtn");


let authors = [];
let genres = [];

// Tracks whether the user has attempted a submit yet — live validation
// only kicks in after that, so errors don't appear before they've tried.
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

function clearError(input) {
  input.classList.remove("is-invalid");
  const feedback = input.parentElement.querySelector(".invalid-feedback");

  if (feedback) {
    const def = feedback.getAttribute("data-default");
    feedback.textContent = def || "";
  }
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
  if (!authorId.value || !authors.find((a) => a.id == authorId.value)) {
    setError(authorSearch, "No author selected");
    return false;
  }

  clearError(authorSearch);
  return true;
}

function validateGenre() {
  if (!genreId.value || !genres.find((g) => g.id == genreId.value)) {
    setError(genreSearch, "No genre selected");
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

function validateCover() {
  if (!cover.files.length) {
    setError(cover, "Cover image is required");
    return false;
  }

  clearError(cover);
  return true;
}

function validateForm() {
  clearErrors();

  const validFlags = [
    validateTitle(),
    validateAuthor(),
    validateGenre(),
    validateStock(),
    validateCover(),
  ];

  return validFlags.every(Boolean);
}

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
      if (submitted) validateAuthorOrGenre(input);
    };

    list.appendChild(btn);
  });
}

// picks the right validator for whichever search box triggered the click
function validateAuthorOrGenre(input) {
  if (input === authorSearch) validateAuthor();
  if (input === genreSearch) validateGenre();
}

authorSearch.addEventListener("input", () => {
  authorId.value = "";
  renderSuggestions(authorSearch, authorId, authorSuggestions, authors);

  if (submitted) validateAuthor();
});
authorSearch.addEventListener("blur", () => {
  // small delay so a suggestion click can register before we validate
  setTimeout(() => {
    if (submitted) validateAuthor();
  }, 150);
});

genreSearch.addEventListener("input", () => {
  genreId.value = "";
  renderSuggestions(genreSearch, genreId, genreSuggestions, genres);

  if (submitted) validateGenre();
});
genreSearch.addEventListener("blur", () => {
  setTimeout(() => {
    if (submitted) validateGenre();
  }, 150);
});

title.addEventListener("blur", () => {
  if (submitted) validateTitle();
});
title.addEventListener("input", () => {
  if (submitted) validateTitle();
});

stock.addEventListener("input", () => {
  if (submitted) validateStock();
});
stock.addEventListener("blur", () => {
  if (submitted) validateStock();
});

cover.addEventListener("change", () => {
  if (submitted) validateCover();
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

  if (submitBtn.disabled) return;

  submitted = true;

  if (!validateForm()) return;

  const formData = new FormData();
  formData.append("title", title.value.trim());
  formData.append("authorId", authorId.value);
  formData.append("genreId", genreId.value);
  formData.append("stock", stock.value);
  formData.append("cover", cover.files[0]);

  setButtonLoading(submitBtn, true);
  try {
    const res = await fetch("/api/admin/books", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      showToast(data.message || "Book added successfully.", "success");
      setTimeout(() => (location.href = "/books"), 1500);
    } else {
      clearErrors();

      if (data.errors?.title) setError(title, data.errors.title);
      if (data.errors?.authorId) setError(authorSearch, data.errors.authorId);
      if (data.errors?.genreId) setError(genreSearch, data.errors.genreId);
      if (data.errors?.stock) setError(stock, data.errors.stock);
      if (data.errors?.cover) setError(cover, data.errors.cover);

      if (!data.errors) {
        showToast(data.message || "Something went wrong.", "error");
      }
    }
  } catch (err) {
    showToast("An error occurred while adding the book. Please try again.", "error");
  } finally {
    setButtonLoading(submitBtn, false);
  }

});

loadLookupData();
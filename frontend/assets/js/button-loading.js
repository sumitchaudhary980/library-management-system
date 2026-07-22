function setButtonLoading(button, loading) {
  const text = button.querySelector("#btnText");
  const icon = button.querySelector("#btnIcon");

  if (loading) {
    button.disabled = true;

    text.textContent = button.dataset.loadingText;

    icon.innerHTML = `
      <span
        class="spinner-border spinner-border-sm ms-2"
        role="status"
        aria-hidden="true">
      </span>
    `;
  } else {
    button.disabled = false;

    text.textContent = button.dataset.text;

    icon.innerHTML = button.dataset.icon;
  }
}
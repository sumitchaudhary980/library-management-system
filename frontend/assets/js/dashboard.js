async function loadDashboard() {
    try {
        const response = await fetch("/api/admin/dashboard", {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        document.getElementById("totalBooks").textContent =
            data.totalBooks.toLocaleString();

        document.getElementById("totalAuthors").textContent =
            data.totalAuthors.toLocaleString();

        document.getElementById("totalGenres").textContent =
            data.totalGenres.toLocaleString();
    } catch (err) {
        console.error(err);
        showToast("Something went wrong", "error");
    }
}

loadDashboard();
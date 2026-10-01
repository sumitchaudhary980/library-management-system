function updateHeader() {
  const now = new Date();

  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  document.getElementById("currentDate").textContent =
    now.toLocaleDateString("en-GB", dateOptions);

  const hour = now.getHours();
  let greeting = "Good Evening";

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  document.getElementById("greeting").textContent = `${greeting}, Admin`;
}

updateHeader();

function setDashboardLoading(loading) {
  ["totalBooks", "totalAuthors", "totalGenres", "totalReaders"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (loading) {
      el.textContent = "0";
      el.classList.add("loading-placeholder");
      el.style.width = "64px";
    } else {
      el.classList.remove("loading-placeholder");
      el.style.width = "";
    }
  });
}

async function loadDashboard() {
  setDashboardLoading(true);

  try {
    const response = await fetch("/api/admin/dashboard", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to load dashboard", "error");
      return;
    }

    document.getElementById("totalBooks").textContent =
      data.totalBooks.toLocaleString();

    document.getElementById("totalAuthors").textContent =
      data.totalAuthors.toLocaleString();

    document.getElementById("totalGenres").textContent =
      data.totalGenres.toLocaleString();

    document.getElementById("totalReaders").textContent =
      data.totalReaders.toLocaleString();

  } catch (err) {
    console.error(err);
    showToast("Something went wrong", "error");
  } finally {
    setDashboardLoading(false);
  }
}

loadDashboard();

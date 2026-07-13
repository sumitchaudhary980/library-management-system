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

function updateHeader(firstName = "User") {

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

    document.getElementById("greeting").textContent =
        `${greeting}, ${firstName}`;
}

async function loadHome() {

    try {

        const response = await fetch("/api/user/home", {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        updateHeader(data.firstName);

        document.getElementById("borrowedBooks").textContent =
            data.borrowedBooks.toLocaleString();

        document.getElementById("returnedBooks").textContent =
            data.returnedBooks.toLocaleString();

        document.getElementById("dueBooks").textContent =
            data.dueBooks.toLocaleString();

        document.getElementById("fineAmount").textContent =
            `Rs. ${Number(data.fineAmount).toLocaleString()}`;

    } catch (err) {

        console.error(err);

        showToast("Something went wrong", "error");

    }
}

loadHome();
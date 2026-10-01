function showToast(message, type = "error") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        showCloseButton: true,
        timer: 4000,
        timerProgressBar: true,
        customClass: {
            popup: "small-toast"
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}


let currentTitle = "";
let currentStatus = "";
let currentReturnedFrom = "";
let currentReturnedTo = "";
let currentSort = "latest";

let currentPage = 1;
let searchTimer;


const today = new Date().toISOString().split("T")[0];

document.getElementById("returnedFrom").max = today;
document.getElementById("returnedTo").max = today;

function showFinesLoading() {
    document.getElementById("fineTable").innerHTML = `
        <tr class="loading-row">
            <td colspan="6" class="text-center py-5 text-muted">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading fines...
            </td>
        </tr>
    `;
    document.getElementById("entryText").innerHTML = "";
    document.getElementById("pagination").innerHTML = "";
}

// Show payment result toast based on eSewa redirect query param
(function handlePaymentRedirect() {

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {

        showToast("Fine paid successfully!", "success");

    } else if (paymentStatus === "failed") {

        showToast("Payment failed. Please try again.", "error");

    } else if (paymentStatus === "error") {

        showToast("Something went wrong while processing your payment.", "error");

    }


    // Clean the URL so refreshing doesn't re-trigger the toast
    if (paymentStatus) {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    }

})();



async function loadFines(page = 1) {

    currentPage = page;
    showFinesLoading();

    const params = new URLSearchParams({
        page,
        title: currentTitle,
        status: currentStatus,
        returned_from: currentReturnedFrom,
        returned_to: currentReturnedTo,
        sort: currentSort
    });


    try {

        const response = await fetch(`/api/user/fines?${params}`);

        const data = await response.json();


        const table = document.getElementById("fineTable");

        table.innerHTML = "";


        if (data.fines.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        No fines found
                    </td>
                </tr>
            `;

        }


        data.fines.forEach(fine => {


            table.innerHTML += `

            <tr>

                <td class="py-3 px-4">
                    <img src="${fine.cover_image}"
                    alt="${fine.title} book cover"
                    loading="lazy"
                    decoding="async"
                    style="width:60px;height:80px;object-fit:cover;border-radius:8px;">
                </td>


                <td class="py-3 px-4 text-nowrap">
                    <h6 class="fw-bold mb-0 text-primary-dark">
                        ${fine.title}
                    </h6>
                </td>


                <td class="py-3 px-4 text-nowrap">
                    ${new Date(fine.due_date).toLocaleDateString()}
                </td>


            <td class="py-3 px-4 fw-bold text-center text-nowrap">

${fine.fine_amount > 0
?
`
<div>

    <span class="badge bg-danger mb-1">
        Fine: Rs. ${Number(fine.fine_amount).toLocaleString()}
    </span>

    <br>

    <span class="badge bg-success mb-1">
        Paid: Rs. ${Number(fine.fine_paid_amount || 0).toLocaleString()}
    </span>

    ${
        (fine.fine_amount - fine.fine_paid_amount) > 0
        ?
        `
        <br>
        <span class="badge bg-warning text-dark">
            Due: Rs. ${Number(
                fine.fine_amount - fine.fine_paid_amount
            ).toLocaleString()}
        </span>
        `
        :
        ""
    }

</div>
`
:
`
<span class="text-muted">
    No Fine
</span>
`

}

</td>


               


                <td class="py-3 px-4 text-center text-nowrap">

                    ${fine.remaining_fine <= 0

                    ?

                    `<button class="btn btn-secondary btn-sm px-3" disabled>
    Paid
</button>`

                    :

                    `<button 
    class="btn btn-sm text-white px-3 pay-fine-btn"
    data-id="${fine.id}"
    style="background:#002147;border-radius:10px;">
    
    <i class="fas fa-credit-card me-2"></i>
    Pay

</button>`

                }

                </td>


            </tr>

            `;


        });



        document.getElementById("entryText").innerHTML = `
            Showing ${data.total === 0 ? 0 : (page - 1) * 10 + 1}
            to ${Math.min(page * 10, data.total)}
            of ${data.total} entries
        `;



        const pagination = document.getElementById("pagination");

        pagination.innerHTML = "";


        if (data.totalPages > 1) {


            pagination.innerHTML += `

            <li class="page-item ${page === 1 ? "disabled" : ""}">

                <button 
                class="page-link page-btn"
                data-page="${page - 1}">
                    Previous
                </button>

            </li>

            `;



            for (let i = 1; i <= data.totalPages; i++) {


                pagination.innerHTML += `

                <li class="page-item ${page === i ? "active" : ""}">

                    <button 
                    class="page-link page-btn"
                    data-page="${i}">
                        ${i}
                    </button>

                </li>

                `;

            }



            pagination.innerHTML += `

            <li class="page-item ${page === data.totalPages ? "disabled" : ""}">

                <button 
                class="page-link page-btn"
                data-page="${page + 1}">
                    Next
                </button>

            </li>

            `;


        }


    }
    catch (err) {

        console.log(err);
        showToast("Failed to load fines");

    }

}




async function payFine(id, button) {

    if (button) {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Pay
        `;
    }

    try {

        console.log("Paying fine:", id);

        const response = await fetch(`/api/user/fines/${id}/pay`, {

            method: "POST",

            credentials: "include"

        });


        const data = await response.json();


        if (!response.ok) {

            showToast(data.message || "Failed to start payment.");

            return;

        }


        if (!data.gatewayUrl || !data.params) {

            showToast("Payment could not be started.");

            return;

        }


        // Build and submit a real form via DOM APIs
        // (no inline script, so CSP has nothing to block)
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.gatewayUrl;

        Object.entries(data.params).forEach(([key, value]) => {

            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value;

            form.appendChild(input);

        });

        document.body.appendChild(form);
        form.submit();

    }
    catch (err) {

        console.log(err);

        showToast("Failed to start payment.");

    }
    finally {

        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <i class="fas fa-credit-card me-2"></i>
                Pay
            `;
        }

    }

}



function triggerSearch() {

    clearTimeout(searchTimer);


    searchTimer = setTimeout(() => {


        currentTitle =
            document.getElementById("searchBook").value.trim();


        currentStatus =
            document.getElementById("fineStatus").value;


        currentReturnedFrom =
            document.getElementById("returnedFrom").value;


        currentReturnedTo =
            document.getElementById("returnedTo").value;


        currentSort =
            document.getElementById("sortBy").value;



        loadFines(1);



    }, 300);


}





document.getElementById("searchBook")
    .addEventListener("input", triggerSearch);


document.getElementById("fineStatus")
    .addEventListener("change", triggerSearch);


document.getElementById("returnedFrom")
    .addEventListener("change", triggerSearch);


document.getElementById("returnedTo")
    .addEventListener("change", triggerSearch);


document.getElementById("sortBy")
    .addEventListener("change", triggerSearch);





document.getElementById("returnedFrom")
    .addEventListener("change", () => {


        const from =
            document.getElementById("returnedFrom").value;


        const to =
            document.getElementById("returnedTo");


        to.min = from || "";


        if (to.value && to.value < from) {

            to.value = "";

        }


    });





document.getElementById("clearFilters")
    .addEventListener("click", () => {


        document.getElementById("searchBook").value = "";
        document.getElementById("fineStatus").value = "";
        document.getElementById("returnedFrom").value = "";
        document.getElementById("returnedTo").value = "";
        document.getElementById("sortBy").value = "latest";


        currentTitle = "";
        currentStatus = "";
        currentReturnedFrom = "";
        currentReturnedTo = "";
        currentSort = "latest";


        loadFines(1);


    });





// CSP SAFE CLICK HANDLER

document.addEventListener("click", (e) => {


    const payBtn = e.target.closest(".pay-fine-btn");


    if (payBtn) {

        payFine(payBtn.dataset.id, payBtn);

        return;

    }



    const pageBtn = e.target.closest(".page-btn");


    if (pageBtn) {

        loadFines(Number(pageBtn.dataset.page));

    }


});





loadFines();

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



let currentSearch = "";
let currentSort = "highest";
let currentStatus = "";

let currentPage = 1;
let searchTimer;



async function loadUsers(page = 1) {


    currentPage = page;


    const params = new URLSearchParams({

        page,

        search: currentSearch,

        sort: currentSort,

        status: currentStatus

    });



    try {


        const response = await fetch(
            `/api/admin/fines?${params}`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();



        const table = document.getElementById("fineTable");

        table.innerHTML = "";




        if (!data.users || data.users.length === 0) {


            table.innerHTML = `

            <tr>

                <td colspan="5" class="text-center py-5 text-muted">

                    No users found

                </td>

            </tr>

            `;


            document.getElementById("entryText").innerHTML = "";

            document.getElementById("pagination").innerHTML = "";


            return;

        }





        data.users.forEach(user => {



            table.innerHTML += `

            <tr>



                <td class="py-3 px-4 text-nowrap">


                    <div class="d-flex align-items-center">


                      ${user.profile_image
                    ? `
      <img
        src="${user.profile_image}"
        alt="${user.first_name} ${user.last_name} profile image"
        loading="lazy"
        decoding="async"
        class="rounded-circle me-3"
        style="
          width:52px;
          height:52px;
          object-fit:cover;
          border:2px solid #e5e7eb;
        "
      >
    `
                    : `
      <div
        class="rounded-circle me-3 d-flex align-items-center justify-content-center"
        style="
          width:52px;
          height:52px;
          border:2px solid #e5e7eb;
          background:#f8f9fa;
          flex-shrink:0;
        "
      >
        <i class="fas fa-user text-muted"></i>
      </div>
    `
                }



                        <div>


                            <h6 class="fw-bold mb-1 text-primary-dark">

                                ${user.first_name} ${user.last_name}

                            </h6>


                            <small class="text-muted">

                                ${user.email}

                            </small>


                        </div>


                    </div>


                </td>





                <td class="text-center">


                    ${user.fined_books || 0}


                </td>





                <td class="text-center">


                ${user.unpaid_books > 0

                    ?

                    `
                    <span class="badge bg-danger">

                        ${user.unpaid_books}

                    </span>
                    `

                    :

                    `
                    <span class="badge bg-success">

                        0

                    </span>
                    `
                }


                </td>





                <td class="text-center fw-bold">


                ${Number(user.outstanding_fine) > 0

                    ?

                    `
                    <span class="text-danger">

                        Rs. ${Number(user.outstanding_fine).toLocaleString()}

                    </span>
                    `

                    :

                    `
                    <span class="text-muted">

                        No Fine

                    </span>
                    `

                }


                </td>





                <td class="text-center">


                    <a

                    href="/borrow-history/${user.id}"

                    class="btn btn-sm text-white"

                    style="
                        background:#002147;
                        border-radius:8px;
                    "

                    >

                        <i class="fas fa-eye me-2"></i>

                        View

                    </a>


                </td>



            </tr>


            `;


        });





        document.getElementById("entryText").innerHTML = `

            Showing

            ${(page - 1) * 10 + 1}

            to

            ${Math.min(page * 10, data.total)}

            of

            ${data.total}

            entries

        `;





        const pagination = document.getElementById("pagination");

        pagination.innerHTML = "";





        if (data.totalPages > 1) {



            pagination.innerHTML += `

            <li class="page-item ${page === 1 ? "disabled" : ""}">

                <button

                class="page-link"

                onclick="loadUsers(${page - 1})">

                    Previous

                </button>

            </li>

            `;





            for (let i = 1; i <= data.totalPages; i++) {


                pagination.innerHTML += `

                <li class="page-item ${page === i ? "active" : ""}">


                    <button

                    class="page-link"

                    onclick="loadUsers(${i})">


                        ${i}


                    </button>


                </li>


                `;

            }





            pagination.innerHTML += `

            <li class="page-item ${page === data.totalPages ? "disabled" : ""}">


                <button

                class="page-link"

                onclick="loadUsers(${page + 1})">


                    Next


                </button>


            </li>


            `;


        }





    } catch (err) {


        console.log(err);


        showToast("Failed to load users");


    }


}






function triggerSearch() {


    clearTimeout(searchTimer);



    searchTimer = setTimeout(() => {


        currentSearch =
            document.getElementById("searchUser").value.trim();



        currentSort =
            document.getElementById("sortBy").value;



        currentStatus =
            document.getElementById("fineStatus").value;




        loadUsers(1);



    }, 300);


}







document
    .getElementById("searchUser")
    .addEventListener("input", triggerSearch);





document
    .getElementById("sortBy")
    .addEventListener("change", triggerSearch);





document
    .getElementById("fineStatus")
    .addEventListener("change", triggerSearch);






document
    .getElementById("clearFilters")
    .addEventListener("click", () => {


        document.getElementById("searchUser").value = "";

        document.getElementById("sortBy").value = "highest";

        document.getElementById("fineStatus").value = "";



        currentSearch = "";

        currentSort = "highest";

        currentStatus = "";



        loadUsers(1);


    });





loadUsers();

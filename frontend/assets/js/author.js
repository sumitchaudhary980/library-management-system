async function loadAuthors(page = 1) {
  const response = await fetch(`/api/admin/authors?page=${page}`);

  const data = await response.json();

  const table = document.getElementById("authorTable");

  table.innerHTML = "";

  data.authors.forEach((author) => {
    table.innerHTML += `

          <tr>

            <td class="py-3 px-4">

              <div class="d-flex align-items-center">

                <div
                  class="stat-icon-wrapper bg-primary-light me-3"
                >

                  <i class="fas fa-user"></i>

                </div>


                <div>

                  <h6
                    class="mb-0 fw-bold text-primary-dark text-truncate"
                    style="max-width:220px"
                  >

                    ${author.name}

                  </h6>


                  

                </div>


              </div>

            </td>



            <td class="py-3 px-4 text-muted">

              <span
                class="text-truncate d-block"
                style="max-width:320px"
              >

                ${author.biography || "No biography available"}

              </span>

            </td>



            <td class="py-3 px-4 text-end">

              <a
                href="/authors/edit/${author.id}"
                class="btn btn-light me-1 text-primary-dark shadow-sm"
                title="Edit"
              >

                <i class="fas fa-pen"></i>

              </a>



              <button
                class="btn btn-light text-danger shadow-sm"
                title="Delete"
              >

                <i class="fas fa-trash"></i>

              </button>


            </td>


          </tr>

          `;
  });

  document.getElementById("entryText").innerHTML =
    `Showing ${(page - 1) * 10 + 1} to ${Math.min(
      page * 10,
      data.total,
    )} of ${data.total} entries`;

  const pagination = document.getElementById("pagination");

  pagination.innerHTML = "";

  pagination.innerHTML += `

        <li class="page-item ${page === 1 ? "disabled" : ""}">

          <button
            class="page-link"
            onclick="loadAuthors(${page - 1})"
          >

            Previous

          </button>

        </li>

        `;

  for (let i = 1; i <= data.totalPages; i++) {
    pagination.innerHTML += `

          <li class="page-item ${page === i ? "active" : ""}">

            <button
              class="page-link"
              onclick="loadAuthors(${i})"
            >

              ${i}

            </button>

          </li>

          `;
  }

  pagination.innerHTML += `

        <li class="page-item ${page === data.totalPages ? "disabled" : ""}">

          <button
            class="page-link"
            onclick="loadAuthors(${page + 1})"
          >

            Next

          </button>

        </li>

        `;
}

loadAuthors();

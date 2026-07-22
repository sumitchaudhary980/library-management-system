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
        title: message

    });

}



const newPassword =
    document.getElementById("newPassword");


const confirmPassword =
    document.getElementById("confirmPassword");


const form =
    document.getElementById("changePasswordForm");



let submitted = false;




function setError(input, message) {


    input.classList.add("is-invalid");


    const feedback =
        input.closest(".mb-4")
            .querySelector(".invalid-feedback");


    if (feedback) {

        feedback.textContent = message;

        feedback.style.display = "block";

    }


}





function clearError(input) {


    input.classList.remove("is-invalid");


    const feedback =
        input.closest(".mb-4")
            .querySelector(".invalid-feedback");



    if (feedback) {

        feedback.textContent =
            feedback.dataset.default || "";

        feedback.style.display = "none";

    }


}




function clearErrors() {


    document
        .querySelectorAll(".is-invalid")
        .forEach(el => {

            el.classList.remove("is-invalid");

        });



    document
        .querySelectorAll(".invalid-feedback")
        .forEach(el => {

            el.textContent =
                el.dataset.default || "";

            el.style.display = "none";

        });


}




function validatePassword() {


    const value =
        newPassword.value.trim();



    if (!value) {

        setError(
            newPassword,
            "Password is required"
        );

        return false;

    }



    if (value.length < 8) {

        setError(
            newPassword,
            "Password must be at least 8 characters"
        );

        return false;

    }



    clearError(newPassword);

    return true;


}





function validateConfirmPassword() {


    const value =
        confirmPassword.value.trim();



    if (!value) {

        setError(
            confirmPassword,
            "Please confirm your password"
        );

        return false;

    }



    if (newPassword.value !== value) {

        setError(
            confirmPassword,
            "Passwords do not match"
        );

        return false;

    }



    clearError(confirmPassword);

    return true;


}





newPassword.addEventListener("input", () => {

    if (submitted)
        validatePassword();

});



newPassword.addEventListener("blur", () => {

    if (submitted)
        validatePassword();

});




confirmPassword.addEventListener("input", () => {

    if (submitted)
        validateConfirmPassword();

});



confirmPassword.addEventListener("blur", () => {

    if (submitted)
        validateConfirmPassword();

});







form.addEventListener("submit", async (e) => {


    e.preventDefault();


    submitted = true;



    clearErrors();



    if (
        !validatePassword() ||
        !validateConfirmPassword()
    ) {

        return;

    }




    try {


        const res =
            await fetch("/api/auth/change-password", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                credentials: "include",


                body: JSON.stringify({

                    password: newPassword.value.trim(),

                    confirmPassword: confirmPassword.value.trim()

                })

            });



        const data =
            await res.json();



        if (res.ok) {


            showToast(
                "Password changed successfully!",
                "success"
            );



            setTimeout(() => {

                window.location.href = "/home";

            }, 1200);



        } else {


            showToast(
                data.message || "Password change failed",
                "error"
            );


        }


    }

    catch (err) {

        console.error(err);

        showToast(
            "Something went wrong",
            "error"
        );


    }



});
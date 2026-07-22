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



const newPassword =
  document.getElementById("newPassword");


const confirmPassword =
  document.getElementById("confirmPassword");


const form =
  document.getElementById("resetPasswordForm");


const submitBtn =
  document.getElementById("submitBtn");


let submitted = false;



function setError(input, message){

  input.classList.add("is-invalid");


  const feedback =
    input.closest(".mb-4")
    .querySelector(".invalid-feedback");


  if(feedback){

    feedback.textContent = message;
    feedback.style.display = "block";

  }

}



function clearError(input){

  input.classList.remove("is-invalid");


  const feedback =
    input.closest(".mb-4")
    .querySelector(".invalid-feedback");


  if(feedback){

    feedback.textContent =
      feedback.dataset.default || "";

    feedback.style.display = "none";

  }

}



function clearErrors(){

  document.querySelectorAll(".is-invalid")
  .forEach(el=>{

    el.classList.remove("is-invalid");

  });


  document.querySelectorAll(".invalid-feedback")
  .forEach(el=>{

    el.textContent =
      el.dataset.default || "";

    el.style.display="none";

  });

}




function validatePassword(){


  const value =
    newPassword.value.trim();



  if(!value){

    setError(
      newPassword,
      "Password is required"
    );

    return false;

  }



  if(value.length < 8){

    setError(
      newPassword,
      "Password must be at least 8 characters"
    );

    return false;

  }



  clearError(newPassword);

  return true;

}




function validateConfirmPassword(){


  const value =
    confirmPassword.value.trim();



  if(!value){

    setError(
      confirmPassword,
      "Please confirm your password"
    );

    return false;

  }



  if(value !== newPassword.value.trim()){


    setError(
      confirmPassword,
      "Passwords do not match"
    );


    return false;

  }



  clearError(confirmPassword);

  return true;

}





newPassword.addEventListener("input",()=>{

  if(submitted)
    validatePassword();

});


newPassword.addEventListener("blur",()=>{

  if(submitted)
    validatePassword();

});




confirmPassword.addEventListener("input",()=>{

  if(submitted)
    validateConfirmPassword();

});


confirmPassword.addEventListener("blur",()=>{

  if(submitted)
    validateConfirmPassword();

});





form.addEventListener("submit", async(e)=>{


  e.preventDefault();


  submitted=true;


  clearErrors();



  if(
    !validatePassword() ||
    !validateConfirmPassword()
  ){

    return;

  }



  if(submitBtn.disabled)
    return;



  setButtonLoading(
    submitBtn,
    true
  );



  try{


    const token =
      new URLSearchParams(
        window.location.search
      ).get("token");



    const response =
      await fetch(
        "/api/auth/reset-password",
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          credentials:"include",


          body:JSON.stringify({

            token,

            password:
              newPassword.value.trim(),

            confirmPassword:
              confirmPassword.value.trim()

          })

        }
      );



    const data =
      await response.json();



    if(response.ok){


      showToast(
        data.message ||
        "Password reset successful",
        "success"
      );


      setTimeout(()=>{

        window.location.href="/login";

      },1500);



      return;

    }




    showToast(
      data.message ||
      "Password reset failed",
      "error"
    );



  }

  catch(err){

    console.error(err);

    showToast(
      "Something went wrong",
      "error"
    );

  }

  finally{

    setButtonLoading(
      submitBtn,
      false
    );

  }



});
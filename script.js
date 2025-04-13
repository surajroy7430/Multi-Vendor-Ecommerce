export function showToast(message, isError = false) {
    const toastElement = document.getElementById("toastMsg");
    const toastBody = document.getElementById("toastBody");

    toastBody.textContent = message;
    toastElement.classList.remove("bg-success", "bg-danger");
    toastElement.classList.add(isError ? "bg-danger" : "bg-success");

    const bsToast = bootstrap.Toast.getOrCreateInstance(toastElement);
    bsToast.show();
}

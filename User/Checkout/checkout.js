document.addEventListener("DOMContentLoaded", () => {
  const order = JSON.parse(localStorage.getItem("currentOrder"));
  if (!order) {
    showToast("No order found. Please select a product.", true);
    window.location.href = "/Products/mens.html"; // or go back
    return;
  }

  // Show order summary & proceed to payment logic...
});

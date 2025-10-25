// import { showToast } from "../../script";

document.addEventListener("DOMContentLoaded", () => {
  // const order = JSON.parse(localStorage.getItem("currentOrder"));
  // if (!order) {
  //   showToast("No order found. Please select a product.", true);
  //   window.location.href = "/Products/mens.html"; // or go back
  //   return;
  // }

  // Show order summary & proceed to payment logic...

  // Card Validate
  const cardNumberInput = document.getElementById("cardNumber");
  const cardTypeDisplay = document.getElementById("cardType");
  const expInput = document.getElementById("expDate");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  function luhnCheck(number = "") {
    const digits = number.replace(/\D/g, "");
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function formatCardNumber(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  async function fetchCardType(bin) {
    try {
      const res = await fetch(`https://lookup.binlist.net/${bin}`);
      if (!res.ok) throw new Error("Bin Not Found");

      const data = await res.json();
      const scheme = data.scheme || "";
      const brand = data.brand || "";
      const country = data.country?.name || "";
      return `${scheme.toUpperCase()} ${brand}`;
    } catch (error) {
      return "";
    }
  }

  cardNumberInput.addEventListener("input", async (e) => {
    const formatted = formatCardNumber(e.target.value);
    e.target.value = formatted;

    const digits = formatted.replace(/\s/g, "");
    if (digits.length >= 6) {
      const type = await fetchCardType(digits.substring(0, 6));
      cardTypeDisplay.textContent = type || "";
    } else {
      cardNumberInput.textContent = "";
    }
  });

  expInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 3) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    e.target.value = value;
  });

  function placeOrderProducts() {
    let valid = true;

    // Card Number
    const cardNumber = cardNumberInput.value.replace(/\s/g, "");
    if (cardNumber.length !== 16 || !luhnCheck(cardNumber)) {
      cardNumberInput.classList.add("error");
      document.getElementById("cardNumberHelp").textContent =
        "Invalid card number";
      valid = false;
    } else {
      cardNumberInput.classList.remove("error");
      document.getElementById("cardNumberHelp").textContent = "";
    }

    // Expiry Date
    const exp = expInput.value;
    const expHelp = document.getElementById("expDateHelp");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
      expInput.classList.add("error");
      expHelp.textContent = "Invalid Expiry Date";
      valid = false;
    } else {
      const [mm, yy] = exp.split("/").map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        expInput.classList.add("error");
        expHelp.textContent = "Card expired";
        valid = false;
      } else {
        expInput.classList.remove("error");
        expHelp.textContent = "";
      }
    }

    // CVV
    const cvvInput = document.getElementById("cvv");
    const cvv = cvvInput.value;
    const cvvHelp = document.getElementById("cvvHelp");
    if (!/^\d{3}$/.test(cvv)) {
      cvvInput.classList.add("error");
      cvvHelp.textContent = "Invalid CVV";
      valid = false;
    } else {
      cvvInput.classList.remove("error");
      cvvHelp.textContent = "";
    }

    // Name
    const nameInput = document.getElementById("cardName");
    const name = nameInput.value.trim();
    const nameHelp = document.getElementById("cardNameHelp");
    if (name === "") {
      nameInput.classList.add("error");
      nameHelp.textContent = "Enter cardholder name";
      valid = false;
    } else {
      nameInput.classList.remove("error");
      nameHelp.textContent = "";
    }

    if (valid) alert("Card validated successfully!");
  }

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", placeOrderProducts);
  }
});

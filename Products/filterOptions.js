import { fetchAndPopulateFilterTerms } from "./filterdata.js";
import { applyFilters } from "./products.js";

let category = [];
let brand = [];
let vendor = [];
let color = [];
let size = [];
let rating = ["5", "4", "3", "2", "1"];

const filters = [
  { id: 1, title: "Category", filterTerm: category },
  { id: 2, title: "Price", filterTerm: "" },
  { id: 3, title: "Brand", filterTerm: brand },
  { id: 4, title: "Vendors", filterTerm: vendor },
  { id: 5, title: "Sizes", filterTerm: size },
  { id: 6, title: "Color", filterTerm: color },
  { id: 7, title: "Ratings", filterTerm: rating },
];

document.addEventListener("DOMContentLoaded", () => {
  let gender = document.body.dataset.gender;
  renderFilters();

  (async () => {
    const data = await fetchAndPopulateFilterTerms(gender);

    category.length = 0;
    brand.length = 0;
    vendor.length = 0;
    color.length = 0;
    size.length = 0;

    category.push(...data.categories);
    brand.push(...data.brands);
    vendor.push(...data.sellers);
    color.push(...data.colors);
    size.push(...data.sizes);

    renderFilters();
  })();
});

let appliedFilters = [];
let expandedSections = new Set(["Price"]);

const container = document.getElementById("filterSections");
const clearBtn = document.getElementById("clearAllBtn");

function renderFilters() {
  container.innerHTML = "";

  filters.forEach((filter) => {
    const section = document.createElement("div");
    section.className = "accordian-item border-b mb-2";

    const header = document.createElement("button");
    header.className =
      "w-full flex justify-between items-center py-2 text-left font-medium text-gray-700";
    header.innerHTML = `
      ${filter.title}
      <span><i class="bi bi-chevron-down"></i></span>
    `;

    const icon = header.querySelector("i");
    if (expandedSections.has(filter.title)) {
      icon.classList.remove("bi-chevron-down");
      icon.classList.add("bi-chevron-up");
    }

    const options = document.createElement("div");
    options.className = "flex flex-col gap-2 py-2 pl-2";

    if (!expandedSections.has(filter.title)) options.classList.add("hidden");

    if (filter.title === "Price") {
      options.innerHTML = `
        <div class="w-full h-[30px] flex items-center">
          <input
            type="range"
            id="min-price"
            min="100"
            max="5000"
            step="10"
            value="0"
            class="absolute"
          />
          <input
            type="range"
            id="max-price"
            min="100"
            max="5000"
            step="10"
            value="5000"
            class="absolute"
          />
        </div>
        <div class="text-left">
          <span
            id="price-value"
            class="text-lg font-bold text-blue-500"
            >₹100 - ₹5000</span
          >
        </div>
      `;

      setTimeout(() => {
        const minInput = document.getElementById("min-price");
        const maxInput = document.getElementById("max-price");
        const priceValue = document.getElementById("price-value");

        function updatePriceValue() {
          let min = parseInt(minInput.value);
          let max = parseInt(maxInput.value);
          let minGap = 300;

          if (max - min < minGap) {
            if (document.activeElement === minInput) {
              minInput.value = max - minGap;
            } else {
              maxInput.value = min + minGap;
            }
          }

          priceValue.textContent = `₹${minInput.value} - ₹${maxInput.value}`;
          applyFilters();
        }

        minInput.addEventListener("input", updatePriceValue);
        maxInput.addEventListener("input", updatePriceValue);
      }, 0);
    } else {
      filter.filterTerm.forEach((term) => {
        const label = document.createElement("label");
        label.className =
          "flex items-center text-left gap-2 text-sm capitalize cursor-pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = term;
        checkbox.className = "form-checkbox accent-blue-600";
        checkbox.dataset.filter = filter.title;

        let key = `${filter.title}: ${term}`;
        checkbox.checked = appliedFilters.includes(key);

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            if (!appliedFilters.includes(key)) appliedFilters.push(key);
          } else {
            appliedFilters = appliedFilters.filter((k) => k !== key);
          }
          updateUI();

          applyFilters();
        });

        if (filter.title === "Color") {
          const colorBox = document.createElement("span");
          colorBox.className = "inline-block w-4 h-4 rounded-full border";
          colorBox.style.backgroundColor = term;
          colorBox.title = term;

          const text = document.createElement("span");
          text.textContent = term;

          label.appendChild(checkbox);
          label.appendChild(colorBox);
          label.appendChild(text);
        } else if (filter.title === "Ratings") {
          checkbox.id = `rating-${term}`;
          checkbox.value = term;
          label.appendChild(checkbox);

          if (isNaN(term)) {
            const text = document.createElement("span");
            text.textContent = term;
            label.appendChild(text);
          } else {
            const starsWrapper = document.createElement("span");
            starsWrapper.className = "flex gap-1";

            for (let i = 1; i <= 5; i++) {
              const star = document.createElement("i");
              star.className =
                i <= Number(term)
                  ? "bi bi-star-fill text-yellow-500"
                  : "bi bi-star text-yellow-500";
              starsWrapper.appendChild(star);
            }
            label.appendChild(starsWrapper);
          }
        } else {
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(term));
        }

        options.appendChild(label);
      });
    }

    header.addEventListener("click", () => {
      options.classList.toggle("hidden");

      const icon = header.querySelector("i");
      const isExpanded = !options.classList.contains("hidden");

      if (isExpanded) {
        expandedSections.add(filter.title);
        icon.classList.remove("bi-chevron-down");
        icon.classList.add("bi-chevron-up");
      } else {
        expandedSections.delete(filter.title);
        icon.classList.remove("bi-chevron-up");
        icon.classList.add("bi-chevron-down");
      }
    });

    section.appendChild(header);
    section.appendChild(options);
    container.appendChild(section);
  });

  clearBtn.style.display = appliedFilters.length > 0 ? "inline" : "none";
}

function updateUI() {
  renderFilters();
}

clearBtn.addEventListener("click", () => {
  appliedFilters = [];

  const minInput = document.getElementById("min-price");
  const maxInput = document.getElementById("max-price");
  const priceLabel = document.getElementById("price-value");

  if (minInput && maxInput && priceLabel) {
    minInput.value = 100;
    maxInput.value = 5000;
    priceLabel.textContent = "₹100 - ₹5000";
  }

  updateUI();
  applyFilters();
});

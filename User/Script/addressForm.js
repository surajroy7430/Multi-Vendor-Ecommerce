import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      loadAddresses();
    } else {
      console.warn("User not signed in.");
    }
  });
});

const addBtn = document.getElementById("add-address-btn");
const addressArea = document.getElementById("address-action-area");
const savedAddresses = document.getElementById("saved-addresses");
const formTemplate = document.getElementById("address-form-template");

function createForm(data = {}, id = null) {
  const form = formTemplate.content.cloneNode(true).querySelector("form");

  if (data && Object.keys(data).length) {
    form.name = "edit";
    form.dataset.id = id;
    form.querySelector(`[value="${data.type}"]`).checked = true;
    form.name.value = data.name || "";
    form.mobile.value = data.mobile || "";
    form.address.value = data.address || "";
    form.area.value = data.area || "";
    form.landmark.value = data.landmark || "";
    form.city.value = data.city || "";
    form.state.value = data.state || "";
    form.pincode.value = data.pincode || "";
  }

  form.pincode.addEventListener("blur", async () => {
    const pin = form.pincode.value;

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();

      if (json[0].Status === "Success") {
        let postOffice = json[0].PostOffice[0];
        form.city.value = postOffice.District;
        form.state.value = postOffice.State;
      }
    } catch (error) {
      console.warn("Invalid Pincode");
    }
  });

  form.querySelector(".cancel-btn").onclick = () => {
    form.remove();
    if (!id) addressArea.appendChild(addBtn);
    loadAddresses();
  };

  form.onsubmit = async (e) => {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(form).entries());
    const docId = id || crypto.randomUUID();
    const ref = doc(db, "users", currentUser.uid, "addresses", docId);
    await setDoc(ref, formData);

    form.remove();
    addressArea.appendChild(addBtn);
    loadAddresses();
  };

  return form;
}

function loadAddresses() {
  savedAddresses.innerHTML = "";
  const ref = collection(db, "users", currentUser.uid, "addresses");
  getDocs(ref).then((snapshot) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const fullAddress = [
        data.address,
        data.area,
        data.landmark || "",
        data.city,
        data.state,
      ].filter(Boolean).join(", ");

      const div = document.createElement("div");
      div.className = "border rounded-md p-4";

      div.innerHTML = `
        <div>
          <div
            class="ring-1 ring-orange-400 rounded-sm text-orange-400 bg-orange-100 p-[2px] font-semibold text-sm w-fit"
          >
            ${data.type}
          </div>
          <div class="my-2">
            <h3 class="font-[550] mb-2">${data.name}</h3>
            <p class="flex flex-wrap">
              ${fullAddress},&nbsp;
              <span class="font-[550]">${data.pincode}</span>
            </p>
            <p>
              Mobile:
              <span class="font-[550]">${data.mobile}</span>
            </p>
          </div>
        </div>
        <div class="mt-3">
          <button
            class="edit-btn ring-1 rounded-md text-sky-400 font-semibold p-2 w-[100px] mr-2"
          >
            Edit
          </button>
          <button
            class="remove-btn ring-1 rounded-md text-sky-400 font-semibold p-2 w-[100px]"
          >
            Remove
          </button>
        </div>
      `;

      div.querySelector(".edit-btn").onclick = () => {
        div.replaceWith(createForm(data, id));
      };

      div.querySelector(".remove-btn").onclick = async () => {
        await deleteDoc(doc(db, "users", currentUser.uid, "addresses", id));
        loadAddresses();
      };

      savedAddresses.appendChild(div);
    });
  });
}

addBtn.onclick = () => {
  addBtn.remove();
  const form = createForm();
  addressArea.appendChild(form);
};

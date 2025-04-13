import { authListener } from "./updateHeaderOnLogin.js";


let depth = window.location.pathname.split('/').length - 2;
let basePath = '../'.repeat(depth);

async function loadHeaderFooter() {
    try {
        const headerContainer = document.getElementById("site-header");
        const footerContainer = document.getElementById("site-footer");
        const toastContainer = document.getElementById("toastContainer");

        // Load header
        const headerRes = await fetch(`${basePath}HeaderFooter/header.html`);
        const headerHTML = await headerRes.text();
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            highlightActiveTab();
            setupHamburgerMenu();
        }

        // Load footer
        const footerRes = await fetch(`${basePath}HeaderFooter/footer.html`);
        const footerHTML = await footerRes.text();
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
            setCurrentYear();
        }

        // Load toast
        const toast = await fetch(`${basePath}HeaderFooter/footer.html`);
        const toastHtml = await toast.text();
        if (toastContainer) {
            toastContainer.innerHTML = toastHtml;
        }

    } catch (err) {
        console.error('Error loading header or footer:', err);
    }
}

function highlightActiveTab() {
    const path = window.location.pathname;
    const menTab = document.getElementById("men-tab");
    const womenTab = document.getElementById("women-tab");

    if (path.includes("mens.html")) {
        menTab?.classList.add("active-tab");
        womenTab?.classList.remove("active-tab");
    }
    if (path.includes("womens.html")) {
        womenTab?.classList.add("active-tab");
        menTab?.classList.remove("active-tab");
    }
}

function setCurrentYear() {
    const yearSpan = document.getElementById("footer-date");
    if (yearSpan) {
        yearSpan.innerHTML = new Date().getFullYear();
    }
}

function setupHamburgerMenu() {
    const hamburger = document.getElementById("hamburger");
    const closeMenu = document.getElementById("close-menu");
    const mobileMenu = document.getElementById("mobile-menu");
    const overlay = document.getElementById("overlay");

    if (hamburger && mobileMenu && overlay) {
        hamburger.addEventListener("click", () => {
            mobileMenu.classList.add("show");
            overlay.classList.add("show");
            document.body.classList.add("menu-open");
        });
    }

    if (closeMenu && mobileMenu && overlay) {
        closeMenu.addEventListener("click", () => {
            mobileMenu.classList.remove("show");
            overlay.classList.remove("show");
            document.body.classList.remove("menu-open");
        });
    }
}

function checkFooterVisibility() {
    const totalHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );

    if (totalHeight <= window.innerHeight) {
        document.body.classList.add("hide-footer");
    } else {
        document.body.classList.remove("hide-footer");
    }
}

function loadHeaderFooterStyleSheet() {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${basePath}HeaderFooter/headerFooter.css`;
    document.head.appendChild(link);
}

document.addEventListener("DOMContentLoaded", async () => {
    loadHeaderFooterStyleSheet();
    await loadHeaderFooter();
    authListener();
    setTimeout(checkFooterVisibility, 500);
    window.addEventListener("resize", checkFooterVisibility);

    let loader = document.getElementById("loader");
    let mainContent = document.getElementById("main-content");

    if(loader) loader.style.display = "none";
    if(mainContent) mainContent.style.display = "block";
});
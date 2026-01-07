/* ============================================================
    YouthPower HR - Utils & Helpers
    Version: 5.2 PRO (2026)
============================================================ */

/* ---------------------------------------
    TOAST (Notifications)
-----------------------------------------*/
function showToast(msg, type = "info") {
    const t = document.getElementById("toast");

    const colors = {
        success: "bg-emerald-600 text-white",
        error: "bg-rose-600 text-white",
        info: "bg-slate-900 text-white"
    };

    t.className =
        `fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-xl 
         transition-all duration-500 z-[300] font-black text-sm ${colors[type]}`;

    t.innerText = msg;

    // show
    t.classList.remove("opacity-0", "translate-y-32");
    t.classList.add("opacity-100", "translate-y-0");

    setTimeout(() => {
        t.classList.remove("opacity-100", "translate-y-0");
        t.classList.add("opacity-0", "translate-y-32");
    }, 4000);
}


/* ---------------------------------------
    FIX GOOGLE DRIVE IMAGE LINKS
-----------------------------------------*/
function fixImg(url) {
    if (!url || typeof url !== "string")
        return "https://ui-avatars.com/api/?background=172554&color=fff&name=User";

    // Direct links → OK
    if (url.startsWith("http") && !url.includes("drive.google.com"))
        return url;

    // Google Drive Link → Convert to direct view
    if (url.includes("drive.google.com")) {
        const match = url.match(/[-\w]{25,}/);
        if (match)
            return `https://drive.google.com/uc?export=view&id=${match[0]}`;
    }

    return "https://ui-avatars.com/api/?background=172554&color=fff&name=User";
}


/* ---------------------------------------
    NUMBER EXTRACTION
-----------------------------------------*/
function extractNumber(text) {
    const m = String(text).match(/\d+/);
    return m ? parseInt(m[0]) : 0;
}


/* ---------------------------------------
    DARK MODE TOGGLE
-----------------------------------------*/
function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.theme = "light";
    } else {
        html.classList.add("dark");
        localStorage.theme = "dark";
    }
}


/* ---------------------------------------
    REPORT POPUP CONTROLS
-----------------------------------------*/
function openReportPopup() {
    document.getElementById("reportPopup").classList.remove("hidden");
    document.getElementById("reportPopup").classList.add("flex");
}

function closeReportPopup() {
    document.getElementById("reportPopup").classList.add("hidden");
    document.getElementById("reportPopup").classList.remove("flex");
}


/* ---------------------------------------
    HTML CLEANER
-----------------------------------------*/
function clearElement(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
}


/* ---------------------------------------
    DATE FORMATTER
-----------------------------------------*/
function formatDate(dateStr) {
    if (!dateStr) return "--";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("ar-EG");
    } catch {
        return dateStr;
    }
}


/* ---------------------------------------
    LOADING ELEMENT CREATOR
-----------------------------------------*/
function createLoader() {
    return `
        <div class="text-center py-10 opacity-50">
            <i class="fas fa-spinner fa-spin text-4xl"></i>
        </div>
    `;
}
// utils.js

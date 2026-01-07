/* ============================================================
    YouthPower HR - Utilities & Helpers
    Version 5.2 PRO (2026)
============================================================ */

/* ------------------------------------------------------------
    TOAST SYSTEM
------------------------------------------------------------ */
function showToast(msg, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    const colors = {
        success: "bg-emerald-600 text-white",
        error: "bg-rose-600 text-white",
        info: "bg-brand-600 text-white",
        warn: "bg-amber-500 text-black"
    };

    toast.className =
        `fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-xl opacity-0
         transition-all duration-500 z-[300] ${colors[type]}`;

    toast.innerText = msg;

    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(-20px)";
    }, 50);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%)";
    }, 2500);
}

/* ------------------------------------------------------------
    FIX IMAGE URL (Google Drive direct link)
------------------------------------------------------------ */
function fixImg(url) {
    if (!url) return "https://via.placeholder.com/200x200?text=No+Image";

    // Google Drive URL → convert to viewable direct link
    if (url.includes("drive.google.com")) {
        const id = url.match(/[-\w]{25,}/);
        return id ? `https://drive.google.com/uc?export=view&id=${id[0]}` : url;
    }

    return url;
}

/* ------------------------------------------------------------
    EXTRACT NUMBER FROM A STRING
    Example: "خصم 5 نقاط" → 5
------------------------------------------------------------ */
function extractNumber(str) {
    if (!str) return 0;
    const m = String(str).match(/\d+/);
    return m ? parseInt(m[0]) : 0;
}

/* ------------------------------------------------------------
    DARK MODE TOGGLER
------------------------------------------------------------ */
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");

    if (isDark) {
        html.classList.remove("dark");
        localStorage.setItem("darkMode", "0");
    } else {
        html.classList.add("dark");
        localStorage.setItem("darkMode", "1");
    }
}

/* Load saved theme */
(function initTheme() {
    const saved = localStorage.getItem("darkMode");
    if (saved === "1") {
        document.documentElement.classList.add("dark");
    }
})();

/* ------------------------------------------------------------
    POPULATE MONTH & YEAR SELECT BOXES
------------------------------------------------------------ */
(function initDateSelectors() {
    const mSel = document.getElementById("evalMonthSelect");
    const ySel = document.getElementById("evalYearSelect");
    const rmSel = document.getElementById("rankMonth");
    const rySel = document.getElementById("rankYear");

    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    if (mSel && rmSel) {
        months.forEach((m, i) => {
            mSel.innerHTML += `<option value="${m}">${m}</option>`;
            rmSel.innerHTML += `<option value="${m}">${m}</option>`;
        });
    }

    const year = new Date().getFullYear();
    if (ySel && rySel) {
        for (let y = year - 3; y <= year + 1; y++) {
            ySel.innerHTML += `<option value="${y}">${y}</option>`;
            rySel.innerHTML += `<option value="${y}">${y}</option>`;
        }
    }
})();

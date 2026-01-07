/* ============================================================
    YouthPower HR - Authentication System
    Version 5.2 PRO (2026)
============================================================ */

window.authState = {
    user: null,
    role: null,
    token: null,
    sig: null
};

/* ------------------------------------------------------------
    SAVE SESSION
------------------------------------------------------------ */
function saveSession(data) {
    authState.user = data.username;
    authState.role = data.role;
    authState.token = data.token;
    authState.sig = data.signature;

    localStorage.setItem("YP_AUTH", JSON.stringify(authState));
}

/* ------------------------------------------------------------
    LOAD SESSION (Auto-login)
------------------------------------------------------------ */
function loadSession() {
    const saved = localStorage.getItem("YP_AUTH");
    if (!saved) return;

    try {
        const s = JSON.parse(saved);

        // Merge only known fields – بدون overwrite كامل
        authState.user  = s.user;
        authState.role  = s.role;
        authState.token = s.token;
        authState.sig   = s.sig;

        // إذا كل القيم موجودة → افتح الواجهة
        if (authState.user && authState.token && authState.sig) {
            document.getElementById("loginOverlay").classList.add("hidden");
            showMainUI();
        }

    } catch (e) {
        console.warn("Session load failed:", e);
    }
}
loadSession();

/* ------------------------------------------------------------
    LOGIN
------------------------------------------------------------ */
async function handleLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    const status = document.getElementById("loginStatus");
    const btn = document.getElementById("loginBtn");

    if (!u || !p) {
        status.innerText = "املأ جميع البيانات";
        return;
    }

    btn.disabled = true;
    status.innerText = "جار التحقق...";

    const res = await apiRequest({
        action: "login",
        username: u,
        password: p
    });

    btn.disabled = false;

    if (!res.success) {
        status.innerText = res.error;
        return;
    }

    // Save & start session
    saveSession(res.data);

    status.innerText = "";
    document.getElementById("loginOverlay").classList.add("hidden");

    showMainUI();
}

/* ------------------------------------------------------------
    SHOW MAIN CONTENT AFTER LOGIN
------------------------------------------------------------ */
function showMainUI() {
    const main = document.getElementById("mainContent");
    main.classList.remove("hidden");

    setTimeout(() => {
        main.style.opacity = "1";
    }, 100);

    // Default tab
    switchTab("dashboard");
}

/* ------------------------------------------------------------
    LOGOUT
------------------------------------------------------------ */
function logout() {
    localStorage.removeItem("YP_AUTH");
    location.reload();
}

/* ============================================================
    YouthPower HR - Authentication
    Version: 5.2 PRO (2026)
============================================================ */

let authState = {
    user: localStorage.getItem("yp_user") || null,
    role: localStorage.getItem("yp_role") || null,
    token: localStorage.getItem("yp_token") || null,
    sig: localStorage.getItem("yp_sig") || null
};

/* ------------------------------------------------------------
    HANDLE LOGIN
------------------------------------------------------------ */
async function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn = document.getElementById("loginBtn");

    if (!username || !password)
        return showToast("برجاء إدخال البيانات كاملة", "error");

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري التحقق...`;

    const res = await apiRequest({
        action: "login",
        username,
        password
    });

    btn.disabled = false;
    btn.innerHTML = "تحقق من الهوية";

    if (!res.success)
        return showToast(res.error || "خطأ في تسجيل الدخول", "error");

    // Save session
    localStorage.setItem("yp_user", res.data.username);
    localStorage.setItem("yp_role", res.data.role);
    localStorage.setItem("yp_token", res.data.token);
    localStorage.setItem("yp_sig", res.data.signature);

    authState = {
        user: res.data.username,
        role: res.data.role,
        token: res.data.token,
        sig: res.data.signature
    };

    showToast("تم تسجيل الدخول بنجاح", "success");

    setTimeout(() => {
        showMainUI();
    }, 500);
}


/* ------------------------------------------------------------
    SHOW MAIN UI
------------------------------------------------------------ */
function showMainUI() {
    document.getElementById("loginOverlay").classList.add("hidden");

    const mc = document.getElementById("mainContent");
    mc.classList.remove("hidden");

    setTimeout(() => mc.classList.add("opacity-100"), 30);

    // Load default tab
    switchTab("dashboard");
}


/* ------------------------------------------------------------
    LOGOUT
------------------------------------------------------------ */
function logout() {
    localStorage.clear();
    location.reload();
}


/* ------------------------------------------------------------
    SECURITY WRAPPER
    Attaches _u, _t, _s to all API calls
------------------------------------------------------------ */
function attachAuth(data) {
    return {
        ...data,
        _u: authState.user,
        _t: authState.token,
        _s: authState.sig
    };
}


/* ------------------------------------------------------------
    CHECK IF SESSION EXISTS ON PAGE LOAD
------------------------------------------------------------ */
window.addEventListener("load", () => {
    if (authState.token) {
        showMainUI();
    }
});
// auth.js

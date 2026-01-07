/* ============================================================
    YouthPower HR - API Communication
    Version: 5.2 PRO (2026)
============================================================ */

// ضع هنا نفس رابط Google Script الخاص بك
const API_URL =
    "https://script.google.com/macros/s/AKfycbzQzKyi3mpV4E9xEAjSHtMib3zfLlg012LuM4RAHdwIjUN9y2g1V0jnv-RcQtabwO77dA/exec";

/* ------------------------------------------------------------
    MAIN API REQUEST FUNCTION
------------------------------------------------------------ */
async function apiRequest(payload) {
    try {
        // Handle auth injection
        if (
            payload.action !== "login" &&
            authState.token &&
            authState.user &&
            authState.sig
        ) {
            payload = attachAuth(payload);
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        // Auto logout on expired session
        if (!res.success && res.error) {
            if (
                res.error.includes("انتهت الجلسة") ||
                res.error.includes("توثيق")
            ) {
                showToast("انتهت الجلسة الأمنية — يرجى تسجيل الدخول مرة أخرى", "error");
                setTimeout(logout, 1800);
            }
        }

        return res;

    } catch (err) {
        console.error("API Error:", err);
        showToast("تعذر الاتصال بالخادم", "error");
        return { success: false, error: "Connection Error" };
    }
}
// api.js

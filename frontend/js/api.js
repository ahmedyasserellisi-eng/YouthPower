/* ============================================================
    YouthPower HR - Frontend API Connector
    Version 5.2 PRO (2026)
============================================================ */

/*  ============================================
    ضع هنا رابط الـ Web App من Google Apps Script
    مثال:
    const API_URL = "https://script.google.com/macros/s/AKfycbyls10eMc1qIy6c0esdiNdZpGgrBFMWzff5IOskmYuTBo4krP-Hzt_8fZFdIGFb7zqSmA/exec";
================================================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyls10eMc1qIy6c0esdiNdZpGgrBFMWzff5IOskmYuTBo4krP-Hzt_8fZFdIGFb7zqSmA/exec";


/* ------------------------------------------------------------
    GENERAL FETCH WRAPPER — NO PRE-FLIGHT CORS
    (مهم جداً: لا نستخدم application/json)
------------------------------------------------------------ */
async function apiRequest(data) {
    const payload = {
        ...data,
        _u: authState.user,
        _t: authState.token,
        _s: authState.sig
    };

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    return await response.json();
}

        // لو الرد مش JSON هنعرف من الخطأ
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("API returned non-JSON:", text);
            return { success: false, error: "الرد من الخادم غير صالح" };
        }

    } catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}


/* ------------------------------------------------------------
    SHORTCUTS (اختصارات للعمليات)
------------------------------------------------------------ */
function apiSearchMember(id) {
    return apiRequest({ action: "search", id });
}

function apiGetStats() {
    return apiRequest({ action: "stats" });
}

function apiAddLog(payload) {
    return apiRequest({ action: "add_log", ...payload });
}

function apiAddMonthlyEvaluation(payload) {
    return apiRequest({ action: "add_month_eval", ...payload });
}

function apiAddActivity(payload) {
    return apiRequest({ action: "add_activity", ...payload });
}

function apiGetTop3(month, year) {
    return apiRequest({ action: "top3", month, year });
}

function apiGetFullReport(uid) {
    return apiRequest({ action: "get_member_report", MemberUID: uid });
}

// Manual API caller
window.api = (payload) => apiRequest(payload);

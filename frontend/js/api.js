/* ================================================
   YouthPower HR - API Handler (Vercel + GAS)
   Version 5.2 PRO (2026)
================================================ */

/*
  IMPORTANT:
  Using Vercel Proxy → /api → Google Apps Script
  This avoids all CORS / Preflight errors.
*/

const API_URL = "/api";   // لا تغيره

async function apiRequest(body) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        // لو السيرفر رجّع Error HTML أو فشل
        let data;
        try {
            data = await res.json();
        } catch (e) {
            console.error("JSON parse failed:", e);
            return { success: false, error: "استجابة غير صالحة من الخادم" };
        }

        return data;
    }
    catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}

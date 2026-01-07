async function apiRequest(body) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const text = await res.text();  // GAS no longer returns pure JSON

        let data = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("INVALID JSON:", text);
            return { success:false, error:"استجابة غير صالحة من الخادم" };
        }

        return data;
    }
    catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}

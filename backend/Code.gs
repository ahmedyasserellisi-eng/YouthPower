/*******************************************************
 *  YouthPower HR Backend - Enterprise V5.2 (2026)
 *  Fully FIXED for Vercel + CORS + OPTIONS
 *******************************************************/

const SHEET_MEMBERS       = "Members";
const SHEET_LOGS          = "Logs";
const SHEET_MEMBER_LOGS   = "MemberLogs";

const SHEET_EVAL          = "MonthlyEvaluations";
const SHEET_ACT           = "MemberActivities";
const SHEET_REP           = "ReportsCache";

const SECRET_KEY = "YouthPower_Secure_2026_PRO_KEY"; 
const SESSION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 ساعة

//------------------------------------------------------
// USER ROLES
//------------------------------------------------------
const USERS = {
  "admin":  { pass: "12345", role: "admin" },
  "editor": { pass: "12345", role: "editor" },
  "viewer": { pass: "12345", role: "viewer" }
};

/*******************************************************
 *  UNIVERSAL CORS HANDLING
 *******************************************************/
function doGet(e) { return handleAPI(e); }
function doPost(e) { return handleAPI(e); }

function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/*******************************************************
 *  FIXED RESPONSE (CORS + JSON)
 *******************************************************/
function createResponse(success, payload) {
  let res = { success, timestamp: new Date().toISOString() };

  if (success) res.data = payload;
  else res.error = payload;

  return ContentService
    .createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/*******************************************************
 *  MAIN API HANDLER  —  ALL LOGIC MOVED HERE
 *******************************************************/
function handleAPI(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000))
    return createResponse(false, "الخادم مشغول، حاول بعد لحظات");

  try {
    installTrigger();

    let params = {};
    try {
      params = JSON.parse(e.postData.contents || "{}");
    } catch (err) {
      return createResponse(false, "JSON غير صالح");
    }

    const action = params.action;

    const ss = SpreadsheetApp.getActive();
    const shMembers    = ss.getSheetByName(SHEET_MEMBERS);
    const shLogs       = ss.getSheetByName(SHEET_LOGS);
    const shMemberLogs = ss.getSheetByName(SHEET_MEMBER_LOGS);

    /*******************************************************
     * LOGIN
     *******************************************************/
    if (action === "login") {

      const u = params.username, p = params.password;

      if (USERS[u] && USERS[u].pass === p) {

        const token = Utilities.base64Encode(u + ":" + Date.now());
        const sig = generateSignature(token);

        logEvent(u, "LOGIN", "SUCCESS", token, sig, "");

        return createResponse(true, {
          username: u,
          role: USERS[u].role,
          token,
          signature: sig
        });
      }

      logEvent(u, "LOGIN", "FAILED", "", "", "bad credentials");
      return createResponse(false, "خطأ في اسم المستخدم أو كلمة المرور.");
    }

    /*******************************************************
     * AUTH VALIDATION
     *******************************************************/
    const auth = isAuthorized(params);
    if (auth !== "valid") {
      logEvent(params._u, action, "UNAUTHORIZED", params._t, params._s, auth);
      return createResponse(false, auth);
    }

    /*******************************************************
     * STATS
     *******************************************************/
    if (action === "stats") {

      const members = shMembers.getDataRange().getValues();
      const logs    = shMemberLogs.getDataRange().getValues();

      let stats = { total: 0, active: 0, pendingReviews: 0 };
      let notifications = [];

      for (let i=1; i<members.length; i++) {
        if (members[i][0]) stats.total++;
        if (String(members[i][4]).includes("عضو")) stats.active++;
      }

      for (let j=1; j<logs.length; j++) {
        if (logs[j][10] === "pending") {
          stats.pendingReviews++;
          notifications.push({
            memberUID: logs[j][0],
            logId: logs[j][1],
            type: logs[j][2],
            reason: logs[j][3]
          });
        }
      }

      return createResponse(true, { stats, notifications });
    }

    /*******************************************************
     * SEARCH MEMBER
     *******************************************************/
    if (action === "search") {

      const searchID = String(params.id).trim();

      const rows = shMembers.getDataRange().getValues();
      let member = null;

      for (let i=1; i<rows.length; i++) {
        if (String(rows[i][0]) === searchID) {

          member = {
            MemberID : rows[i][0],
            name     : rows[i][1],
            photo    : rows[i][2],
            joinDate : rows[i][3],
            status   : rows[i][4],
            sector   : rows[i][5],
            uid      : rows[i][6]
          };

          break;
        }
      }

      if (!member)
        return createResponse(false, "العضو غير موجود");

      const logs = shMemberLogs.getDataRange().getValues()
        .filter(r => r[0] === member.uid)
        .map(r => ({
          logId: r[1],
          type: r[2],
          reason: r[3],
          s1: r[4],
          s2: r[5],
          s3: r[6],
          s4: r[7],
          s5: r[8],
          avg: r[9],
          status: r[10],
          admin: r[11]
        }));

      member.logs = logs;

      return createResponse(true, member);
    }

    /*******************************************************
     * ADD LOG (BONUS / PENALTY / OLD SYSTEM)
     *******************************************************/
    if (action === "add_log") {

      const uid = params.uid;
      if (!uid) return createResponse(false, "MemberUID مفقود");

      const newId = "LOG_" + Utilities.getUuid().split("-")[0].toUpperCase();

      shMemberLogs.appendRow([
        uid,
        newId,
        params.type,
        params.reason,
        params.details?.s1 || "",
        params.details?.s2 || "",
        params.details?.s3 || "",
        params.details?.s4 || "",
        params.details?.s5 || "",
        params.details?.avg || "",
        params.status || "pending",
        params._u
      ]);

      return createResponse(true, "تم إضافة السجل بنجاح.");
    }

    /*******************************************************
     * APPROVE LOG
     *******************************************************/
    if (action === "approve_log") {

      const uid = params.uid;
      const logId = params.logId;

      const logs = shMemberLogs.getDataRange().getValues();

      for (let i=1; i<logs.length; i++) {
        if (logs[i][0] === uid && logs[i][1] === logId) {

          shMemberLogs.getRange(i+1, 11).setValue("approved");
          shMemberLogs.getRange(i+1, 12).setValue(params._u);

          return createResponse(true, "تم اعتماد السجل.");
        }
      }

      return createResponse(false, "السجل غير موجود.");
    }

    /*******************************************************
     * MONTHLY EVALUATION
     *******************************************************/
    if (action === "add_month_eval") {

      try {

        const now = new Date();

        const autoFinal =
          (parseInt(params.AttendanceScore) || 0) +
          (parseInt(params.ActivityScore)   || 0) +
          (parseInt(params.TaskScore)       || 0) +
          (parseInt(params.Bonus)           || 0) -
          (parseInt(params.Penalty)         || 0);

        const payload = {
          MemberUID: params.MemberUID,
          Date: params.Date || now.toLocaleDateString("ar-EG"),
          Month: params.Month,
          Year : params.Year,

          MeetingMode: params.MeetingMode,
          MeetingStatus: params.MeetingStatus,
          DelayMinutes: params.DelayMinutes || 0,

          AttendanceScore: params.AttendanceScore || 0,
          ActivityScore: params.ActivityScore   || 0,
          TaskScore: params.TaskScore           || 0,

          Bonus: params.Bonus   || 0,
          Penalty: params.Penalty || 0,

          FinalScore: params.FinalScore || autoFinal,
          Notes: params.Notes || ""
        };

        shMemberLogs.appendRow([
          payload.MemberUID,
          "EVAL_" + Utilities.getUuid().split("-")[0],
          "تقييم شهري",
          "",
          "",
          "",
          "",
          "",
          "",
          payload.FinalScore,
          "approved",
          params._u
        ]);

        return createResponse(true, "تم حفظ التقييم الشهري بنجاح.");

      } catch(err) {
        return createResponse(false, "خطأ أثناء حفظ التقييم: " + err);
      }
    }

    /*******************************************************
     * ACTIVITY
     *******************************************************/
    if (action === "add_activity") {

      try {

        const payload = {
          MemberUID: params.MemberUID,
          Type: params.Type,
          Date: params.Date,
          Description: params.Description,
          Score: params.Score || 0
        };

        const sh = getSheet(SHEET_ACT);

        sh.appendRow([
          payload.MemberUID,
          payload.Type,
          payload.Date,
          payload.Description,
          payload.Score,
          JSON.stringify(payload)
        ]);

        return createResponse(true, "تم تسجيل النشاط بنجاح.");

      } catch(err) {
        return createResponse(false, "خطأ أثناء حفظ النشاط: " + err);
      }
    }

    /*******************************************************
     * TOP 3
     *******************************************************/
    if (action === "top3") {

      try {

        const shMembers = getSheet(SHEET_MEMBERS);
        const shEval    = getSheet(SHEET_EVAL);
        const shLogs    = getSheet(SHEET_MEMBER_LOGS);

        const members = shMembers.getDataRange().getValues();
        const evals   = shEval.getDataRange().getValues();
        const logs    = shLogs.getDataRange().getValues();

        const month = params.month;
        const year  = params.year;

        let ranking = {};

        for (let i=1; i<evals.length; i++) {
          if (evals[i][2] === month && String(evals[i][3]) === year) {
            const uid = evals[i][0];
            const score = parseInt(evals[i][12]) || 0;

            if (!ranking[uid]) ranking[uid] = { uid, monthScore:0, logsScore:0 };
            ranking[uid].monthScore += score;
          }
        }

        for (let i=1; i<logs.length; i++) {

          const uid = logs[i][0];
          const type = logs[i][2];
          const reason = logs[i][3];
          const status = logs[i][10];

          if (!ranking[uid]) ranking[uid] = { uid, monthScore:0, logsScore:0 };
          if (status !== "approved") continue;

          let pts = 0;
          const m = String(reason).match(/\d+/);
          if (m) pts = parseInt(m[0]);

          if (type === "بونص") ranking[uid].logsScore += pts;
          if (type === "عقوبة") ranking[uid].logsScore -= pts;
        }

        let arr = [];

        Object.values(ranking).forEach(r => {
          r.total = r.monthScore + r.logsScore;
          arr.push(r);
        });

        arr.sort((a,b) => b.total - a.total);

        let top3 = arr.slice(0, 3);

        for (let m of top3) {
          for (let i=1; i<members.length; i++) {
            if (members[i][6] === m.uid) {
              m.name   = members[i][1];
              m.sector = members[i][5];
              break;
            }
          }
        }

        return createResponse(true, top3);

      } catch(err) {
        return createResponse(false, "خطأ في ترتيب الأفضل: " + err);
      }
    }

    /*******************************************************
     * FULL MEMBER REPORT
     *******************************************************/
    if (action === "get_member_report") {

      try {

        const uid = params.MemberUID;
        if (!uid) return createResponse(false, "MemberUID مفقود");

        const shMembers = getSheet(SHEET_MEMBERS);
        const shLogs    = getSheet(SHEET_MEMBER_LOGS);
        const shEval    = getSheet(SHEET_EVAL);
        const shAct     = getSheet(SHEET_ACT);

        const members = shMembers.getDataRange().getValues();
        const evals   = shEval.getDataRange().getValues();
        const acts    = shAct.getDataRange().getValues();
        const logs    = shLogs.getDataRange().getValues();

        let result = {
          profile: {},
          evaluations: [],
          activities:

/*******************************************************
 *  YouthPower HR Backend - Enterprise V5.2 (2026)
 *  Full Integrated System:
 *  - Members
 *  - MemberLogs
 *  - Logs
 *  - MonthlyEvaluations
 *  - MemberActivities
 *  - ReportsCache
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

//=====================================================================
// FIXED CORS + JSON RESPONSE =========================================
//=====================================================================
function createResponse(success, payload) {
  let res = { success, timestamp: new Date().toISOString() };
  if (success) res.data = payload;
  else res.error = payload;

  const output = ContentService.createTextOutput(JSON.stringify(res));
  output.setMimeType(ContentService.MimeType.JSON);

  // *******************************
  // 🔥 CRS HEADERS FIX HERE
  // *******************************
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return output;
}

//=====================================================================
// SIGNATURE
//=====================================================================
function generateSignature(data) {
  const sig = Utilities.computeHmacSha256Signature(data, SECRET_KEY);
  return sig.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

//=====================================================================
// UID GENERATOR (Members)
//=====================================================================
function generateMemberUIDs() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_MEMBERS);
  const last = sh.getLastRow();
  if (last < 2) return;

  const data = sh.getRange(2,1,last-1,7).getValues();
  let updates = 0;

  for (let i=0; i<data.length; i++) {
    if (!data[i][6]) {
      data[i][6] = Utilities.getUuid().replace(/-/g,"");
      updates++;
    }
  }

  sh.getRange(2,1,data.length,7).setValues(data);
}

//=====================================================================
// AUTO UID ON EDIT
//=====================================================================
function onEdit(e) {
  try {
    const sh = e.source.getSheetByName(SHEET_MEMBERS);
    if (!sh) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();

    if (row > 1 && col >= 1 && col <= 6) {
      const uidCell = sh.getRange(row, 7);
      if (!uidCell.getValue()) {
        uidCell.setValue(Utilities.getUuid().replace(/-/g,""));
      }
    }

  } catch(err) {
    logEvent("SYSTEM","ONEDIT_ERROR","FAILED","","",err.toString());
  }
}

//=====================================================================
// AUTO TRIGGER INSTALL
//=====================================================================
function installTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let exists = triggers.some(t => t.getHandlerFunction() === "onEdit");

  if (!exists) {
    ScriptApp.newTrigger("onEdit")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
  }
}

//=====================================================================
// LOGGING SHEET
//=====================================================================
function logEvent(user, action, status, token, sig, msg) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_LOGS);
  sh.appendRow([
    new Date(),
    user || "",
    action || "",
    status || "",
    token || "",
    sig || "",
    msg || ""
  ]);
}

//=====================================================================
// SECURITY
//=====================================================================
function isAuthorized(params) {
  try {
    if (!params._u || !params._t || !params._s)
      return "بيانات التوثيق ناقصة";

    if (!USERS.hasOwnProperty(params._u))
      return "حساب غير معروف";

    if (params._s !== generateSignature(params._t))
      return "توقيع غير صحيح";

    const decoded = Utilities.newBlob(Utilities.base64Decode(params._t))
                   .getDataAsString();

    const timestamp = parseInt(decoded.split(":")[1]);

    if (!timestamp || (Date.now() - timestamp) > SESSION_EXPIRY_MS)
      return "انتهت الجلسة";

    return "valid";

  } catch (err) {
    return "خطأ بالتحقق الأمني: " + err;
  }
}

//=====================================================================
// GET SHEET
//=====================================================================
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/*******************************************************
 *    HR ENGINE EXTENSIONS
 *******************************************************/

//------------------------------------------------------
// SAVE MONTHLY EVALUATION
//------------------------------------------------------
function saveMonthlyEvaluation(payload) {
  const sh = getSheet(SHEET_EVAL);
  if (!sh) return { success:false, error:"ورقة MonthlyEvaluations غير موجودة" };

  const row = [
    payload.MemberUID,
    payload.Date,
    payload.Month,
    payload.Year,
    payload.MeetingMode,
    payload.MeetingStatus,
    payload.DelayMinutes,
    payload.AttendanceScore,
    payload.ActivityScore,
    payload.TaskScore,
    payload.Bonus,
    payload.Penalty,
    payload.FinalScore,
    payload.Notes,
    JSON.stringify(payload)
  ];

  sh.appendRow(row);
  return { success:true };
}

//------------------------------------------------------
// SAVE ACTIVITY
//------------------------------------------------------
function saveActivity(payload) {
  const sh = getSheet(SHEET_ACT);
  if (!sh) return { success:false, error:"ورقة MemberActivities غير موجودة" };

  sh.appendRow([
    payload.MemberUID,
    payload.Type,
    payload.Date,
    payload.Description,
    payload.Score,
    JSON.stringify(payload)
  ]);

  return { success:true };
}

//=====================================================================
// doGet
//=====================================================================
function doGet(e) {
  return createResponse(true, "YouthPower HR API V5.2 Engine Running...");
}

//=====================================================================
// doPost — MAIN CONTROLLER
//=====================================================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000))
    return createResponse(false, "الخادم مشغول، حاول بعد لحظات");

  try {
    installTrigger();

    const params = JSON.parse(e.postData.contents || "{}");
    const action = params.action;

    const ss = SpreadsheetApp.getActive();
    const shMembers    = ss.getSheetByName(SHEET_MEMBERS);
    const shLogs       = ss.getSheetByName(SHEET_LOGS);
    const shMemberLogs = ss.getSheetByName(SHEET_MEMBER_LOGS);

    //-------------------------------------------------------------
    // LOGIN
    //-------------------------------------------------------------
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

    //-------------------------------------------------------------
    // AUTH CHECK
    //-------------------------------------------------------------
    const auth = isAuthorized(params);
    if (auth !== "valid") {
      logEvent(params._u, action, "UNAUTHORIZED", params._t, params._s, auth);
      return createResponse(false, auth);
    }

    /**************************************************************
     *                    SYSTEM ACTIONS
     **************************************************************/

    //-------------------------------------------------------------
    // STATS
    //-------------------------------------------------------------
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

    //-------------------------------------------------------------
    // SEARCH MEMBER
    //-------------------------------------------------------------
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

    //-------------------------------------------------------------
    // ADD LOG
    //-------------------------------------------------------------
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

    //-------------------------------------------------------------
    // APPROVE LOG
    //-------------------------------------------------------------
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

    /**************************************************************
     * NEW ENGINE (MonthlyEval + Activity)
     **************************************************************/

    //-------------------------------------------------------------
    // ADD MONTHLY EVALUATION
    //-------------------------------------------------------------
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

        const result = saveMonthlyEvaluation(payload);

        if (result.success)
          return createResponse(true, "تم حفظ التقييم الشهري بنجاح.");

        return createResponse(false, result.error);

      } catch(err) {
        return createResponse(false, "خطأ أثناء حفظ التقييم: " + err);
      }
    }

    //-------------------------------------------------------------
    // ADD ACTIVITY
    //-------------------------------------------------------------
    if (action === "add_activity") {

      try {

        const payload = {
          MemberUID: params.MemberUID,
          Type: params.Type,
          Date: params.Date,
          Description: params.Description,
          Score: params.Score || 0
        };

        const result = saveActivity(payload);

        if (result.success)
          return createResponse(true, "تم تسجيل النشاط بنجاح.");

        return createResponse(false, result.error);

      } catch(err) {
        return createResponse(false, "خطأ أثناء حفظ النشاط: " + err);
      }
    }

    /**************************************************************
     * TOP 3
     **************************************************************/
    if (action === "top3") {

      try {

        const shMembers = getSheet(SHEET_MEMBERS);
        const shEval    = getSheet(SHEET_EVAL);
        const shLogs    = getSheet(SHEET_MEMBER_LOGS);

        const members = shMembers.getDataRange().getValues();
        const evals   = shEval.getDataRange().getValues();
        const logs    = shLogs.getDataRange().getValues();

        const now = new Date();
        const month = params.month;
        const year  = params.year;

        let ranking = {};

        //---------------------------------------------------
        // Monthly Evaluations
        //---------------------------------------------------
        for (let i=1; i<evals.length; i++) {

          if (evals[i][2] === month && String(evals[i][3]) === year) {

            const uid = evals[i][0];
            const score = parseInt(evals[i][12]) || 0;

            if (!ranking[uid]) ranking[uid] = { uid, monthScore:0, logsScore:0 };
            ranking[uid].monthScore += score;
          }
        }

        //---------------------------------------------------
        // Logs: Bonuses & Penalties
        //---------------------------------------------------
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

        //---------------------------------------------------
        // Final Total
        //---------------------------------------------------
        let arr = [];

        Object.values(ranking).forEach(r => {
          r.total = r.monthScore + r.logsScore;
          arr.push(r);
        });

        arr.sort((a,b) => b.total - a.total);

        let top3 = arr.slice(0, 3);

        //---------------------------------------------------
        // Attach Member Names
        //---------------------------------------------------
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

    /**************************************************************
     * FULL MEMBER REPORT
     **************************************************************/
    if (action === "get_member_report") {

      try {

        const uid = params.MemberUID;
        if (!uid) return createResponse(false, "MemberUID مفقود");

        const shMembers = getSheet(SHEET_MEMBERS);
        const shEval    = getSheet(SHEET_EVAL);
        const shAct     = getSheet(SHEET_ACT);
        const shLogs    = getSheet(SHEET_MEMBER_LOGS);

        const members = shMembers.getDataRange().getValues();
        const evals   = shEval.getDataRange().getValues();
        const acts    = shAct.getDataRange().getValues();
        const logs    = shLogs.getDataRange().getValues();

        let result = {
          profile: {},
          evaluations: [],
          activities: [],
          logs: [],
          score: {
            evalScore: 0,
            activityScore: 0,
            bonus: 0,
            penalty: 0,
            total: 0
          }
        };

        //---------------------------------------------------
        // Profile
        //---------------------------------------------------
        let found = false;

        for (let i=1; i<members.length; i++) {
          if (members[i][6] === uid) {
            result.profile = {
              MemberID: members[i][0],
              name:     members[i][1],
              photo:    members[i][2],
              joinDate: members[i][3],
              status:   members[i][4],
              sector:   members[i][5],
              uid:      members[i][6]
            };
            found = true;
            break;
          }
        }

        if (!found)
          return createResponse(false, "لم يتم العثور على العضو");

        //---------------------------------------------------
        // Evaluations
        //---------------------------------------------------
        for (let i=1; i<evals.length; i++) {

          if (evals[i][0] === uid) {

            result.evaluations.push({
              Date: evals[i][1],
              Month: evals[i][2],
              Year: evals[i][3],
              MeetingMode: evals[i][4],
              MeetingStatus: evals[i][5],
              DelayMinutes: evals[i][6],
              AttendanceScore: evals[i][7],
              ActivityScore : evals[i][8],
              TaskScore     : evals[i][9],
              Bonus         : evals[i][10],
              Penalty       : evals[i][11],
              FinalScore    : evals[i][12],
              Notes: evals[i][13]
            });

            result.score.evalScore += parseInt(evals[i][12]) || 0;
          }
        }

        //---------------------------------------------------
        // Activities
        //---------------------------------------------------
        for (let i=1; i<acts.length; i++) {

          if (acts[i][0] === uid) {

            result.activities.push({
              Type: acts[i][1],
              Date: acts[i][2],
              Description: acts[i][3],
              Score: acts[i][4]
            });

            result.score.activityScore += parseInt(acts[i][4]) || 0;
          }
        }

        //---------------------------------------------------
        // Logs (Bonus/Penalty)
        //---------------------------------------------------
        for (let i=1; i<logs.length; i++) {

          if (logs[i][0] === uid && logs[i][10] === "approved") {

            const type = logs[i][2];
            const reason = logs[i][3];

            let pts = 0;
            const m = String(reason).match(/\d+/);
            if (m) pts = parseInt(m[0]);

            if (type === "بونص")  result.score.bonus   += pts;
            if (type === "عقوبة") result.score.penalty += pts;

            result.logs.push({
              logId: logs[i][1],
              type,
              reason,
              admin: logs[i][11]
            });
          }
        }

        //---------------------------------------------------
        // TOTAL SCORE
        //---------------------------------------------------
        result.score.total =
            result.score.evalScore +
            result.score.activityScore +
            result.score.bonus -
            result.score.penalty;

        return createResponse(true, result);

      } catch(err) {
        return createResponse(false, "خطأ في تقرير العضو: " + err);
      }
    }

    //-------------------------------------------------------------
    // UNKNOWN ACTION
    //-------------------------------------------------------------
    return createResponse(false, "أمر غير معروف");

  } catch (err) {

    logEvent("SYSTEM","CRASH","ERROR","","",err.toString());
    return createResponse(false, "خطأ داخلي: " + err);

  } finally {

    lock.releaseLock();

  }

}

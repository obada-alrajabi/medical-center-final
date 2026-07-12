#!/usr/bin/env bash
BASE="http://localhost:3001/api"
PASS=0; FAIL=0

check() {
  local label="$1" method="$2" url="$3" data="$4" expect="$5"
  if [ -n "$data" ]; then
    code=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" -d "$data" "$url")
  else
    code=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X "$method" "$url")
  fi
  body=$(cat /tmp/resp.txt)
  if [ "$code" = "$expect" ]; then
    echo "✅ [$code] $label"
    PASS=$((PASS+1))
  else
    echo "❌ [$code] $label — $(echo "$body" | head -c 180)"
    FAIL=$((FAIL+1))
  fi
}

# Helper: extract id — handles both numeric "id":123 and string "id":"100006"
get_id() {
  local nid
  nid=$(grep -o '"id":[0-9]*' /tmp/resp.txt | head -1 | grep -o '[0-9]*$')
  if [ -n "$nid" ]; then echo "$nid"; return; fi
  grep -o '"id":"[^"]*"' /tmp/resp.txt | head -1 | sed 's/"id":"//;s/"$//'
}

# ── Auth ───────────────────────────────────────────────────────────────────
check "POST /settings/auth/login valid"   POST "$BASE/settings/auth/login" '{"username":"admin","password":"1234"}' 200
ADMIN_TOKEN=$(grep -o '"token":"[^"]*"' /tmp/resp.txt | head -1 | sed 's/"token":"//;s/"$//')
check "POST /settings/auth/login invalid" POST "$BASE/settings/auth/login" '{"username":"admin","password":"bad"}'  401

# check_auth: same as check() but sends the admin Bearer token
check_auth() {
  local label="$1" method="$2" url="$3" data="$4" expect="$5"
  if [ -n "$data" ]; then
    code=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d "$data" "$url")
  else
    code=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X "$method" \
      -H "Authorization: Bearer $ADMIN_TOKEN" "$url")
  fi
  body=$(cat /tmp/resp.txt)
  if [ "$code" = "$expect" ]; then
    echo "✅ [$code] $label"
    PASS=$((PASS+1))
  else
    echo "❌ [$code] $label — $(echo "$body" | head -c 180)"
    FAIL=$((FAIL+1))
  fi
}

# ── Patients ───────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/patients" -H "Content-Type: application/json" \
  -d '{"name":"تجربة مؤقتة","phone":"0912300099","gender":"male","age":30}'
PID=$(get_id)
check "GET /patients"         GET "$BASE/patients" "" 200
if [ -n "$PID" ]; then
  check "GET /patients/$PID"  GET "$BASE/patients/$PID" "" 200
  check "PUT /patients/$PID"  PUT "$BASE/patients/$PID" '{"name":"تجربة2"}' 200
  check_auth "DELETE /patients/$PID" DELETE "$BASE/patients/$PID" "" 200
else echo "⚠️  Patients: skipped GET/PUT/DELETE — could not create patient (ID: '$PID')"; fi

# ── Sessions ───────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/patients" -H "Content-Type: application/json" \
  -d '{"name":"مريض جلسة","phone":"0900000011","gender":"male","age":25}'
PID2=$(get_id)
curl -s -o /tmp/resp.txt -X POST "$BASE/sessions" -H "Content-Type: application/json" \
  -d "{\"patient_id\":\"${PID2:-1}\",\"dept\":\"lab\",\"date\":\"2026-07-01\",\"amount\":100}"
SID=$(get_id)
check "GET /sessions"         GET "$BASE/sessions" "" 200
[ -n "$SID" ] && check "GET /sessions/$SID" GET "$BASE/sessions/$SID" "" 200
[ -n "$SID" ] && check "PUT /sessions/$SID (partial)" PUT "$BASE/sessions/$SID" '{"amount":200}' 200
[ -n "$SID" ] && check_auth "DELETE /sessions/$SID" DELETE "$BASE/sessions/$SID" "" 200
[ -n "$PID2" ] && curl -s -X DELETE "$BASE/patients/$PID2" > /dev/null

# ── Lab tests ──────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/lab/tests" -H "Content-Type: application/json" \
  -d '{"name":"اختبار نوفي","price":50}'
LID=$(get_id)
check "GET /lab/tests"        GET "$BASE/lab/tests" "" 200
[ -n "$LID" ] && check "GET /lab/tests/$LID" GET "$BASE/lab/tests/$LID" "" 200
[ -n "$LID" ] && check "PUT /lab/tests/$LID (partial)" PUT "$BASE/lab/tests/$LID" '{"price":60}' 200
[ -n "$LID" ] && check "DELETE /lab/tests/$LID" DELETE "$BASE/lab/tests/$LID" "" 200

# ── Lab ranges ─────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/lab/tests" -H "Content-Type: application/json" \
  -d '{"name":"اختبار مدى","price":50}'
LID2=$(get_id)
curl -s -o /tmp/resp.txt -X POST "$BASE/lab/tests/${LID2:-999}/ranges" -H "Content-Type: application/json" \
  -d '{"param":"Hemoglobin"}'
RID=$(get_id)
[ -n "$LID2" ] && check "GET /lab/tests/$LID2/ranges" GET "$BASE/lab/tests/$LID2/ranges" "" 200
[ -n "$RID"  ] && check "PUT /lab/ranges/$RID (partial)" PUT "$BASE/lab/ranges/$RID" '{"unit":"g/dL"}' 200
[ -n "$RID"  ] && check "DELETE /lab/ranges/$RID" DELETE "$BASE/lab/ranges/$RID" "" 200
[ -n "$LID2" ] && curl -s -X DELETE "$BASE/lab/tests/$LID2" > /dev/null

# ── Lab inventory ──────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/lab/inventory" -H "Content-Type: application/json" \
  -d '{"name":"كيت تجريبي","qty":10,"threshold":2}'
INVID=$(get_id)
check "GET /lab/inventory"    GET "$BASE/lab/inventory" "" 200
[ -n "$INVID" ] && check "GET /lab/inventory/$INVID" GET "$BASE/lab/inventory/$INVID" "" 200
[ -n "$INVID" ] && check "PUT /lab/inventory/$INVID (partial)" PUT "$BASE/lab/inventory/$INVID" '{"qty":5}' 200
[ -n "$INVID" ] && check "DELETE /lab/inventory/$INVID" DELETE "$BASE/lab/inventory/$INVID" "" 200

# ── Radiology ──────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/radiology" -H "Content-Type: application/json" \
  -d '{"name":"صورة أشعة تجربة","price":150}'
RADID=$(get_id)
check "GET /radiology"        GET "$BASE/radiology" "" 200
[ -n "$RADID" ] && check "GET /radiology/$RADID" GET "$BASE/radiology/$RADID" "" 200
[ -n "$RADID" ] && check "PUT /radiology/$RADID (partial)" PUT "$BASE/radiology/$RADID" '{"price":200}' 200
[ -n "$RADID" ] && check "DELETE /radiology/$RADID" DELETE "$BASE/radiology/$RADID" "" 200

# ── Surgery inventory ──────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/surgery-inventory" -H "Content-Type: application/json" \
  -d '{"name":"أداة جراحية تجربة","qty":5}'
SURID=$(get_id)
check "GET /surgery-inventory" GET "$BASE/surgery-inventory" "" 200
[ -n "$SURID" ] && check "GET /surgery-inventory/$SURID" GET "$BASE/surgery-inventory/$SURID" "" 200
[ -n "$SURID" ] && check "PUT /surgery-inventory/$SURID (partial)" PUT "$BASE/surgery-inventory/$SURID" '{"qty":10}' 200
[ -n "$SURID" ] && check "DELETE /surgery-inventory/$SURID" DELETE "$BASE/surgery-inventory/$SURID" "" 200

# ── Rehab services ─────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/rehab/services" -H "Content-Type: application/json" \
  -d '{"name":"علاج طبيعي تجربة","price":80}'
RSID=$(get_id)
check "GET /rehab/services"   GET "$BASE/rehab/services" "" 200
[ -n "$RSID" ] && check "PUT /rehab/services/$RSID (partial)" PUT "$BASE/rehab/services/$RSID" '{"price":90}' 200
[ -n "$RSID" ] && check "DELETE /rehab/services/$RSID" DELETE "$BASE/rehab/services/$RSID" "" 200

# ── Rehab plans ────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/patients" -H "Content-Type: application/json" \
  -d '{"name":"مريض تأهيل","phone":"0900000022","gender":"female","age":40}'
PID3=$(get_id)
curl -s -o /tmp/resp.txt -X POST "$BASE/rehab/plans" -H "Content-Type: application/json" \
  -d "{\"patient_id\":\"${PID3:-1}\",\"patient_name\":\"مريض تأهيل\",\"diagnosis\":\"آلام\",\"total_sessions\":10,\"completed_sessions\":0}"
RPID=$(get_id)
check "GET /rehab/plans"      GET "$BASE/rehab/plans" "" 200
[ -n "$RPID" ] && check "PUT /rehab/plans/$RPID (partial)" PUT "$BASE/rehab/plans/$RPID" '{"status":"completed"}' 200
[ -n "$RPID" ] && check_auth "DELETE /rehab/plans/$RPID" DELETE "$BASE/rehab/plans/$RPID" "" 200
[ -n "$PID3" ] && curl -s -X DELETE "$BASE/patients/$PID3" > /dev/null

# ── Rehab queue ────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/rehab/queue" -H "Content-Type: application/json" \
  -d '{"patient_id":"1","patient_name":"مريض","session_number":1}'
RQID=$(get_id)
check "GET /rehab/queue"      GET "$BASE/rehab/queue" "" 200
[ -n "$RQID" ] && check "PATCH /rehab/queue/$RQID" PATCH "$BASE/rehab/queue/$RQID" '{"status":"done"}' 200
[ -n "$RQID" ] && check "DELETE /rehab/queue/$RQID" DELETE "$BASE/rehab/queue/$RQID" "" 200

# ── Finance: debts ─────────────────────────────────────────────────────────
check "GET /finance/debts"    GET "$BASE/finance/debts" "" 200
curl -s -o /tmp/resp.txt -X POST "$BASE/finance/debts" -H "Content-Type: application/json" \
  -d '{"patient":"مديون تجريبي","patient_id":"9999","dept":"lab","amount":500,"date":"2026-07-01"}'
DEBTID=$(get_id)
[ -n "$DEBTID" ] && check "PUT /finance/debts/$DEBTID (partial)" PUT "$BASE/finance/debts/$DEBTID" '{"amount":600}' 200
[ -n "$DEBTID" ] && check_auth "DELETE /finance/debts/$DEBTID" DELETE "$BASE/finance/debts/$DEBTID" "" 200

# ── Finance: external debts ────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/finance/external-debts" -H "Content-Type: application/json" \
  -d '{"dir":"given","party":"شركة تجربة","amount":1000,"date":"2026-07-01"}'
EDID=$(get_id)
check "GET /finance/external-debts" GET "$BASE/finance/external-debts" "" 200
check "POST /finance/external-debts (dir alias)" POST "$BASE/finance/external-debts" \
  '{"dir":"received","party":"مريض","amount":500}' 201
[ -n "$EDID" ] && check "PUT /finance/external-debts/$EDID (partial)" PUT "$BASE/finance/external-debts/$EDID" \
  '{"status":"settled","settled_date":"2026-07-02"}' 200
[ -n "$EDID" ] && check_auth "DELETE /finance/external-debts/$EDID" DELETE "$BASE/finance/external-debts/$EDID" "" 200

# ── Finance: purchase requests ─────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/finance/purchase-requests" -H "Content-Type: application/json" \
  -d '{"date":"2026-07-01","items":[{"name":"مادة تجربة","qty":2,"estimated_price":50}]}'
PRID=$(get_id)
check "GET /finance/purchase-requests" GET "$BASE/finance/purchase-requests" "" 200
[ -n "$PRID" ] && check "PUT /finance/purchase-requests/$PRID (partial)" PUT \
  "$BASE/finance/purchase-requests/$PRID" '{"status":"approved"}' 200
# get item id from the request
[ -n "$PRID" ] && curl -s -o /tmp/resp.txt "$BASE/finance/purchase-requests/$PRID"
PIID=$(grep -o '"id":[0-9]*' /tmp/resp.txt | sed -n '2p' | grep -o '[0-9]*$')
[ -n "$PIID" ] && check "PUT /finance/purchase-items/$PIID (partial)" PUT \
  "$BASE/finance/purchase-items/$PIID" '{"qty":5}' 200
[ -n "$PRID" ] && check "DELETE /finance/purchase-requests/$PRID" DELETE \
  "$BASE/finance/purchase-requests/$PRID" "" 200

# ── Finance: receipt vouchers ──────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/finance/receipt-vouchers" -H "Content-Type: application/json" \
  -d '{"received_from_type":"patient","received_from_name":"مريض","amount":200,"date":"2026-07-01","reason":"كشفية"}'
RVID=$(get_id)
check "GET /finance/receipt-vouchers" GET "$BASE/finance/receipt-vouchers" "" 200
[ -n "$RVID" ] && check "GET /finance/receipt-vouchers/$RVID" GET "$BASE/finance/receipt-vouchers/$RVID" "" 200
[ -n "$RVID" ] && check_auth "PUT /finance/receipt-vouchers/$RVID (partial)" PUT \
  "$BASE/finance/receipt-vouchers/$RVID" '{"amount":300}' 200
[ -n "$RVID" ] && check_auth "DELETE /finance/receipt-vouchers/$RVID" DELETE "$BASE/finance/receipt-vouchers/$RVID" "" 200

# ── Finance: payment vouchers ──────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/finance/payment-vouchers" -H "Content-Type: application/json" \
  -d '{"paid_to_type":"supplier","paid_to_name":"مورد","amount":500,"date":"2026-07-01","reason":"مستلزمات"}'
PVID=$(get_id)
check "GET /finance/payment-vouchers" GET "$BASE/finance/payment-vouchers" "" 200
[ -n "$PVID" ] && check "GET /finance/payment-vouchers/$PVID" GET "$BASE/finance/payment-vouchers/$PVID" "" 200
[ -n "$PVID" ] && check_auth "PUT /finance/payment-vouchers/$PVID (partial)" PUT \
  "$BASE/finance/payment-vouchers/$PVID" '{"amount":600}' 200
[ -n "$PVID" ] && check_auth "DELETE /finance/payment-vouchers/$PVID" DELETE "$BASE/finance/payment-vouchers/$PVID" "" 200

# ── Finance: summary (requires admin) ─────────────────────────────────────
check_auth "GET /finance/summary" GET "$BASE/finance/summary" "" 200

# ── Finance: reset-all stub (requires admin, now returns 410) ─────────────
check_auth "POST /finance/reset-all (deprecated stub)" POST "$BASE/finance/reset-all" '{}' 410

# ── Drawers ────────────────────────────────────────────────────────────────
check "GET /drawers"          GET "$BASE/drawers" "" 200
curl -s -o /tmp/resp.txt -X POST "$BASE/drawers/transactions" -H "Content-Type: application/json" \
  -d '{"dept":"lab","type":"in","title":"إيداع تجريبي","amount":1000,"balance_after":1000,"tx_date":"2026-07-01"}'
DTID=$(get_id)
check "GET /drawers/transactions/all" GET "$BASE/drawers/transactions/all" "" 200
[ -n "$DTID" ] && check_auth "PUT /drawers/transactions/$DTID (partial)" PUT \
  "$BASE/drawers/transactions/$DTID" '{"amount":1200}' 200
[ -n "$DTID" ] && check_auth "DELETE /drawers/transactions/$DTID" DELETE "$BASE/drawers/transactions/$DTID" "" 200

# ── Staff ──────────────────────────────────────────────────────────────────
check "GET /staff"            GET "$BASE/staff" "" 200
curl -s -o /tmp/resp.txt -X POST "$BASE/staff" -H "Content-Type: application/json" \
  -d '{"name":"موظف تجربة99","dept":"lab","role":"staff","username":"teststaff99x","password_hash":"x"}'
EMPID=$(get_id)
[ -n "$EMPID" ] && check "GET /staff/$EMPID" GET "$BASE/staff/$EMPID" "" 200
[ -n "$EMPID" ] && check "PUT /staff/$EMPID (partial)" PUT "$BASE/staff/$EMPID" '{"name":"موظف محدث"}' 200

# ── Staff advances (require admin) ─────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/staff/advances" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"emp_name":"موظف","amount":200,"date":"2026-07-01"}'
ADID=$(get_id)
check "GET /staff/advances/all" GET "$BASE/staff/advances/all" "" 200
[ -n "$ADID" ] && check_auth "PUT /staff/advances/$ADID (partial)" PUT "$BASE/staff/advances/$ADID" '{"repaid":true}' 200
[ -n "$ADID" ] && check_auth "DELETE /staff/advances/$ADID" DELETE "$BASE/staff/advances/$ADID" "" 200

# ── Attendance (PUT/DELETE require admin) ──────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/staff/attendance" -H "Content-Type: application/json" \
  -d '{"emp_id":1,"emp_name":"موظف","date":"2026-07-01","check_in":"08:00","check_out":"16:00"}'
ATID=$(get_id)
check "GET /staff/attendance/all" GET "$BASE/staff/attendance/all" "" 200
[ -n "$ATID" ] && check_auth "PUT /staff/attendance/$ATID (partial)" PUT "$BASE/staff/attendance/$ATID" '{"check_out":"17:00"}' 200
[ -n "$ATID" ] && check_auth "DELETE /staff/attendance/$ATID" DELETE "$BASE/staff/attendance/$ATID" "" 200
[ -n "$EMPID" ] && curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$BASE/staff/$EMPID" > /dev/null

# ── Settings ───────────────────────────────────────────────────────────────
curl -s -o /tmp/resp.txt -X POST "$BASE/settings/insurance" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"تأمين تجريبي 99"}'
INSID=$(get_id)
check "GET /settings/insurance" GET "$BASE/settings/insurance" "" 200
[ -n "$INSID" ] && check_auth "PUT /settings/insurance/$INSID (partial)" PUT \
  "$BASE/settings/insurance/$INSID" '{"phone":"0912345678"}' 200
[ -n "$INSID" ] && check_auth "DELETE /settings/insurance/$INSID" DELETE "$BASE/settings/insurance/$INSID" "" 200

curl -s -o /tmp/resp.txt -X POST "$BASE/settings/suppliers" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"مورد تجريبي 99"}'
SUPID=$(get_id)
check "GET /settings/suppliers" GET "$BASE/settings/suppliers" "" 200
[ -n "$SUPID" ] && check_auth "PUT /settings/suppliers/$SUPID (partial)" PUT \
  "$BASE/settings/suppliers/$SUPID" '{"phone":"0911111111"}' 200
[ -n "$SUPID" ] && check_auth "DELETE /settings/suppliers/$SUPID" DELETE "$BASE/settings/suppliers/$SUPID" "" 200

check_auth "GET /settings/admins"  GET "$BASE/settings/admins" "" 200
check "GET /settings/sidebar"      GET "$BASE/settings/sidebar" "" 200
check_auth "GET /admin/tables"     GET "$BASE/admin/tables" "" 200
check "GET /api/health"            GET "http://localhost:3001/api/health" "" 200

echo ""
echo "══════════════════════════════════════"
echo "  PASS: $PASS   FAIL: $FAIL"
echo "══════════════════════════════════════"

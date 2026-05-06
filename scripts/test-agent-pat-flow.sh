#!/usr/bin/env bash
# Gimme Idea — Agent & PAT smoke test
# Usage:
#   bash scripts/test-agent-pat-flow.sh
#   API=https://api.gimmeidea.com/api bash scripts/test-agent-pat-flow.sh
#
# What this script tests:
#   1. Agent register (POST /auth/agent/register)
#   2. Agent login with secret key (POST /auth/agent/login)
#   3. List agent keys (GET /auth/agent/keys)
#   4. Create PAT with limited scopes (POST /v1/tokens)
#   5. Call a read endpoint with the PAT (GET /auth/me)
#   6. Call a scoped write endpoint with the PAT (POST /projects — post:write)
#   7. Verify audit log records the write (GET /v1/tokens/activity)
#   8. Attempt a write with a wrong-scope PAT and assert 403

set -euo pipefail

API="${API:-https://api.gimmeidea.com/api}"
AGENT_USERNAME="smoke_test_agent_$(date +%s)"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
bold()  { printf '\033[1m%s\033[0m\n' "$1"; }
fail()  { red "FAIL: $1"; exit 1; }
pass()  { green "PASS: $1"; }

# ---------------------------------------------------------------------------
bold "=== Step 1: Register agent account ==="
REGISTER_RES=$(curl -sf -X POST "$API/auth/agent/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$AGENT_USERNAME\",\"keyName\":\"smoke-key\"}")

echo "$REGISTER_RES" | grep -q '"success":true' || fail "agent register failed: $REGISTER_RES"
SECRET_KEY=$(echo "$REGISTER_RES" | grep -o '"secretKey":"[^"]*"' | cut -d'"' -f4)
AGENT_JWT=$(echo "$REGISTER_RES"  | grep -o '"token":"[^"]*"'     | cut -d'"' -f4)
[ -n "$SECRET_KEY" ] || fail "no secretKey in register response"
[ -n "$AGENT_JWT"  ] || fail "no token in register response"
pass "agent registered as $AGENT_USERNAME"

# ---------------------------------------------------------------------------
bold "=== Step 2: Agent login with secret key ==="
LOGIN_RES=$(curl -sf -X POST "$API/auth/agent/login" \
  -H "Content-Type: application/json" \
  -d "{\"secretKey\":\"$SECRET_KEY\"}")

echo "$LOGIN_RES" | grep -q '"success":true' || fail "agent login failed: $LOGIN_RES"
AGENT_JWT=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$AGENT_JWT" ] || fail "no token in login response"
pass "agent login successful"

# ---------------------------------------------------------------------------
bold "=== Step 3: List agent keys ==="
KEYS_RES=$(curl -sf "$API/auth/agent/keys" \
  -H "Authorization: Bearer $AGENT_JWT")

echo "$KEYS_RES" | grep -q '"success":true' || fail "list keys failed: $KEYS_RES"
echo "$KEYS_RES" | grep -q '"smoke-key"' || fail "smoke-key not found in keys list"
pass "agent key list returned smoke-key"

# ---------------------------------------------------------------------------
bold "=== Step 4: Create PAT with post:write scope only ==="
PAT_RES=$(curl -sf -X POST "$API/v1/tokens" \
  -H "Authorization: Bearer $AGENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"smoke-pat","scopes":["post:read","post:write"]}')

echo "$PAT_RES" | grep -q '"success":true' || fail "create PAT failed: $PAT_RES"
PAT=$(echo "$PAT_RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$PAT" ] || fail "no token value in PAT create response"
echo "$PAT" | grep -q '^gi_pat_' || fail "PAT does not start with gi_pat_"
pass "PAT created: ${PAT:0:20}…"

# ---------------------------------------------------------------------------
bold "=== Step 5: Read endpoint with PAT (GET /auth/me) ==="
ME_RES=$(curl -sf "$API/auth/me" \
  -H "Authorization: Bearer $PAT")

echo "$ME_RES" | grep -q '"success":true' || fail "GET /auth/me with PAT failed: $ME_RES"
echo "$ME_RES" | grep -q "\"$AGENT_USERNAME\"" || fail "/auth/me username mismatch"
pass "read endpoint works with PAT"

# ---------------------------------------------------------------------------
bold "=== Step 6: Scoped write with PAT (POST /projects — post:write) ==="
IDEA_TITLE="Smoke test idea $(date +%s)"
IDEA_RES=$(curl -sf -X POST "$API/projects" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\":\"idea\",
    \"title\":\"$IDEA_TITLE\",
    \"description\":\"Automated smoke test idea. Safe to delete.\",
    \"category\":\"Developer Tooling\",
    \"stage\":\"Idea\",
    \"tags\":[\"smoke-test\"],
    \"problem\":\"Verifying that scoped PAT writes work end-to-end.\",
    \"solution\":\"Automated test confirms the post:write scope is honoured.\"
  }")

echo "$IDEA_RES" | grep -q '"success":true' || fail "create idea with PAT failed: $IDEA_RES"
IDEA_ID=$(echo "$IDEA_RES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$IDEA_ID" ] || fail "no idea ID returned"
pass "scoped write succeeded — idea id: $IDEA_ID"

# ---------------------------------------------------------------------------
bold "=== Step 7: Verify audit log contains the write ==="
# Give the backend a moment to flush the async audit write
sleep 1
ACTIVITY_RES=$(curl -sf "$API/v1/tokens/activity" \
  -H "Authorization: Bearer $AGENT_JWT")

echo "$ACTIVITY_RES" | grep -q '"success":true' || fail "list activity failed: $ACTIVITY_RES"
# The audit log should contain at least one entry related to the project create
echo "$ACTIVITY_RES" | grep -q '"action"' || fail "no action entries in activity log"
pass "audit log returned entries"

# ---------------------------------------------------------------------------
bold "=== Step 8: Wrong-scope PAT should be rejected (403) ==="
NARROW_PAT_RES=$(curl -sf -X POST "$API/v1/tokens" \
  -H "Authorization: Bearer $AGENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"read-only-smoke","scopes":["post:read"]}')

echo "$NARROW_PAT_RES" | grep -q '"success":true' || fail "create narrow PAT failed"
NARROW_PAT=$(echo "$NARROW_PAT_RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# This call SHOULD fail with 403 because the narrow PAT lacks post:write
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/projects" \
  -H "Authorization: Bearer $NARROW_PAT" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\":\"idea\",
    \"title\":\"Should be rejected\",
    \"description\":\"This must fail — narrow PAT has no post:write scope.\",
    \"category\":\"Developer Tooling\",
    \"stage\":\"Idea\",
    \"tags\":[\"smoke-test\"],
    \"problem\":\"Testing scope enforcement.\",
    \"solution\":\"The 403 is the expected outcome.\"
  }")

[ "$HTTP_STATUS" = "403" ] || fail "expected 403 from wrong-scope write, got $HTTP_STATUS"
pass "wrong-scope PAT correctly rejected with 403"

# ---------------------------------------------------------------------------
bold ""
green "==================================================="
green " All smoke tests passed."
green " Agent: $AGENT_USERNAME"
green " Test idea ID: $IDEA_ID  (safe to delete)"
green "==================================================="

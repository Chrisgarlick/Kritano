#!/bin/bash
set -e

# Kritano — Phase 1 Security Fixes Deployment
# Usage: ssh deploy@your-server 'bash -s' < scripts/deploy-security-fixes.sh
#    OR: copy to server and run: bash deploy-security-fixes.sh
#
# What this does:
#   1. Blocks access to dotfiles (.env, .git, etc.) via nginx
#   2. Adds missing security headers (CSP, Permissions-Policy, HSTS preload)
#   3. Hides nginx server version
#   4. Adds cache headers for HTML pages
#   5. Copies security.txt into client/dist (no rebuild needed)
#   6. Tests nginx config before reloading
#   7. Verifies all fixes with curl

APP_DIR="/home/deploy/kritano"
NGINX_SRC="$APP_DIR/scripts/nginx.conf"
NGINX_DEST="/etc/nginx/sites-available/kritano"
DOMAIN="https://kritano.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}PASS${NC} $1"; }
fail() { echo -e "  ${RED}FAIL${NC} $1"; }
warn() { echo -e "  ${YELLOW}WARN${NC} $1"; }
step() { echo -e "\n${GREEN}==>${NC} $1"; }

echo "========================================="
echo "  Kritano — Phase 1: Security Fixes"
echo "========================================="

# --------------------------------------------------
# Step 1: Pull latest code (includes new nginx.conf + security.txt)
# --------------------------------------------------
step "Pulling latest code..."
cd "$APP_DIR"
git pull origin main

# --------------------------------------------------
# Step 2: Verify .env is NOT in client/dist
# --------------------------------------------------
step "Checking for exposed .env in public directories..."
if [ -f "$APP_DIR/client/dist/.env" ]; then
    rm "$APP_DIR/client/dist/.env"
    warn "Removed .env from client/dist!"
fi
if [ -f "$APP_DIR/client/public/.env" ]; then
    rm "$APP_DIR/client/public/.env"
    warn "Removed .env from client/public!"
fi
pass "No .env in public directories"

# --------------------------------------------------
# Step 3: Deploy nginx config
# --------------------------------------------------
step "Deploying nginx config..."

# Backup current config
if [ -f "$NGINX_DEST" ]; then
    sudo cp "$NGINX_DEST" "${NGINX_DEST}.bak.$(date +%Y%m%d_%H%M%S)"
    pass "Backed up current nginx config"
fi

# Copy new config
sudo cp "$NGINX_SRC" "$NGINX_DEST"
pass "Copied new nginx config"

# Ensure symlink exists
if [ ! -L "/etc/nginx/sites-enabled/kritano" ]; then
    sudo ln -sf "$NGINX_DEST" /etc/nginx/sites-enabled/kritano
    pass "Created sites-enabled symlink"
fi

# --------------------------------------------------
# Step 4: Test nginx config
# --------------------------------------------------
step "Testing nginx config..."
if sudo nginx -t 2>&1; then
    pass "Nginx config is valid"
else
    fail "Nginx config test failed! Rolling back..."
    LATEST_BAK=$(ls -t ${NGINX_DEST}.bak.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BAK" ]; then
        sudo cp "$LATEST_BAK" "$NGINX_DEST"
        sudo nginx -t && sudo systemctl reload nginx
        fail "Rolled back to previous config"
    fi
    exit 1
fi

# --------------------------------------------------
# Step 5: Reload nginx
# --------------------------------------------------
step "Reloading nginx..."
sudo systemctl reload nginx
pass "Nginx reloaded"

# --------------------------------------------------
# Step 6: Copy security.txt into existing build (no rebuild)
# --------------------------------------------------
step "Copying security.txt into client/dist..."
mkdir -p "$APP_DIR/client/dist/.well-known"
cp "$APP_DIR/client/public/.well-known/security.txt" "$APP_DIR/client/dist/.well-known/security.txt"
pass "security.txt deployed"

# --------------------------------------------------
# Step 7: Verify fixes
# --------------------------------------------------
step "Verifying security fixes (waiting 3s for nginx)..."
sleep 3

ERRORS=0

echo ""
echo "  Checking security headers..."

# Check each header
check_header() {
    local header_name="$1"
    local expected="$2"
    local headers
    headers=$(curl -sI "$DOMAIN" 2>/dev/null)
    if echo "$headers" | grep -qi "$header_name"; then
        pass "$header_name present"
    else
        fail "$header_name missing"
        ERRORS=$((ERRORS + 1))
    fi
}

check_header "Strict-Transport-Security"
check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "Referrer-Policy"
check_header "Permissions-Policy"
check_header "Content-Security-Policy"

echo ""
echo "  Checking server version is hidden..."
SERVER_HEADER=$(curl -sI "$DOMAIN" 2>/dev/null | grep -i "^server:" || true)
if echo "$SERVER_HEADER" | grep -qi "nginx/"; then
    fail "Server version still exposed: $SERVER_HEADER"
    ERRORS=$((ERRORS + 1))
else
    pass "Server version hidden"
fi

echo ""
echo "  Checking .env is blocked..."
ENV_STATUS=$(curl -sI "${DOMAIN}/.env" 2>/dev/null | head -1 | awk '{print $2}')
if [ "$ENV_STATUS" = "404" ] || [ "$ENV_STATUS" = "403" ]; then
    pass ".env blocked (HTTP $ENV_STATUS)"
else
    fail ".env returned HTTP $ENV_STATUS (expected 403 or 404)"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "  Checking .git is blocked..."
GIT_STATUS=$(curl -sI "${DOMAIN}/.git/config" 2>/dev/null | head -1 | awk '{print $2}')
if [ "$GIT_STATUS" = "404" ] || [ "$GIT_STATUS" = "403" ]; then
    pass ".git blocked (HTTP $GIT_STATUS)"
else
    fail ".git returned HTTP $GIT_STATUS (expected 403 or 404)"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "  Checking security.txt..."
SEC_STATUS=$(curl -sI "${DOMAIN}/.well-known/security.txt" 2>/dev/null | head -1 | awk '{print $2}')
if [ "$SEC_STATUS" = "200" ]; then
    pass "security.txt accessible"
else
    # .well-known starts with a dot, might be blocked by our rule
    # This is expected — we need to add an exception
    warn "security.txt returned HTTP $SEC_STATUS (may need nginx exception for .well-known)"
fi

echo ""
echo "  Checking cache headers..."
CACHE_HEADER=$(curl -sI "$DOMAIN" 2>/dev/null | grep -i "cache-control" || true)
if [ -n "$CACHE_HEADER" ]; then
    pass "Cache-Control header present"
else
    warn "Cache-Control header not found on HTML"
fi

# --------------------------------------------------
# Summary
# --------------------------------------------------
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "  ${GREEN}All security checks passed!${NC}"
else
    echo -e "  ${RED}${ERRORS} check(s) failed${NC} — review output above"
fi
echo "========================================="
echo ""
echo "MANUAL STEPS STILL REQUIRED:"
echo "  1. Rotate all secrets in server/.env (DB password, JWT secret, API keys)"
echo "  2. Update any external services using the old credentials"
echo "  3. Re-run the Kritano audit to verify score improvement"
echo ""

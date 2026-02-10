#!/bin/bash
# Dynamic Spec-Kit Setup Script
# Automatically detects repository type and installs/updates Spec-Kit from canonical GitHub source
# Version: 2.3.4 (Personal Fork)
# Commands: 13 active prompts | Templates: 4 | Workflows: 1
# Latest: Sync workflow now pushes to sync branch, triggers aggregation via repository_dispatch
# Structure: Prompts, templates, constitution, workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Canonical sources (personal repo - may be private, needs GITHUB_TOKEN or SPEC_KIT_CONTEXT_TOKEN)
# Note: Direct raw.githubusercontent URLs fail for private repos - API method handles this
# Uses 'sync' branch which contains the latest aggregated content (bypasses main branch protection)
GITHUB_RAW_BASE="https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/sync"
GITHUB_BASE="$GITHUB_RAW_BASE/context"
SPECKIT_URL="$GITHUB_RAW_BASE/SPECKIT.md"
CONSTITUTION_URL="$GITHUB_BASE/memory/constitution.md"
PROMPTS_BASE="$GITHUB_BASE/prompts"
TEMPLATES_BASE="$GITHUB_BASE/templates"
WORKFLOWS_BASE="$GITHUB_BASE/workflows"

# Central context repository (for cross-repo spec sync)
CENTRAL_CONTEXT_REPO="rlerikse/es-spec-kit-context"
CONTEXT_WORKSPACE_PATH="context/workspace"  # Where aggregated specs live

CURRENT_DIR=$(pwd)
INSTALL_LOG=()
UPDATE_LOG=()
ERROR_LOG=()

# ============================================================================
# Utility Functions
# ============================================================================

log_install() {
    INSTALL_LOG+=("$1")
}

log_update() {
    UPDATE_LOG+=("$1")
}

log_error() {
    ERROR_LOG+=("$1")
}

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# Network Check
# ============================================================================

run_network_diagnostics() {
    print_header "Network Diagnostics"
    
    echo "Running comprehensive network tests..."
    echo ""
    
    # Test 1: DNS resolution
    echo -e "${CYAN}1. DNS Resolution:${NC}"
    if host github.com > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} github.com resolves"
    else
        echo -e "   ${RED}✗${NC} Cannot resolve github.com - DNS issue"
    fi
    
    if host raw.githubusercontent.com > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} raw.githubusercontent.com resolves"
    else
        echo -e "   ${RED}✗${NC} Cannot resolve raw.githubusercontent.com - DNS issue"
    fi
    
    if host api.github.com > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} api.github.com resolves"
    else
        echo -e "   ${RED}✗${NC} Cannot resolve api.github.com - DNS issue"
    fi
    echo ""
    
    # Test 2: HTTPS connectivity
    echo -e "${CYAN}2. HTTPS Connectivity:${NC}"
    local GITHUB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://github.com" 2>/dev/null || echo "000")
    if [ "$GITHUB_CODE" = "200" ] || [ "$GITHUB_CODE" = "301" ] || [ "$GITHUB_CODE" = "302" ]; then
        echo -e "   ${GREEN}✓${NC} github.com reachable (HTTP $GITHUB_CODE)"
    else
        echo -e "   ${RED}✗${NC} github.com unreachable (HTTP $GITHUB_CODE)"
    fi
    
    local RAW_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://raw.githubusercontent.com" 2>/dev/null || echo "000")
    if [ "$RAW_CODE" != "000" ]; then
        echo -e "   ${GREEN}✓${NC} raw.githubusercontent.com reachable (HTTP $RAW_CODE)"
    else
        echo -e "   ${RED}✗${NC} raw.githubusercontent.com unreachable"
    fi
    echo ""
    
    # Test 3: Test actual download URL
    echo -e "${CYAN}3. Download URL Test:${NC}"
    local TEST_URL="$CONSTITUTION_URL"
    echo -e "   Testing: $TEST_URL"
    local DL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$TEST_URL" 2>/dev/null || echo "000")
    echo -e "   HTTP response: $DL_CODE"
    case "$DL_CODE" in
        200) echo -e "   ${GREEN}✓${NC} URL accessible" ;;
        404) echo -e "   ${RED}✗${NC} 404 Not Found - file doesn't exist at URL" ;;
        403) echo -e "   ${RED}✗${NC} 403 Forbidden - need authentication" ;;
        000) echo -e "   ${RED}✗${NC} Connection failed - network issue" ;;
        *)   echo -e "   ${YELLOW}?${NC} Unexpected response: $DL_CODE" ;;
    esac
    echo ""
    
    # Test 4: GitHub token
    echo -e "${CYAN}4. GitHub Token:${NC}"
    local AUTH_TOKEN=""
    if [ -n "$SPEC_KIT_CONTEXT_TOKEN" ]; then
        AUTH_TOKEN="$SPEC_KIT_CONTEXT_TOKEN"
        echo -e "   ${GREEN}✓${NC} SPEC_KIT_CONTEXT_TOKEN is set"
        echo -e "   Token prefix: ${AUTH_TOKEN:0:10}..."
    elif [ -n "$GITHUB_TOKEN" ]; then
        AUTH_TOKEN="$GITHUB_TOKEN"
        echo -e "   ${GREEN}✓${NC} GITHUB_TOKEN is set"
        echo -e "   Token prefix: ${AUTH_TOKEN:0:10}..."
    fi
    
    if [ -n "$AUTH_TOKEN" ]; then
        # Test token validity
        local TOKEN_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: token $AUTH_TOKEN" \
            "https://api.github.com/user" 2>/dev/null || echo "000")
        case "$TOKEN_TEST" in
            200) echo -e "   ${GREEN}✓${NC} Token is valid" ;;
            401) echo -e "   ${RED}✗${NC} Token is invalid or expired" ;;
            403) echo -e "   ${YELLOW}!${NC} Token valid but rate limited or lacks scope" ;;
            000) echo -e "   ${RED}✗${NC} Cannot reach API to validate token" ;;
            *)   echo -e "   ${YELLOW}?${NC} Unexpected response: $TOKEN_TEST" ;;
        esac
    else
        echo -e "   ${YELLOW}!${NC} No token set (SPEC_KIT_CONTEXT_TOKEN or GITHUB_TOKEN)"
        echo -e "   Private repo downloads will fail without token"
    fi
    echo ""
    
    # Test 5: Try actual download
    echo -e "${CYAN}5. Test Download:${NC}"
    local TMP_FILE="/tmp/speckit_test_$$"
    echo -e "   Attempting download to $TMP_FILE..."
    
    if curl -fsSL -o "$TMP_FILE" "$TEST_URL" 2>/dev/null; then
        local FILE_SIZE=$(wc -c < "$TMP_FILE" 2>/dev/null || echo "0")
        echo -e "   ${GREEN}✓${NC} Direct download succeeded ($FILE_SIZE bytes)"
        rm -f "$TMP_FILE"
    else
        echo -e "   ${RED}✗${NC} Direct download failed (expected for private repos)"
        
        local AUTH_TOKEN="${SPEC_KIT_CONTEXT_TOKEN:-$GITHUB_TOKEN}"
        if [ -n "$AUTH_TOKEN" ]; then
            echo -e "   Trying API download..."
            # Parse URL for API
            local PATH_PART=$(echo "$TEST_URL" | sed 's|https://raw.githubusercontent.com/||')
            local OWNER=$(echo "$PATH_PART" | cut -d'/' -f1)
            local REPO=$(echo "$PATH_PART" | cut -d'/' -f2)
            local BRANCH=$(echo "$PATH_PART" | cut -d'/' -f3)
            local FILE_PATH=$(echo "$PATH_PART" | cut -d'/' -f4-)
            local API_URL="https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}"
            
            echo -e "   API URL: $API_URL"
            local HEADERS_FILE=$(mktemp)
            local API_RESP=$(curl -sS -D "$HEADERS_FILE" -H "Authorization: token $AUTH_TOKEN" "$API_URL" 2>/dev/null)
            
            # Check for SSO requirement (must match header line start, not access-control-expose-headers)
            if grep -Eqi "^X-GitHub-SSO:" "$HEADERS_FILE" 2>/dev/null; then
                echo -e "   ${RED}✗${NC} SAML SSO authorization required"
                echo -e "   ${YELLOW}Authorize your token at: https://github.com/settings/tokens${NC}"
                rm -f "$HEADERS_FILE"
            elif echo "$API_RESP" | jq -e '.content' > /dev/null 2>&1; then
                echo -e "   ${GREEN}✓${NC} API download would succeed"
                rm -f "$HEADERS_FILE"
            else
                echo -e "   ${RED}✗${NC} API download failed"
                if echo "$API_RESP" | jq -e '.message' > /dev/null 2>&1; then
                    local ERR_MSG=$(echo "$API_RESP" | jq -r '.message')
                    echo -e "   Error: $ERR_MSG"
                    if [ "$ERR_MSG" = "Not Found" ]; then
                        echo -e "   ${YELLOW}Tip: Your token may need SSO authorization${NC}"
                    fi
                fi
                rm -f "$HEADERS_FILE"
            fi
        fi
    fi
    rm -f "$TMP_FILE" 2>/dev/null
    echo ""
}

check_network() {
    print_header "Network Connectivity Check"
    
    # Run diagnostics if DEBUG is enabled
    if [ "$DEBUG" = "1" ]; then
        run_network_diagnostics
    fi
    
    print_step "Verifying network access..."
    
    # Quick connectivity test
    local QUICK_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "https://raw.githubusercontent.com" 2>/dev/null || echo "000")
    
    if [ "$QUICK_TEST" = "000" ]; then
        print_error "Cannot reach GitHub - network issue"
        echo ""
        echo -e "${YELLOW}Run with DEBUG=1 for detailed diagnostics:${NC}"
        echo -e "${YELLOW}  DEBUG=1 ./speckit.sh${NC}"
        echo ""
        exit 1
    fi
    
    # Check if authentication token is set (enables private repo access)
    local AUTH_TOKEN=""
    if [ -n "$SPEC_KIT_CONTEXT_TOKEN" ]; then
        AUTH_TOKEN="$SPEC_KIT_CONTEXT_TOKEN"
        print_success "SPEC_KIT_CONTEXT_TOKEN is set"
    elif [ -n "$GITHUB_TOKEN" ]; then
        AUTH_TOKEN="$GITHUB_TOKEN"
        print_success "GITHUB_TOKEN is set"
    fi
    
    if [ -n "$AUTH_TOKEN" ]; then
        # Test token validity with API call
        local TOKEN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: token $AUTH_TOKEN" \
            "https://api.github.com/user" 2>/dev/null || echo "000")
        if [ "$TOKEN_CHECK" = "200" ]; then
            print_success "Authentication token is valid"
        else
            print_warning "Token may be invalid (HTTP $TOKEN_CHECK)"
        fi
    else
        print_warning "No auth token set - using public access only"
        echo -e "  ${YELLOW}Set SPEC_KIT_CONTEXT_TOKEN or GITHUB_TOKEN for private repos${NC}"
    fi
    
    # Test the actual source URL
    print_step "Testing download source..."
    local SOURCE_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$CONSTITUTION_URL" 2>/dev/null || echo "000")
    
    if [ "$SOURCE_TEST" = "200" ]; then
        print_success "Download source accessible"
        return 0
    elif [ "$SOURCE_TEST" = "404" ]; then
        if [ -n "$AUTH_TOKEN" ]; then
            # Private repo - 404 from raw URL is expected, verify API access works
            # Test actual repo access via API (not just token validity)
            local REPO_CHECK_FILE=$(mktemp)
            local REPO_CHECK_HEADERS=$(mktemp)
            curl -sS \
                -H "Authorization: token $AUTH_TOKEN" \
                -D "$REPO_CHECK_HEADERS" \
                "https://api.github.com/repos/${CENTRAL_CONTEXT_REPO}" > "$REPO_CHECK_FILE" 2>/dev/null
            local REPO_CHECK_EXIT=$?
            
            # Check for SSO requirement in headers (must match header line start, not access-control-expose-headers)
            if grep -Eqi "^X-GitHub-SSO:" "$REPO_CHECK_HEADERS" 2>/dev/null; then
                local SSO_URL=$(grep -Ei "^X-GitHub-SSO:" "$REPO_CHECK_HEADERS" | sed 's/.*url=\([^;]*\).*/\1/')
                print_error "SAML SSO Authorization Required"
                echo ""
                echo -e "${YELLOW}Your token needs SSO authorization:${NC}"
                echo "  1. Go to: https://github.com/settings/tokens"
                echo "  2. Find your token and click 'Configure SSO'"
                echo "  3. Click 'Authorize' for your organization"
                echo "  4. Re-run this script"
                echo ""
                rm -f "$REPO_CHECK_FILE" "$REPO_CHECK_HEADERS"
                exit 1
            fi
            
            # Check if repo is accessible
            if jq -e '.full_name' "$REPO_CHECK_FILE" > /dev/null 2>&1; then
                print_success "Private repo detected - API access verified"
                rm -f "$REPO_CHECK_FILE" "$REPO_CHECK_HEADERS"
                return 0
            else
                # Get error message
                local REPO_ERR=$(jq -r '.message // "Unknown error"' "$REPO_CHECK_FILE" 2>/dev/null)
                rm -f "$REPO_CHECK_FILE" "$REPO_CHECK_HEADERS"
                
                if [ "$REPO_ERR" = "Not Found" ]; then
                    print_error "Cannot access repository via API"
                    echo ""
                    echo -e "${YELLOW}Possible causes:${NC}"
                    echo "  1. Token needs SSO authorization"
                    echo "  2. Token doesn't have 'repo' scope"
                    echo "  3. You don't have access to this repository"
                    echo ""
                    echo -e "${YELLOW}To authorize SSO:${NC}"
                    echo "  1. Go to: https://github.com/settings/tokens"
                    echo "  2. Find your token and click 'Configure SSO'"
                    echo "  3. Click 'Authorize' for your organization"
                    echo ""
                    exit 1
                else
                    print_error "API error: $REPO_ERR"
                    exit 1
                fi
            fi
        else
            print_error "Source files not found (404)"
            echo -e "  ${YELLOW}URL: $CONSTITUTION_URL${NC}"
            echo -e "  ${YELLOW}Set GITHUB_TOKEN for private repo access${NC}"
        fi
    elif [ "$SOURCE_TEST" = "403" ]; then
        print_error "Access forbidden (403) - authentication required"
        echo -e "  ${YELLOW}Set GITHUB_TOKEN for private repo access${NC}"
    else
        print_warning "Source returned HTTP $SOURCE_TEST"
    fi
    
    echo ""
    echo -e "${YELLOW}Run with DEBUG=1 for detailed diagnostics:${NC}"
    echo -e "${YELLOW}  DEBUG=1 ./speckit.sh${NC}"
    echo ""
}

# ============================================================================
# Repository Type Detection
# ============================================================================

detect_repo_type() {
    # Check if directory is empty
    if [ -z "$(ls -A "$CURRENT_DIR" 2>/dev/null)" ]; then
        echo "EMPTY"
        return
    fi
    
    # Count subdirectories that look like repos (have .git or specs/)
    REPO_COUNT=0
    HAS_SPECS=false
    HAS_SPECKIT=false
    
    for DIR in "$CURRENT_DIR"/*; do
        if [ -d "$DIR" ]; then
            DIRNAME=$(basename "$DIR")
            
            # Skip hidden directories and common directories
            if [[ "$DIRNAME" == .* ]] || [[ "$DIRNAME" == "node_modules" ]] || [[ "$DIRNAME" == "scripts" ]]; then
                continue
            fi
            
            # Check if directory has .git (individual repo in monorepo)
            if [ -d "$DIR/.git" ]; then
                REPO_COUNT=$((REPO_COUNT + 1))
            fi
            
            # Check if directory has specs (looks like a project)
            if [ -d "$DIR/specs" ]; then
                HAS_SPECS=true
            fi
        fi
    done
    
    # Check for Spec-Kit infrastructure at current level
    if [ -d ".specify" ] || [ -f "SPECKIT.md" ]; then
        HAS_SPECKIT=true
    fi
    
    # Determine type
    if [ $REPO_COUNT -gt 1 ]; then
        echo "MONOREPO"
    elif [ -d ".git" ]; then
        echo "SINGLE_REPO"
    elif [ "$HAS_SPECKIT" = true ] || [ "$HAS_SPECS" = true ]; then
        echo "SINGLE_REPO"
    else
        echo "EMPTY"
    fi
}

# ============================================================================
# Download Functions (with GitHub API auth for private repos)
# ============================================================================

# Debug mode - set DEBUG=1 to enable verbose output
DEBUG=${DEBUG:-0}

debug_log() {
    if [ "$DEBUG" = "1" ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

# Download a file from GitHub with comprehensive error handling
download_file() {
    local URL=$1
    local DEST=$2
    local DESC=$3
    
    debug_log "Attempting to download: $DESC"
    debug_log "  URL: $URL"
    debug_log "  Destination: $DEST"
    
    # Ensure destination directory exists
    local DEST_DIR=$(dirname "$DEST")
    if [ ! -d "$DEST_DIR" ]; then
        debug_log "  Creating directory: $DEST_DIR"
        mkdir -p "$DEST_DIR"
    fi
    
    # Extract path components from raw URL
    # Format: https://raw.githubusercontent.com/owner/repo/branch/path
    local PATH_PART=$(echo "$URL" | sed 's|https://raw.githubusercontent.com/||')
    local OWNER=$(echo "$PATH_PART" | cut -d'/' -f1)
    local REPO=$(echo "$PATH_PART" | cut -d'/' -f2)
    local BRANCH=$(echo "$PATH_PART" | cut -d'/' -f3)
    local FILE_PATH=$(echo "$PATH_PART" | cut -d'/' -f4-)
    
    debug_log "  Parsed - Owner: $OWNER, Repo: $REPO, Branch: $BRANCH"
    debug_log "  File path: $FILE_PATH"
    
    # ========== Method 1: Direct curl download ==========
    debug_log "  Method 1: Direct curl download..."
    
    local HTTP_CODE
    local HTTP_CODE_FILE=$(mktemp)
    
    # Use separate file for HTTP code to avoid mixing with error output
    curl -sSL -w "%{http_code}" -o "$DEST" "$URL" 2>/dev/null > "$HTTP_CODE_FILE"
    local CURL_EXIT=$?
    HTTP_CODE=$(cat "$HTTP_CODE_FILE" 2>/dev/null || echo "000")
    rm -f "$HTTP_CODE_FILE"
    
    debug_log "  Curl exit code: $CURL_EXIT"
    debug_log "  HTTP code: $HTTP_CODE"
    
    # Success: exit code 0, valid HTTP 200, and file has content
    if [ $CURL_EXIT -eq 0 ] && [ "$HTTP_CODE" = "200" ] && [ -s "$DEST" ]; then
        print_success "Downloaded $DESC"
        return 0
    fi
    
    # Clean up failed download
    rm -f "$DEST" 2>/dev/null
    
    # Log the error details
    if [ $CURL_EXIT -ne 0 ]; then
        debug_log "  Curl failed with exit code $CURL_EXIT"
        case $CURL_EXIT in
            6)  debug_log "  Error: Could not resolve host" ;;
            7)  debug_log "  Error: Failed to connect to host" ;;
            22) debug_log "  Error: HTTP error (404, 403, etc.)" ;;
            28) debug_log "  Error: Operation timeout" ;;
            35) debug_log "  Error: SSL connect error" ;;
            56) debug_log "  Error: Failure in receiving network data" ;;
            *)  debug_log "  Error: Unknown curl error" ;;
        esac
    fi
    
    if [ "$HTTP_CODE" = "404" ]; then
        debug_log "  Error: File not found at URL (404)"
    elif [ "$HTTP_CODE" = "403" ]; then
        debug_log "  Error: Access forbidden (403) - may need authentication"
    elif [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "000" ]; then
        debug_log "  Error: Unexpected HTTP status: $HTTP_CODE"
    fi
    
    # ========== Method 2: Authenticated GitHub API ==========
    # Use SPEC_KIT_CONTEXT_TOKEN if set, otherwise fall back to GITHUB_TOKEN
    local AUTH_TOKEN="${SPEC_KIT_CONTEXT_TOKEN:-$GITHUB_TOKEN}"
    
    if [ -n "$AUTH_TOKEN" ]; then
        debug_log "  Method 2: GitHub API with token..."
        
        local API_URL="https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}"
        debug_log "  API URL: $API_URL"
        
        # Use temp file to avoid issues with newlines/control chars in base64 content
        local TEMP_FILE=$(mktemp)
        local HTTP_FILE=$(mktemp)
        
        # Download to temp file, capture HTTP code separately
        curl -sSL -w "%{http_code}" \
            -H "Authorization: token $AUTH_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -o "$TEMP_FILE" \
            "$API_URL" 2>/dev/null > "$HTTP_FILE"
        local API_EXIT=$?
        local API_HTTP=$(cat "$HTTP_FILE" 2>/dev/null || echo "000")
        
        debug_log "  API exit code: $API_EXIT"
        debug_log "  API HTTP code: $API_HTTP"
        
        if [ $API_EXIT -eq 0 ] && [ "$API_HTTP" = "200" ] && [ -s "$TEMP_FILE" ]; then
            # Check if response is valid JSON with content field
            if jq -e '.content' "$TEMP_FILE" > /dev/null 2>&1; then
                jq -r '.content' "$TEMP_FILE" | base64 -d > "$DEST" 2>/dev/null
                if [ $? -eq 0 ] && [ -s "$DEST" ]; then
                    rm -f "$TEMP_FILE" "$HTTP_FILE"
                    print_success "Downloaded $DESC (via API)"
                    return 0
                else
                    debug_log "  Error: Failed to decode base64 content"
                fi
            else
                debug_log "  Error: API response missing 'content' field"
            fi
        elif [ $API_EXIT -eq 0 ] && [ -s "$TEMP_FILE" ]; then
            # API returned non-200 status but we have a response body
            debug_log "  API returned HTTP $API_HTTP"
            if jq -e '.message' "$TEMP_FILE" > /dev/null 2>&1; then
                local ERR_MSG=$(jq -r '.message' "$TEMP_FILE")
                debug_log "  API error message: $ERR_MSG"
                
                # Check for SAML SSO error
                if echo "$ERR_MSG" | grep -qi "SAML"; then
                    print_error "SAML SSO Authorization Required"
                    echo ""
                    echo "Your token needs SSO authorization:"
                    echo "  1. Go to https://github.com/settings/tokens"
                    echo "  2. Find your token and click 'Configure SSO'"
                    echo "  3. Click 'Authorize' for your organization"
                    echo "  4. Re-run this script"
                    echo ""
                    rm -f "$TEMP_FILE" "$HTTP_FILE"
                    return 1
                fi
                
                # Check for "Not Found" (usually 404)
                if [ "$ERR_MSG" = "Not Found" ]; then
                    debug_log "  Error: File not found in repository (404)"
                fi
                
                # Check for Bad credentials
                if echo "$ERR_MSG" | grep -qi "Bad credentials"; then
                    print_error "Invalid GitHub token"
                    echo "  Your SPEC_KIT_CONTEXT_TOKEN or GITHUB_TOKEN is invalid."
                    echo "  Please check your token and try again."
                    rm -f "$TEMP_FILE" "$HTTP_FILE"
                    return 1
                fi
            fi
        else
            debug_log "  API request failed (exit code: $API_EXIT)"
        fi
        
        rm -f "$TEMP_FILE" "$HTTP_FILE"
    else
        debug_log "  Method 2: Skipped (no GITHUB_TOKEN set)"
    fi
    
    # ========== All methods failed ==========
    print_error "Failed to download $DESC"
    echo -e "  ${RED}URL: $URL${NC}"
    
    # Show diagnostic info
    if [ "$DEBUG" != "1" ]; then
        echo -e "  ${YELLOW}Run with DEBUG=1 for detailed error info:${NC}"
        echo -e "  ${YELLOW}  DEBUG=1 ./speckit.sh${NC}"
    fi
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "  ${YELLOW}Tip: Set SPEC_KIT_CONTEXT_TOKEN or GITHUB_TOKEN for private repo access${NC}"
    fi
    
    log_error "Download failed: $DESC ($URL)"
    return 1
}

download_prompts() {
    print_step "Downloading Spec-Kit prompts from GitHub (13 commands)..."
    
    mkdir -p .github/prompts
    
    # All 13 Spec-Kit prompts
    local PROMPTS=(
        # Core workflow (6)
        "speckit.specify.prompt.md"       # Create specifications
        "speckit.clarify.prompt.md"       # Clarify requirements
        "speckit.plan.prompt.md"          # Generate implementation plan
        "speckit.tasks.prompt.md"         # Break down into tasks
        "speckit.analyze.prompt.md"       # Validate against constitution
        "speckit.implement.prompt.md"     # Execute implementation
        # Epic management (1)
        "speckit.epic.prompt.md"          # Create epic specifications
        # Quick start (1)
        "speckit.quickstart.prompt.md"    # Combined spec+plan+tasks
        # Constitution management (1)
        "speckit.constitution.prompt.md"  # Constitution audit/generate/update
        # Utilities (4)
        "speckit.validate.prompt.md"      # Validate spec structure
        "speckit.retro.prompt.md"         # Retroactive specs + conventions
        "speckit.checklist.prompt.md"     # Generate checklists
        "speckit.report.prompt.md"        # Generate reports
    )
    
    local SUCCESS=0
    local FAILED=0
    
    for PROMPT in "${PROMPTS[@]}"; do
        if download_file "$PROMPTS_BASE/$PROMPT" ".github/prompts/$PROMPT" "$PROMPT"; then
            log_install "Prompt: $PROMPT"
            SUCCESS=$((SUCCESS + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    done
    
    echo ""
    print_success "Downloaded $SUCCESS prompts ($FAILED failed)"
}

download_templates() {
    print_step "Downloading Spec-Kit templates from GitHub..."
    
    mkdir -p .specify/templates
    
    local TEMPLATES=(
        "spec-template.md"
        "plan-template.md"
        "tasks-template.md"
        "checklist-template.md"
    )
    
    local SUCCESS=0
    local FAILED=0
    
    for TEMPLATE in "${TEMPLATES[@]}"; do
        if download_file "$TEMPLATES_BASE/$TEMPLATE" ".specify/templates/$TEMPLATE" "$TEMPLATE"; then
            log_install "Template: $TEMPLATE"
            SUCCESS=$((SUCCESS + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    done
    
    echo ""
    print_success "Downloaded $SUCCESS templates ($FAILED failed)"
}

download_workflows() {
    print_step "Downloading GitHub Actions workflow for context sync..."
    
    mkdir -p .github/workflows
    
    # Only sync-spec-context.yml is needed - it pushes specs to central repo
    if download_file "$WORKFLOWS_BASE/sync-spec-context.yml" ".github/workflows/sync-spec-context.yml" "sync-spec-context.yml"; then
        log_install "Workflow: sync-spec-context.yml"
        echo ""
        print_success "Downloaded workflow"
        print_warning "Note: Workflow requires SPEC_KIT_CONTEXT_TOKEN secret in GitHub"
        echo -e "  ${YELLOW}See: https://github.com/rlerikse/es-spec-kit-context${NC}"
    else
        echo ""
        print_error "Failed to download workflow"
    fi
}

# Pull cross-repo context from central spec-kit-context repository
pull_cross_repo_context() {
    print_step "Pulling cross-repo context from central repository..."
    
    mkdir -p .specify/workspace
    
    # Use raw URLs that download_file() can parse
    local RAW_BASE="https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/sync"
    
    # Use | as delimiter (not : which appears in URLs)
    local CONTEXT_FILES=(
        "$RAW_BASE/context/workspace/all-specs.md|.specify/workspace/all-specs.md|all-specs.md"
        "$RAW_BASE/context/workspace/all-conventions.md|.specify/workspace/all-conventions.md|all-conventions.md"
        "$RAW_BASE/context/workspace/repo-index.json|.specify/workspace/repo-index.json|repo-index.json"
    )
    
    local SUCCESS=0
    local FAILED=0
    
    for FILE_PAIR in "${CONTEXT_FILES[@]}"; do
        IFS='|' read -r SRC_URL DEST_PATH FILE_NAME <<< "$FILE_PAIR"
        
        if download_file "$SRC_URL" "$DEST_PATH" "$FILE_NAME"; then
            log_install "Context: $FILE_NAME"
            SUCCESS=$((SUCCESS + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    done
    
    echo ""
    if [ $SUCCESS -gt 0 ]; then
        print_success "Downloaded cross-repo context ($SUCCESS files)"
        
        # Show summary of what's in the context
        if [ -f ".specify/workspace/repo-index.json" ]; then
            local REPO_COUNT=$(grep -c '"name"' .specify/workspace/repo-index.json 2>/dev/null || echo "0")
            local SPEC_LINES=$(grep -c '"id"' .specify/workspace/repo-index.json 2>/dev/null || echo "0")
            echo -e "  ${CYAN}→ $REPO_COUNT repositories, ~$SPEC_LINES specifications indexed${NC}"
            echo -e "  ${CYAN}→ Copilot now has context from all Spec-Kit repos${NC}"
        fi
    else
        print_warning "Could not download cross-repo context"
        echo -e "  ${YELLOW}Context sync handled by GitHub Actions (sync-spec-context.yml)${NC}"
    fi
}

download_speckit_md() {
    print_step "Downloading SPECKIT.md from GitHub..."
    
    if download_file "$SPECKIT_URL" "SPECKIT.md" "SPECKIT.md"; then
        log_install "Documentation: SPECKIT.md"
        
        # Extract version
        VERSION=$(grep -o 'v[0-9][0-9.]*' SPECKIT.md | head -n 1 || echo "")
        if [ -n "$VERSION" ]; then
            print_success "SPECKIT.md $VERSION downloaded"
        fi
    fi
}

download_constitution() {
    # Only download if constitution doesn't exist
    if [ -f ".specify/memory/constitution.md" ]; then
        print_warning "Constitution already exists - preserving existing file"
        log_install "Constitution: constitution.md (existing, not overwritten)"
        return 0
    fi
    
    print_step "Downloading constitution from GitHub..."
    mkdir -p .specify/memory
    
    if download_file "$CONSTITUTION_URL" ".specify/memory/constitution.md" "constitution"; then
        log_install "Constitution: constitution.md"
    fi
}

# ============================================================================
# Installation Functions
# ============================================================================

install_workspace() {
    print_header "Installing Spec-Kit for Workspace (Multi-Repo)"
    
    # Create directory structure
    print_step "Creating workspace directory structure..."
    mkdir -p .specify/memory
    mkdir -p .specify/templates
    mkdir -p .specify/workspace
    mkdir -p .github/prompts
    print_success "Directory structure created"
    
    # Download all components
    download_speckit_md
    download_constitution
    download_prompts
    download_templates
    download_workflows
    
    # Create workspace-level copilot instructions
    print_step "Creating workspace-level GitHub Copilot integration..."
    
    cat > .github/copilot-instructions.md << 'COPILOT_EOF'
# Workspace-Level GitHub Copilot Instructions

This workspace contains multiple repositories managed by Spec-Kit.

## Critical: Prompt Execution Rules

**BEFORE executing ANY `/speckit.*` command:**

1. **STOP** - Do not proceed based on general knowledge
2. **READ** - Open and read the entire `.github/prompts/speckit.{command}.prompt.md` file
3. **FOLLOW** - Execute the prompt's workflow EXACTLY as written, step by step
4. **DO NOT** batch, skip, or combine steps that the prompt defines as sequential/interactive

**Violations to avoid:**
- Improvising workflows instead of reading the prompt
- Batching steps that should be interactive (per-feature, per-item)
- Presenting custom options when the prompt defines specific options
- Assuming you know the workflow without reading the prompt file

**If a prompt says "for each X, do Y" - that means STOP after each X and wait for user input before proceeding to the next X.**

## Critical Constraint: User Decision Approval

**NEVER assume user decisions - ALWAYS prompt for confirmation.**

IF there is EVER a decision required to be made by the user:
- DO NOT assume what the user wants
- ALWAYS prompt the user with clear options
- WAIT for explicit user response before proceeding
- Feel free to suggest your recommendation
- But NEVER proceed without user confirmation

This applies to ALL decisions including:
- Which files to modify or create
- Implementation approach choices
- Technology/library selections
- Architecture decisions
- Configuration changes
- Feature scope interpretations

## Enterprise Context

For specifications across all repositories, reference:
- **All Specs**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-specs.md
- **Conventions**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-conventions.md
- **Repo Index**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/repo-index.json

When asked about features in other repositories, check the enterprise context first.

## Constitution

See: `.specify/memory/constitution.md` for non-negotiable quality gates.

All code MUST comply with the constitution.

## Workspace Context

**All Specifications**: See `.specify/workspace/all-specs.md` for complete cross-repo context.

**All Conventions**: See `.specify/workspace/all-conventions.md` for cross-repo coding patterns.

**Repo Index**: See `.specify/workspace/repo-index.json` for structured spec metadata.

**Full Sync Architecture**: Complete spec directories (spec.md, plan.md, tasks.md, contracts/) are synced locally - no auth barriers for AI agents.

## Cross-Repo Features

When implementing features that span multiple repositories:

1. Check `.specify/workspace/all-specs.md` for related specs in other repos
2. Check `.specify/workspace/all-conventions.md` for coding patterns to follow
3. Maintain consistency across services (auth, logging, error handling)
4. Reference existing patterns from other repos where applicable

## Creating New Features

Use Spec-Kit workflow (13 commands available):

**Quick Start (simple features)**:
- `/speckit.quickstart` - Combined spec+plan+tasks in one step

**Full Workflow (complex features)**:
1. `/speckit.specify` - Create specification
2. `/speckit.clarify` - Resolve ambiguities
3. `/speckit.plan` - Generate implementation plan
4. `/speckit.tasks` - Break down into tasks
5. `/speckit.analyze` - Validate against constitution (includes pre-PR check)
6. `/speckit.implement` - Execute implementation

**Constitution & Quality**:
- `/speckit.constitution` - View, audit, generate, or update constitution
- `/speckit.validate` - Validate spec structure and implementation

**Utilities**:
- `/speckit.epic` - Epic status dashboard (queries Jira)
- `/speckit.retro` - Retroactive documentation + convention extraction
- `/speckit.checklist` - Generate quality checklists
- `/speckit.report` - Generate status reports

## Templates

- Spec: `.specify/templates/spec-template.md`
- Plan: `.specify/templates/plan-template.md`
- Tasks: `.specify/templates/tasks-template.md`

COPILOT_EOF
    
    log_install "Copilot: workspace-level instructions"
    print_success "GitHub Copilot integration configured"
    
    echo ""
    print_success "Workspace setup complete!"
}

install_single_repo() {
    print_header "Installing Spec-Kit for Single Repository"
    
    # Create directory structure
    print_step "Creating repository directory structure..."
    mkdir -p .specify/memory
    mkdir -p .specify/templates
    mkdir -p .specify/workspace  # For cross-repo context
    mkdir -p .github/prompts
    mkdir -p specs
    print_success "Directory structure created"
    
    # Download all components
    download_speckit_md
    download_constitution
    download_prompts
    download_templates
    download_workflows
    
    # Pull cross-repo context from central repository
    pull_cross_repo_context
    
    # Create repo-level copilot instructions
    print_step "Creating GitHub Copilot integration..."
    
    REPO_NAME=$(basename "$CURRENT_DIR")
    
    cat > .github/copilot-instructions.md << COPILOT_EOF
# GitHub Copilot Instructions - $REPO_NAME

This repository uses Spec-Kit for specification-driven development.

## Critical: Prompt Execution Rules

**BEFORE executing ANY \`/speckit.*\` command:**

1. **STOP** - Do not proceed based on general knowledge
2. **READ** - Open and read the entire \`.github/prompts/speckit.{command}.prompt.md\` file
3. **FOLLOW** - Execute the prompt's workflow EXACTLY as written, step by step
4. **DO NOT** batch, skip, or combine steps that the prompt defines as sequential/interactive

**Violations to avoid:**
- Improvising workflows instead of reading the prompt
- Batching steps that should be interactive (per-feature, per-item)
- Presenting custom options when the prompt defines specific options
- Assuming you know the workflow without reading the prompt file

**If a prompt says "for each X, do Y" - that means STOP after each X and wait for user input before proceeding to the next X.**

## Critical Constraint: User Decision Approval

**NEVER assume user decisions - ALWAYS prompt for confirmation.**

IF there is EVER a decision required to be made by the user:
- DO NOT assume what the user wants
- ALWAYS prompt the user with clear options
- WAIT for explicit user response before proceeding
- Feel free to suggest your recommendation
- But NEVER proceed without user confirmation

This applies to ALL decisions including:
- Which files to modify or create
- Implementation approach choices
- Technology/library selections
- Architecture decisions
- Configuration changes
- Feature scope interpretations

## Enterprise Context

For specifications across all repositories, reference:
- **All Specs**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-specs.md
- **Conventions**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-conventions.md
- **Repo Index**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/repo-index.json

When asked about features in other repositories, check the enterprise context first.

## Cross-Repository Context (IMPORTANT)

**Before implementing any feature**, check cross-repo specs:

- \`.specify/workspace/all-specs.md\` - Index of all specs across ALL repositories
- \`.specify/workspace/all-conventions.md\` - Aggregated coding conventions
- \`.specify/workspace/repo-index.json\` - Structured repo/spec metadata

When a requested feature resembles an existing spec in another repo, reference that implementation for consistency.

**Multi-Repository Features**:
Features spanning multiple repositories (frontend + backend + BFF) will have MULTIPLE SPECS:
- Each repository maintains its own spec documenting its layer (UI spec, API spec, BFF spec)
- Specs reference each other via "Related Specifications" section
- Specs may share the same Jira ticket but serve different purposes
- DO NOT merge specs from different repos - they are complementary, not duplicates

To refresh cross-repo context: Push changes to trigger sync workflow (sync-spec-context.yml)

## Constitution

See: \`.specify/memory/constitution.md\` for non-negotiable quality gates.

All code MUST comply with the constitution.

## Local Specifications

See: \`specs/\` directory for this repository's feature specifications.

## Creating New Features

Use Spec-Kit workflow (13 commands available):

**Quick Start (simple features)**:
- \`/speckit.quickstart\` - Combined spec+plan+tasks in one step

**Full Workflow (complex features)**:
1. \`/speckit.specify\` - Create specification
2. \`/speckit.clarify\` - Resolve ambiguities
3. \`/speckit.plan\` - Generate implementation plan
4. \`/speckit.tasks\` - Break down into tasks
5. \`/speckit.analyze\` - Validate against constitution (includes pre-PR check)
6. \`/speckit.implement\` - Execute implementation

**Constitution & Quality**:
- \`/speckit.constitution\` - View, audit, generate, or update constitution
- \`/speckit.validate\` - Validate spec structure and implementation

**Utilities**:
- \`/speckit.epic\` - Epic status dashboard (queries Jira)
- \`/speckit.retro\` - Retroactive documentation + convention extraction
- \`/speckit.checklist\` - Generate quality checklists
- \`/speckit.report\` - Generate status reports

## Templates

- Spec: \`.specify/templates/spec-template.md\`
- Plan: \`.specify/templates/plan-template.md\`
- Tasks: \`.specify/templates/tasks-template.md\`

COPILOT_EOF
    
    log_install "Copilot: repository instructions"
    print_success "GitHub Copilot integration configured"
    
    echo ""
    print_success "Single repository setup complete!"
}

update_existing() {
    local REPO_TYPE=$1
    
    print_header "Updating Existing Spec-Kit Installation"
    
    # Backup existing SPECKIT.md if it exists
    if [ -f "SPECKIT.md" ]; then
        OLD_VERSION=$(grep -o 'v[0-9][0-9.]*' SPECKIT.md | head -n 1 || echo "")
        if [ -z "$OLD_VERSION" ]; then
            OLD_VERSION="unknown"
        fi
        print_step "Backing up SPECKIT.md $OLD_VERSION..."
        cp SPECKIT.md "SPECKIT.md.backup-$(date +%Y%m%d-%H%M%S)"
        log_update "Backed up SPECKIT.md $OLD_VERSION"
    fi
    
    # Download updated components
    download_speckit_md
    
    # Update constitution (preserve if exists)
    if [ -f ".specify/memory/constitution.md" ]; then
        print_warning "Constitution exists - preserving existing file"
        log_update "Constitution: constitution.md (existing, not overwritten)"
    else
        download_constitution
    fi
    
    # Update prompts
    download_prompts
    
    # Update templates
    download_templates
    
    # Update workflows (for context sync)
    download_workflows

    echo ""
    print_success "Spec-Kit updated successfully!"
}

# ============================================================================
# Report Generation
# ============================================================================

generate_report() {
    local REPO_TYPE=$1
    local ACTION=$2  # "install" or "update"
    
    print_header "Setup Report"
    
    echo -e "${CYAN}Repository Type:${NC} $REPO_TYPE"
    echo -e "${CYAN}Action:${NC} $ACTION"
    echo -e "${CYAN}Location:${NC} $CURRENT_DIR"
    echo ""
    
    # Installation summary
    if [ ${#INSTALL_LOG[@]} -gt 0 ]; then
        echo -e "${GREEN}Installed Components (${#INSTALL_LOG[@]}):${NC}"
        for ITEM in "${INSTALL_LOG[@]}"; do
            echo "  ✓ $ITEM"
        done
        echo ""
    fi
    
    # Update summary
    if [ ${#UPDATE_LOG[@]} -gt 0 ]; then
        echo -e "${BLUE}Updated Components (${#UPDATE_LOG[@]}):${NC}"
        for ITEM in "${UPDATE_LOG[@]}"; do
            echo "  ↻ $ITEM"
        done
        echo ""
    fi
    
    # Errors
    if [ ${#ERROR_LOG[@]} -gt 0 ]; then
        echo -e "${RED}Errors (${#ERROR_LOG[@]}):${NC}"
        for ITEM in "${ERROR_LOG[@]}"; do
            echo "  ✗ $ITEM"
        done
        echo ""
    fi
    
    # File structure analysis
    echo -e "${CYAN}Installed File Structure:${NC}"
    if [ -d ".specify" ]; then
        echo "  .specify/"
        [ -f ".specify/memory/constitution.md" ] && echo "    ✓ memory/constitution.md"
        [ -d ".specify/templates" ] && echo "    ✓ templates/ ($(ls -1 .specify/templates 2>/dev/null | wc -l | tr -d ' ') files)"
        [ -d ".specify/workspace" ] && echo "    ✓ workspace/ (context files)"
    fi
    if [ -d ".github/prompts" ]; then
        PROMPT_COUNT=$(ls -1 .github/prompts/*.prompt.md 2>/dev/null | wc -l | tr -d ' ')
        echo "  .github/prompts/ ($PROMPT_COUNT commands)"
    fi
    if [ -d ".github/workflows" ]; then
        WORKFLOW_COUNT=$(ls -1 .github/workflows/*spec*.yml 2>/dev/null | wc -l | tr -d ' ')
        [ "$WORKFLOW_COUNT" -gt 0 ] && echo "  .github/workflows/ ($WORKFLOW_COUNT context sync workflows)"
    fi
    echo ""
    
    # Next steps
    echo -e "${CYAN}Next Steps:${NC}"
    
    if [ "$REPO_TYPE" = "MONOREPO" ]; then
        echo "  1. Clone repositories into workspace root:"
        echo "     ${YELLOW}git clone <repo-url>${NC}"
        echo ""
        echo "  2. Start using Spec-Kit commands (13 available):"
        echo "     ${YELLOW}/speckit.quickstart \"Your feature description\"${NC}  (simple features)"
        echo "     ${YELLOW}/speckit.specify \"Your feature description\"${NC}   (complex features)"
    else
        echo "  1. Review and customize constitution:"
        echo "     ${YELLOW}nano .specify/memory/constitution.md${NC}"
        echo ""
        echo "  2. Create your first specification:"
        echo "     ${YELLOW}/speckit.quickstart \"Your feature description\"${NC}  (simple features)"
        echo "     ${YELLOW}/speckit.specify \"Your feature description\"${NC}   (complex features)"
        echo ""
        echo "  3. Follow the Spec-Kit workflow (13 commands available):"
        echo "     ${YELLOW}/speckit.plan${NC} → ${YELLOW}/speckit.tasks${NC} → ${YELLOW}/speckit.implement${NC} → ${YELLOW}/speckit.analyze${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  - Complete guide: SPECKIT.md"
    echo "  - Constitution:   .specify/memory/constitution.md"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header "Spec-Kit Dynamic Setup"
    
    # Step 0: Configuration prompts (if not already set)
    if [ -z "$GITHUB_TOKEN" ] && [ -z "$SPEC_KIT_CONTEXT_TOKEN" ]; then
        echo -e "${YELLOW}🔐 Authentication Required${NC}"
        echo ""
        echo "The Spec-Kit source (rlerikse/es-spec-kit-context) may be a private repo."
        echo "You need a GitHub Personal Access Token (PAT) to download files."
        echo ""
        echo -e "${CYAN}Requirements:${NC}"
        echo "  • Token scope: 'repo' (full control of private repositories)"
        echo ""
        echo -e "${CYAN}Quick Setup:${NC}"
        echo "  1. Generate token: https://github.com/settings/tokens/new"
        echo "     → Note: spec-kit-access"
        echo "     → Expiration: 90 days (recommended)"
        echo "     → Scope: ☑ repo"
        echo "     → Click 'Generate token'"
        echo ""
        echo -e "${CYAN}Already have a token?${NC}"
        echo "  • Run with: GITHUB_TOKEN=ghp_xxx ./speckit.sh"
        echo "  • Or paste it below (input is hidden)"
        echo ""
        
        # Check if running interactively (not piped)
        if [ -t 0 ]; then
            # Interactive - prompt for token with hidden input
            echo -n "Enter GitHub token: "
            read -s INPUT_TOKEN
            echo ""  # newline after hidden input
            
            if [ -n "$INPUT_TOKEN" ]; then
                export GITHUB_TOKEN="$INPUT_TOKEN"
                
                # Validate token immediately
                print_step "Validating token..."
                local TOKEN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
                    -H "Authorization: token $GITHUB_TOKEN" \
                    "https://api.github.com/user" 2>/dev/null || echo "000")
                
                if [ "$TOKEN_CHECK" = "200" ]; then
                    print_success "Token is valid"
                    
                    # Test repo access
                    local REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
                        -H "Authorization: token $GITHUB_TOKEN" \
                        "https://api.github.com/repos/$CENTRAL_CONTEXT_REPO" 2>/dev/null || echo "000")
                    
                    if [ "$REPO_CHECK" = "200" ]; then
                        print_success "Access to $CENTRAL_CONTEXT_REPO confirmed"
                    elif [ "$REPO_CHECK" = "404" ]; then
                        print_error "Cannot access $CENTRAL_CONTEXT_REPO"
                        echo ""
                        echo "Your token may need SSO authorization or the repo may not exist."
                        echo ""
                        exit 1
                    fi
                elif [ "$TOKEN_CHECK" = "401" ]; then
                    print_error "Token is invalid or expired"
                    echo "Please generate a new token and try again."
                    exit 1
                else
                    print_warning "Could not validate token (HTTP $TOKEN_CHECK)"
                fi
            else
                print_error "No token provided"
                echo ""
                echo "Run with token: GITHUB_TOKEN=ghp_xxx ./speckit.sh"
                exit 1
            fi
        else
            # Non-interactive (piped input) - must use environment variable
            print_error "Running in non-interactive mode (piped input)"
            echo ""
            echo "When running via 'curl | bash', you must provide the token via environment variable:"
            echo ""
            echo -e "  ${GREEN}curl -fsSL URL | GITHUB_TOKEN=ghp_xxx bash${NC}"
            echo ""
            echo "Or download and run interactively:"
            echo ""
            echo -e "  ${GREEN}curl -fsSL URL -o speckit.sh && bash speckit.sh${NC}"
            echo ""
            exit 1
        fi
        echo ""
    fi
    
    # Prompt for base URL if not using default
    echo "Current Spec-Kit source location:"
    echo "  $GITHUB_RAW_BASE"
    echo ""
    read -p "Use a different source URL? (y/N): " CHANGE_URL
    if [[ "$CHANGE_URL" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Enter the GitHub URL for spec-kit-context."
        echo "You can use either format:"
        echo "  - Web URL: https://github.com/owner/repo/tree/branch/path"
        echo "  - Raw URL: https://raw.githubusercontent.com/owner/repo/branch/path"
        echo ""
        read -p "URL: " INPUT_URL
        if [ -n "$INPUT_URL" ]; then
            # Normalize URL: convert github.com/tree to raw.githubusercontent.com
            if echo "$INPUT_URL" | grep -q "github.com.*\/tree\/"; then
                INPUT_URL=$(echo "$INPUT_URL" | sed 's|https://github.com/|https://raw.githubusercontent.com/|' | sed 's|/tree/|/|')
                print_success "Normalized to raw URL: $INPUT_URL"
            fi
            
            GITHUB_RAW_BASE="$INPUT_URL"
            GITHUB_BASE="$GITHUB_RAW_BASE/context"
            SPECKIT_URL="$GITHUB_RAW_BASE/SPECKIT.md"
            CONSTITUTION_URL="$GITHUB_BASE/memory/constitution.md"
            PROMPTS_BASE="$GITHUB_BASE/prompts"
            TEMPLATES_BASE="$GITHUB_BASE/templates"
            WORKFLOWS_BASE="$GITHUB_BASE/workflows"
            print_success "Using custom source: $GITHUB_RAW_BASE"
        fi
        echo ""
    fi
    
    # Step 1: Network check
    check_network
    
    # Step 2: Detect repository type
    print_header "Repository Analysis"
    REPO_TYPE=$(detect_repo_type)
    
    print_step "Detected repository type: $REPO_TYPE"
    echo ""
    
    # Step 3: Handle based on type
    case $REPO_TYPE in
        EMPTY)
            print_header "Empty Directory Detected"
            echo "This directory is empty. What would you like to set up?"
            echo ""
            echo "  1) Workspace (multi-repo for cross-context)"
            echo "  2) Single repository"
            echo ""
            read -p "Enter choice (1 or 2): " CHOICE
            echo ""
            
            case $CHOICE in
                1)
                    install_workspace
                    generate_report "WORKSPACE" "install"
                    ;;
                2)
                    install_single_repo
                    generate_report "SINGLE_REPO" "install"
                    ;;
                *)
                    print_error "Invalid choice"
                    exit 1
                    ;;
            esac
            ;;
            
        MONOREPO)
            print_step "Monorepo detected with $(ls -d */ 2>/dev/null | wc -l | tr -d ' ') subdirectories"
            
            if [ -d ".specify" ] && [ -f "SPECKIT.md" ]; then
                print_step "Existing Spec-Kit installation found - updating..."
                update_existing "MONOREPO"
                generate_report "MONOREPO" "update"
            else
                print_step "No Spec-Kit installation found - installing..."
                install_workspace
                generate_report "MONOREPO" "install"
            fi
            ;;
            
        SINGLE_REPO)
            print_step "Single repository detected"
            
            if [ -d ".specify" ] && [ -f "SPECKIT.md" ]; then
                print_step "Existing Spec-Kit installation found - updating..."
                update_existing "SINGLE_REPO"
                generate_report "SINGLE_REPO" "update"
            else
                print_step "No Spec-Kit installation found - installing..."
                install_single_repo
                generate_report "SINGLE_REPO" "install"
            fi
            ;;
            
        *)
            print_error "Could not determine repository type"
            exit 1
            ;;
    esac
    
    echo ""
    print_header "✓ Setup Complete"
}

# Run main function
main "$@"

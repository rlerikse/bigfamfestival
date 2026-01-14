#!/usr/bin/env bash

set -e

JSON_MODE=false
SHORT_NAME=""
BRANCH_NUMBER=""
ARGS=()

i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json) JSON_MODE=true ;;
        --short-name)
            i=$((i + 1)); SHORT_NAME="${!i}" ;;
        --number)
            i=$((i + 1)); BRANCH_NUMBER="${!i}" ;;
        --help|-h)
            echo "Usage: $0 [--json] [--short-name <name>] [--number N] <feature_description>"
            exit 0 ;;
        *) ARGS+=("$arg") ;;
    esac
    i=$((i + 1))
done

FEATURE_DESCRIPTION="${ARGS[*]}"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] [--short-name <name>] [--number N] <feature_description>" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    HAS_GIT=true
else
    REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
    HAS_GIT=false
fi

cd "$REPO_ROOT"
SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

generate_branch_name() {
    local description="$1"
    local stop_words="^(i|a|an|the|to|for|of|in|on|at|by|with|from|is|are|was|were|be|want|need|add|get|set)$"
    local clean_name=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')
    local meaningful_words=()
    
    for word in $clean_name; do
        [ -z "$word" ] && continue
        if ! echo "$word" | grep -qiE "$stop_words"; then
            if [ ${#word} -ge 3 ]; then
                meaningful_words+=("$word")
            fi
        fi
    done
    
    if [ ${#meaningful_words[@]} -gt 0 ]; then
        local max_words=3
        local result=""
        local count=0
        for word in "${meaningful_words[@]}"; do
            if [ $count -ge $max_words ]; then break; fi
            if [ -n "$result" ]; then result="$result-"; fi
            result="$result$word"
            count=$((count + 1))
        done
        echo "$result"
    else
        echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | head -c 30
    fi
}

if [ -n "$SHORT_NAME" ]; then
    BRANCH_SUFFIX=$(echo "$SHORT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g')
else
    BRANCH_SUFFIX=$(generate_branch_name "$FEATURE_DESCRIPTION")
fi

if [ -z "$BRANCH_NUMBER" ]; then
    HIGHEST=0
    if [ -d "$SPECS_DIR" ]; then
        for dir in "$SPECS_DIR"/*; do
            [ -d "$dir" ] || continue
            dirname=$(basename "$dir")
            number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
            number=$((10#$number))
            if [ "$number" -gt "$HIGHEST" ]; then HIGHEST=$number; fi
        done
    fi
    BRANCH_NUMBER=$((HIGHEST + 1))
fi

FEATURE_NUM=$(printf "%03d" "$BRANCH_NUMBER")
BRANCH_NAME="${FEATURE_NUM}-${BRANCH_SUFFIX}"

if [ "$HAS_GIT" = true ]; then
    git checkout -b "$BRANCH_NAME"
else
    >&2 echo "[specify] Warning: Git repository not detected; skipped branch creation"
fi

FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi

export SPECIFY_FEATURE="$BRANCH_NAME"

if $JSON_MODE; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s"}\n' "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_NUM: $FEATURE_NUM"
fi

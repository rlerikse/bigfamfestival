#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
else
    REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi

cd "$REPO_ROOT"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
AGENT_TYPE="agent"
OUTPUT_FILE=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON_MODE=true; shift ;;
        --agent) AGENT_TYPE="$2"; shift 2 ;;
        --output|-o) OUTPUT_FILE="$2"; shift 2 ;;
        --verbose|-v) VERBOSE=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--json] [--agent <type>] [--output <file>] [--verbose]"
            echo "  --agent <type>   Agent type: agent, edit, ask, review (default: agent)"
            echo "  --output <file>  Output file path (default: .specify/memory/agent-file.md)"
            echo "  --verbose        Show detailed output"
            exit 0 ;;
        *) shift ;;
    esac
done

FEATURE=$(get_current_feature)
FEATURE_DIR="$REPO_ROOT/specs/$FEATURE"

if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE="$REPO_ROOT/.specify/memory/agent-file.md"
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

CONSTITUTION="$REPO_ROOT/.specify/memory/constitution.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
PLAN_FILE="$FEATURE_DIR/plan.md"
TASKS_FILE="$FEATURE_DIR/tasks.md"

{
    echo "# Agent Context File"
    echo ""
    echo "**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "**Feature:** $FEATURE"
    echo "**Agent Type:** $AGENT_TYPE"
    echo ""
    
    echo "---"
    echo ""
    echo "## Constitution"
    echo ""
    if [ -f "$CONSTITUTION" ]; then
        cat "$CONSTITUTION"
    else
        echo "_No constitution found._"
    fi
    echo ""
    
    echo "---"
    echo ""
    echo "## Specification"
    echo ""
    if [ -f "$SPEC_FILE" ]; then
        cat "$SPEC_FILE"
    else
        echo "_No specification found at $SPEC_FILE._"
    fi
    echo ""
    
    echo "---"
    echo ""
    echo "## Implementation Plan"
    echo ""
    if [ -f "$PLAN_FILE" ]; then
        cat "$PLAN_FILE"
    else
        echo "_No plan found. Run /speckit.plan to generate._"
    fi
    echo ""
    
    echo "---"
    echo ""
    echo "## Tasks"
    echo ""
    if [ -f "$TASKS_FILE" ]; then
        cat "$TASKS_FILE"
    else
        echo "_No tasks found. Run /speckit.tasks to generate._"
    fi
    echo ""
    
    echo "---"
    echo ""
    echo "## Project Structure"
    echo ""
    echo '```'
    if command -v tree >/dev/null 2>&1; then
        tree -L 2 --dirsfirst -I 'node_modules|.git|dist|build|coverage|.next' "$REPO_ROOT" 2>/dev/null || ls -la "$REPO_ROOT"
    else
        ls -la "$REPO_ROOT"
    fi
    echo '```'
    
} > "$OUTPUT_FILE"

if $JSON_MODE; then
    printf '{"output_file":"%s","feature":"%s","agent_type":"%s","success":true}\n' "$OUTPUT_FILE" "$FEATURE" "$AGENT_TYPE"
else
    echo "✓ Agent context file generated: $OUTPUT_FILE"
    echo "  Feature: $FEATURE"
    echo "  Agent Type: $AGENT_TYPE"
    if $VERBOSE; then
        echo ""
        echo "Contents:"
        head -50 "$OUTPUT_FILE"
    fi
fi

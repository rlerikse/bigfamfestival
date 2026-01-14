#!/usr/bin/env bash

# Consolidated prerequisite checking script
#
# Usage: ./check-prerequisites.sh [OPTIONS]
#
# OPTIONS:
#   --json              Output in JSON format
#   --require-tasks     Require tasks.md to exist (for implementation phase)
#   --include-tasks     Include tasks.md in AVAILABLE_DOCS list
#   --paths-only        Only output path variables (no validation)
#   --help, -h          Show help message

set -e

JSON_MODE=false
REQUIRE_TASKS=false
INCLUDE_TASKS=false
PATHS_ONLY=false

for arg in "$@"; do
    case "$arg" in
        --json) JSON_MODE=true ;;
        --require-tasks) REQUIRE_TASKS=true ;;
        --include-tasks) INCLUDE_TASKS=true ;;
        --paths-only) PATHS_ONLY=true ;;
        --help|-h)
            echo "Usage: check-prerequisites.sh [OPTIONS]"
            echo "Options: --json, --require-tasks, --include-tasks, --paths-only"
            exit 0
            ;;
        *) echo "ERROR: Unknown option '$arg'" >&2; exit 1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

eval $(get_feature_paths)

if $PATHS_ONLY; then
    if $JSON_MODE; then
        printf '{"REPO_ROOT":"%s","BRANCH":"%s","FEATURE_DIR":"%s"}\n' "$REPO_ROOT" "$CURRENT_BRANCH" "$FEATURE_DIR"
    else
        echo "REPO_ROOT: $REPO_ROOT"
        echo "BRANCH: $CURRENT_BRANCH"
        echo "FEATURE_DIR: $FEATURE_DIR"
    fi
    exit 0
fi

if [[ ! -d "$FEATURE_DIR" ]]; then
    echo "ERROR: Feature directory not found: $FEATURE_DIR" >&2
    exit 1
fi

if [[ ! -f "$IMPL_PLAN" ]]; then
    echo "ERROR: plan.md not found in $FEATURE_DIR" >&2
    exit 1
fi

if $REQUIRE_TASKS && [[ ! -f "$TASKS" ]]; then
    echo "ERROR: tasks.md not found in $FEATURE_DIR" >&2
    exit 1
fi

docs=()
$INCLUDE_TASKS && [[ -f "$TASKS" ]] && docs+=("tasks.md")

if $JSON_MODE; then
    if [[ ${#docs[@]} -eq 0 ]]; then
        json_docs="[]"
    else
        json_docs=$(printf '"%s",' "${docs[@]}")
        json_docs="[${json_docs%,}]"
    fi
    printf '{"FEATURE_DIR":"%s","AVAILABLE_DOCS":%s}\n' "$FEATURE_DIR" "$json_docs"
else
    echo "FEATURE_DIR:$FEATURE_DIR"
fi

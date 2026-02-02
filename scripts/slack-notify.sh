#!/bin/bash
#
# Slack Notification Script for DevSecOps Pipeline
#
# Sends formatted notifications to Slack when security scans complete.
# Requires SLACK_WEBHOOK_URL environment variable to be set.
#
# Usage:
#   ./slack-notify.sh --status [success|failure|warning] --title "Message Title" --message "Details"
#
# Environment Variables:
#   SLACK_WEBHOOK_URL - Slack incoming webhook URL (required)
#   GITHUB_REPOSITORY - Repository name (auto-set in GitHub Actions)
#   GITHUB_RUN_ID     - Workflow run ID (auto-set in GitHub Actions)
#   GITHUB_SHA        - Commit SHA (auto-set in GitHub Actions)
#

set -euo pipefail

# Default values
STATUS="info"
TITLE="DevSecOps Pipeline Notification"
MESSAGE=""
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0

# Colors for Slack attachments
COLOR_SUCCESS="#28a745"
COLOR_FAILURE="#dc3545"
COLOR_WARNING="#ffc107"
COLOR_INFO="#17a2b8"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            STATUS="$2"
            shift 2
            ;;
        --title)
            TITLE="$2"
            shift 2
            ;;
        --message)
            MESSAGE="$2"
            shift 2
            ;;
        --critical)
            CRITICAL_COUNT="$2"
            shift 2
            ;;
        --high)
            HIGH_COUNT="$2"
            shift 2
            ;;
        --medium)
            MEDIUM_COUNT="$2"
            shift 2
            ;;
        --low)
            LOW_COUNT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 --status [success|failure|warning] --title \"Title\" --message \"Message\""
            echo ""
            echo "Options:"
            echo "  --status    Notification status (success, failure, warning, info)"
            echo "  --title     Notification title"
            echo "  --message   Notification message body"
            echo "  --critical  Count of critical vulnerabilities"
            echo "  --high      Count of high vulnerabilities"
            echo "  --medium    Count of medium vulnerabilities"
            echo "  --low       Count of low vulnerabilities"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check for required webhook URL
if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
    echo "Error: SLACK_WEBHOOK_URL environment variable is not set"
    echo "Skipping Slack notification"
    exit 0
fi

# Determine color based on status
case $STATUS in
    success)
        COLOR="$COLOR_SUCCESS"
        EMOJI=":white_check_mark:"
        ;;
    failure)
        COLOR="$COLOR_FAILURE"
        EMOJI=":x:"
        ;;
    warning)
        COLOR="$COLOR_WARNING"
        EMOJI=":warning:"
        ;;
    *)
        COLOR="$COLOR_INFO"
        EMOJI=":information_source:"
        ;;
esac

# Build vulnerability summary if counts provided
VULN_SUMMARY=""
if [[ $CRITICAL_COUNT -gt 0 ]] || [[ $HIGH_COUNT -gt 0 ]] || [[ $MEDIUM_COUNT -gt 0 ]] || [[ $LOW_COUNT -gt 0 ]]; then
    VULN_SUMMARY="*Vulnerabilities Found:*\n"
    VULN_SUMMARY+="• :red_circle: Critical: $CRITICAL_COUNT\n"
    VULN_SUMMARY+="• :large_orange_circle: High: $HIGH_COUNT\n"
    VULN_SUMMARY+="• :large_yellow_circle: Medium: $MEDIUM_COUNT\n"
    VULN_SUMMARY+="• :large_green_circle: Low: $LOW_COUNT"
fi

# Build GitHub links
REPO_URL="https://github.com/${GITHUB_REPOSITORY:-unknown}"
RUN_URL="${REPO_URL}/actions/runs/${GITHUB_RUN_ID:-0}"
COMMIT_URL="${REPO_URL}/commit/${GITHUB_SHA:-unknown}"
COMMIT_SHORT="${GITHUB_SHA:0:8}"

# Construct the Slack payload
read -r -d '' PAYLOAD << EOF || true
{
    "username": "DevSecOps Bot",
    "icon_emoji": ":shield:",
    "attachments": [
        {
            "color": "${COLOR}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "${EMOJI} ${TITLE}",
                        "emoji": true
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Repository:*\n<${REPO_URL}|${GITHUB_REPOSITORY:-unknown}>"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Commit:*\n<${COMMIT_URL}|${COMMIT_SHORT}>"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "${MESSAGE:-No additional details}"
                    }
                },
                ${VULN_SUMMARY:+"{
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"${VULN_SUMMARY}\"
                    }
                },"}
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": ":memo: View Run",
                                "emoji": true
                            },
                            "url": "${RUN_URL}"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": ":shield: Security Tab",
                                "emoji": true
                            },
                            "url": "${REPO_URL}/security"
                        }
                    ]
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Triggered by DevSecOps Pipeline • $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
                        }
                    ]
                }
            ]
        }
    ]
}
EOF

# Remove the trailing comma if VULN_SUMMARY is empty (fix JSON)
if [[ -z "$VULN_SUMMARY" ]]; then
    PAYLOAD=$(echo "$PAYLOAD" | sed 's/,$//')
fi

# Send to Slack
echo "Sending notification to Slack..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$SLACK_WEBHOOK_URL")

if [[ "$HTTP_RESPONSE" == "200" ]]; then
    echo "Slack notification sent successfully"
else
    echo "Failed to send Slack notification. HTTP status: $HTTP_RESPONSE"
    exit 1
fi

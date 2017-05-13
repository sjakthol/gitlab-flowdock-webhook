#!/bin/bash

set -euo pipefail

if [ -z "$FLOW_TOKEN" ]; then
    echo "FLOW_TOKEN is not defined"
    echo "Usage: FLOW_TOKEN=<token> ./run_integration_test.sh"
    exit 1
fi

RANDOM_ID="$RANDOM"

send_event() {
    local event_file="$1"
    jq ".object_attributes.iid = $RANDOM_ID" "$event_file" | \
    curl -v \
        -H "Content-Type: application/json" \
        -H "X-GitLab-Token: secret" \
        -H "X-GitLab-Event: Merge Request Hook" \
        --data @- \
        http://localhost:8080/event 
}

# Cleanup routines
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Start the server
GITLAB_TOKEN=secret node index.js | ./node_modules/.bin/bunyan &
sleep 1

# Create
echo "Press ENTER to open a Merge Request"
read -n1
send_event "sample_events/mr-create.json"

# Push commits
echo "Press ENTER to push commits to the MR"
read -n1
send_event "sample_events/mr-push-commit.json"

# Close
echo "Press ENTER to close the MR"
read -n1
send_event "sample_events/mr-close-1.json"
send_event "sample_events/mr-close-2.json"

# Reopen
echo "Press ENTER to reopen the MR"
read -n1
send_event "sample_events/mr-reopen-1.json"
send_event "sample_events/mr-reopen-2.json"

# Push commits
echo "Press ENTER to push more commits to the MR"
read -n1
send_event "sample_events/mr-push-commit.json"

# Merge
echo "Press ENTER to merge the MR"
read -n1
send_event "sample_events/mr-merge.json"

sleep 5
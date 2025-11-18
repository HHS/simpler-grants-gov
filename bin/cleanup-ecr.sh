#!/usr/bin/env bash
# Requires bash 4.0+

set -euo pipefail

# Check bash version
if ((BASH_VERSINFO[0] < 4)); then
    echo "ERROR: This script requires bash 4.0 or higher (you have ${BASH_VERSION})"
fi

REGION="us-east-1"
DRY_RUN=false

declare -A active_tags_map

REPOSITORIES=(
    "simpler-grants-gov-api"
    "simpler-grants-gov-frontend"
    "simpler-grants-gov-analytics"
    "simpler-grants-gov-fluentbit"
    "simpler-grants-gov-nofos"
)

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run]"
            exit 1
            ;;
    esac
done

# Get all active image tags from ECS task definitions
get_active_tags() {
    echo "Step 1: Identifying active images from ECS task definitions"

    local task_defs
    task_defs=$(aws ecs list-task-definitions \
        --region "$REGION" \
        --status ACTIVE \
        --query 'taskDefinitionArns[]' \
        --output text) || {
            echo "ERROR: Failed to list task definitions"
            exit 1
        }

    local task_def_count
    task_def_count=$(echo "$task_defs" | wc -w | tr -d ' ')
    echo "Found $task_def_count active task definitions"

    local all_images
    all_images=$(for task_def_arn in $task_defs; do
        aws ecs describe-task-definition \
            --task-definition "$task_def_arn" \
            --region "$REGION" \
            --query 'taskDefinition.containerDefinitions[].image' \
            --output json 2>/dev/null || echo "[]"
    done | jq -s 'add | unique | .[]' -r)

    local tag_count=0
    for image_url in $all_images; do
        if [[ $image_url =~ ([^/]+):([^:]+)$ ]]; then
            local repo="${BASH_REMATCH[1]}"
            local tag="${BASH_REMATCH[2]}"
            local repo_tag="$repo:$tag"
            active_tags_map["$repo_tag"]=1
            ((tag_count++))
        fi
    done

    echo "Found $tag_count unique active image tags"
}

is_tag_active() {
    local repo_name=$1
    local tag=$2
    local repo_tag="$repo_name:$tag"

    [[ -n "${active_tags_map[$repo_tag]:-}" ]]
}

# Get tags to delete for a repository
get_tags_to_delete() {
    local repo_name=$1
    local images=$2
    local -n delete_array=$3
    local -n active_count=$4

    local image_data
    image_data=$(echo "$images" | jq -r '.imageDetails[] |
        {digest: .imageDigest, tags: (.imageTags // [])} |
        @json')

    while IFS= read -r image_json; do
        if [ -z "$image_json" ]; then
            continue
        fi

        local image_digest
        image_digest=$(echo "$image_json" | jq -r '.digest')

        local tags
        tags=$(echo "$image_json" | jq -r '.tags[]?' 2>/dev/null || echo "")

        local is_active=false
        if [ -n "$tags" ]; then
            for tag in $tags; do
                if is_tag_active "$repo_name" "$tag"; then
                    is_active=true
                    break
                fi
            done
        fi

        if [ "$is_active" = true ]; then
            ((active_count++))
        else
            delete_array+=("$image_digest")
        fi
    done <<< "$image_data"
}

# Delete images
delete_images() {
    local repo_name=$1
    shift
    local images_to_delete=("$@")

    for ((i=0; i<${#images_to_delete[@]}; i+=100)); do
        local batch=("${images_to_delete[@]:i:100}")

        if [ "$DRY_RUN" = true ]; then
            echo "[DRY RUN] Would delete ${#batch[@]} images from $repo_name"
        else
            # Use jq to build JSON properly instead of string concatenation
            local image_ids
            image_ids=$(printf '%s\n' "${batch[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map({imageDigest: .})')

            local result
            result=$(aws ecr batch-delete-image \
                --repository-name "$repo_name" \
                --region "$REGION" \
                --image-ids "$image_ids" \
                --output json 2>&1) || {
                    echo "ERROR: Failed to delete images from $repo_name"
                    continue
                }

            local deleted
            deleted=$(echo "$result" | jq '.imageIds | length' 2>/dev/null || echo 0)
            local failed
            failed=$(echo "$result" | jq '.failures | length' 2>/dev/null || echo 0)

            echo "Deleted $deleted images from $repo_name ($failed failures)"

            if [ "$failed" -gt 0 ]; then
                echo "$result" | jq -r '.failures[] | "  WARNING: Failed to delete \(.imageId.imageDigest): \(.failureReason)"'
            fi
        fi
    done
}

# Clean up a repository
cleanup_repository() {
    local repo_name=$1

    echo ""
    echo "Processing repository: $repo_name"

    local images
    images=$(aws ecr describe-images \
        --repository-name "$repo_name" \
        --region "$REGION" \
        --output json 2>/dev/null) || {
            echo "WARNING: Failed to describe images for $repo_name"
            return
        }

    local total_images
    total_images=$(echo "$images" | jq '.imageDetails | length')
    echo "Total images in repository: $total_images"

    if [ "$total_images" -eq 0 ]; then
        echo "No images to process"
        return
    fi


    local active_count=0
    for repo_tag in "${!active_tags_map[@]}"; do
        if [[ $repo_tag == $repo_name:* ]]; then
            ((active_count++))
        fi
    done
    echo "Active tags to preserve: $active_count"

    local images_to_delete=()
    local active_images=0
    get_tags_to_delete "$repo_name" "$images" images_to_delete active_images

    echo "Images to delete: ${#images_to_delete[@]}"
    echo "Active images to preserve: $active_images"

    if [ ${#images_to_delete[@]} -gt 0 ]; then
        delete_images "$repo_name" "${images_to_delete[@]}"
    else
        echo "No images to delete"
    fi
}

main() {
    echo "ECR Cleanup Starting"
    echo "Dry Run: $DRY_RUN"
    echo "Repositories: ${REPOSITORIES[*]}"

    get_active_tags

    echo ""
    echo "Step 2: Cleaning up repositories"

    for repo in "${REPOSITORIES[@]}"; do
        cleanup_repository "$repo"
    done
}

main

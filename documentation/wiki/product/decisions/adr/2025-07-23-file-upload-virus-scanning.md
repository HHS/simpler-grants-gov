# File Upload Virus Scanning Architecture

* **Related Issue:** [#5686](https://github.com/HHS/simpler-grants-gov/pull/5686)

## Context and Problem Statement

The application allows users to upload file attachments as part of their applications. Currently, uploaded files are stored directly in S3 without any virus scanning, creating a security vulnerability where malicious files could be stored and potentially downloaded by other users or administrators.

To ensure the security and integrity of the platform, we need to implement virus scanning for all uploaded files before they are stored and made available for download.

_What is the best architectural approach to implement virus scanning for file uploads?_

## Options Considered

* **In-App Server ClamAV Scanning** - Run ClamAV daemon directly in the Flask application container
* **Asynchronous S3 Event-Driven Scanning** - Upload to staging bucket, scan via S3 events, move to final bucket
* **Third-party SaaS Solution** - Use services like VirusTotal API or AWS GuardDuty Malware Protection

## Decision Recommendation

Recommend **In-App Server ClamAV Scanning** by running the ClamAV daemon directly within our existing Flask application containers.

### Architecture Components

1. **ClamAV Daemon** - Runs as a background process in each Flask app container
2. **Enhanced Upload Endpoint** - Modified `/applications/{id}/attachments` endpoint with virus scanning
3. **Python ClamAV Client** - Uses `clamd` library to communicate with local ClamAV daemon
4. **Definition Updates** - Scheduled `freshclam` updates within containers every 6 hours
5. **Error Handling** - Return immediate 422 errors for infected files

### Implementation Approach

```python
# Add to app initialization
import clamd

# Initialize ClamAV connection (once at app startup)
clam = clamd.ClamdUnixSocket()

# Modified create_application_attachment service
def create_application_attachment(db_session, application_id, user, form_and_files_data):
    file_attachment = form_and_files_data.get("file_attachment")
    
    # Pre-scan validation
    if file_attachment.content_length > MAX_SCAN_SIZE:
        raise_flask_error(422, "File too large for virus scanning")
    
    # Perform virus scan using local ClamAV daemon
    scan_result = clam.instream(file_attachment.stream)
    
    if scan_result['stream'][0] == 'FOUND':
        threat_name = scan_result['stream'][1]
        logger.warning(f"Malware detected in upload: {threat_name}")
        raise_flask_error(422, f"File rejected: malware detected ({threat_name})")
    
    if scan_result['stream'][0] == 'ERROR':
        logger.error(f"Virus scan failed: {scan_result['stream'][1]}")
        raise_flask_error(500, "File upload temporarily unavailable")
    
    # Proceed with S3 upload only if clean
    s3_key = file_util.open_stream(file_attachment)
    # ... rest of attachment creation logic
```

### Docker Configuration

```dockerfile
# Add to existing Dockerfile
RUN apt-get update && apt-get install -y \
    clamav \
    clamav-daemon \
    clamav-freshclam \
    && rm -rf /var/lib/apt/lists/*

# Update virus definitions
RUN freshclam

# Start ClamAV daemon
RUN mkdir -p /var/run/clamav && \
    chown clamav:clamav /var/run/clamav
    
# Add to container startup script
CMD ["sh", "-c", "clamd --config-file=/etc/clamav/clamd.conf & python app.py"]
```

### Positive Consequences

* **Immediate security:** Malicious files never reach S3 storage
* **User experience:** Instant feedback on file uploads (clean or rejected)
* **Simple architecture:** No additional AWS services or infrastructure
* **Lower latency:** No network calls to external scanning services (~100-500ms faster than Lambda)
* **Cost-effective:** No Lambda execution costs, uses existing container resources
* **No cold starts:** ClamAV daemon stays warm between requests
* **Easy testing:** Can run and test locally during development

### Negative Consequences

* **Container resource usage:** Each app container needs additional memory (~200MB) for ClamAV
* **Container startup time:** Slightly longer container initialization due to ClamAV setup
* **Definition management:** Need to ensure virus definitions stay updated in containers
* **False positives:** Legitimate files may occasionally be flagged (though rare with ClamAV)
* **Container image size:** Increased by ~100MB due to ClamAV installation

## Pros and Cons of the Options

### In-App Server ClamAV Scanning

* **Pros**
  * Immediate feedback to users
  * Malicious files never reach permanent storage
  * Simple architecture with no additional AWS services
  * Lower latency than Lambda approach
  * No cold start delays
  * Cost-effective (no Lambda execution costs)
  * Easy local development and testing
  * ClamAV daemon can efficiently handle multiple files
* **Cons**
  * Increased container resource usage
  * Slightly larger container images
  * Need to manage virus definition updates in containers

### Asynchronous S3 Event-Driven Scanning

* **Pros**
  * Can handle larger files (up to 5TB with enterprise scanners)
  * No impact on upload performance
  * Supports multiple scanning engines
  * Better for high-volume scenarios
* **Cons**
  * Delayed feedback to users (files may be downloaded before scanning)
  * More complex architecture with multiple S3 buckets
  * Requires additional notification mechanisms
  * Higher operational complexity

### Third-party SaaS Solution

* **Pros**
  * No infrastructure management
  * Multiple scanning engines
  * Always up-to-date definitions
  * Professional support
* **Cons**
  * Ongoing subscription costs
  * Data privacy concerns (files sent to third-party)
  * Potential rate limiting
  * Vendor lock-in

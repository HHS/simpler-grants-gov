# File Upload Virus Scanning Architecture

* **Status:** Active
* **Last Modified:** 2025-07-23
* **Related Issue:** [#5739](https://github.com/HHS/simpler-grants-gov/issues/5739)
* **Tags:** security, file-upload, antivirus, api

## Context and Problem Statement

The application allows users to upload file attachments as part of their applications. Currently, uploaded files are stored directly in S3 without any virus scanning, creating a security vulnerability where malicious files could be stored and potentially downloaded by other users or administrators.

To ensure the security and integrity of the platform, we need to implement virus scanning for all uploaded files before they are stored and made available for download.

_What is the best architectural approach to implement virus scanning for file uploads that provides immediate feedback to users while maintaining security and performance?_

## Options Considered

* **ClamAV Sidecar Container** - Run ClamAV in a dedicated sidecar container for API services
* **In-App Server ClamAV Scanning** - Run ClamAV daemon directly in the Flask application container
* **In-Memory ClamAV Lambda Scanning** - Scan files before S3 upload using Lambda with ClamAV
* **Asynchronous S3 Event-Driven Scanning** - Upload to staging bucket, scan via S3 events, move to final bucket
* **Third-party SaaS Solution** - Use services like VirusTotal API or AWS GuardDuty Malware Protection

## Decision Recommendation

We will implement **ClamAV Sidecar Container** approach, running ClamAV in a dedicated container alongside API services that handle file uploads.

### Architecture Components

1. **ClamAV Sidecar Container** - Dedicated container running ClamAV daemon with 4GB memory allocation
2. **Enhanced Upload Endpoint** - Modified `/applications/{id}/attachments` endpoint with virus scanning
3. **Python ClamAV Client** - Uses `clamd` library to communicate with sidecar container via TCP
4. **Environment-based Control** - Only deploy ClamAV sidecar for API services, not backend tasks
5. **Definition Updates** - Scheduled `freshclam` updates within ClamAV container every 6 hours
6. **Error Handling** - Return immediate 422 errors for infected files

### Implementation Approach

```python
# Add to app initialization
import clamd
import os

# Initialize ClamAV connection (only for API containers)
clam = None
if os.getenv('ENABLE_VIRUS_SCANNING', 'false').lower() == 'true':
    clam = clamd.ClamdNetworkSocket(host='clamav-sidecar', port=3310)

# Modified create_application_attachment service
def create_application_attachment(db_session, application_id, user, form_and_files_data):
    file_attachment = form_and_files_data.get("file_attachment")
    
    # Skip scanning if not enabled (backend tasks)
    if clam is None:
        raise_flask_error(500, "Virus scanning not available")
    
    # Pre-scan validation - ClamAV supports up to 4GB files by default
    if file_attachment.content_length > MAX_SCAN_SIZE:  # 1GB practical limit
        raise_flask_error(422, "File too large for virus scanning (max 1GB)")
    
    # Perform virus scan using ClamAV sidecar
    try:
        scan_result = clam.instream(file_attachment.stream)
        
        if scan_result['stream'][0] == 'FOUND':
            threat_name = scan_result['stream'][1]
            logger.warning(f"Malware detected in upload: {threat_name}")
            raise_flask_error(422, f"File rejected: malware detected ({threat_name})")
        
        if scan_result['stream'][0] == 'ERROR':
            logger.error(f"Virus scan failed: {scan_result['stream'][1]}")
            raise_flask_error(500, "File upload temporarily unavailable")
            
    except Exception as e:
        logger.error(f"ClamAV connection failed: {e}")
        raise_flask_error(500, "Virus scanning temporarily unavailable")
    
    # Proceed with S3 upload only if clean
    s3_key = file_util.open_stream(file_attachment)
    # ... rest of attachment creation logic
```

### Docker Configuration

```yaml
# docker-compose.yml - API service only
version: '3.8'
services:
  api:
    build: .
    environment:
      - ENABLE_VIRUS_SCANNING=true
    depends_on:
      - clamav-sidecar
    networks:
      - app-network

  clamav-sidecar:
    image: clamav/clamav:stable
    ports:
      - "3310:3310"
    volumes:
      - clamav-data:/var/lib/clamav
    environment:
      - CLAMAV_NO_FRESHCLAMD=false
    memory: 4096m  # 4GB as recommended by ClamAV docs
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "clamdscan", "--ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend tasks without ClamAV
  backend-task:
    build: .
    environment:
      - ENABLE_VIRUS_SCANNING=false
    networks:
      - app-network

volumes:
  clamav-data:

networks:
  app-network:
    driver: bridge
```

### File Size and Performance Characteristics

Based on ClamAV documentation and benchmarks:

**File Size Support:**
* **ClamAV Maximum:** 4GB (configurable via MaxFileSize)
* **Practical Limit:** 1GB for user experience
* **Files exceeding limit:** Return clear error message suggesting file compression or alternative delivery

**Performance Benchmarks:**
* **Small files (few KB):** ~50-100ms scanning time
* **Medium files (1-10MB):** ~200-500ms scanning time  
* **Large files (100MB-1GB):** ~2-15 seconds scanning time
* **Memory usage:** 3-4GB RAM for ClamAV daemon (virus database + processing)

### Positive Consequences

* **Immediate security:** Malicious files never reach S3 storage
* **User experience:** Reasonably fast feedback on file uploads
* **Resource isolation:** ClamAV runs in dedicated container with appropriate memory allocation
* **Selective deployment:** Only runs for services that need it (API, not backend tasks)
* **Cost-effective:** No Lambda execution costs, dedicated resources
* **No cold starts:** ClamAV daemon stays warm between requests
* **Easy testing:** Can run and test locally during development
* **Proven technology:** ClamAV is widely used and trusted in enterprise environments

### Negative Consequences

* **Additional container:** Increases infrastructure complexity slightly
* **Memory requirements:** 4GB RAM needed for ClamAV sidecar container
* **Performance impact:** 2-15 second delay for large files
* **Definition management:** Need to ensure virus definitions stay updated
* **Network dependency:** API containers depend on ClamAV sidecar availability
* **Container orchestration:** Requires proper service discovery and health checks

## Pros and Cons of the Options

### ClamAV Sidecar Container ✅ **CHOSEN**

* **Pros**
  * Immediate feedback to users
  * Malicious files never reach permanent storage
  * Resource isolation - dedicated 4GB for ClamAV
  * Selective deployment (API only, not backend tasks)
  * Can handle large files up to 1GB practically
  * Better resource management than in-app approach
  * Easy to scale ClamAV independently
* **Cons**
  * Additional container to manage
  * Network dependency between containers
  * Higher memory overhead (4GB dedicated)
  * More complex service orchestration

### In-App Server ClamAV Scanning

* **Pros**
  * Immediate feedback to users
  * Malicious files never reach permanent storage
  * Simple architecture with no additional containers
  * Lower latency (no network calls)
* **Cons**
  * High memory usage (4GB) in every API container
  * Wasteful for backend tasks that don't need scanning
  * Harder to tune ClamAV resources independently
  * Larger container images

### In-Memory ClamAV Lambda Scanning

* **Pros**
  * Immediate feedback to users
  * Malicious files never reach permanent storage
  * Isolated scanning environment
  * Auto-scaling based on demand
* **Cons**
  * Limited by Lambda memory constraints (~10GB max, expensive)
  * Cold start delays
  * Network latency between API and Lambda
  * Additional infrastructure complexity
  * Higher costs (Lambda execution time)

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
  * Network latency for external API calls

## Implementation Considerations

### Environment Variable Controls

```bash
# API containers
ENABLE_VIRUS_SCANNING=true

# Backend task containers
ENABLE_VIRUS_SCANNING=false
```

### Health Checks and Monitoring

* **ClamAV Health Check:** Use `clamdscan --ping` to verify daemon availability
* **Performance Monitoring:** Track scanning times by file size
* **Alert Thresholds:** Alert if scanning takes >30 seconds or fails >5% of requests
* **Definition Updates:** Monitor freshclam success and alert on failures

### Error Handling Strategy

* **ClamAV Unavailable:** Return 500 error, don't allow uploads without scanning
* **Scanning Timeout:** Fail safely - reject file rather than allow unscanned upload
* **Large Files:** Clear user messaging about file size limits and alternatives

## Future Considerations

* **File Size Limits:** If larger file support is needed, consider hybrid approach with asynchronous scanning for files >1GB
* **Multiple Engines:** Could add secondary scanning engines for enhanced detection
* **Machine Learning:** Consider AWS GuardDuty Malware Protection for advanced threat detection
* **Performance:** Consider file type-based scanning (skip obviously safe files like text)
* **Horizontal Scaling:** Multiple ClamAV sidecar instances for high-volume scenarios

## Links

* [ClamAV Official Documentation](https://docs.clamav.net/)
* [ClamAV Docker Installation](https://docs.clamav.net/manual/Installing/Docker.html)
* [Python ClamAV Library (clamd)](https://pypi.org/project/clamd/)
* [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
* [AWS Security Best Practices](https://docs.aws.amazon.com/security/latest/userguide/best-practices.html)

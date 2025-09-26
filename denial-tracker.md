# Denial Tracker Playbook

This playbook provides a systematic approach for collecting, logging, and archiving denial and acceptance letters as evidence for grant applications.

## Overview

The Denial Tracker system helps maintain comprehensive records of grant application outcomes, which can serve as valuable evidence for legal counsel, pattern analysis, and process improvement.

## Evidence Collection Process

### 1. Initial Application Tracking

When submitting a grant application:

1. **Record Application Details:**
   ```bash
   python scripts/submit_tracker.py add-application \
     --opportunity-id GRANT-123 \
     --applicant "Organization Name" \
     --submitted-date 2024-01-15 \
     --amount-requested 50000
   ```

2. **Create Evidence Folder:**
   ```bash
   mkdir -p data/denials/GRANT-123-2024-01-15/
   ```

3. **Save Application Materials:**
   - Copy of submitted application (PDF)
   - Supporting documents
   - Submission confirmation receipts
   - Email correspondence

### 2. Response Tracking

When receiving a response (denial or acceptance):

1. **Record the Response:**
   ```bash
   python scripts/submit_tracker.py add-response \
     --application-id 1 \
     --status denied \
     --response-date 2024-03-15 \
     --evidence-file data/denials/GRANT-123-2024-01-15/denial_letter.pdf \
     --notes "Standard rejection - no specific feedback provided"
   ```

2. **Archive Evidence:**
   - Save original response letter/email (PDF format preferred)
   - Screenshot of online portal notifications
   - Any follow-up correspondence
   - Feedback or scoring sheets if provided

### 3. Evidence Organization Structure

```
data/denials/
├── GRANT-123-2024-01-15/
│   ├── application_submitted.pdf
│   ├── denial_letter.pdf
│   ├── correspondence/
│   │   ├── submission_confirmation.pdf
│   │   └── follow_up_emails.pdf
│   └── evidence_summary.txt
├── GRANT-456-2024-02-20/
│   └── ... (similar structure)
└── evidence_bundle_README.md
```

### 4. Data Quality Standards

#### Required Information for Applications:
- Opportunity ID (from Grants.gov)
- Applicant organization name
- Application submission date
- Requested amount
- Program/funding category
- Key contact person

#### Required Information for Responses:
- Response date
- Decision status (denied/accepted/pending)
- Response method (email/portal/mail)
- Evidence file location
- Any specific reasons provided
- Follow-up actions taken

## Legal Evidence Preparation

### Creating Evidence Bundles

1. **Generate CSV Reports:**
   ```bash
   python export_reports.py --format legal --output legal_evidence/
   ```

2. **Organize Physical Evidence:**
   - Chronological order of applications
   - Complete paper trail for each application
   - Signed affidavits if needed
   - Index of all documents

3. **Create Evidence Bundle:**
   ```bash
   # Create ZIP package for legal counsel
   python -c "
   import zipfile
   import os
   
   with zipfile.ZipFile('evidence_bundle.zip', 'w') as z:
       for root, dirs, files in os.walk('data/denials/'):
           for file in files:
               z.write(os.path.join(root, file))
       z.write('legal_evidence/applications_report.csv')
       z.write('legal_evidence/responses_report.csv')
   "
   ```

## Quality Assurance Checklist

### Before Each Submission:
- [ ] Application details recorded in database
- [ ] Evidence folder created with proper naming
- [ ] Application materials backed up
- [ ] Submission confirmation saved

### After Each Response:
- [ ] Response recorded in database
- [ ] Evidence files saved in proper format
- [ ] File locations updated in database
- [ ] Summary notes added
- [ ] Database backup created

### Monthly Review:
- [ ] Review all pending applications
- [ ] Follow up on overdue responses
- [ ] Verify evidence file integrity
- [ ] Update contact information
- [ ] Generate summary reports

## Automation and Alerts

### Automated Reminders:
Set up reminders for:
- Following up on pending applications (90 days)
- Checking for new opportunities (daily)
- Monthly evidence review
- Quarterly report generation

### Quality Control Scripts:
```bash
# Check for missing evidence files
python scripts/submit_tracker.py verify-evidence

# Generate summary statistics
python scripts/submit_tracker.py stats

# Check database integrity
python scripts/submit_tracker.py check-db
```

## Security and Privacy

### Data Protection:
- Store evidence files locally only
- Use encrypted backups for sensitive information
- Limit access to authorized personnel only
- Regular security audits of stored data

### FOIA Compliance:
- Maintain clear records of all communications
- Document decision-making processes
- Preserve metadata and timestamps
- Follow retention schedules

## Troubleshooting

### Common Issues:

1. **Missing Evidence Files:**
   - Check file paths in database records
   - Verify file naming conventions
   - Restore from backup if necessary

2. **Database Corruption:**
   - Regular backups prevent data loss
   - Use SQLite repair tools if needed
   - Maintain CSV exports as backup

3. **Inconsistent Data:**
   - Run validation scripts regularly
   - Standardize data entry procedures
   - Train users on proper procedures

## Contact and Support

For technical issues with the tracker system:
- Create issue in GitHub repository
- Check logs in `logs/` directory
- Review database schema in `scripts/tracker_db.py`

For legal or procedural questions:
- Consult with legal counsel
- Review organizational policies
- Document any special circumstances
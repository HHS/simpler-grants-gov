import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')

def format_finding(finding):
    """Format a single Security Hub finding into readable text"""
    
    # Extract key information
    title = finding.get('Title', 'N/A')
    severity = finding.get('Severity', {}).get('Label', 'N/A')
    description = finding.get('Description', 'N/A')
    account_id = finding.get('AwsAccountId', 'N/A')
    region = finding.get('Region', 'N/A')
    created_at = finding.get('CreatedAt', 'N/A')
    workflow_status = finding.get('Workflow', {}).get('Status', 'N/A')
    
    # Format resources
    resources = []
    for resource in finding.get('Resources', []):
        res_type = resource.get('Type', 'N/A')
        res_id = resource.get('Id', 'N/A')
        resources.append(f"  - {res_type}: {res_id}")
    
    resources_text = '\n'.join(resources) if resources else "  None"
    
    # Format vulnerabilities if present
    vulns_text = ""
    vulnerabilities = finding.get('Vulnerabilities', [])
    if vulnerabilities:
        vuln = vulnerabilities[0]  # Get first vulnerability
        cve_id = vuln.get('Id', 'N/A')
        fix_available = vuln.get('FixAvailable', 'UNKNOWN')
        
        # Get vulnerable packages
        packages = []
        for pkg in vuln.get('VulnerablePackages', [])[:3]:  # Limit to 3
            pkg_name = pkg.get('Name', 'N/A')
            current_ver = pkg.get('Version', 'N/A')
            fixed_ver = pkg.get('FixedInVersion', 'N/A')
            packages.append(f"    • {pkg_name}: {current_ver} → {fixed_ver}")
        
        packages_text = '\n'.join(packages) if packages else "    None"
        
        vulns_text = f"""
CVE Information:
  CVE ID: {cve_id}
  Fix Available: {fix_available}
  
  Affected Packages:
{packages_text}
"""
    
    # Get remediation if available
    remediation = finding.get('Remediation', {}).get('Recommendation', {}).get('Text', '')
    remediation_text = f"\nRemediation:\n  {remediation}" if remediation else ""
    
    # Build formatted message
    formatted = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 SECURITY HUB FINDING - {severity} SEVERITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: {title}

Severity: {severity}
Status: {workflow_status}
Created: {created_at}

Account: {account_id}
Region: {region}

Description:
  {description}
{vulns_text}
Affected Resources:
{resources_text}
{remediation_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View in AWS Console:
https://console.aws.amazon.com/securityhub/home?region={region}#/findings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    return formatted.strip()

def handler(event, context):
    """Format Security Hub findings and send to email SNS topic"""
    
    try:
        # Parse the SNS message
        for record in event['Records']:
            sns_message = json.loads(record['Sns']['Message'])
            
            # Extract findings from the EventBridge event
            findings = sns_message.get('detail', {}).get('findings', [])
            
            if not findings:
                print("No findings in message")
                continue
            
            # Format each finding
            formatted_messages = []
            for finding in findings:
                formatted_messages.append(format_finding(finding))
            
            # Combine all findings
            subject = f"🔒 Security Hub Alert - {findings[0].get('Severity', {}).get('Label', 'UNKNOWN')} Severity"
            message = '\n\n\n'.join(formatted_messages)
            
            # Add summary header if multiple findings
            if len(findings) > 1:
                message = f"Found {len(findings)} security findings:\n\n" + message
            
            # Publish to email SNS topic
            email_topic_arn = os.environ['EMAIL_SNS_TOPIC_ARN']
            sns.publish(
                TopicArn=email_topic_arn,
                Subject=subject,
                Message=message
            )
            
            print(f"Formatted and sent {len(findings)} finding(s) to email topic")
            
    except Exception as e:
        print(f"Error processing event: {e}")
        raise


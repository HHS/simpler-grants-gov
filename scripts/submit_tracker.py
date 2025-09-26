#!/usr/bin/env python3
"""
Submit Tracker CLI

Command-line interface for adding applications and responses to the grants tracker database.
"""

import os
import sys
import argparse
import json
from datetime import datetime
from pathlib import Path
import logging
from typing import Optional

# Add the scripts directory to path so we can import tracker_db
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tracker_db import TrackerDB

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def add_application_command(args):
    """Add a new application to the tracker"""
    tracker = TrackerDB()
    
    try:
        app_id = tracker.add_application(
            opportunity_id=args.opportunity_id,
            applicant_name=args.applicant,
            contact_email=args.email or '',
            contact_phone=args.phone or '',
            organization_type=args.org_type or '',
            submitted_date=args.submitted_date or datetime.now().isoformat(),
            amount_requested=float(args.amount) if args.amount else 0.0,
            project_title=args.project_title or '',
            project_description=args.description or '',
            status=args.status or 'submitted',
            notes=args.notes or ''
        )
        
        print(f"✅ Successfully added application with ID: {app_id}")
        
        # Create evidence directory if specified
        if args.create_evidence_dir:
            evidence_dir = f"data/denials/{args.opportunity_id}-{datetime.now().strftime('%Y-%m-%d')}"
            Path(evidence_dir).mkdir(parents=True, exist_ok=True)
            print(f"📁 Created evidence directory: {evidence_dir}")
        
    except Exception as e:
        print(f"❌ Failed to add application: {e}")
        sys.exit(1)


def add_response_command(args):
    """Add a response to an existing application"""
    tracker = TrackerDB()
    
    try:
        # Validate evidence file if provided
        if args.evidence_file and not os.path.exists(args.evidence_file):
            print(f"⚠️  Warning: Evidence file does not exist: {args.evidence_file}")
            if not args.force:
                response = input("Continue anyway? (y/N): ")
                if response.lower() != 'y':
                    print("Operation cancelled")
                    sys.exit(1)
        
        response_id = tracker.add_response(
            application_id=int(args.application_id),
            status=args.status,
            response_date=args.response_date or datetime.now().isoformat(),
            response_method=args.method or 'email',
            evidence_file_path=args.evidence_file or '',
            funding_amount=float(args.funding_amount) if args.funding_amount else 0.0,
            feedback=args.feedback or '',
            follow_up_required=args.follow_up,
            notes=args.notes or ''
        )
        
        print(f"✅ Successfully added response with ID: {response_id}")
        
    except ValueError as e:
        print(f"❌ Invalid application ID: {args.application_id}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to add response: {e}")
        sys.exit(1)


def list_applications_command(args):
    """List applications with optional filtering"""
    tracker = TrackerDB()
    
    try:
        applications = tracker.get_applications(
            status=args.status,
            opportunity_id=args.opportunity_id
        )
        
        if not applications:
            print("📝 No applications found matching the criteria")
            return
        
        print(f"📋 Found {len(applications)} application(s):\n")
        
        for app in applications:
            print(f"ID: {app['id']}")
            print(f"  Opportunity: {app['opportunity_id']} - {app.get('opportunity_title', 'N/A')}")
            print(f"  Applicant: {app['applicant_name']}")
            print(f"  Status: {app['status']}")
            print(f"  Submitted: {app['submitted_date']}")
            if app['amount_requested']:
                print(f"  Amount: ${app['amount_requested']:,.2f}")
            if app['project_title']:
                print(f"  Project: {app['project_title']}")
            print(f"  Created: {app['created_at']}")
            print("-" * 50)
        
    except Exception as e:
        print(f"❌ Failed to list applications: {e}")
        sys.exit(1)


def list_responses_command(args):
    """List responses with optional filtering"""
    tracker = TrackerDB()
    
    try:
        responses = tracker.get_responses(
            application_id=int(args.application_id) if args.application_id else None,
            status=args.status
        )
        
        if not responses:
            print("📝 No responses found matching the criteria")
            return
        
        print(f"📋 Found {len(responses)} response(s):\n")
        
        for resp in responses:
            print(f"Response ID: {resp['id']}")
            print(f"  Application: {resp['application_id']} ({resp['applicant_name']})")
            print(f"  Opportunity: {resp['opportunity_id']} - {resp.get('opportunity_title', 'N/A')}")
            print(f"  Status: {resp['status']}")
            print(f"  Response Date: {resp['response_date']}")
            print(f"  Method: {resp['response_method']}")
            if resp['funding_amount']:
                print(f"  Funding: ${resp['funding_amount']:,.2f}")
            if resp['evidence_file_path']:
                exists = "✅" if os.path.exists(resp['evidence_file_path']) else "❌"
                print(f"  Evidence: {resp['evidence_file_path']} {exists}")
            if resp['feedback']:
                print(f"  Feedback: {resp['feedback']}")
            print(f"  Created: {resp['created_at']}")
            print("-" * 50)
        
    except ValueError as e:
        print(f"❌ Invalid application ID: {args.application_id}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to list responses: {e}")
        sys.exit(1)


def stats_command(args):
    """Show database statistics"""
    tracker = TrackerDB()
    
    try:
        stats = tracker.get_statistics()
        
        print("📊 Database Statistics:\n")
        
        print(f"Applications: {stats.get('total_applications', 0)}")
        app_status = stats.get('applications_by_status', {})
        for status, count in app_status.items():
            print(f"  - {status}: {count}")
        
        print(f"\nResponses: {stats.get('total_responses', 0)}")
        resp_status = stats.get('responses_by_status', {})
        for status, count in resp_status.items():
            print(f"  - {status}: {count}")
        
        print(f"\nOpportunities: {stats.get('total_opportunities', 0)}")
        print(f"Success Rate: {stats.get('success_rate', 0)}%")
        
    except Exception as e:
        print(f"❌ Failed to get statistics: {e}")
        sys.exit(1)


def verify_evidence_command(args):
    """Verify evidence files exist"""
    tracker = TrackerDB()
    
    try:
        integrity = tracker.verify_database_integrity()
        
        print("🔍 Database Integrity Check:\n")
        
        if integrity['integrity_ok']:
            print("✅ Database integrity is good!")
        else:
            print("⚠️  Issues found:")
            for issue in integrity.get('issues', []):
                print(f"  - {issue}")
        
        if 'total_evidence_references' in integrity:
            print(f"\nEvidence Files: {integrity['total_evidence_references']} referenced")
            if integrity.get('missing_files', 0) > 0:
                print(f"Missing Files: {integrity['missing_files']}")
        
    except Exception as e:
        print(f"❌ Failed to verify evidence: {e}")
        sys.exit(1)


def check_db_command(args):
    """Check database health"""
    tracker = TrackerDB()
    
    try:
        # Try to get statistics to verify database works
        stats = tracker.get_statistics()
        integrity = tracker.verify_database_integrity()
        
        print("🏥 Database Health Check:\n")
        
        print("✅ Database connection: OK")
        print("✅ Tables accessible: OK")
        print(f"✅ Total records: {stats.get('total_applications', 0)} apps, {stats.get('total_responses', 0)} responses")
        
        if integrity['integrity_ok']:
            print("✅ Data integrity: OK")
        else:
            print("⚠️  Data integrity: Issues found")
            for issue in integrity.get('issues', []):
                print(f"    - {issue}")
        
        print("\n🎯 Database is healthy and ready to use!")
        
    except Exception as e:
        print(f"❌ Database health check failed: {e}")
        sys.exit(1)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description='Grant Application Tracker CLI')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Add application command
    add_app_parser = subparsers.add_parser('add-application', help='Add a new application')
    add_app_parser.add_argument('--opportunity-id', required=True, help='Grant opportunity ID')
    add_app_parser.add_argument('--applicant', required=True, help='Applicant organization name')
    add_app_parser.add_argument('--email', help='Contact email')
    add_app_parser.add_argument('--phone', help='Contact phone')
    add_app_parser.add_argument('--org-type', help='Organization type')
    add_app_parser.add_argument('--submitted-date', help='Submission date (YYYY-MM-DD)')
    add_app_parser.add_argument('--amount', help='Requested amount')
    add_app_parser.add_argument('--project-title', help='Project title')
    add_app_parser.add_argument('--description', help='Project description')
    add_app_parser.add_argument('--status', default='submitted', help='Application status')
    add_app_parser.add_argument('--notes', help='Additional notes')
    add_app_parser.add_argument('--create-evidence-dir', action='store_true', 
                               help='Create evidence directory')
    
    # Add response command
    add_resp_parser = subparsers.add_parser('add-response', help='Add a response to an application')
    add_resp_parser.add_argument('--application-id', required=True, help='Application ID')
    add_resp_parser.add_argument('--status', required=True, 
                                choices=['denied', 'accepted', 'pending', 'withdrawn'],
                                help='Response status')
    add_resp_parser.add_argument('--response-date', help='Response date (YYYY-MM-DD)')
    add_resp_parser.add_argument('--method', choices=['email', 'portal', 'mail', 'phone'],
                                default='email', help='Response method')
    add_resp_parser.add_argument('--evidence-file', help='Path to evidence file')
    add_resp_parser.add_argument('--funding-amount', help='Funding amount (if accepted)')
    add_resp_parser.add_argument('--feedback', help='Feedback or reason')
    add_resp_parser.add_argument('--follow-up', action='store_true', help='Follow-up required')
    add_resp_parser.add_argument('--notes', help='Additional notes')
    add_resp_parser.add_argument('--force', action='store_true', 
                                help='Force operation even if evidence file missing')
    
    # List applications command
    list_apps_parser = subparsers.add_parser('list-applications', help='List applications')
    list_apps_parser.add_argument('--status', help='Filter by status')
    list_apps_parser.add_argument('--opportunity-id', help='Filter by opportunity ID')
    
    # List responses command
    list_resp_parser = subparsers.add_parser('list-responses', help='List responses')
    list_resp_parser.add_argument('--application-id', help='Filter by application ID')
    list_resp_parser.add_argument('--status', help='Filter by status')
    
    # Statistics command
    stats_parser = subparsers.add_parser('stats', help='Show database statistics')
    
    # Verify evidence command
    verify_parser = subparsers.add_parser('verify-evidence', help='Verify evidence files exist')
    
    # Check database command
    check_parser = subparsers.add_parser('check-db', help='Check database health')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Execute command
    if args.command == 'add-application':
        add_application_command(args)
    elif args.command == 'add-response':
        add_response_command(args)
    elif args.command == 'list-applications':
        list_applications_command(args)
    elif args.command == 'list-responses':
        list_responses_command(args)
    elif args.command == 'stats':
        stats_command(args)
    elif args.command == 'verify-evidence':
        verify_evidence_command(args)
    elif args.command == 'check-db':
        check_db_command(args)


if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Export Reports Script

Generate CSV reports from the SQLite database for legal evidence and analysis.
"""

import os
import csv
import sys
import argparse
import sqlite3
from datetime import datetime
from pathlib import Path
import logging
from typing import List, Dict, Any

# Add scripts directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scripts.tracker_db import TrackerDB

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ReportExporter:
    """Export various reports from the tracker database"""
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.tracker = TrackerDB()
    
    def export_applications_report(self) -> str:
        """Export comprehensive applications report"""
        filename = f"applications_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = self.output_dir / filename
        
        conn = self.tracker._get_connection()
        
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    a.id,
                    a.opportunity_id,
                    o.title as opportunity_title,
                    o.agency,
                    o.category,
                    o.funding_instrument,
                    o.posted_date as opportunity_posted_date,
                    o.closing_date as opportunity_closing_date,
                    o.estimated_funding as opportunity_estimated_funding,
                    a.applicant_name,
                    a.contact_email,
                    a.contact_phone,
                    a.organization_type,
                    a.submitted_date,
                    a.amount_requested,
                    a.project_title,
                    a.project_description,
                    a.status,
                    a.notes,
                    a.created_at,
                    a.updated_at,
                    COUNT(r.id) as response_count,
                    MAX(r.response_date) as latest_response_date,
                    GROUP_CONCAT(r.status, ', ') as all_response_statuses
                FROM applications a
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                LEFT JOIN responses r ON a.id = r.application_id
                GROUP BY a.id
                ORDER BY a.created_at DESC
            ''')
            
            rows = cursor.fetchall()
            
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Application ID', 'Opportunity ID', 'Opportunity Title', 'Agency',
                    'Category', 'Funding Instrument', 'Opportunity Posted Date',
                    'Opportunity Closing Date', 'Opportunity Estimated Funding',
                    'Applicant Name', 'Contact Email', 'Contact Phone',
                    'Organization Type', 'Submitted Date', 'Amount Requested',
                    'Project Title', 'Project Description', 'Status', 'Notes',
                    'Created At', 'Updated At', 'Response Count',
                    'Latest Response Date', 'All Response Statuses'
                ])
                
                writer.writerows(rows)
            
            logger.info(f"Exported {len(rows)} applications to {output_path}")
            return str(output_path)
            
        except sqlite3.Error as e:
            logger.error(f"Database error during applications export: {e}")
            raise
        finally:
            conn.close()
    
    def export_responses_report(self) -> str:
        """Export comprehensive responses report"""
        filename = f"responses_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = self.output_dir / filename
        
        conn = self.tracker._get_connection()
        
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    r.id,
                    r.application_id,
                    a.opportunity_id,
                    o.title as opportunity_title,
                    o.agency,
                    a.applicant_name,
                    a.contact_email,
                    a.organization_type,
                    a.submitted_date,
                    a.amount_requested,
                    a.project_title,
                    r.response_date,
                    r.status,
                    r.response_method,
                    r.evidence_file_path,
                    r.funding_amount,
                    r.feedback,
                    r.follow_up_required,
                    r.notes,
                    r.created_at,
                    r.updated_at,
                    CASE WHEN r.evidence_file_path != '' AND r.evidence_file_path IS NOT NULL 
                         THEN 'Yes' ELSE 'No' END as has_evidence
                FROM responses r
                JOIN applications a ON r.application_id = a.id
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                ORDER BY r.response_date DESC, r.created_at DESC
            ''')
            
            rows = cursor.fetchall()
            
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Response ID', 'Application ID', 'Opportunity ID', 'Opportunity Title',
                    'Agency', 'Applicant Name', 'Contact Email', 'Organization Type',
                    'Submitted Date', 'Amount Requested', 'Project Title',
                    'Response Date', 'Status', 'Response Method', 'Evidence File Path',
                    'Funding Amount', 'Feedback', 'Follow Up Required', 'Notes',
                    'Created At', 'Updated At', 'Has Evidence'
                ])
                
                writer.writerows(rows)
            
            logger.info(f"Exported {len(rows)} responses to {output_path}")
            return str(output_path)
            
        except sqlite3.Error as e:
            logger.error(f"Database error during responses export: {e}")
            raise
        finally:
            conn.close()
    
    def export_denials_report(self) -> str:
        """Export report focused on denials for legal evidence"""
        filename = f"denials_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = self.output_dir / filename
        
        conn = self.tracker._get_connection()
        
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    r.id as response_id,
                    a.id as application_id,
                    a.opportunity_id,
                    o.title as opportunity_title,
                    o.agency,
                    o.category,
                    a.applicant_name,
                    a.contact_email,
                    a.organization_type,
                    a.submitted_date,
                    a.amount_requested,
                    a.project_title,
                    r.response_date,
                    r.response_method,
                    r.evidence_file_path,
                    r.feedback,
                    r.notes as response_notes,
                    a.notes as application_notes,
                    CASE WHEN r.evidence_file_path != '' AND r.evidence_file_path IS NOT NULL 
                         THEN 'Yes' ELSE 'No' END as evidence_available,
                    julianday(r.response_date) - julianday(a.submitted_date) as days_to_response
                FROM responses r
                JOIN applications a ON r.application_id = a.id
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                WHERE r.status = 'denied'
                ORDER BY r.response_date DESC
            ''')
            
            rows = cursor.fetchall()
            
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Response ID', 'Application ID', 'Opportunity ID', 'Opportunity Title',
                    'Agency', 'Category', 'Applicant Name', 'Contact Email',
                    'Organization Type', 'Submitted Date', 'Amount Requested',
                    'Project Title', 'Response Date', 'Response Method',
                    'Evidence File Path', 'Feedback', 'Response Notes',
                    'Application Notes', 'Evidence Available', 'Days to Response'
                ])
                
                writer.writerows(rows)
            
            logger.info(f"Exported {len(rows)} denials to {output_path}")
            return str(output_path)
            
        except sqlite3.Error as e:
            logger.error(f"Database error during denials export: {e}")
            raise
        finally:
            conn.close()
    
    def export_summary_statistics(self) -> str:
        """Export summary statistics report"""
        filename = f"summary_statistics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = self.output_dir / filename
        
        conn = self.tracker._get_connection()
        
        try:
            cursor = conn.cursor()
            
            # Collect various statistics
            stats_data = []
            
            # Basic counts
            cursor.execute('SELECT COUNT(*) FROM opportunities')
            stats_data.append(['Total Opportunities', cursor.fetchone()[0]])
            
            cursor.execute('SELECT COUNT(*) FROM applications')
            stats_data.append(['Total Applications', cursor.fetchone()[0]])
            
            cursor.execute('SELECT COUNT(*) FROM responses')
            stats_data.append(['Total Responses', cursor.fetchone()[0]])
            
            # Application status breakdown
            cursor.execute('SELECT status, COUNT(*) FROM applications GROUP BY status')
            for status, count in cursor.fetchall():
                stats_data.append([f'Applications - {status.title()}', count])
            
            # Response status breakdown
            cursor.execute('SELECT status, COUNT(*) FROM responses GROUP BY status')
            for status, count in cursor.fetchall():
                stats_data.append([f'Responses - {status.title()}', count])
            
            # Success rate
            cursor.execute('SELECT COUNT(*) FROM responses WHERE status = "accepted"')
            accepted = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM responses')
            total_responses = cursor.fetchone()[0]
            
            if total_responses > 0:
                success_rate = (accepted / total_responses) * 100
                stats_data.append(['Success Rate (%)', round(success_rate, 2)])
            else:
                stats_data.append(['Success Rate (%)', 0])
            
            # Average response time
            cursor.execute('''
                SELECT AVG(julianday(r.response_date) - julianday(a.submitted_date))
                FROM responses r
                JOIN applications a ON r.application_id = a.id
                WHERE r.response_date IS NOT NULL AND a.submitted_date IS NOT NULL
            ''')
            avg_response_time = cursor.fetchone()[0]
            if avg_response_time:
                stats_data.append(['Average Response Time (days)', round(avg_response_time, 1)])
            
            # Top agencies by applications
            cursor.execute('''
                SELECT o.agency, COUNT(*) as app_count
                FROM applications a
                JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                GROUP BY o.agency
                ORDER BY app_count DESC
                LIMIT 10
            ''')
            stats_data.append(['', ''])  # Blank row
            stats_data.append(['Top Agencies by Applications', ''])
            for agency, count in cursor.fetchall():
                stats_data.append([f'  {agency}', count])
            
            # Write to CSV
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['Metric', 'Value'])
                writer.writerow(['Report Generated', datetime.now().isoformat()])
                writer.writerow(['', ''])  # Blank row
                writer.writerows(stats_data)
            
            logger.info(f"Exported summary statistics to {output_path}")
            return str(output_path)
            
        except sqlite3.Error as e:
            logger.error(f"Database error during statistics export: {e}")
            raise
        finally:
            conn.close()
    
    def export_legal_evidence_bundle(self) -> List[str]:
        """Export all reports needed for legal evidence"""
        reports = []
        
        print("📊 Generating legal evidence bundle...")
        
        reports.append(self.export_applications_report())
        print("  ✅ Applications report generated")
        
        reports.append(self.export_responses_report())
        print("  ✅ Responses report generated")
        
        reports.append(self.export_denials_report())
        print("  ✅ Denials report generated")
        
        reports.append(self.export_summary_statistics())
        print("  ✅ Summary statistics generated")
        
        # Create a bundle README
        readme_path = self.output_dir / "README_evidence_bundle.txt"
        with open(readme_path, 'w') as f:
            f.write("GRANT APPLICATION EVIDENCE BUNDLE\n")
            f.write("=" * 35 + "\n\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n\n")
            f.write("This bundle contains comprehensive reports from the grants tracking system\n")
            f.write("for legal evidence and analysis purposes.\n\n")
            f.write("Files included:\n")
            for report in reports:
                f.write(f"  - {os.path.basename(report)}\n")
            f.write(f"\nTotal files: {len(reports)}\n")
            f.write("\nFor questions about this data, contact the grants tracking administrator.\n")
        
        reports.append(str(readme_path))
        print("  ✅ Evidence bundle README created")
        
        print(f"📁 All reports saved to: {self.output_dir}")
        
        return reports


def main():
    parser = argparse.ArgumentParser(description='Export reports from grants tracker database')
    parser.add_argument('--output', '-o', default='reports', 
                       help='Output directory for reports (default: reports)')
    parser.add_argument('--format', '-f', choices=['standard', 'legal'], default='standard',
                       help='Report format (standard or legal evidence bundle)')
    parser.add_argument('--type', '-t', 
                       choices=['applications', 'responses', 'denials', 'statistics', 'all'],
                       default='all', help='Type of report to generate')
    
    args = parser.parse_args()
    
    try:
        exporter = ReportExporter(args.output)
        
        if args.format == 'legal':
            # Generate legal evidence bundle
            reports = exporter.export_legal_evidence_bundle()
            print(f"\n🎯 Legal evidence bundle complete!")
            print(f"Generated {len(reports)} files in {args.output}/")
            
        else:
            # Generate individual reports
            if args.type == 'applications' or args.type == 'all':
                report_path = exporter.export_applications_report()
                print(f"✅ Applications report: {report_path}")
            
            if args.type == 'responses' or args.type == 'all':
                report_path = exporter.export_responses_report()
                print(f"✅ Responses report: {report_path}")
            
            if args.type == 'denials' or args.type == 'all':
                report_path = exporter.export_denials_report()
                print(f"✅ Denials report: {report_path}")
            
            if args.type == 'statistics' or args.type == 'all':
                report_path = exporter.export_summary_statistics()
                print(f"✅ Statistics report: {report_path}")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
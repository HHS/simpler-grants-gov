#!/usr/bin/env python3
"""
Tracker Database Manager

SQLite wrapper for managing grant opportunities, applications, and responses.
Provides a clean interface for database operations.
"""

import os
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_PATH = os.getenv('DATABASE_PATH', 'tracker.db')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TrackerDB:
    """Database manager for grants tracking"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or DATABASE_PATH
        self.init_database()
    
    def init_database(self):
        """Initialize all required tables"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        
        try:
            # Opportunities table (from scanner)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS opportunities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    opportunity_id TEXT UNIQUE,
                    title TEXT,
                    agency TEXT,
                    category TEXT,
                    funding_instrument TEXT,
                    eligible_applicants TEXT,
                    posted_date TEXT,
                    closing_date TEXT,
                    estimated_funding TEXT,
                    description TEXT,
                    last_updated TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Applications table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    opportunity_id TEXT,
                    applicant_name TEXT NOT NULL,
                    contact_email TEXT,
                    contact_phone TEXT,
                    organization_type TEXT,
                    submitted_date TEXT,
                    amount_requested REAL,
                    project_title TEXT,
                    project_description TEXT,
                    status TEXT DEFAULT 'submitted',
                    notes TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (opportunity_id) REFERENCES opportunities (opportunity_id)
                )
            ''')
            
            # Responses table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS responses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    response_date TEXT,
                    status TEXT NOT NULL,
                    response_method TEXT,
                    evidence_file_path TEXT,
                    funding_amount REAL,
                    feedback TEXT,
                    follow_up_required BOOLEAN DEFAULT 0,
                    notes TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (application_id) REFERENCES applications (id)
                )
            ''')
            
            # Evidence files table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS evidence_files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    response_id INTEGER,
                    file_path TEXT NOT NULL,
                    file_type TEXT,
                    file_size INTEGER,
                    description TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (response_id) REFERENCES responses (id)
                )
            ''')
            
            # Create indexes for better performance
            conn.execute('CREATE INDEX IF NOT EXISTS idx_opportunities_id ON opportunities(opportunity_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_applications_opp_id ON applications(opportunity_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_responses_app_id ON responses(application_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status)')
            
            conn.commit()
            logger.info("Database initialized successfully")
            
        except sqlite3.Error as e:
            logger.error(f"Database initialization error: {e}")
            raise
        finally:
            conn.close()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def add_application(self, opportunity_id: str, applicant_name: str, **kwargs) -> int:
        """
        Add a new grant application
        
        Args:
            opportunity_id: Grant opportunity ID
            applicant_name: Name of applicant organization
            **kwargs: Additional application data
            
        Returns:
            ID of created application
        """
        conn = self._get_connection()
        
        try:
            # Prepare application data
            app_data = {
                'opportunity_id': opportunity_id,
                'applicant_name': applicant_name,
                'contact_email': kwargs.get('contact_email', ''),
                'contact_phone': kwargs.get('contact_phone', ''),
                'organization_type': kwargs.get('organization_type', ''),
                'submitted_date': kwargs.get('submitted_date', datetime.now().isoformat()),
                'amount_requested': kwargs.get('amount_requested', 0.0),
                'project_title': kwargs.get('project_title', ''),
                'project_description': kwargs.get('project_description', ''),
                'status': kwargs.get('status', 'submitted'),
                'notes': kwargs.get('notes', ''),
                'updated_at': datetime.now().isoformat()
            }
            
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO applications 
                (opportunity_id, applicant_name, contact_email, contact_phone,
                 organization_type, submitted_date, amount_requested, 
                 project_title, project_description, status, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', tuple(app_data.values()))
            
            app_id = cursor.lastrowid
            conn.commit()
            
            logger.info(f"Added application {app_id} for opportunity {opportunity_id}")
            return app_id
            
        except sqlite3.Error as e:
            logger.error(f"Failed to add application: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def add_response(self, application_id: int, status: str, **kwargs) -> int:
        """
        Add a response to a grant application
        
        Args:
            application_id: ID of the application
            status: Response status (denied/accepted/pending)
            **kwargs: Additional response data
            
        Returns:
            ID of created response
        """
        conn = self._get_connection()
        
        try:
            response_data = {
                'application_id': application_id,
                'response_date': kwargs.get('response_date', datetime.now().isoformat()),
                'status': status.lower(),
                'response_method': kwargs.get('response_method', 'email'),
                'evidence_file_path': kwargs.get('evidence_file_path', ''),
                'funding_amount': kwargs.get('funding_amount', 0.0),
                'feedback': kwargs.get('feedback', ''),
                'follow_up_required': kwargs.get('follow_up_required', False),
                'notes': kwargs.get('notes', ''),
                'updated_at': datetime.now().isoformat()
            }
            
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO responses 
                (application_id, response_date, status, response_method,
                 evidence_file_path, funding_amount, feedback, 
                 follow_up_required, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', tuple(response_data.values()))
            
            response_id = cursor.lastrowid
            
            # Update application status
            cursor.execute('''
                UPDATE applications 
                SET status = ?, updated_at = ?
                WHERE id = ?
            ''', (status.lower(), datetime.now().isoformat(), application_id))
            
            conn.commit()
            
            logger.info(f"Added response {response_id} for application {application_id}")
            return response_id
            
        except sqlite3.Error as e:
            logger.error(f"Failed to add response: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def get_applications(self, status: str = None, opportunity_id: str = None) -> List[Dict]:
        """
        Get applications with optional filtering
        
        Args:
            status: Filter by application status
            opportunity_id: Filter by opportunity ID
            
        Returns:
            List of application dictionaries
        """
        conn = self._get_connection()
        
        try:
            query = '''
                SELECT a.*, o.title as opportunity_title, o.agency
                FROM applications a
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                WHERE 1=1
            '''
            params = []
            
            if status:
                query += ' AND a.status = ?'
                params.append(status.lower())
            
            if opportunity_id:
                query += ' AND a.opportunity_id = ?'
                params.append(opportunity_id)
            
            query += ' ORDER BY a.created_at DESC'
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            applications = [dict(row) for row in cursor.fetchall()]
            
            return applications
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get applications: {e}")
            return []
        finally:
            conn.close()
    
    def get_responses(self, application_id: int = None, status: str = None) -> List[Dict]:
        """
        Get responses with optional filtering
        
        Args:
            application_id: Filter by application ID
            status: Filter by response status
            
        Returns:
            List of response dictionaries
        """
        conn = self._get_connection()
        
        try:
            query = '''
                SELECT r.*, a.applicant_name, a.opportunity_id, 
                       o.title as opportunity_title, o.agency
                FROM responses r
                JOIN applications a ON r.application_id = a.id
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                WHERE 1=1
            '''
            params = []
            
            if application_id:
                query += ' AND r.application_id = ?'
                params.append(application_id)
            
            if status:
                query += ' AND r.status = ?'
                params.append(status.lower())
            
            query += ' ORDER BY r.created_at DESC'
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            responses = [dict(row) for row in cursor.fetchall()]
            
            return responses
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get responses: {e}")
            return []
        finally:
            conn.close()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get summary statistics"""
        conn = self._get_connection()
        
        try:
            stats = {}
            cursor = conn.cursor()
            
            # Application statistics
            cursor.execute('SELECT COUNT(*) FROM applications')
            stats['total_applications'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT status, COUNT(*) FROM applications GROUP BY status')
            stats['applications_by_status'] = dict(cursor.fetchall())
            
            # Response statistics
            cursor.execute('SELECT COUNT(*) FROM responses')
            stats['total_responses'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT status, COUNT(*) FROM responses GROUP BY status')
            stats['responses_by_status'] = dict(cursor.fetchall())
            
            # Opportunity statistics
            cursor.execute('SELECT COUNT(*) FROM opportunities')
            stats['total_opportunities'] = cursor.fetchone()[0]
            
            # Success rate
            if stats['total_responses'] > 0:
                accepted = stats['responses_by_status'].get('accepted', 0)
                stats['success_rate'] = round(accepted / stats['total_responses'] * 100, 2)
            else:
                stats['success_rate'] = 0.0
            
            return stats
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get statistics: {e}")
            return {}
        finally:
            conn.close()
    
    def verify_database_integrity(self) -> Dict[str, Any]:
        """Verify database integrity and check for issues"""
        conn = self._get_connection()
        issues = []
        
        try:
            cursor = conn.cursor()
            
            # Check for applications without opportunities
            cursor.execute('''
                SELECT COUNT(*) FROM applications a
                LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id
                WHERE o.opportunity_id IS NULL
            ''')
            missing_opps = cursor.fetchone()[0]
            if missing_opps > 0:
                issues.append(f"{missing_opps} applications reference missing opportunities")
            
            # Check for responses without applications
            cursor.execute('''
                SELECT COUNT(*) FROM responses r
                LEFT JOIN applications a ON r.application_id = a.id
                WHERE a.id IS NULL
            ''')
            missing_apps = cursor.fetchone()[0]
            if missing_apps > 0:
                issues.append(f"{missing_apps} responses reference missing applications")
            
            # Check for missing evidence files
            cursor.execute('''
                SELECT COUNT(*) FROM responses 
                WHERE evidence_file_path != '' AND evidence_file_path IS NOT NULL
            ''')
            total_evidence_refs = cursor.fetchone()[0]
            
            cursor.execute('''
                SELECT evidence_file_path FROM responses 
                WHERE evidence_file_path != '' AND evidence_file_path IS NOT NULL
            ''')
            evidence_files = [row[0] for row in cursor.fetchall()]
            
            missing_files = 0
            for file_path in evidence_files:
                if not os.path.exists(file_path):
                    missing_files += 1
            
            if missing_files > 0:
                issues.append(f"{missing_files} evidence files are missing from disk")
            
            return {
                'integrity_ok': len(issues) == 0,
                'issues': issues,
                'total_evidence_references': total_evidence_refs,
                'missing_files': missing_files
            }
            
        except sqlite3.Error as e:
            logger.error(f"Database integrity check failed: {e}")
            return {'integrity_ok': False, 'error': str(e)}
        finally:
            conn.close()


# Convenience functions for command-line usage
def get_tracker(db_path: str = None) -> TrackerDB:
    """Get a TrackerDB instance"""
    return TrackerDB(db_path)

if __name__ == "__main__":
    # Simple test
    tracker = get_tracker()
    stats = tracker.get_statistics()
    print("Database Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
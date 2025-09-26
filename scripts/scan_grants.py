#!/usr/bin/env python3
"""
Grants.gov Opportunity Scanner

This script scans Grants.gov for available opportunities and saves them to both
SQLite database and CSV format for further analysis.
"""

import os
import csv
import json
import sqlite3
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GRANTS_API_ENDPOINT = os.getenv('GRANTS_API_ENDPOINT', 
                               'https://www.grants.gov/grantsws/rest/opportunities/search/')
DATABASE_PATH = os.getenv('DATABASE_PATH', 'tracker.db')
OUTPUT_DIR = os.getenv('OUTPUT_DIR', './')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GrantsScanner:
    """Scanner for Grants.gov opportunities"""
    
    def __init__(self):
        self.api_endpoint = GRANTS_API_ENDPOINT
        self.database_path = DATABASE_PATH
        self.output_dir = OUTPUT_DIR
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'simpler-grants-gov-scanner/1.0',
            'Accept': 'application/json'
        })
    
    def init_database(self):
        """Initialize the opportunities table if it doesn't exist"""
        conn = sqlite3.connect(self.database_path)
        try:
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
            conn.commit()
            logger.info("Database initialized successfully")
        except sqlite3.Error as e:
            logger.error(f"Database initialization error: {e}")
        finally:
            conn.close()
    
    def search_opportunities(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Search for grant opportunities
        
        Args:
            days_ahead: Number of days ahead to search for opportunities
            
        Returns:
            List of opportunity dictionaries
        """
        opportunities = []
        
        try:
            # Calculate date range
            start_date = datetime.now()
            end_date = start_date + timedelta(days=days_ahead)
            
            # Prepare search parameters
            params = {
                'format': 'json',
                'rows': 1000,  # Maximum allowed
                'sortby': 'openDate|desc',
                'startRecordNum': 0
            }
            
            # Add date filters if API supports them
            # Note: Grants.gov API structure may vary - adjust as needed
            
            response = self.session.get(self.api_endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse response based on Grants.gov API structure
            # This is a simplified version - actual API structure may differ
            if 'opportunitiesFound' in data:
                opportunities = data.get('opportunitiesFound', [])
            elif 'results' in data:
                opportunities = data.get('results', [])
            else:
                # Fallback for different API responses
                opportunities = data if isinstance(data, list) else []
            
            logger.info(f"Found {len(opportunities)} opportunities")
            
        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during search: {e}")
        
        return opportunities
    
    def save_to_database(self, opportunities: List[Dict[str, Any]]) -> int:
        """
        Save opportunities to SQLite database
        
        Args:
            opportunities: List of opportunity dictionaries
            
        Returns:
            Number of new opportunities saved
        """
        if not opportunities:
            return 0
        
        conn = sqlite3.connect(self.database_path)
        saved_count = 0
        
        try:
            cursor = conn.cursor()
            current_time = datetime.now().isoformat()
            
            for opp in opportunities:
                # Extract and clean data - adjust field names based on actual API response
                opportunity_data = {
                    'opportunity_id': str(opp.get('opportunityID', opp.get('id', ''))),
                    'title': opp.get('opportunityTitle', opp.get('title', ''))[:500],  # Truncate if too long
                    'agency': opp.get('agencyName', opp.get('agency', ''))[:200],
                    'category': opp.get('categoryDescription', opp.get('category', ''))[:200],
                    'funding_instrument': opp.get('fundingInstrumentDescription', '')[:200],
                    'eligible_applicants': str(opp.get('eligibleApplicants', ''))[:500],
                    'posted_date': opp.get('postedDate', ''),
                    'closing_date': opp.get('closingDate', ''),
                    'estimated_funding': str(opp.get('estimatedFunding', '')),
                    'description': opp.get('description', '')[:1000],  # Truncate long descriptions
                    'last_updated': current_time
                }
                
                # Skip if no opportunity ID
                if not opportunity_data['opportunity_id']:
                    continue
                
                try:
                    cursor.execute('''
                        INSERT OR REPLACE INTO opportunities 
                        (opportunity_id, title, agency, category, funding_instrument,
                         eligible_applicants, posted_date, closing_date, estimated_funding,
                         description, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', tuple(opportunity_data.values()))
                    saved_count += 1
                    
                except sqlite3.Error as e:
                    logger.warning(f"Failed to save opportunity {opportunity_data['opportunity_id']}: {e}")
                    continue
            
            conn.commit()
            logger.info(f"Saved {saved_count} opportunities to database")
            
        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
            conn.rollback()
        finally:
            conn.close()
        
        return saved_count
    
    def export_to_csv(self, filename: str = None) -> str:
        """
        Export opportunities to CSV file
        
        Args:
            filename: Output filename (optional)
            
        Returns:
            Path to created CSV file
        """
        if not filename:
            filename = f"opportunities_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        output_path = os.path.join(self.output_dir, filename)
        
        conn = sqlite3.connect(self.database_path)
        
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT opportunity_id, title, agency, category, funding_instrument,
                       eligible_applicants, posted_date, closing_date, 
                       estimated_funding, description, last_updated, created_at
                FROM opportunities 
                ORDER BY posted_date DESC
            ''')
            
            rows = cursor.fetchall()
            
            # Write to CSV
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Opportunity ID', 'Title', 'Agency', 'Category', 
                    'Funding Instrument', 'Eligible Applicants', 
                    'Posted Date', 'Closing Date', 'Estimated Funding',
                    'Description', 'Last Updated', 'Created At'
                ])
                
                # Write data
                writer.writerows(rows)
            
            logger.info(f"Exported {len(rows)} opportunities to {output_path}")
            
        except sqlite3.Error as e:
            logger.error(f"Database error during export: {e}")
        except IOError as e:
            logger.error(f"File I/O error during export: {e}")
        finally:
            conn.close()
        
        return output_path


def main():
    """Main execution function"""
    logger.info("Starting grants scan...")
    
    scanner = GrantsScanner()
    
    # Initialize database
    scanner.init_database()
    
    # Search for opportunities
    opportunities = scanner.search_opportunities(days_ahead=60)
    
    if opportunities:
        # Save to database
        saved_count = scanner.save_to_database(opportunities)
        
        # Export to CSV
        csv_path = scanner.export_to_csv("opportunities.csv")
        
        logger.info(f"Scan completed. Saved {saved_count} opportunities. CSV: {csv_path}")
    else:
        logger.warning("No opportunities found or API request failed")
    
    logger.info("Grants scan finished.")


if __name__ == "__main__":
    main()
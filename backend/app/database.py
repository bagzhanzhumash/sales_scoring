"""
Simple database setup for manager performance scorecards
"""

import sqlite3
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import json


class ManagerScorecardDB:
    """Simple database for storing manager performance scorecards"""
    
    def __init__(self, db_path: str = "manager_scorecards.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database and create tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create manager_scorecards table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS manager_scorecards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT UNIQUE NOT NULL,
                    manager_name TEXT NOT NULL,
                    scorecard TEXT NOT NULL,  -- JSON string containing all scores
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    calls INTEGER DEFAULT 0,
                    flag_calls INTEGER DEFAULT 0,
                    red_flags INTEGER DEFAULT 0,
                    dismissed INTEGER DEFAULT 0,
                    avg_duration REAL DEFAULT 0.0,
                    avg_score INTEGER DEFAULT 0,
                    compliance INTEGER DEFAULT 0,
                    hostile_approach INTEGER DEFAULT 0,
                    objection_handling INTEGER DEFAULT 0,
                    empathy_deficit INTEGER DEFAULT 0
                )
            """)
            
            # Create index for faster queries
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_manager_name ON manager_scorecards(manager_name)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON manager_scorecards(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_unique_id ON manager_scorecards(unique_id)")
            
            conn.commit()
    
    def add_scorecard(self, manager_name: str, scorecard_data: Dict) -> str:
        """Add a new scorecard entry for a manager"""
        unique_id = str(uuid.uuid4())
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO manager_scorecards (
                    unique_id, manager_name, scorecard, calls, flag_calls, red_flags,
                    dismissed, avg_duration, avg_score, compliance, hostile_approach,
                    objection_handling, empathy_deficit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                unique_id,
                manager_name,
                json.dumps(scorecard_data),
                scorecard_data.get('calls', 0),
                scorecard_data.get('flagCalls', 0),
                scorecard_data.get('redFlags', 0),
                scorecard_data.get('dismissed', 0),
                scorecard_data.get('avgDuration', 0.0),
                scorecard_data.get('avgScore', 0),
                scorecard_data.get('compliance', 0),
                scorecard_data.get('hostileApproach', 0),
                scorecard_data.get('objectionHandling', 0),
                scorecard_data.get('empathyDeficit', 0)
            ))
            
            conn.commit()
        
        return unique_id
    
    def get_scorecard(self, unique_id: str) -> Optional[Dict]:
        """Get a specific scorecard by unique_id"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM manager_scorecards WHERE unique_id = ?
            """, (unique_id,))
            
            row = cursor.fetchone()
            if row:
                return self._row_to_dict(cursor, row)
            return None
    
    def get_manager_scorecards(self, manager_name: str, limit: int = 50) -> List[Dict]:
        """Get all scorecards for a specific manager"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM manager_scorecards 
                WHERE manager_name = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (manager_name, limit))
            
            rows = cursor.fetchall()
            return [self._row_to_dict(cursor, row) for row in rows]
    
    def get_all_managers(self) -> List[str]:
        """Get list of all unique manager names"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT DISTINCT manager_name FROM manager_scorecards
                ORDER BY manager_name
            """)
            
            return [row[0] for row in cursor.fetchall()]
    
    def get_latest_scorecards(self, limit: int = 100) -> List[Dict]:
        """Get the most recent scorecards across all managers"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM manager_scorecards 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [self._row_to_dict(cursor, row) for row in rows]
    
    def update_scorecard(self, unique_id: str, scorecard_data: Dict) -> bool:
        """Update an existing scorecard"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE manager_scorecards SET
                    scorecard = ?,
                    calls = ?,
                    flag_calls = ?,
                    red_flags = ?,
                    dismissed = ?,
                    avg_duration = ?,
                    avg_score = ?,
                    compliance = ?,
                    hostile_approach = ?,
                    objection_handling = ?,
                    empathy_deficit = ?,
                    timestamp = CURRENT_TIMESTAMP
                WHERE unique_id = ?
            """, (
                json.dumps(scorecard_data),
                scorecard_data.get('calls', 0),
                scorecard_data.get('flagCalls', 0),
                scorecard_data.get('redFlags', 0),
                scorecard_data.get('dismissed', 0),
                scorecard_data.get('avgDuration', 0.0),
                scorecard_data.get('avgScore', 0),
                scorecard_data.get('compliance', 0),
                scorecard_data.get('hostileApproach', 0),
                scorecard_data.get('objectionHandling', 0),
                scorecard_data.get('empathyDeficit', 0),
                unique_id
            ))
            
            return cursor.rowcount > 0
    
    def delete_scorecard(self, unique_id: str) -> bool:
        """Delete a scorecard by unique_id"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM manager_scorecards WHERE unique_id = ?", (unique_id,))
            return cursor.rowcount > 0
    
    def get_manager_stats(self, manager_name: str) -> Dict:
        """Get aggregate statistics for a manager"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_entries,
                    AVG(calls) as avg_calls,
                    AVG(avg_score) as avg_performance_score,
                    AVG(compliance) as avg_compliance,
                    AVG(hostile_approach) as avg_hostile_approach,
                    AVG(objection_handling) as avg_objection_handling,
                    AVG(empathy_deficit) as avg_empathy_deficit,
                    MIN(timestamp) as first_entry,
                    MAX(timestamp) as last_entry
                FROM manager_scorecards 
                WHERE manager_name = ?
            """, (manager_name,))
            
            row = cursor.fetchone()
            if row:
                columns = [description[0] for description in cursor.description]
                return dict(zip(columns, row))
            return {}
    
    def _row_to_dict(self, cursor, row) -> Dict:
        """Convert sqlite row to dictionary"""
        columns = [description[0] for description in cursor.description]
        data = dict(zip(columns, row))
        
        # Parse the JSON scorecard data
        if data.get('scorecard'):
            try:
                data['scorecard'] = json.loads(data['scorecard'])
            except json.JSONDecodeError:
                data['scorecard'] = {}
        
        return data


# Initialize the database instance
db = ManagerScorecardDB()


def seed_database():
    """Seed the database with sample data"""
    sample_managers = [
        {
            "name": "Cameron Williamson",
            "data": {
                "calls": 232,
                "flagCalls": 21,
                "redFlags": 21,
                "dismissed": 21,
                "avgDuration": 3.3,
                "avgScore": 21,
                "compliance": 34,
                "hostileApproach": 34,
                "objectionHandling": 25,
                "empathyDeficit": 25
            }
        },
        {
            "name": "Annette Black",
            "data": {
                "calls": 232,
                "flagCalls": 10,
                "redFlags": 10,
                "dismissed": 10,
                "avgDuration": 23.3,
                "avgScore": 21,
                "compliance": 46,
                "hostileApproach": 13,
                "objectionHandling": 13,
                "empathyDeficit": 13
            }
        },
        {
            "name": "Jenny Wilson",
            "data": {
                "calls": 232,
                "flagCalls": 1,
                "redFlags": 1,
                "dismissed": 1,
                "avgDuration": 13.3,
                "avgScore": 21,
                "compliance": 70,
                "hostileApproach": 6,
                "objectionHandling": 15,
                "empathyDeficit": 6
            }
        },
        {
            "name": "Ralph Edwards",
            "data": {
                "calls": 232,
                "flagCalls": 15,
                "redFlags": 15,
                "dismissed": 15,
                "avgDuration": 3.3,
                "avgScore": 21,
                "compliance": 46,
                "hostileApproach": 21,
                "objectionHandling": 21,
                "empathyDeficit": 21
            }
        },
        {
            "name": "Albert Flores",
            "data": {
                "calls": 232,
                "flagCalls": 39,
                "redFlags": 39,
                "dismissed": 39,
                "avgDuration": 33.3,
                "avgScore": 21,
                "compliance": 1,
                "hostileApproach": 18,
                "objectionHandling": 18,
                "empathyDeficit": 18
            }
        },
        {
            "name": "Jane Cooper",
            "data": {
                "calls": 211,
                "flagCalls": 24,
                "redFlags": 24,
                "dismissed": 24,
                "avgDuration": 1.3,
                "avgScore": 21,
                "compliance": 40,
                "hostileApproach": 32,
                "objectionHandling": 32,
                "empathyDeficit": 32
            }
        }
    ]
    
    # Add sample data
    for manager in sample_managers:
        db.add_scorecard(manager["name"], manager["data"])
    
    print(f"Database seeded with {len(sample_managers)} manager scorecards")


if __name__ == "__main__":
    # Seed the database with sample data
    seed_database()
    
    # Test the database
    print("\nAll managers:", db.get_all_managers())
    print("\nLatest scorecards:", len(db.get_latest_scorecards()))
    
    # Get stats for one manager
    stats = db.get_manager_stats("Cameron Williamson")
    print(f"\nCameron Williamson stats: {stats}")

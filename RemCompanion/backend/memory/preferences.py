import sqlite3
import os
DB_PATH = os.path.join(os.path.dirname(__file__), "user_prefs.db")
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()
def set_preference(key: str, value: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('REPLACE INTO preferences (key, value) VALUES (?, ?)', (key, value))
    conn.commit()
    conn.close()
def get_preference(key: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM preferences WHERE key = ?', (key,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None
init_db()
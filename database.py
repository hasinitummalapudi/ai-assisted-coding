
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
import json

DB_PATH = Path(__file__).parent / "nutriai.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age INTEGER,
                height REAL,
                weight REAL,
                diet TEXT,
                cuisine TEXT,
                created_at TEXT,
                nutrition_json TEXT NOT NULL DEFAULT '{}',
                meals_json TEXT NOT NULL DEFAULT '[]'
            )
        """)


def save_plan(data, nutrition, meals):
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO plans (
                age, height, weight, diet, cuisine,
                created_at, nutrition_json, meals_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            int(data["age"]),
            float(data["height"]),
            float(data["weight"]),
            data.get("diet", "Vegetarian"),
            data.get("cuisine", "Indian"),
            datetime.now(timezone.utc).isoformat(),
            json.dumps(nutrition),
            json.dumps(meals)
        ))

        return str(cursor.lastrowid)


def get_recent_plans():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT *
            FROM plans
            ORDER BY id DESC
            LIMIT 20
        """).fetchall()

    plans = []

    for row in rows:
        keys = row.keys()

        plans.append({
            "id": str(row["id"]),
            "age": row["age"],
            "height": row["height"],
            "weight": row["weight"],
            "diet": row["diet"],
            "cuisine": row["cuisine"],
            "created_at": row["created_at"],
            "nutrition": json.loads(
                row["nutrition_json"] or "{}"
            ),
            "meals": json.loads(
                row["meals_json"] or "[]"
            )
        })

    return plans

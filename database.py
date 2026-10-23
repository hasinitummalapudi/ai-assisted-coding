
import os
import json
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is missing. Check your .env file."
        )

    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
        connect_timeout=10
    )


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS public.meal_plans (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                age INTEGER NOT NULL,
                height REAL NOT NULL,
                weight REAL NOT NULL,
                diet TEXT DEFAULT 'Vegetarian',
                cuisine TEXT DEFAULT 'Indian',
                nutrition JSONB DEFAULT '{}'::jsonb,
                meals JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)


def save_plan(data, nutrition, meals):
    with get_connection() as conn:
        row = conn.execute("""
            INSERT INTO public.meal_plans (
                age, height, weight, diet, cuisine,
                nutrition, meals
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            int(data["age"]),
            float(data["height"]),
            float(data["weight"]),
            data.get("diet", "Vegetarian"),
            data.get("cuisine", "Indian"),
            Jsonb(nutrition),
            Jsonb(meals)
        )).fetchone()

        return str(row["id"])


def get_recent_plans():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, age, height, weight, diet, cuisine,
                   created_at, nutrition, meals
            FROM public.meal_plans
            ORDER BY id DESC
            LIMIT 20
        """).fetchall()

    plans = []
    for row in rows:
        plans.append({
            "id": str(row["id"]),
            "age": row["age"],
            "height": row["height"],
            "weight": row["weight"],
            "diet": row["diet"],
            "cuisine": row["cuisine"],
            "created_at": row["created_at"].isoformat()
                if row["created_at"] else None,
            "nutrition": row["nutrition"] or {},
            "meals": row["meals"] or []
        })

    return plans

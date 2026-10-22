
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = None
plans_collection = None


def init_db():
    global client, plans_collection

    if not MONGODB_URI:
        raise RuntimeError(
            "MONGODB_URI is missing. Check your .env file."
        )

    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=10000
    )

    # Verify that MongoDB is reachable.
    client.admin.command("ping")

    db = client["nutriai"]
    plans_collection = db["plans"]

    # Show newest plans first efficiently.
    plans_collection.create_index(
        [("created_at", DESCENDING)]
    )

    print("NutriAI MongoDB connected successfully!")


def save_plan(data, nutrition, meals):
    if plans_collection is None:
        raise RuntimeError("Call init_db() before saving plans.")

    plan = {
        "age": int(data["age"]),
        "height": float(data["height"]),
        "weight": float(data["weight"]),
        "diet": data.get("diet", "Vegetarian"),
        "cuisine": data.get("cuisine", "Indian"),
        "created_at": datetime.now(timezone.utc),
        "nutrition": nutrition,
        "meals": meals
    }

    result = plans_collection.insert_one(plan)

    return str(result.inserted_id)


def get_recent_plans():
    if plans_collection is None:
        raise RuntimeError("Call init_db() before reading plans.")

    plans = plans_collection.find(
        {},
        {
            "age": 1,
            "height": 1,
            "weight": 1,
            "diet": 1,
            "cuisine": 1,
            "created_at": 1,
            "nutrition": 1,
            "meals": 1
        }
    ).sort("_id", DESCENDING).limit(20)

    return [
        {
            "id": str(plan["_id"]),
            "age": plan.get("age"),
            "height": plan.get("height"),
            "weight": plan.get("weight"),
            "diet": plan.get("diet"),
            "cuisine": plan.get("cuisine"),
            "created_at": plan.get("created_at"),
            "nutrition": plan.get("nutrition", {}),
            "meals": plan.get("meals", [])
        }
        for plan in plans
    ]

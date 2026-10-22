from database import init_db, save_plan, get_recent_plans

init_db()

plan_id = save_plan(
    {
        "age": 20,
        "height": 165,
        "weight": 60,
        "diet": "Vegetarian",
        "cuisine": "Indian"
    },
    {
        "calorie_estimate": 2000,
        "protein_estimate": 48
    },
    [
        {"meal": "Breakfast", "items": ["Oats", "Banana"]},
        {"meal": "Lunch", "items": ["Rice", "Dal"]},
        {"meal": "Dinner", "items": ["Chapati", "Vegetables"]}
    ]
)

print("Saved plan ID:", plan_id)
print("Recent plans:", get_recent_plans())

import csv
import random
from pathlib import Path

DATA_PATH = (
    Path(__file__).parent
    / "data"
    / "Indian_Food_Nutrition_Processed.csv"
)

def load_foods():
    """Load food data from the CSV file."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Food dataset not found: {DATA_PATH}"
        )

    with DATA_PATH.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:
        foods = list(csv.DictReader(file))

    if not foods:
        raise ValueError("The food CSV file is empty.")

    numeric_fields = [
        "calories", "protein", "carbs", "fat",
        "fibre", "free_sugar", "sodium", "calcium",
        "iron", "vitamin_c", "folate"
    ]

    cleaned_foods = []
    seen_names = set()

    for food in foods:
        # Support both the original nutrition CSV
        # and the prepared foods.csv format.
        name = (
            food.get("name")
            or food.get("Dish Name")
            or ""
        ).strip()

        if not name or name.casefold() in seen_names:
            continue

        seen_names.add(name.casefold())

        item = {
            "name": name,
            "meal_type": (
                food.get("meal_type")
                or "Main"
            ).strip(),
            "cuisine": (
                food.get("cuisine")
                or "Indian"
            ).strip(),
            "ingredients": (
                food.get("ingredients") or ""
            ).strip(),
            "diet": (
                food.get("diet") or "Unverified"
            ).strip(),
        }

        # Map the CSV's original column names.
        source_fields = {
            "calories": "Calories (kcal)",
            "protein": "Protein (g)",
            "carbs": "Carbohydrates (g)",
            "fat": "Fats (g)",
            "fibre": "Fibre (g)",
            "free_sugar": "Free Sugar (g)",
            "sodium": "Sodium (mg)",
            "calcium": "Calcium (mg)",
            "iron": "Iron (mg)",
            "vitamin_c": "Vitamin C (mg)",
            "folate": "Folate (µg)",
        }

        for field in numeric_fields:
            value = food.get(field)

            if value in (None, ""):
                value = food.get(source_fields[field], 0)

            try:
                item[field] = float(value or 0)
            except (TypeError, ValueError):
                item[field] = 0.0

        cleaned_foods.append(item)

    if not cleaned_foods:
        raise ValueError(
            "No valid food names were found in the CSV. "
            "Please check the CSV column headings."
        )

    return cleaned_foods


def _terms(values):
    """Convert comma-separated preferences into a list."""
    if not values:
        return []

    if isinstance(values, str):
        values = values.split(",")

    return [
        str(value).strip().casefold()
        for value in values
        if str(value).strip()
    ]


def _eligible_foods(
    foods,
    diet="Vegetarian",
    cuisine="Indian",
    allergies=None,
    disliked=None,
):
    """Apply available preference filters."""
    allergy_terms = _terms(allergies)
    disliked_terms = _terms(disliked)

    selected = []

    for food in foods:
        name = food["name"].casefold()
        food_diet = food["diet"].casefold()
        food_cuisine = food["cuisine"].casefold()

        # Exclude foods whose names match disliked terms.
        if any(term in name for term in disliked_terms):
            continue

        # Check allergy terms against names only.
        # This cannot verify hidden ingredients.
        if any(term in name for term in allergy_terms):
            continue

        requested_diet = (diet or "").strip().casefold()

        # Exclude foods explicitly marked non-vegetarian.
        # The CSV cannot verify every dish's ingredients.
        if requested_diet in ("vegetarian", "vegan"):
            if "non-vegetarian" in food_diet:
                continue

        if requested_diet == "vegan":
            if any(
                term in name
                for term in (
                    "milk", "cheese", "paneer", "curd",
                    "yogurt", "ghee", "butter", "cream",
                    "egg", "omelette", "honey"
                )
            ):
                continue

        requested_cuisine = (cuisine or "").strip().casefold()

        if (
            requested_cuisine
            and requested_cuisine != "any"
            and food_cuisine != requested_cuisine
        ):
            continue

        selected.append(food)

    return selected


def _is_suggestible(food):
    """Keep drinks and condiments out of ordinary meal plans."""
    return food["meal_type"].casefold() not in (
        "beverage", "condiment", "drink"
    )


def _unique_random_foods(foods, count, excluded=None):
    """Pick random, unique dishes with meal-type variety."""
    excluded_names = {
        str(name).strip().casefold()
        for name in (excluded or [])
        if str(name).strip()
    }

    candidates = [
        food for food in foods
        if food["name"].casefold() not in excluded_names
        and _is_suggestible(food)
    ]

    random.shuffle(candidates)

    chosen = []
    used_names = set()
    used_types = set()

    # First, try to select different meal types.
    for food in candidates:
        meal_type = food["meal_type"].casefold()

        if (
            food["name"].casefold() not in used_names
            and meal_type not in used_types
        ):
            chosen.append(food)
            used_names.add(food["name"].casefold())
            used_types.add(meal_type)

            if len(chosen) >= count:
                return chosen

    # Fill remaining places with other unique dishes.
    for food in candidates:
        if food["name"].casefold() not in used_names:
            chosen.append(food)
            used_names.add(food["name"].casefold())

            if len(chosen) >= count:
                break

    return chosen


def recommend_meals(
    diet="Vegetarian",
    cuisine="Indian",
    allergies=None,
    disliked=None,
    count=4,
):
    """Generate a varied selection of meals."""
    foods = load_foods()

    eligible = _eligible_foods(
        foods,
        diet=diet,
        cuisine=cuisine,
        allergies=allergies,
        disliked=disliked,
    )

    return _unique_random_foods(eligible, count)


def replace_meal(
    current_food="",
    meal_type="",
    diet="Vegetarian",
    cuisine="Indian",
    allergies=None,
    disliked=None,
    used_meals=None,
):
    """Replace a dish with a different eligible dish."""
    foods = load_foods()

    eligible = _eligible_foods(
        foods,
        diet=diet,
        cuisine=cuisine,
        allergies=allergies,
        disliked=disliked,
    )

    excluded = list(used_meals or [])
    excluded.append(current_food)

    # Prefer a replacement of the same meal type.
    requested_type = (meal_type or "").strip().casefold()

    same_type = [
        food for food in eligible
        if food["meal_type"].casefold() == requested_type
    ]

    replacements = _unique_random_foods(
        same_type, 1, excluded=excluded
    )

    # If that type has no alternatives, try other meal types.
    if not replacements:
        replacements = _unique_random_foods(
            eligible, 1, excluded=excluded
        )

    if replacements:
        return replacements[0]

    return None


def find_kitchen_meals(
    ingredients,
    diet="Vegetarian",
    cuisine="Indian",
    allergies=None,
    disliked=None,
):
    """Find dishes whose names match supplied search terms."""
    foods = load_foods()

    eligible = _eligible_foods(
        foods,
        diet=diet,
        cuisine=cuisine,
        allergies=allergies,
        disliked=disliked,
    )

    terms = _terms(ingredients)

    if not terms:
        return []

    matches = []

    for food in eligible:
        searchable_text = (
            food["name"] + " " + food["ingredients"]
        ).casefold()

        if any(term in searchable_text for term in terms):
            matches.append(food)

    random.shuffle(matches)
    return matches[:10]

import csv
from pathlib import Path

DATA_PATH = Path(__file__).parent / 'data' / 'foods.csv'


def load_foods():
    with DATA_PATH.open(encoding='utf-8', newline='') as f:
        foods = list(csv.DictReader(f))
    for food in foods:
        for key in ('calories', 'protein', 'carbs', 'fat'):
            food[key] = int(food[key])
    return foods


def _terms(values):
    if isinstance(values, str):
        values = values.split(',')
    return [str(x).strip().lower() for x in (values or []) if str(x).strip()]


def _allowed_diets(diet):
    return {
        'vegetarian': {'vegetarian', 'vegan'},
        'vegan': {'vegan'},
        'non-vegetarian': {'vegetarian', 'vegan', 'non-vegetarian'},
    }.get(str(diet).lower(), {'vegetarian', 'vegan'})


def _safe_food(food, diet, allergies, disliked):
    text = (food['name'] + ' ' + food['ingredients']).lower()
    return (
        food['diet'].lower() in _allowed_diets(diet)
        and not any(term in text for term in allergies)
        and not any(term in text for term in disliked)
    )


def _public_food(food):
    return {key: food[key] for key in ('name', 'meal_type', 'cuisine', 'ingredients', 'diet', 'calories', 'protein', 'carbs', 'fat')}


def recommend_meals(diet='Vegetarian', cuisine='Indian', allergies=None, disliked=None, count=4):
    allergies, disliked = _terms(allergies), _terms(disliked)
    foods = [f for f in load_foods() if _safe_food(f, diet, allergies, disliked)]
    preferred = [f for f in foods if f['cuisine'].lower() == str(cuisine).lower()]
    ordered = preferred + [f for f in foods if f not in preferred]
    chosen, kinds = [], set()
    for food in ordered:
        if food['meal_type'] not in kinds:
            chosen.append(food)
            kinds.add(food['meal_type'])
        if len(chosen) >= count:
            break
    for food in ordered:
        if len(chosen) >= count:
            break
        if food not in chosen:
            chosen.append(food)
    return [_public_food(f) for f in chosen[:count]]


def replace_meal(current_food='', meal_type='', diet='Vegetarian', cuisine='Indian', allergies=None, disliked=None, used_meals=None):
    allergies, disliked = _terms(allergies), _terms(disliked)
    used = {str(x).strip().lower() for x in (used_meals or [])}
    current = str(current_food).strip().lower()
    foods = [f for f in load_foods() if _safe_food(f, diet, allergies, disliked)]
    if meal_type:
        same_type = [f for f in foods if f['meal_type'].lower() == str(meal_type).lower()]
        if same_type:
            foods = same_type
    foods = [f for f in foods if f['name'].lower() != current and f['name'].lower() not in used]
    foods.sort(key=lambda f: (f['cuisine'].lower() != str(cuisine).lower(), f['name'].lower()))
    return _public_food(foods[0]) if foods else None


def find_kitchen_meals(ingredients, diet='Vegetarian', cuisine='Indian', allergies=None, disliked=None):
    available = _terms(ingredients)
    if not available:
        return []
    foods = [f for f in load_foods() if _safe_food(f, diet, _terms(allergies), _terms(disliked))]
    scored = []
    for food in foods:
        ingredient_terms = _terms(food['ingredients'])
        matched = [term for term in ingredient_terms if any(a in term or term in a for a in available)]
        if matched:
            scored.append((len(matched) / max(1, len(ingredient_terms)), len(matched), food, matched))
    scored.sort(key=lambda item: (-item[0], -item[1], item[2]['cuisine'].lower() != str(cuisine).lower()))
    result = []
    for score, count, food, matched in scored[:8]:
        item = _public_food(food)
        item['matched_ingredients'] = matched
        item['match_percent'] = round(score * 100)
        result.append(item)
    return result

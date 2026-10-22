from database import init_db, save_plan, get_recent_plans
from flask import Flask, render_template, request, jsonify
from database import init_db, save_plan, get_recent_plans
from recommender import recommend_meals, replace_meal, find_kitchen_meals
from nutrition import estimate_nutrition
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'local-demo-change-this')
init_db()

@app.get('/')
def home():
    return render_template('index.html')

@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Nutri AI is running'})

@app.post('/api/generate-plan')
def generate_plan():
    data = request.get_json(silent=True) or {}
    try:
        age = int(data.get('age', 0))
        height = float(data.get('height', 0))
        weight = float(data.get('weight', 0))
        if not 18 <= age <= 100:
            return jsonify({'error': 'For this educational demo, enter an age between 18 and 100.'}), 400
        if not 100 <= height <= 230 or not 25 <= weight <= 300:
            return jsonify({'error': 'Please check your height and weight values.'}), 400
        allergies = [x.strip().lower() for x in data.get('allergies', '').split(',') if x.strip()]
        disliked = [x.strip().lower() for x in data.get('disliked', '').split(',') if x.strip()]
        nutrition = estimate_nutrition(age, height, weight, data.get('activity', 'moderate'))
        meals = recommend_meals(data.get('diet', 'Vegetarian'), data.get('cuisine', 'Indian'), allergies, disliked, min(max(int(data.get('meals', 4)), 3), 5))
        if not meals:
            return jsonify({'error': 'No matching meals found. Try changing your preferences or exclusions.'}), 400
        plan_id = save_plan(data, nutrition, meals)
        return jsonify({'success': True, 'plan_id': plan_id, 'nutrition': nutrition, 'meals': meals})
    except (ValueError, TypeError):
        return jsonify({'error': 'Please enter valid numbers in the profile fields.'}), 400
    except Exception:
        app.logger.exception('Plan generation failed')
        return jsonify({'error': 'Something went wrong. Please try again.'}), 500

@app.post('/api/replace-meal')
def api_replace_meal():
    data = request.get_json(silent=True) or {}
    meal = replace_meal(
        current_food=data.get('current_food', ''),
        meal_type=data.get('meal_type', ''),
        diet=data.get('diet', 'Vegetarian'),
        cuisine=data.get('cuisine', 'Indian'),
        allergies=data.get('allergies', ''),
        disliked=data.get('disliked', ''),
        used_meals=data.get('used_meals', [])
    )
    if not meal:
        return jsonify({'error': 'No safe alternative was found in the current sample dataset. Try changing preferences.'}), 404
    return jsonify({'success': True, 'meal': meal})

@app.post('/api/kitchen-match')
def api_kitchen_match():
    data = request.get_json(silent=True) or {}
    meals = find_kitchen_meals(
        data.get('ingredients', ''), data.get('diet', 'Vegetarian'),
        data.get('cuisine', 'Indian'), data.get('allergies', ''), data.get('disliked', '')
    )
    return jsonify({'success': True, 'meals': meals})

@app.get('/api/history')
def history():
    return jsonify({'plans': get_recent_plans()})

@app.get('/api/insights')
def insights():
    plans = get_recent_plans()
    names, cuisines, diets = {}, {}, {}
    meal_count = 0
    for plan in plans:
        cuisines[plan.get('cuisine') or 'Other'] = cuisines.get(plan.get('cuisine') or 'Other', 0) + 1
        diets[plan.get('diet') or 'Other'] = diets.get(plan.get('diet') or 'Other', 0) + 1
        for meal in plan.get('meals', []):
            name = meal.get('name', 'Unknown')
            names[name] = names.get(name, 0) + 1
            meal_count += 1
    return jsonify({
        'plans_count': len(plans), 'meals_count': meal_count,
        'favorite_meals': sorted(names.items(), key=lambda x: (-x[1], x[0]))[:5],
        'cuisines': sorted(cuisines.items(), key=lambda x: (-x[1], x[0])),
        'diets': sorted(diets.items(), key=lambda x: (-x[1], x[0]))
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

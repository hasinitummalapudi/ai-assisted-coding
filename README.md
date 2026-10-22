# NutriAI — Smart Nutrition Planner

A beginner-friendly Flask project using a local CSV food dataset and SQLite. No paid AI API is required.

## Features

- Personalized sample meal-plan generation
- Estimated nutrition summary (educational estimates, not medical advice)
- Smart Food Swap: replace one meal while keeping the other meal cards unchanged
- Flexible 7-day sample calendar built from the generated meal ideas
- Grocery list generated from meal ingredients, with checkboxes and copy-list action
- What's in My Kitchen?: search meal ideas by ingredients available at home
- Food Preference Insights: summaries of repeated meals, cuisines, and food preferences from saved plans
- SQLite saved-plan history
- Responsive green-and-cream design

## Run on Windows (VS Code)

1. Extract this ZIP.
2. Open the extracted `NutriAI_New` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Create and activate a virtual environment (optional but recommended):

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

5. Install dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

6. Start the app:

   ```powershell
   py app.py
   ```

7. Open `http://127.0.0.1:5000` in your browser.

The app creates `nutriai.db` automatically. Existing saved history in a different folder/database will not automatically move into this copy. Keep a backup before replacing your original project.

## Important notes

- Meal suggestions are selected from `data/foods.csv`; this is a dataset-driven educational project, not a medical tool or generative AI model.
- Food Swap and Kitchen Match only know ingredients recorded in the dataset. Always check food labels and allergy safety yourself.
- The 7-day calendar is a flexible sample arrangement based on the current generated meals, not a clinically designed weekly nutrition prescription.

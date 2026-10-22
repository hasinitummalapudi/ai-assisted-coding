
const form = document.querySelector("#planForm");
const button = document.querySelector("#submitBtn");
const results = document.querySelector("#results");
const stats = document.querySelector("#stats");
const mealGrid = document.querySelector("#mealGrid");
const toast = document.querySelector("#toast");
const historyList = document.querySelector("#historyList");

let toastTimer;
let currentPlan = null;
let swapHistory = {};

// --------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------

function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// --------------------------------------------------
// SAFE TEXT HANDLING
// --------------------------------------------------

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// --------------------------------------------------
// MEAL EMOJIS
// --------------------------------------------------

function emoji(name) {
    const n = String(name).toLowerCase();

    if (n.includes("oat")) return "🥣";
    if (n.includes("egg")) return "🍳";
    if (n.includes("salad") || n.includes("bowl")) return "🥗";
    if (n.includes("fruit") || n.includes("apple")) return "🍎";
    if (n.includes("poha") || n.includes("idli") ||
        n.includes("chilla") || n.includes("dosa")) return "🥘";
    if (n.includes("fish") || n.includes("chicken")) return "🍛";
    if (n.includes("yogurt") || n.includes("paneer")) return "🥛";

    return "🍲";
}

// --------------------------------------------------
// USER PREFERENCES
// --------------------------------------------------

function getPrefs() {
    return Object.fromEntries(new FormData(form));
}

// --------------------------------------------------
// RECIPE GUIDE MODAL
// Created automatically with JavaScript
// --------------------------------------------------

function createRecipeModal() {
    if (document.querySelector("#recipeModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="recipeModal"
             role="dialog"
             aria-modal="true"
             aria-labelledby="recipeTitle"
             hidden
             style="
                position:fixed;
                inset:0;
                z-index:9999;
                background:rgba(20,20,20,.65);
                padding:20px;
                overflow-y:auto;
             ">

            <div style="
                max-width:650px;
                margin:35px auto;
                padding:28px;
                background:white;
                color:#222;
                border-radius:18px;
                box-shadow:0 10px 40px rgba(0,0,0,.2);
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:12px;
                ">
                    <h2 id="recipeTitle">🍲 Recipe Guide</h2>

                    <button type="button"
                            id="closeRecipe"
                            aria-label="Close recipe"
                            style="
                                border:0;
                                background:#f0f0f0;
                                border-radius:50%;
                                padding:10px 14px;
                                cursor:pointer;
                                font-size:18px;
                            ">✕</button>
                </div>

                <p id="recipeDescription"></p>

                <div id="recipeDetails"></div>

                <p style="
                    background:#fff6e8;
                    padding:12px;
                    border-radius:10px;
                    font-size:14px;
                ">
                    💡 Cooking tip: Follow the instructions for your
                    ingredients and adjust seasoning to your taste.
                </p>
            </div>
        </div>
    `);

    const modal = document.querySelector("#recipeModal");

    document.querySelector("#closeRecipe").addEventListener("click", () => {
        modal.hidden = true;
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.hidden = true;
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            modal.hidden = true;
        }
    });
}

// --------------------------------------------------
// RECIPE INSTRUCTIONS
// Uses a recipe template based on the meal name.
// Add specific recipes here for more accurate guides.
// --------------------------------------------------

function getRecipe(meal) {
    const name = String(meal.name || "Meal");
    const lower = name.toLowerCase();

    const ingredients = String(meal.ingredients || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

    let time = "15–20 minutes";
    let steps = [];

    if (lower.includes("oat")) {
        time = "10–15 minutes";

        steps = [
            "Measure the oats and your preferred milk or water.",
            "Heat the milk or water in a saucepan.",
            "Add the oats and cook over low to medium heat, stirring regularly, until soft.",
            "Add suitable fruit, nuts or other ingredients listed in your meal.",
            "Allow it to cool slightly before serving."
        ];
    } else if (lower.includes("egg")) {
        time = "10–15 minutes";

        steps = [
            "Wash your hands and prepare the listed ingredients.",
            "Crack the eggs into a bowl and beat them with a fork.",
            "Heat a lightly oiled pan and add any vegetables listed in the meal.",
            "Add the eggs and cook, stirring or folding as appropriate, until fully cooked.",
            "Serve warm with the suggested accompaniments."
        ];
    } else if (lower.includes("salad")) {
        time = "10–15 minutes";

        steps = [
            "Wash the vegetables and fruit thoroughly.",
            "Cut the ingredients into bite-sized pieces using a clean cutting board.",
            "Place the ingredients in a large bowl.",
            "Add the dressing or seasoning specified in your recipe.",
            "Mix gently and serve fresh."
        ];
    } else if (lower.includes("poha")) {
        time = "15–20 minutes";

        steps = [
            "Rinse the poha briefly in a sieve and allow it to soften.",
            "Heat a little oil in a pan and add the listed spices or seasonings.",
            "Add the vegetables and cook until tender.",
            "Mix in the softened poha and stir gently.",
            "Cook for a few more minutes, check the seasoning and serve."
        ];
    } else if (lower.includes("idli")) {
        time = "20–30 minutes, excluding batter preparation";

        steps = [
            "Prepare or use fermented idli batter.",
            "Grease the idli moulds lightly and pour in the batter.",
            "Place the moulds in a steamer with water.",
            "Steam until the idlis are cooked through.",
            "Allow them to cool slightly before removing and serving."
        ];
    } else if (lower.includes("dosa")) {
        time = "15–20 minutes";

        steps = [
            "Prepare or use fermented dosa batter.",
            "Heat a flat pan and lightly grease it.",
            "Pour a ladle of batter onto the pan and spread it in a thin circle.",
            "Cook until the underside is golden and the dosa releases easily.",
            "Fold and serve with suitable accompaniments."
        ];
    } else if (lower.includes("chilla")) {
        time = "15–20 minutes";

        steps = [
            "Mix the listed flour or ground pulses with water to form a pourable batter.",
            "Add the vegetables and seasonings listed in your meal.",
            "Heat a lightly oiled flat pan.",
            "Pour in the batter and spread it evenly.",
            "Cook both sides until firm and cooked through."
        ];
    } else if (lower.includes("paneer")) {
        time = "20–30 minutes";

        steps = [
            "Cut the paneer and vegetables into suitable pieces.",
            "Prepare the seasonings or sauce listed in the recipe.",
            "Heat a little oil in a pan and cook the vegetables.",
            "Add the paneer and sauce, then simmer until heated through.",
            "Check the seasoning and serve."
        ];
    } else if (lower.includes("chicken") || lower.includes("fish")) {
        time = "20–35 minutes, depending on the pieces";

        steps = [
            "Prepare the protein and season it with the ingredients listed in the recipe.",
            "Heat a little oil in a suitable pan.",
            "Add the protein and cook evenly, turning as needed.",
            "Continue cooking until fully cooked throughout. Chicken should reach 74°C internally; fish should reach 63°C.",
            "Serve with the listed vegetables, grains or other accompaniments."
        ];
    } else if (lower.includes("fruit") || lower.includes("yogurt")) {
        time = "5–10 minutes";

        steps = [
            "Wash fresh fruit thoroughly.",
            "Cut the fruit into bite-sized pieces.",
            "Place the yogurt or other listed base in a bowl.",
            "Add the fruit and remaining ingredients.",
            "Mix gently and serve fresh."
        ];
    } else {
        time = "20–30 minutes, as a general estimate";

        steps = [
            "Read the ingredient list and prepare the ingredients.",
            "Wash and chop any vegetables. Measure the other ingredients.",
            "Cook the main ingredients using a suitable method for that food.",
            "Add the remaining ingredients and seasonings, following an appropriate recipe for the dish.",
            "Check that everything is thoroughly cooked, taste and adjust seasoning, then serve."
        ];
    }

    return {
        name,
        time,
        ingredients,
        steps
    };
}

// --------------------------------------------------
// SHOW RECIPE GUIDE
// --------------------------------------------------

function showRecipe(meal) {
    createRecipeModal();

    const recipe = getRecipe(meal);

    document.querySelector("#recipeTitle").textContent =
        `🍲 ${recipe.name}`;

    document.querySelector("#recipeDescription").textContent =
        `Estimated cooking time: ${recipe.time}`;

    document.querySelector("#recipeDetails").innerHTML = `
        <h3>Ingredients</h3>

        ${
            recipe.ingredients.length
                ? `<ul>
                    ${recipe.ingredients.map(item =>
                        `<li>${esc(item)}</li>`
                    ).join("")}
                   </ul>`
                : "<p>Check the meal details for ingredients.</p>"
        }

        <h3>Step-by-step instructions</h3>

        <ol>
            ${recipe.steps.map(step =>
                `<li style="margin-bottom:12px;line-height:1.6">
                    ${esc(step)}
                 </li>`
            ).join("")}
        </ol>
    `;

    document.querySelector("#recipeModal").hidden = false;
    document.querySelector("#closeRecipe").focus();
}

// --------------------------------------------------
// MEAL CARDS
// --------------------------------------------------

function mealCard(meal, index) {
    return `
        <article class="meal" data-meal-index="${index}">
            <div class="emoji">${emoji(meal.name)}</div>

            <div class="mealbody">
                <div class="mealhead">
                    <h3>${esc(meal.name)}</h3>
                    <span class="tag">${esc(meal.meal_type)}</span>
                </div>

                <p>${esc(meal.ingredients)}</p>

                <div class="macros">
                    <span>${esc(meal.calories)} kcal</span>
                    <span>${esc(meal.protein)}g protein</span>
                    <span>${esc(meal.carbs)}g carbs</span>
                    <span>${esc(meal.fat)}g fat</span>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
                    <button type="button" data-recipe="${index}">
                        🍳 How to Cook
                    </button>

                    <button type="button"
                            class="swap-button"
                            data-swap="${index}">
                        ↻ Swap meal
                    </button>
                </div>

                <span class="swap-status"
                      id="swapStatus${index}"
                      role="status"></span>
            </div>
        </article>
    `;
}

// --------------------------------------------------
// RENDER GENERATED PLAN
// --------------------------------------------------

function renderPlan(plan) {
    currentPlan = plan;

    const nutrition = plan.nutrition;

    stats.innerHTML = `
        <article class="stat">
            <span>Estimated daily energy</span>
            <strong>
                ${Number(nutrition.calorie_estimate || 0).toLocaleString()}
                <small>kcal</small>
            </strong>
            <small>Approximate educational estimate</small>
        </article>

        <article class="stat">
            <span>Protein reference</span>
            <strong>${esc(nutrition.protein_estimate)} <small>g</small></strong>
            <small>Simple reference estimate</small>
        </article>

        <article class="stat">
            <span>BMI calculation</span>
            <strong>${esc(nutrition.bmi)}</strong>
            <small>Not a diagnosis or health assessment</small>
        </article>
    `;

    mealGrid.innerHTML = plan.meals.map(mealCard).join("");

    results.hidden = false;

    renderGroceries();

    results.scrollIntoView({ behavior: "smooth" });
}

// --------------------------------------------------
// GENERATE MEAL PLAN
// --------------------------------------------------

form.addEventListener("submit", async event => {
    event.preventDefault();

    button.disabled = true;
    button.textContent = "Creating your ideas…";

    try {
        const response = await fetch("/api/generate-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(getPrefs())
        });

        const plan = await response.json();

        if (!response.ok) {
            throw new Error(plan.error || "Could not create a plan.");
        }

        swapHistory = {};

        renderPlan(plan);

        notify("Your meal ideas are ready!");

        loadHistory();
        loadInsights();

    } catch (error) {
        notify(error.message || "Connection error. Is the server running?");
    } finally {
        button.disabled = false;
        button.textContent = "Generate my meal ideas →";
    }
});

// --------------------------------------------------
// RECIPE AND MEAL SWAP BUTTONS
// --------------------------------------------------

mealGrid.addEventListener("click", async event => {
    const recipeButton = event.target.closest("[data-recipe]");

    if (recipeButton && currentPlan) {
        const index = Number(recipeButton.dataset.recipe);
        const meal = currentPlan.meals[index];

        if (meal) showRecipe(meal);

        return;
    }

    const swapButton = event.target.closest("[data-swap]");

    if (!swapButton || !currentPlan) return;

    const index = Number(swapButton.dataset.swap);
    const oldMeal = currentPlan.meals[index];

    if (!oldMeal) return;

    const status = document.querySelector(`#swapStatus${index}`);

    swapButton.disabled = true;
    swapButton.textContent = "Finding a swap…";

    try {
        const usedMeals = swapHistory[index] || [];

        const response = await fetch("/api/replace-meal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...getPrefs(),
                current_food: oldMeal.name,
                meal_type: oldMeal.meal_type,
                used_meals: usedMeals
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No replacement found.");
        }

        swapHistory[index] = [
            ...usedMeals,
            oldMeal.name,
            data.meal.name
        ];

        currentPlan.meals[index] = data.meal;

        mealGrid.querySelector(
            `[data-meal-index="${index}"]`
        ).outerHTML = mealCard(data.meal, index);

        renderGroceries();

        notify(`Swapped to ${data.meal.name}`);

    } catch (error) {
        if (status) status.textContent = error.message;
        notify(error.message);
    } finally {
        const newButton = mealGrid.querySelector(
            `[data-swap="${index}"]`
        );

        if (newButton) {
            newButton.disabled = false;
            newButton.textContent = "↻ Swap meal";
        }
    }
});

// --------------------------------------------------
// NAVIGATION AND REFRESH BUTTONS
// --------------------------------------------------

document.querySelector("#newPlan").addEventListener("click", () => {
    document.querySelector("#planner").scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelector("#refresh").addEventListener("click", loadHistory);

// --------------------------------------------------
// SAVED PLAN HISTORY
// --------------------------------------------------

async function loadHistory() {
    try {
        const response = await fetch("/api/history");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("History unavailable");
        }

        if (!data.plans.length) {
            historyList.innerHTML =
                '<p class="muted">No saved plans yet. Create your first plan above.</p>';

            return;
        }

        historyList.innerHTML = data.plans.map(plan => `
            <article class="history-item">
                <div>
                    <b>
                        Plan #${esc(plan.id)} ·
                        ${esc(plan.diet)} ·
                        ${esc(plan.cuisine)}
                    </b>

                    <small>
                        ${esc(plan.created_at)} ·
                        ${plan.meals.length} meal ideas ·
                        Around ${Number(
                            plan.nutrition.calorie_estimate || 0
                        ).toLocaleString()} kcal estimated
                    </small>
                </div>

                <span class="tag">Saved</span>
            </article>
        `).join("");

    } catch {
        historyList.innerHTML =
            '<p class="muted">Could not load saved plans right now.</p>';
    }
}

// --------------------------------------------------
// GROCERY LIST
// --------------------------------------------------

function renderGroceries() {
    const element = document.querySelector("#groceryList");

    if (!currentPlan?.meals?.length) {
        element.innerHTML =
            '<p class="muted">Generate a plan to create your grocery list.</p>';

        element.dataset.items = "[]";

        return;
    }

    const ingredients = [
        ...new Set(
            currentPlan.meals.flatMap(meal =>
                String(meal.ingredients || "")
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean)
            )
        )
    ].sort((a, b) => a.localeCompare(b));

    element.innerHTML = ingredients.map((ingredient, index) => `
        <label class="grocery-item">
            <input type="checkbox" data-grocery="${index}">
            <span>${esc(ingredient)}</span>
        </label>
    `).join("");

    element.dataset.items = JSON.stringify(ingredients);
}

// --------------------------------------------------
// COPY GROCERY LIST
// --------------------------------------------------

document.querySelector("#copyGroceries").addEventListener("click", async () => {
    const element = document.querySelector("#groceryList");
    const items = JSON.parse(element.dataset.items || "[]");

    if (!items.length) {
        notify("Generate a meal plan first.");
        return;
    }

    const checked = [
        ...element.querySelectorAll("[data-grocery]:checked")
    ].map(item => Number(item.dataset.grocery));

    const text = items.map((item, index) =>
        `${checked.includes(index) ? "[x]" : "[ ]"} ${item}`
    ).join("\n");

    try {
        await navigator.clipboard.writeText(
            "NutriAI grocery list\n" + text
        );

        notify("Grocery list copied!");

    } catch {
        notify("Clipboard unavailable. Select and copy the list manually.");
    }
});

// --------------------------------------------------
// 7-DAY MEAL CALENDAR
// --------------------------------------------------

document.querySelector("#buildWeek").addEventListener("click", () => {
    if (!currentPlan?.meals?.length) {
        notify("Generate a meal plan first.");
        return;
    }

    const days = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
    ];

    const types = [
        "Breakfast", "Mid-morning", "Lunch",
        "Evening snack", "Dinner"
    ];

    const grid = document.querySelector("#weekGrid");

    grid.innerHTML = days.map((day, dayIndex) => `
        <article class="day-card">
            <h4>${day}</h4>

            ${types.map((type, typeIndex) => {
                const candidates = currentPlan.meals.filter(
                    meal =>
                        String(meal.meal_type).toLowerCase() ===
                        type.toLowerCase()
                );

                const pool = candidates.length
                    ? candidates
                    : currentPlan.meals;

                const meal = pool[(dayIndex + typeIndex) % pool.length];

                return `
                    <div class="day-meal">
                        <small>${type}</small>

                        <span>${esc(meal.name)}</span>

                        <button type="button"
                                data-week-recipe="${dayIndex}-${typeIndex}">
                            How to cook
                        </button>
                    </div>
                `;
            }).join("")}
        </article>
    `).join("");

    notify("Your flexible 7-day calendar is ready.");
});

// Open recipes from the weekly calendar.
document.querySelector("#weekGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-week-recipe]");

    if (!button || !currentPlan?.meals?.length) return;

    const [dayIndex, typeIndex] = button.dataset.weekRecipe
        .split("-")
        .map(Number);

    const types = [
        "Breakfast", "Mid-morning", "Lunch",
        "Evening snack", "Dinner"
    ];

    const candidates = currentPlan.meals.filter(
        meal =>
            String(meal.meal_type).toLowerCase() ===
            types[typeIndex].toLowerCase()
    );

    const pool = candidates.length ? candidates : currentPlan.meals;
    const meal = pool[(dayIndex + typeIndex) % pool.length];

    showRecipe(meal);
});

// --------------------------------------------------
// KITCHEN INGREDIENT MATCHING
// --------------------------------------------------

document.querySelector("#kitchenForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const button = document.querySelector("#kitchenButton");
        const output = document.querySelector("#kitchenResults");

        button.disabled = true;
        button.textContent = "Finding matches…";

        try {
            const preferences = getPrefs();

            const ingredients = new FormData(
                event.currentTarget
            ).get("ingredients");

            const response = await fetch("/api/kitchen-match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...preferences,
                    ingredients
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not search ingredients."
                );
            }

            output.innerHTML = data.meals.length
                ? data.meals.map((meal, index) => `
                    <article class="meal">
                        <div class="emoji">${emoji(meal.name)}</div>

                        <div class="mealbody">
                            <div class="mealhead">
                                <h3>${esc(meal.name)}</h3>

                                <span class="tag">
                                    ${esc(meal.match_percent)}% ingredient match
                                </span>
                            </div>

                            <p>${esc(meal.ingredients)}</p>

                            <div class="macros">
                                <span>${esc(meal.calories)} kcal</span>
                                <span>${esc(meal.protein)}g protein</span>
                                <span>
                                    Matched:
                                    ${esc((meal.matched_ingredients || []).join(", "))}
                                </span>
                            </div>

                            <button type="button" data-kitchen-recipe="${index}">
                                🍳 How to Cook
                            </button>
                        </div>
                    </article>
                `).join("")
                : '<p class="muted">No matches found. Try entering broader ingredients or generate a plan first to set your food preferences.</p>';

            // Keep the matched meals available to the recipe buttons.
            window.nutriKitchenMeals = data.meals || [];

            if (!data.meals.length) {
                notify("No matches in the current sample dataset.");
            }

        } catch (error) {
            output.innerHTML = `<p class="muted">${esc(error.message)}</p>`;
        } finally {
            button.disabled = false;
            button.textContent = "Find matching meals →";
        }
    }
);

// Open recipe guides for kitchen matches.
document.querySelector("#kitchenResults").addEventListener("click", event => {
    const button = event.target.closest("[data-kitchen-recipe]");

    if (!button) return;

    const index = Number(button.dataset.kitchenRecipe);
    const meal = window.nutriKitchenMeals?.[index];

    if (meal) showRecipe(meal);
});

// --------------------------------------------------
// INSIGHTS BAR CHARTS
// --------------------------------------------------

function bars(items) {
    if (!items?.length) {
        return '<p class="muted">Create saved plans to see insights here.</p>';
    }

    const max = Math.max(...items.map(item => item[1]), 1);

    return items.map(([name, count]) => `
        <div class="bar-row">
            <div>
                <span>${esc(name)}</span>
                <b>${esc(count)}</b>
            </div>

            <div class="bar-track">
                <i style="width:${Math.max(6, count / max * 100)}%"></i>
            </div>
        </div>
    `).join("");
}

// --------------------------------------------------
// LOAD INSIGHTS
// --------------------------------------------------

async function loadInsights() {
    try {
        const response = await fetch("/api/insights");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("Insights unavailable");
        }

        document.querySelector("#insightStats").innerHTML = `
            <article class="stat">
                <span>Saved plans analyzed</span>
                <strong>${esc(data.plans_count)}</strong>
                <small>Most recent 20 plans</small>
            </article>

            <article class="stat">
                <span>Meal selections</span>
                <strong>${esc(data.meals_count)}</strong>
                <small>Across your saved plans</small>
            </article>

            <article class="stat">
                <span>Favorite meal</span>
                <strong style="font-size:17px">
                    ${esc(data.favorite_meals?.[0]?.[0] || "Not yet available")}
                </strong>
                <small>Based on saved plan repeats</small>
            </article>
        `;

        document.querySelector("#favoriteMeals").innerHTML =
            bars(data.favorite_meals);

        document.querySelector("#preferenceBars").innerHTML = bars([
            ...(data.cuisines || []).map(item => [
                `Cuisine: ${item[0]}`, item[1]
            ]),
            ...(data.diets || []).map(item => [
                `Food style: ${item[0]}`, item[1]
            ])
        ]);

    } catch {
        document.querySelector("#insightStats").innerHTML =
            '<p class="muted">Insights are unavailable right now.</p>';
    }
}

// --------------------------------------------------
// INITIALIZE APP
// --------------------------------------------------

document.querySelector("#refreshInsights").addEventListener(
    "click",
    loadInsights
);

createRecipeModal();
loadHistory();
loadInsights();

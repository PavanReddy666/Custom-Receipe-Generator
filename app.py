import os
import json
import re
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def get_api_key():
    """Retrieve Gemini API Key from environment."""
    key = os.getenv("GEMINI_API_KEY", "").strip().strip("'\"")
    if not key or key == "YOUR_GEMINI_API_KEY_HERE":
        return None
    return key

def call_gemini_api(prompt):
    """Call Google Gemini API using google-genai or fallback methods."""
    api_key = get_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in .env file.")

    # Try importing google-genai
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        # Models ordered by availability & reliability
        models_to_try = [
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-2.0-flash-lite',
            'gemini-flash-latest',
            'gemini-2.0-flash'
        ]
        last_err = None
        
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_err = e
                continue
                
        if last_err:
            raise last_err

    except ImportError:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key)
        model = legacy_genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return response.text

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("favicon.svg")

@app.route("/api/status", methods=["GET"])
def api_status():
    key = get_api_key()
    return jsonify({
        "configured": key is not None,
        "filename": ".env",
        "variable": "GEMINI_API_KEY"
    })

@app.route("/api/generate-recipe", methods=["POST"])
def generate_recipe():
    data = request.get_json() or {}
    ingredients = data.get("ingredients", [])
    dietary = data.get("dietary", [])
    meal_type = data.get("mealType", "Any")
    cuisine = data.get("cuisine", "Any")
    cooking_time = data.get("cookingTime", "Any")

    # Basic server-side sanity check
    if not ingredients or not isinstance(ingredients, list):
        return jsonify({
            "valid": False,
            "errorMessage": "No ingredients supplied. Please add at least one ingredient with its quantity."
        }), 400

    formatted_ingredients = []
    for item in ingredients:
        if isinstance(item, dict):
            name = str(item.get("name", "")).strip()
            qty = str(item.get("quantity", "")).strip()
            if name:
                formatted_ingredients.append(f"{name} (Quantity: {qty if qty else 'as available'})")
        elif isinstance(item, str) and item.strip():
            formatted_ingredients.append(item.strip())

    if not formatted_ingredients:
        return jsonify({
            "valid": False,
            "errorMessage": "Please enter valid item names with quantities."
        }), 400

    api_key = get_api_key()
    if not api_key:
        return jsonify({
            "valid": False,
            "errorMessage": "API key is missing! Please open the `.env` file and set your `GEMINI_API_KEY`."
        }), 400

    # Build prompt for Gemini AI
    system_prompt = f"""
You are an elite gourmet Master Chef and AI Culinary Expert.
The user has provided the following items they claim to have in their kitchen:

INGREDIENTS LIST:
{json.dumps(formatted_ingredients, indent=2)}

USER PREFERENCES:
- Dietary Constraints: {", ".join(dietary) if dietary else "None"}
- Target Meal Type: {meal_type}
- Preferred Cuisine: {cuisine}
- Target Cooking Time: {cooking_time}

CRITICAL VERIFICATION INSTRUCTION:
First, inspect the provided INGREDIENTS LIST.
1. Determine if the items listed are recognizable, edible food items, ingredients, spices, condiments, or standard cooking staples.
2. If the user input consists of NON-FOOD items (e.g. 'screwdriver', 'rocks', 'laptop', 'plastic', gibberish like 'asdfg123', or empty/nonsense items), OR if the ingredients are completely impossible to make any edible food dish with, you MUST set "valid": false.
3. If "valid" is false, set "errorMessage" to a polite, warm, and clear message explaining why the input was invalid and kindly asking them to re-enter valid food items along with their quantities. Leave "recipe" as null.

4. If the items are valid food ingredients, set "valid": true and "errorMessage": "". Then generate a creative, delicious, fully detailed custom recipe in the "recipe" object based on what they have.

SPECIAL FORMATTING REQUIREMENT FOR PANTRY STAPLES & EQUIPMENT:
- For "assumedPantryStaples": ALWAYS provide alternative options using a slash `/` for each item (e.g., "Salt / Sea Salt to taste", "Cooking Oil / Butter or Ghee", "Black Pepper / Red Chili Flakes").
- For "equipmentNeeded": ALWAYS provide alternative options using a slash `/` for each item so if primary cookware is not available, the user knows what alternate to use (e.g., "Frying Pan / Cast Iron Skillet or Wok", "Chef Knife / Kitchen Scissors", "Mixing Bowl / Deep Plate", "Colander / Strainer or Sieve").

You MUST respond strictly in valid JSON format matching this schema:
{{
  "valid": true or false,
  "errorMessage": "string (explanatory message if valid is false, otherwise empty)",
  "recipe": {{
    "title": "Creative Dish Name",
    "tagline": "A catchy single line description of the dish",
    "prepTime": "10 mins",
    "cookTime": "20 mins",
    "totalTime": "30 mins",
    "servings": "2-3 servings",
    "difficulty": "Easy / Medium / Hard",
    "cuisine": "Italian / Indian / Mexican / Fusion / etc.",
    "calories": "e.g. 420 kcal per serving",
    "macroNutrients": {{
      "protein": "18g",
      "carbs": "45g",
      "fat": "12g"
    }},
    "providedIngredientsUsed": [
      {{ "name": "Ingredient Name", "quantity": "Quantity provided/used", "note": "e.g. Main protein" }}
    ],
    "assumedPantryStaples": [
      "Salt / Sea Salt to taste",
      "Cooking Oil / Butter or Ghee"
    ],
    "missingOptionalIngredients": [
      "Fresh Basil (optional garnish)"
    ],
    "equipmentNeeded": [
      "Frying Pan / Non-stick Skillet",
      "Chef Knife / Kitchen Scissors",
      "Mixing Bowl / Deep Bowl"
    ],
    "instructions": [
      {{
        "step": 1,
        "title": "Preparation",
        "detail": "Detailed instruction text...",
        "timerMinutes": 5
      }}
    ],
    "chefTips": "Pro chef tip to elevate this dish...",
    "flavorProfile": "e.g. Savory, Tangy, Garlic-infused",
    "pairings": "Suggested beverage or side dish"
  }}
}}
"""

    try:
        raw_response = call_gemini_api(system_prompt)
        
        # Clean JSON from markdown block wrappers if present
        clean_json = raw_response.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(?:json)?\n?", "", clean_json)
            clean_json = re.sub(r"\n?```$", "", clean_json)
        
        result_data = json.loads(clean_json)
        return jsonify(result_data)

    except ValueError as ve:
        return jsonify({
            "valid": False,
            "errorMessage": str(ve)
        }), 400
    except json.JSONDecodeError:
        return jsonify({
            "valid": False,
            "errorMessage": "Failed to parse AI response. Please try clicking 'Generate Recipe' again."
        }), 500
    except Exception as e:
        return jsonify({
            "valid": False,
            "errorMessage": f"AI Generation Error: {str(e)}"
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Recipe Generator running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)

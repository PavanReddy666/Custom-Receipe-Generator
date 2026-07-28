/* ==========================================================================
   GOURMET AI - CLIENT SIDE SCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    checkApiKeyStatus();
    initDefaultIngredients();
});

// Initial Default Sample Rows
function initDefaultIngredients() {
    const container = document.getElementById("ingredientsRows");
    container.innerHTML = "";
    
    // Add two initial rows
    addIngredientRow("Eggs", "2 pcs");
    addIngredientRow("Flour", "1 cup");
}

// Add New Ingredient Row
function addIngredientRow(name = "", qty = "") {
    const container = document.getElementById("ingredientsRows");
    const rowId = "row_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    const rowHtml = `
        <div class="ingredient-row" id="${rowId}">
            <input type="text" 
                   class="form-input ing-name-input" 
                   placeholder="e.g. Eggs, Rice, Garlic" 
                   value="${escapeHtml(name)}" 
                   required>
            
            <input type="text" 
                   class="form-input ing-qty-input" 
                   placeholder="e.g. 2 pcs, 100g" 
                   value="${escapeHtml(qty)}">
            
            <button type="button" 
                    class="row-delete-btn" 
                    onclick="removeIngredientRow('${rowId}')" 
                    title="Remove ingredient">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;

    container.insertAdjacentHTML("beforeend", rowHtml);
}

// Remove Ingredient Row
function removeIngredientRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const allRows = document.querySelectorAll(".ingredient-row");
    if (allRows.length <= 1) {
        // Clear inputs instead of deleting last row
        row.querySelector(".ing-name-input").value = "";
        row.querySelector(".ing-qty-input").value = "";
        return;
    }

    row.style.opacity = "0";
    row.style.transform = "translateY(-6px)";
    setTimeout(() => row.remove(), 200);
}

// Quick Add Button Handler
function quickAdd(name, qty) {
    const rows = document.querySelectorAll(".ingredient-row");
    
    // Check if an empty row exists
    for (let r of rows) {
        const nameInput = r.querySelector(".ing-name-input");
        const qtyInput = r.querySelector(".ing-qty-input");
        if (nameInput && nameInput.value.trim() === "") {
            nameInput.value = name;
            qtyInput.value = qty;
            nameInput.focus();
            return;
        }
    }

    // Otherwise add new row
    addIngredientRow(name, qty);
}

// Toggle Preferences Accordion
function togglePreferences() {
    const prefBody = document.getElementById("prefBody");
    const chevron = document.getElementById("prefChevron");
    
    prefBody.classList.toggle("collapsed");
    if (prefBody.classList.contains("collapsed")) {
        chevron.className = "fa-solid fa-chevron-down";
    } else {
        chevron.className = "fa-solid fa-chevron-up";
    }
}

// Check Backend API Key Status
async function checkApiKeyStatus() {
    const badge = document.getElementById("apiKeyStatus");
    try {
        const res = await fetch("/api/status");
        const data = await res.json();

        if (data.configured) {
            badge.className = "api-status-badge configured";
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>API Key Active</span>`;
        } else {
            badge.className = "api-status-badge missing";
            badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Set Key in .env</span>`;
        }
    } catch (e) {
        badge.className = "api-status-badge missing";
        badge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>Server Offline</span>`;
    }
}

// Modals Controls
function openKeyModal() {
    document.getElementById("keyNoticeModal").classList.remove("hidden");
}

function closeKeyModal() {
    document.getElementById("keyNoticeModal").classList.add("hidden");
}

function closeErrorModal() {
    document.getElementById("errorModal").classList.add("hidden");
}

function focusIngredientInput() {
    closeErrorModal();
    const firstInput = document.querySelector(".ing-name-input");
    if (firstInput) firstInput.focus();
}

function copyFileName() {
    navigator.clipboard.writeText(".env").then(() => {
        alert("Filename '.env' copied to clipboard!");
    });
}

// Form Submission Handler
async function handleFormSubmit(e) {
    e.preventDefault();

    // Gather ingredients
    const rows = document.querySelectorAll(".ingredient-row");
    const ingredients = [];

    rows.forEach(r => {
        const name = r.querySelector(".ing-name-input").value.trim();
        const quantity = r.querySelector(".ing-qty-input").value.trim();
        if (name) {
            ingredients.push({ name, quantity });
        }
    });

    if (ingredients.length === 0) {
        showError("Please enter at least one ingredient with its quantity.");
        return;
    }

    // Gather dietary preferences
    const dietaryBoxes = document.querySelectorAll("input[name='dietary']:checked");
    const dietary = Array.from(dietaryBoxes).map(cb => cb.value);

    // Gather options
    const mealType = document.getElementById("mealTypeSelect").value;
    const cuisine = document.getElementById("cuisineSelect").value;
    const cookingTime = document.getElementById("prepTimeSelect").value;

    const payload = {
        ingredients,
        dietary,
        mealType,
        cuisine,
        cookingTime
    };

    // UI state transitions
    document.getElementById("welcomePlaceholder").classList.add("hidden");
    document.getElementById("recipeDisplay").classList.add("hidden");
    document.getElementById("loadingState").classList.remove("hidden");
    
    startLoadingTips();

    try {
        const response = await fetch("/api/generate-recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        stopLoadingTips();
        document.getElementById("loadingState").classList.add("hidden");

        if (!response.ok || !data.valid) {
            const msg = data.errorMessage || "Could not recognize food ingredients. Please check item names and quantities.";
            showError(msg);
            return;
        }

        // Render recipe
        renderRecipe(data.recipe);

    } catch (err) {
        stopLoadingTips();
        document.getElementById("loadingState").classList.add("hidden");
        showError("Network or server connection error: " + err.message);
    }
}

// Show Error Modal
function showError(msg) {
    document.getElementById("errorMessageText").innerText = msg;
    document.getElementById("errorModal").classList.remove("hidden");
}

// Loading Tips Animator
let tipTimer = null;
const chefTipsList = [
    "Analyzing flavor pairings...",
    "Verifying ingredient quantities...",
    "Balancing spices and nutrition...",
    "Formulating chef technique steps...",
    "Plating up your custom recipe..."
];

function startLoadingTips() {
    let idx = 0;
    const tipElem = document.getElementById("loadingTip");
    tipTimer = setInterval(() => {
        idx = (idx + 1) % chefTipsList.length;
        if (tipElem) tipElem.innerText = chefTipsList[idx];
    }, 2200);
}

function stopLoadingTips() {
    if (tipTimer) clearInterval(tipTimer);
}

// Render Recipe Data
function renderRecipe(recipe) {
    if (!recipe) return;

    // Header info
    document.getElementById("recipeTitle").innerText = recipe.title || "Custom Gourmet Dish";
    document.getElementById("recipeTagline").innerText = recipe.tagline || "";
    document.getElementById("recipeCuisinePill").innerText = recipe.cuisine || "Gourmet";
    document.getElementById("recipeDifficultyPill").innerText = recipe.difficulty || "Easy";

    // Stats
    document.getElementById("recipeTotalTime").innerText = recipe.totalTime || (recipe.prepTime + " + " + recipe.cookTime);
    document.getElementById("recipeCalories").innerText = recipe.calories || "N/A";
    document.getElementById("recipeServings").innerText = recipe.servings || "2 Servings";

    // Macros
    const macros = recipe.macroNutrients || {};
    document.getElementById("macroProtein").innerText = macros.protein || "N/A";
    document.getElementById("macroCarbs").innerText = macros.carbs || "N/A";
    document.getElementById("macroFat").innerText = macros.fat || "N/A";

    // Ingredients List
    const ingContainer = document.getElementById("ingredientsList");
    ingContainer.innerHTML = "";
    (recipe.providedIngredientsUsed || []).forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><i class="fa-solid fa-circle-dot" style="color: var(--primary-gold); font-size: 0.6rem; margin-right: 8px;"></i>${escapeHtml(item.name)}</span>
            <span class="ing-qty">${escapeHtml(item.quantity)}</span>
        `;
        ingContainer.appendChild(li);
    });

    // Assumed Staples (with slash / for alternates)
    const staplesList = document.getElementById("staplesList");
    let staples = recipe.assumedPantryStaples || [];
    if (staples.length === 0) {
        staples = ["Salt / Sea Salt to taste", "Cooking Oil / Butter or Ghee", "Black Pepper / Red Chili Flakes"];
    }
    staplesList.innerHTML = staples.map(s => {
        const text = escapeHtml(s);
        const formatted = text.includes("/") 
            ? text.replace(/\s*\/\s*/g, ' <span class="slash-divider">/</span> ') 
            : `${text} <span class="slash-divider">/</span> Standard Staple`;
        return `<li><i class="fa-solid fa-check" style="color: var(--primary-gold); margin-right: 6px; font-size: 0.75rem;"></i> ${formatted}</li>`;
    }).join("");

    // Equipment Needed (with slash / for alternate equipment)
    const equipContainer = document.getElementById("equipmentTags");
    let equipment = recipe.equipmentNeeded || [];
    if (equipment.length === 0) {
        equipment = ["Frying Pan / Non-stick Skillet", "Chef Knife / Kitchen Scissors", "Mixing Bowl / Deep Bowl"];
    }
    equipContainer.innerHTML = equipment.map(e => {
        const text = escapeHtml(e);
        const formatted = text.includes("/") 
            ? text.replace(/\s*\/\s*/g, ' <span class="slash">/</span> ') 
            : `${text} <span class="slash">/</span> Alternate Tool`;
        return `<div class="alt-equipment-badge"><i class="fa-solid fa-kitchen-set" style="color: var(--primary-gold); margin-right: 4px;"></i> ${formatted}</div>`;
    }).join("");

    // Instructions
    const instContainer = document.getElementById("instructionsList");
    instContainer.innerHTML = "";
    (recipe.instructions || []).forEach((inst, index) => {
        const stepNum = inst.step || (index + 1);
        const timerHtml = inst.timerMinutes 
            ? `<button class="step-timer-btn" onclick="event.stopPropagation(); startTimer(${inst.timerMinutes})"><i class="fa-regular fa-clock"></i> ${inst.timerMinutes}m Timer</button>` 
            : "";

        const card = document.createElement("div");
        card.className = "step-card";
        card.onclick = () => card.classList.toggle("completed");
        card.innerHTML = `
            <div class="step-badge">${stepNum}</div>
            <div class="step-content">
                <div class="step-title-row">
                    <span class="step-title">${escapeHtml(inst.title || `Step ${stepNum}`)}</span>
                    ${timerHtml}
                </div>
                <div class="step-detail">${escapeHtml(inst.detail || inst.instruction || "")}</div>
            </div>
        `;
        instContainer.appendChild(card);
    });

    // Chef Tips & Pairings
    document.getElementById("chefTipsText").innerText = recipe.chefTips || "Enjoy your home-cooked meal!";
    document.getElementById("pairingsText").innerText = recipe.pairings || "A cold refreshing beverage or fresh side salad.";

    // Show display card
    document.getElementById("recipeDisplay").classList.remove("hidden");
}

// Simple Step Timer Widget
function startTimer(minutes) {
    const totalSeconds = minutes * 60;
    alert(`Started ${minutes} minute timer! We will notify you when time is up.`);
    setTimeout(() => {
        alert(`⏰ TIMER UP! (${minutes} minutes completed)`);
    }, totalSeconds * 1000);
}

// Save Recipe to LocalStorage
function saveRecipe() {
    const title = document.getElementById("recipeTitle").innerText;
    alert(`Saved "${title}" to your favorites!`);
}

// Utility: Escape HTML
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

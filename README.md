# Custom Recipe Generator | Gourmet Fork AI 🍴✨

[![Live Demo](https://img.shields.io/badge/Live%20Demo-custom--receipe--generator.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://custom-receipe-generator.vercel.app/)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/framework-Flask-green.svg)](https://flask.palletsprojects.com/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](#)

An AI-powered gourmet custom recipe generator built using **Python Flask**, **JavaScript**, **CSS Glassmorphism**, and **Google Gemini AI**. Enter available pantry ingredients with quantities, select dietary preferences, and instantly receive custom recipes complete with interactive cooking step timers, nutrition macros, and alternative equipment & pantry substitutions formatted with slashes `/`.

---

## 🌐 Live Web Application

👉 **[Click Here to Open the Live Project: https://custom-receipe-generator.vercel.app/](https://custom-receipe-generator.vercel.app/)**

---

## 🌟 Key Features

- 🍳 **Dynamic Ingredient Builder**: Input ingredients with custom quantities and units, or use quick-add pantry staple tags.
- 🤖 **AI Ingredient Validation**: Automatically verifies if input items are valid, edible food items. Prompts for retry if non-food items are entered.
- 🔀 **Smart Alternate Substitutions (`/`)**: Provides equipment and pantry staple alternatives (e.g. *Frying Pan / Non-stick Skillet*, *Salt / Sea Salt*) if standard cookware isn't available.
- ⏱️ **Interactive Cooking Checklist & Timer**: Check off cooking steps as you cook with built-in step countdown timers.
- 📊 **Nutritional Macros**: View estimated protein, carbs, fat, and total calories per serving.
- 🔒 **Secure API Key Management**: API key is isolated inside `.env` and kept local using `.gitignore`.

---

## 🔒 Security: Hiding Your API Key

> [!IMPORTANT]
> **Never commit your API key to GitHub.** The `.env` file is excluded from Git tracking via `.gitignore`.

### 1. Local Environment Setup
Create a file named `.env` in the root folder (do not push this to GitHub):
```env
GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
```

### 2. Template Configuration (`.env.example`)
Developers cloning this repo should copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Google Gemini API Key ([Get a free key at Google AI Studio](https://aistudio.google.com/))

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/PavanReddy666/Custom-Receipe-Generator.git
cd Custom-Receipe-Generator

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file and add your key
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# 4. Run the Flask application
python app.py
```
Open your browser and navigate to **`http://127.0.0.1:5000`** or access the live deployment at **`https://custom-receipe-generator.vercel.app/`**.

---

## 🤝 Add Me / Contribution Section

We welcome contributions from the community! If you'd like to collaborate, add new features, or join as a contributor:

1. **Fork this repository**
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

### Contributors & Maintainers
- **[PavanReddy666](https://github.com/PavanReddy666)** - Creator & Lead Maintainer

---

## 📂 Project Structure

```
Custom-Receipe-Generator/
├── app.py              # Main Flask Backend & Gemini AI integration
├── requirements.txt    # Python dependencies
├── .env                # Local API Key (Ignored by Git)
├── .env.example        # Environment template for repository
├── .gitignore          # Excludes secret & temporary files
├── static/
│   ├── css/
│   │   └── style.css   # Glassmorphic dark styling & layout
│   ├── js/
│   │   └── app.js      # Dynamic client application logic
│   └── favicon.svg     # Gourmet Fork SVG logo icon
└── templates/
    └── index.html      # Single Page Application HTML structure
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

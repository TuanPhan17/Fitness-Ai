# backend/main.py
# FitnessAI backend — natural-language meal parser using Gemini.
# The Gemini API key lives here on the server, never in the mobile app.

import json
import os

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. Add it to backend/.env.")

genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.0-flash"

app = FastAPI(title="FitnessAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseMealRequest(BaseModel):
    text: str


class ParsedFood(BaseModel):
    name: str
    calories: int
    protein: int
    fats: int
    carbs: int


class ParseMealResponse(BaseModel):
    items: list[ParsedFood]


PROMPT_TEMPLATE = """You are a nutrition assistant. The user will describe a meal in plain language.
Break it into individual food items and estimate the nutrition for the quantity described.

Return ONLY a JSON object in exactly this shape, with no markdown, no code fences, and no extra text:

{{
  "items": [
    {{ "name": "Food name", "calories": 0, "protein": 0, "fats": 0, "carbs": 0 }}
  ]
}}

Rules:
- calories, protein, fats, and carbs must be whole numbers (integers).
- protein, fats, and carbs are in grams.
- Account for the quantity the user mentions (e.g. "2 eggs" = nutrition for 2 eggs).
- If the user lists multiple foods, return one object per food.
- Use reasonable standard estimates for typical serving sizes.
- If you cannot identify any food, return {{ "items": [] }}.

User meal: "{meal}"
"""


def parse_meal_with_gemini(meal_text: str) -> list[dict]:
    model = genai.GenerativeModel(MODEL_NAME)
    prompt = PROMPT_TEMPLATE.format(meal=meal_text)
    response = model.generate_content(prompt)
    raw = (response.text or "").strip()

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lstrip().lower().startswith("json"):
            raw = raw.lstrip()[4:]

    data = json.loads(raw)
    items = data.get("items", [])
    cleaned = []
    for item in items:
        cleaned.append({
            "name": str(item.get("name", "Unknown")),
            "calories": int(round(float(item.get("calories", 0)))),
            "protein": int(round(float(item.get("protein", 0)))),
            "fats": int(round(float(item.get("fats", 0)))),
            "carbs": int(round(float(item.get("carbs", 0)))),
        })
    return cleaned


@app.get("/")
def health_check():
    return {"status": "ok", "service": "FitnessAI Backend"}


@app.post("/parse-meal", response_model=ParseMealResponse)
def parse_meal(req: ParseMealRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Meal text is empty.")
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Server is missing GEMINI_API_KEY.")
    try:
        items = parse_meal_with_gemini(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="The AI response could not be understood. Try rephrasing.")
    except Exception as err:
        raise HTTPException(status_code=502, detail=f"AI request failed: {err}")
    return {"items": items}

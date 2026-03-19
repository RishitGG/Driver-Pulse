import os
import google.generativeai as genai
from dotenv import load_dotenv
from backend.data.sample_data import (
    get_trips, 
    get_goals, 
    get_driver_preferences,
    get_market_insights
)
from datetime import datetime

load_dotenv()

def get_navigation_assistant(**kwargs):
    """
    TOOL: Dynamically constructs a route based on the driver's current city
    to ensure the demo works for any location.
    """
    goals = get_goals()
    prefs = get_driver_preferences()
    market = get_market_insights()
    
    # Pull the city from the profile (e.g., Mumbai, Bangalore)
    city = prefs.get("city", "Mumbai")
    favorite_stop = prefs.get("food_preferences", ["McDonald's"])[0]
    surge_zone = market.get("high_surge_zones", [{"name": "Airport"}])[0]["name"]
    
    # Construct search strings that include the city to avoid location jumping
    origin = "My+Location"
    waypoint = f"{favorite_stop}+{city}".replace(" ", "+")
    destination = f"{surge_zone}+{city}".replace(" ", "+")
    
    maps_url = f"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={destination}&waypoints={waypoint}&travelmode=driving"

    return {
        "finance": {
            "today_target": goals.get("daily_target"),
            "today_earned": goals.get("current_earnings"),
        },
        "driver_info": {
            "name": "Alex",
            "city": city,
            "favorite": favorite_stop
        },
        "navigation": {
            "url": maps_url
        }
    }

def run_co_pilot(user_prompt: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Co-pilot Error: API Key missing."

    genai.configure(api_key=api_key)
    
    model = genai.GenerativeModel(
        model_name='models/gemini-flash-latest', 
        tools=[get_navigation_assistant],
        system_instruction=(
            "You are the DrivePulse AI Co-pilot. Your name for the driver is Alex."
            "\n\nSTRICT OPERATING PROCEDURES:\n"
            "1. PERSONALIZATION: When food or breaks are mentioned, call get_navigation_assistant. "
            "Mention the driver's favorite (McDonald's) and the city (e.g. Mumbai) from the tool."
            "\n2. REACTIVE NAVIGATION: Do NOT show the [Start Navigation] link immediately. "
            "First, suggest the stop and ask: 'Would you like me to set up the route?'"
            "\n3. LINK FORMATTING: Only provide the [Start Navigation](URL) link if they say yes. "
            "Use that exact Markdown format so the frontend can turn it into a button."
            "\n4. FINANCIAL MATH: For monthly goals, multiply the today_target by 30. "
            "Example: If today_target is 1800, the monthly goal is 54,000. Do not use other numbers."
            "\n5. TONE: Be a supportive co-pilot. Brief, smart, and always use ₹."
        )
    )
    
    try:
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(user_prompt)
        return response.text
    except Exception as e:
        print(f"DEBUG AGENT ERROR: {str(e)}")
        return "I'm recalibrating my sensors. Try again in a moment! 🤖"
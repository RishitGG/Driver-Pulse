import os
import google.generativeai as genai
from dotenv import load_dotenv
# Add get_profile to your imports
from backend.data.sample_data import (
    get_trips, 
    get_goals, 
    get_profile, # <--- Added this
    get_driver_preferences,
    get_market_insights
)
from datetime import datetime

load_dotenv()

def get_navigation_assistant(**kwargs):
    profile = get_profile() # <--- Fetch real profile data
    goals = get_goals()
    market = get_market_insights()
    
    city = profile.get("city", "Mumbai")
    # Pull name from the same place the dashboard does
    driver_name = profile.get("name", "Driver") 
    favorite_stop = profile.get("food_preferences", ["McDonald's"])[0]
    surge_zone = market.get("high_surge_zones", [{"name": "Airport"}])[0]["name"]
    
    origin = "Bandra+West+Mumbai"
    waypoint = f"{favorite_stop}+{city}".replace(" ", "+")
    destination = f"{surge_zone}+{city}".replace(" ", "+")
    
    maps_url = f"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={destination}&waypoints={waypoint}&travelmode=driving"

    return {
        "finance": {
            "today_target": goals.get("daily_target"),
            "today_earned": goals.get("current_earnings"),
        },
        "driver_info": {
            "name": driver_name, # <--- Now dynamic
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

    # 1. Fetch the driver name from the data layer BEFORE starting the chat
    current_profile = get_profile()
    driver_name = current_profile.get("name", "Driver")

    genai.configure(api_key=api_key)
    
    # This must be indented to stay inside the function
    model = genai.GenerativeModel(
        model_name='models/gemini-flash-latest', 
        tools=[get_navigation_assistant],
        system_instruction=(
            f"You are the DrivePulse AI Co-pilot. You are assisting {driver_name}."
            "\n\nSTRICT OPERATING PROCEDURES:\n"
            "1. IDENTITY: Your name is 'DrivePulse Co-pilot'. Never call yourself Alex. "
            "Address the driver as 'Alex' or 'Partner' when appropriate."
            "\n2. GOALS: Mention the daily earnings target (₹1,800) only if Alex asks about "
            "money, performance, or 'how am I doing?'. Don't bring it up unprompted."
            "\n3. NAVIGATION: Use the get_navigation_assistant tool for food/break requests. "
            "Suggest Mumbai-based spots and ask before providing the navigation link."
            "\n4. LINK FORMATTING: Use the [Start Navigation](URL) format only when Alex says yes."
            "\n5. TONE: Professional, efficient, and supportive. Use ₹ for all currency."
        )
    )
    
    # This must also be indented
    try:
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(user_prompt)
        return response.text
    except Exception as e:
        print(f"DEBUG AGENT ERROR: {str(e)}")
        return "I'm recalibrating my sensors. Try again in a moment! 🤖"
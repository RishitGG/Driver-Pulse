import os
import google.generativeai as genai
from dotenv import load_dotenv
from backend.data.sample_data import get_trips, get_goals
from datetime import datetime

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_financial_context():
    """TOOL: The AI calls this to calculate targets and gaps."""
    trips = get_trips()
    goals = get_goals()
    
    total_earned = sum(t['fare'] for t in trips)
    monthly_goal = 50000 
    days_in_month = 30
    today = datetime.now().day
    days_remaining = days_in_month - today
    
    # Financial Logic
    remaining = max(0, monthly_goal - total_earned)
    # Required Daily Velocity (V_req)
    v_req = remaining / days_remaining if days_remaining > 0 else remaining
    
    return {
        "earned_so_far": total_earned,
        "goal": monthly_goal,
        "days_left": days_remaining,
        "daily_target_needed": round(v_req, 2),
        "trips_total": len(trips)
    }

def run_co_pilot(user_prompt: str):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Using 'gemini-2.0-flash' which is the 2026 stable standard
    model = genai.GenerativeModel(
        model_name='gemini-2.0-flash', 
        tools=[get_financial_context],
        system_instruction=(
            "You are the DrivePulse AI Co-pilot. Be brief and use ₹."
        )
    )
    
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(user_prompt)
    return response.text
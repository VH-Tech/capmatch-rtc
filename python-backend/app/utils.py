"""
Gemini AI utilities for meeting transcript analysis and summarization.
"""

import os
import json

import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv
load_dotenv()  # Loads variables from .env into environment

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def create_meeting_summary(transcript_text: str) -> Optional[Dict[str, str]]:
    """
    Generate a comprehensive meeting summary using Gemini AI.
    
    Args:
        transcript_text: The transcript text (plain text format)
        
    Returns:
        Dictionary containing structured summary or None if failed
    """
    try:
        if not GEMINI_API_KEY:
            print("⚠️ GEMINI_API_KEY not found in environment variables")
            return None
            
        # Validate input
        if not transcript_text or not isinstance(transcript_text, str):
            print("❌ No valid transcript text provided")
            return None
            
        print(f"📝 Creating summary for transcript ({len(transcript_text)} characters)")
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
        generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json"
        )
        
        # Create the prompt
        prompt = f"""Please create a detailed summary of this meeting transcript. The transcript is in a mix of Hindi and English (Hinglish). Please:

Title: Generate a concise, descriptive title for this meeting (3-8 words)

Description: Provide a brief description of the meeting's purpose and agenda. (1 sentence)

Executive Summary: Provide a 2-3 sentence overview of the main discussion

Key Points Discussed: Extract and organize the main topics covered

Important Numbers/Metrics: Highlight any significant figures, dates, or statistics mentioned

Action Items: If any next steps or follow-ups are mentioned, list them

Speaker Insights: Summarize the key insights or lessons shared by the speakers

Questions Raised: List any questions that were asked during the meeting by any participants.

Open Questions: If there are any unresolved questions or topics that need further discussion, list them.

Please translate any Hindi/Hinglish portions to English and provide the summary in clear, professional English.

<transcript>
{transcript_text}
</transcript>

Please structure your response as a JSON object with the following format:
{{
    "title": "...",
    "executive_summary": "...",
    "key_points": ["point 1", "point 2", "..."],
    "important_numbers": ["metric 1", "metric 2", "..."],
    "action_items": ["action 1", "action 2", "..."],
    "questions_raised": ["question 1", "question 2", "..."],
    "open_questions": ["open question 1", "open question 2", "..."],
    "transcript_language": "Hinglish/English/Hindi"
}}"""
        
        # Generate summary
        response = model.generate_content(prompt, generation_config=generation_config)
        
        
        if not response or not response.text:
            print("❌ No response from Gemini API")
            return None
        
        return response
            
    except Exception as e:
        print(f"❌ Error generating meeting summary: {str(e)}")
        return None

import os
import logging
from typing import Dict, Any
from supabase import create_client, Client

from fastapi import FastAPI, Request, Header, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.status import HTTP_200_OK, HTTP_403_FORBIDDEN

from dotenv import load_dotenv  # type: ignore
load_dotenv()

# Twilio request validator (created per-request below so env changes in tests are respected)
from twilio.request_validator import RequestValidator  # type: ignore


import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv
load_dotenv()  # Loads variables from .env into environment

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def create_meeting_summary(transcript_text: str) -> Optional[str]:
    """
    Generate a comprehensive meeting summary using Gemini AI.
    
    Args:
        transcript_text: The transcript text (plain text format)
        
    Returns:
        JSON string with the summary, or None if failed
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
    "participants": "[Person 1, Person 2, ...]",
    "transcript_language": "Hinglish/English/Hindi"
}}"""
        
        # Generate summary
        response = model.generate_content(prompt, generation_config=generation_config)
        
        
        if not response or not response.text:
            print("❌ No response from Gemini API")
            return None
        
        return response.text
    
    except Exception as e:
        print(f"❌ Error generating meeting summary: {str(e)}")
        return None




url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


app = FastAPI(title="CapMatch RTC Python Backend", version="0.1.0")

# Ensure request.url reflects the original external URL when behind a proxy (e.g., Fly.io)
# This is critical for Twilio signature validation, which depends on the exact URL.
try:
    from starlette.middleware.proxy_headers import ProxyHeadersMiddleware  # type: ignore

    # Trust all proxy IPs in containerized environments like Fly.io; adjust if you want to restrict.
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
except Exception:
    # If middleware import fails for any reason, continue without it (validation may fail behind proxies)
    pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("twilio-webhook")


@app.get("/health", response_class=JSONResponse)
async def healthcheck() -> Dict[str, Any]:
    return {"status": "ok"}


def _is_valid_twilio_request(request: Request, form_dict: Dict[str, Any], signature: str | None) -> bool:
    token = os.getenv("TWILIO_AUTH_TOKEN")
    if not token or not signature:
        return True

    validator = RequestValidator(token)
    # Twilio validates against the full URL including query string, exactly as received
    url = str(request.url)
    try:
        return validator.validate(url, form_dict, signature)
    except Exception:
        return False


@app.post("/")
async def twilio_webhook(
    request: Request,
    background: BackgroundTasks,
    x_twilio_signature: str | None = Header(default=None),
):
    # Twilio sends application/x-www-form-urlencoded
    form = await request.form()
    form_dict: Dict[str, Any] = {k: v for k, v in form.items()}

    # Verify authenticity (recommended). In dev without token, this is a no-op.
    if not _is_valid_twilio_request(request, form_dict, x_twilio_signature):
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Invalid Twilio signature")

    event = form_dict.get("StatusCallbackEvent")
    room_name = form_dict.get("RoomName")

    # Persist in Supabase (background) when configured. We store the whole form as `payload`

    if event == "participant-connected":
        participant_sid = form_dict.get("ParticipantSid")
        participant_identity = form_dict.get("ParticipantIdentity")
        print("Connecting participant_sid=%s to room_name=%s", participant_sid, room_name, participant_identity)
        response = (
            supabase.table("active_participants")
            .insert({"participant_sid": participant_sid, "participant_identity": participant_identity, "room_name": room_name})
            .execute()
        )
        print(response.data)

        response = (
            supabase.table("transcriptions")
            .update({"completed": "false"})
            .eq("participant_sid", participant_sid)
            .eq("room_name", room_name)
            .execute()
        )
        print(response.data)

    elif event == "participant-disconnected":
        participant_sid = form_dict.get("ParticipantSid")
        print("Disconnecting participant_sid=%s from room_name=%s", participant_sid, room_name)
        response = (
            supabase.table("active_participants")
            .delete()
            .eq("participant_sid", participant_sid)
            .execute()
        )
        print(response.data)

        response = (
            supabase.table("transcriptions")
            .update({"completed": "true"})
            .eq("participant_sid", participant_sid)
            .eq("room_name", room_name)
            .execute()
        )
        print(response.data)
    
        # get transcript from transcriptions table transcript column
        response = (
            supabase.table("transcriptions")
            .select("transcript")
            .eq("participant_sid", participant_sid)
            .eq("room_name", room_name)
            .execute()
        )
        
        transcript = response.data[0]["transcript"] if response.data else ""
        summary_response = create_meeting_summary(transcript)

        #extract title from summary_response
        title = ""
        if summary_response:
            try:
                import json
                summary_json = json.loads(summary_response)
                title = summary_json.get("title", "")
                executive_summary = summary_json.get("executive_summary", "")
            except Exception as e:
                print(f"❌ Error parsing summary response: {str(e)}")

        response = (
            supabase.table("transcriptions")
            .update({"summary": summary_response, "title": title, "executive_summary": executive_summary})
            .eq("participant_sid", participant_sid)
            .eq("room_name", room_name)
            .execute()
        )
        print(response.data)
    return JSONResponse(status_code=HTTP_200_OK, content={"ok": True})


# Optional plaintext endpoint for quick manual checks
@app.post("/twilio/webhook/plain", response_class=PlainTextResponse)
async def twilio_webhook_plain(
    request: Request,
    x_twilio_signature: str | None = Header(default=None),
):
    form = await request.form()
    form_dict: Dict[str, Any] = {k: v for k, v in form.items()}

    if not _is_valid_twilio_request(request, form_dict, x_twilio_signature):
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Invalid Twilio signature")

    return "OK"

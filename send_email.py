from __future__ import print_function
import os
import sys
import re
import base64
import json
import time
import argparse
import logging
from typing import List, Dict, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# ===================== Setup & Logging =====================
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("ai-mailer")

# Minimal default (expanded on-demand)
GMAIL_SCOPE_SEND   = 'https://www.googleapis.com/auth/gmail.send'
GMAIL_SCOPE_MODIFY = 'https://www.googleapis.com/auth/gmail.modify'   # only if --add-label used
GMAIL_SCOPE_COMPOSE= 'https://www.googleapis.com/auth/gmail.compose'  # only if --draft used

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-70b-instruct")

SENDER_NAME  = os.getenv("SENDER_NAME", "Your Name")
SENDER_TITLE = os.getenv("SENDER_TITLE", "Your Title")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Your Company")
SENDER_PHONE = os.getenv("SENDER_PHONE", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")

OUT_DIR = os.getenv("OUT_DIR", "out")

PROFESSIONAL_AREAS = [
    "Marketing", "Sales", "HR", "Finance", "Operations", "Product",
    "Engineering", "Management", "Customer Support", "Legal", "IT",
    "Design", "Research", "Strategy", "PR", "Business Development",
    "Analytics", "Education", "Healthcare", "Consulting"
]

# ===================== Utilities =====================
def ensure_out_dir():
    if not os.path.isdir(OUT_DIR):
        os.makedirs(OUT_DIR, exist_ok=True)

def sanitize_html(html: str) -> str:
    """Minimal sanitizer: remove scripts & inline JS."""
    if not html:
        return html
    html = re.sub(r"(?is)<script.*?>.*?</script>", "", html)
    html = re.sub(r'\son\w+="[^"]*"', "", html)
    html = re.sub(r"\son\w+='[^']*'", "", html)
    html = re.sub(r'(?i)(href|src)\s*=\s*"javascript:[^"]*"', r'\1="#"', html)
    html = re.sub(r"(?i)(href|src)\s*=\s*'javascript:[^']*'", r"\1='#'", html)
    return html

# ===================== Auth with Dynamic Scopes =====================
def _credentials_have_scopes(creds: Credentials, required_scopes: List[str]) -> bool:
    # creds.scopes may be None; normalize
    current = set(creds.scopes or [])
    needed = set(required_scopes)
    return needed.issubset(current)

def authenticate_gmail(required_scopes: List[str]) -> Credentials:
    token_path = "token.json"
    creds = None

    # Load existing token if present
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, required_scopes)

    # If token already valid and has required scopes -> reuse
    if creds and creds.valid and _credentials_have_scopes(creds, required_scopes):
        return creds

    # If token expired but refreshable and scopes ok -> refresh and save
    if creds and creds.expired and creds.refresh_token and _credentials_have_scopes(creds, required_scopes):
        creds.refresh(Request())
        with open(token_path, "w") as f:
            f.write(creds.to_json())
        return creds

    # Otherwise, perform full OAuth and SAVE the new token
    log.info("Re-authenticating with scopes: %s", ", ".join(required_scopes))
    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", required_scopes)
    if os.getenv("OAUTH_NO_BROWSER") == "1":
        creds = flow.run_console()
    else:
        creds = flow.run_local_server(port=0)

    with open(token_path, "w") as f:
        f.write(creds.to_json())

    return creds


# ===================== Prompting =====================
def build_signature_html() -> str:
    return f"""
<p style="margin-top:20px; font-size:14px; line-height:1.5;">
Regards,<br>
<b>{SENDER_NAME}</b><br>
<i>{SENDER_TITLE}, {COMPANY_NAME}</i><br>
<span style="font-size:12px; color:#555;">{SENDER_PHONE}<br>{SENDER_EMAIL}</span>
</p>
""".strip()

def template_guidance(template_hint: Optional[str]) -> str:
    t = (template_hint or "").strip().lower()
    blocks = {
        "recruitment_announcement": """
- Use a friendly corporate tone with a brief intro and clear sections.
- Include <h2 style="font-size:20px;"> headings, <ul>/<li> bullets, and short paragraphs.
- Suggested sections: Eligibility Criteria, Role/Benefits (optional), Next Steps / How to Apply.
""",
        "partnership_pitch": """
- Value-first tone; highlight outcomes.
- Include headings, bullets, and a clear CTA (<b>Next Steps</b>).
""",
        "appreciation_note": """
- Warm, sincere tone; tasteful <i>italics</i> and <b>bold</b> for emphasis.
- Keep it concise and human.
""",
        "default_professional": """
- Concise professional tone with scannable formatting.
"""
    }
    return blocks.get(t, blocks["default_professional"])

def build_email_prompt(user_prompt: str, area: str, style: str, template_hint: str) -> str:
    signature_html = build_signature_html()
    formatting_rules = """
"body_html" must be a professional HTML fragment (NOT a full <html> doc). Use:
- <h2 style="font-size:20px; margin:0 0 8px 0;"> and <h3 style="font-size:16px; margin:12px 0 6px;"> for headings
- <b> and <i> for emphasis (sparingly, human-like)
- <ul>, <ol>, <li> for lists
- <span style="font-size:15px; color:#333;"> for mild highlights
- <hr style="border:none; border-top:1px solid #eee; margin:16px 0;"> to separate sections
- <p style="margin:8px 0;"> paragraphs and <br> for subtle spacing
Vary headings and emphasis slightly across drafts so they feel naturally written (not identical).
Avoid walls of text; prefer short paragraphs and scannable bullets.
"""
    return f"""
You are an expert corporate email writer.

User request / purpose (verbatim):
{user_prompt}

Professional area: {area}
Desired template: {template_hint}
Style/tone cues: {style}

Template guidance:
{template_guidance(template_hint)}

Write THREE complete email drafts as VALID JSON ONLY.
Each draft MUST have keys: "subject" and "body_html".

{formatting_rules}

Do NOT include placeholders like [Your Name].
End each email with this exact signature (append as-is):

{signature_html}

IMPORTANT OUTPUT RULES:
- Output ONLY a JSON array (no markdown, no commentary, no code fences).
- Example:
[
  {{"subject":"...", "body_html":"..."}},
  {{"subject":"...", "body_html":"..."}},
  {{"subject":"...", "body_html":"..."}}
]
""".strip()

# ===================== OpenRouter =====================
def call_openrouter(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set in environment.")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": OPENROUTER_MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0.4}

    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"OpenRouter API error [{resp.status_code}]: {resp.text[:500]}")
    return resp.json()["choices"][0]["message"]["content"]

def extract_first_json_array(text: str):
    start = text.find('['); end = text.rfind(']')
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON array found in model output.")
    return json.loads(text[start:end+1])

def validate_previews(data: List[Dict], fallback: str) -> List[Dict[str, str]]:
    previews = []
    for d in data[:3]:
        subj = (d.get("subject") or "").strip() or "No Subject"
        body_html = d.get("body_html")
        if not body_html and "body" in d:
            safe = (str(d["body"])
                    .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            body_html = f"<pre>{safe}</pre>"
        if not body_html:
            safe = (str(fallback)
                    .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            body_html = f"<p>{safe}</p>"
        previews.append({"subject": subj, "body_html": sanitize_html(body_html)})
    while len(previews) < 3:
        previews.append({"subject": "Draft", "body_html": f"<p>{fallback}</p>"})
    return previews

def generate_email_previews(user_prompt: str, area: Optional[str], style: Optional[str], template_hint: Optional[str]) -> List[Dict[str, str]]:
    area = area or "General"
    style = style or "formal, human, concise, confident"
    template_hint = template_hint or "default_professional"
    prompt = build_email_prompt(user_prompt, area, style, template_hint)
    content = call_openrouter(prompt)
    try:
        data = extract_first_json_array(content)
    except Exception:
        objs = re.findall(r'\{.*?\}', content, flags=re.DOTALL)
        if not objs:
            raise RuntimeError(f"Failed to parse AI output. Raw content:\n{content}")
        data = [json.loads(o) for o in objs]
    return validate_previews(data, fallback=user_prompt)

# ===================== MIME & Gmail =====================
def build_mime_message(
    sender: str, to: str, subject: str, body_html: str, body_text: Optional[str]=None,
    cc: Optional[List[str]]=None, bcc: Optional[List[str]]=None,
    attachments: Optional[List[str]]=None
):
    root = MIMEMultipart("mixed") if attachments else MIMEMultipart("alternative")
    root['From'] = sender; root['To'] = to; root['Subject'] = subject
    if cc:  root['Cc']  = ", ".join(cc)

    alt = MIMEMultipart("alternative")
    if body_text:
        alt.attach(MIMEText(body_text, "plain"))
    alt.attach(MIMEText(body_html, "html"))

    if attachments:
        root.attach(alt)
        for path in attachments:
            if not os.path.isfile(path):
                log.warning(f"Attachment not found, skipping: {path}")
                continue
            part = MIMEBase('application', 'octet-stream')
            with open(path, 'rb') as f:
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(path)}"')
            root.attach(part)
        msg = root
    else:
        msg = alt
        msg['From'] = sender; msg['To'] = to; msg['Subject'] = subject
        if cc: msg['Cc'] = ", ".join(cc)

    return msg

def to_resource(msg) -> Dict:
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {'raw': raw}

def gmail_send(service, resource: Dict) -> str:
    res = service.users().messages().send(userId="me", body=resource).execute()
    return res["id"]

def gmail_create_draft(service, resource: Dict) -> str:
    res = service.users().drafts().create(userId="me", body={'message': resource}).execute()
    return res["id"]

def gmail_modify_labels(service, msg_id: str, add_labels: List[str]):
    if not add_labels:
        return
    try:
        service.users().messages().modify(userId="me", id=msg_id, body={"addLabelIds": add_labels}).execute()
    except HttpError as e:
        log.warning(f"Failed to modify labels: {e}")

# ===================== Save Artifacts =====================
def save_previews(previews: List[Dict[str, str]]):
    ensure_out_dir()
    for i, p in enumerate(previews, 1):
        with open(os.path.join(OUT_DIR, f"preview_{i}.html"), "w", encoding="utf-8") as f:
            f.write(p["body_html"])
    log.info("Saved previews to ./%s/preview_*.html", OUT_DIR)

def save_eml(msg, filename: str):
    ensure_out_dir()
    path = os.path.join(OUT_DIR, filename)
    with open(path, "wb") as f:
        f.write(msg.as_bytes())
    log.info("Saved EML -> %s", path)

# ===================== CLI & Main =====================
def parse_args():
    p = argparse.ArgumentParser(description="AI HTML email sender (dynamic scopes + human-like formatting)")
    p.add_argument("user_prompt", type=str, help="Describe the email you want")
    p.add_argument("recipient_email", type=str, help="Recipient email address")
    p.add_argument("--area", type=str, choices=PROFESSIONAL_AREAS, default=None, help="Professional area (optional)")
    p.add_argument("--style", type=str, default=None, help="Custom style/tone (optional)")
    p.add_argument("--template", type=str, default=None,
                   help="Template hint: recruitment_announcement, partnership_pitch, appreciation_note")
    p.add_argument("--cc", nargs="*", default=None, help="CC addresses")
    p.add_argument("--bcc", nargs="*", default=None, help="BCC addresses")
    p.add_argument("--attach", nargs="*", default=None, help="File paths to attach")
    p.add_argument("--draft", action="store_true", help="Create Gmail draft instead of sending")
    p.add_argument("--add-label", nargs="*", default=None, help="Label IDs to add after send (requires modify)")
    p.add_argument("--auto-send", action="store_true", help="Skip prompts and send preview # --pick")
    p.add_argument("--pick", type=int, default=1, help="Preview index to send (1-3) when --auto-send")
    p.add_argument("--save-previews", action="store_true", help="Save the 3 previews as HTML files")
    p.add_argument("--save-eml", action="store_true", help="Save final MIME as .eml")
    return p.parse_args()

def interactive_choices():
    print("\nSelect a professional area for better context? (y/n)")
    area = None
    if input("> ").strip().lower() == 'y':
        print("\nChoose one:")
        for i, a in enumerate(PROFESSIONAL_AREAS, 1):
            print(f"{i}. {a}")
        s = input("\nEnter number (or Enter to skip): ").strip()
        if s.isdigit() and 1 <= int(s) <= len(PROFESSIONAL_AREAS):
            area = PROFESSIONAL_AREAS[int(s)-1]

    print("\nAdd a custom style/tone? (y/n)")
    style = None
    if input("> ").strip().lower() == 'y':
        style = input("Enter custom style/tone (e.g., warm, motivational): ").strip()

    print("\nTemplate hint (Enter to skip). Examples: recruitment_announcement, partnership_pitch, appreciation_note")
    template_hint = input("> ").strip() or None

    return area, style, template_hint


def compute_required_scopes(args) -> List[str]:
    scopes = [GMAIL_SCOPE_SEND]  # minimum
    if args.draft:
        scopes.append(GMAIL_SCOPE_COMPOSE)
    if args.add_label:
        scopes.append(GMAIL_SCOPE_MODIFY)
    return scopes

def main():
    args = parse_args()

    # Dynamic scopes (ONLY what you need)
    required_scopes = compute_required_scopes(args)
    creds = authenticate_gmail(required_scopes)
    service = build('gmail', 'v1', credentials=creds)

    # Gather context
    if args.auto_send:
        area, style, template_hint = args.area, args.style, args.template
    else:
        area, style, template_hint = None, None, None
        print("\nDo you want a quick interactive context setup? (y/n)")
        if input("> ").strip().lower() == 'y':
            area, style, template_hint = interactive_choices()

    # Generate drafts
    previews = generate_email_previews(args.user_prompt, area, style, template_hint)

    print("\n--- AI Generated Previews ---")
    for i, p in enumerate(previews, 1):
        print(f"\nPreview {i}:")
        print(f"Subject: {p['subject']}")
        print("Body (HTML):")
        print(p['body_html'])

    if args.save_previews:
        save_previews(previews)

    # Pick draft
    if args.auto_send:
        idx = max(1, min(3, args.pick))
    else:
        sel = input("\nEnter preview number to proceed (1/2/3): ").strip()
        if not (sel.isdigit() and 1 <= int(sel) <= 3):
            print("❌ Invalid selection. Exiting.")
            return
        idx = int(sel)
    chosen = previews[idx-1]

    # Build MIME
    msg = build_mime_message(
        sender="me",
        to=args.recipient_email,
        subject=chosen["subject"],
        body_html=chosen["body_html"],
        body_text=None,
        cc=args.cc,
        bcc=args.bcc,
        attachments=args.attach
    )
    resource = to_resource(msg)

    if args.draft:
        try:
            draft_id = gmail_create_draft(service, resource)
            print(f"📝 Draft created. Draft ID: {draft_id}")
            if args.save_eml:
                save_eml(msg, f"draft_{draft_id}.eml")
        except HttpError as e:
            print(f"❌ Gmail API error (draft): {e}")
    else:
        try:
            sent_id = gmail_send(service, resource)
            print(f"✅ Email sent! Message ID: {sent_id}")
            if args.add_label:
                gmail_modify_labels(service, sent_id, args.add_label)
            if args.save_eml:
                save_eml(msg, f"sent_{sent_id}.eml")
        except HttpError as e:
            print(f"❌ Gmail API error (send): {e}")


if __name__ == "__main__":
    main()

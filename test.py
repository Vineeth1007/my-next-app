import os
from dotenv import load_dotenv
load_dotenv()
print("OpenRouter API Key:", os.getenv("OPENROUTER_API_KEY"))

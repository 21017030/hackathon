from google import genai
from app.core.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

CHAT_MODEL = "gemini-3.1-flash-lite"
REWRITE_MODEL = "gemini-3.1-flash-lite"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 1536  # pgvector HNSW 인덱스 호환 (최대 2000차원)

from google import genai
from app.core.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

CHAT_MODEL = "gemini-3.1-flash-lite"
REWRITE_MODEL = "gemini-3.1-flash-lite"
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 1536  # pgvector HNSW 인덱스 호환 (최대 2000차원)

CHUNK_SIZE = 1000            # RAG 인제스션 청크 크기 (문자 수)
RAG_CHUNK_LIMIT = 6          # 벡터 검색 반환 청크 수
HISTORY_LIMIT = 6            # 대화 히스토리 로드 개수
REWRITE_HISTORY_WINDOW = 4   # 쿼리 재작성에 사용할 최근 대화 수

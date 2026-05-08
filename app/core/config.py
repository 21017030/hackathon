import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(".env 파일에 SUPABASE_URL과 SUPABASE_KEY를 설정해주세요.")

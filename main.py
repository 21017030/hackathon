import os
import uuid
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(".env 파일에 SUPABASE_URL과 SUPABASE_KEY를 설정해주세요.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app = FastAPI(title="Hackathon API")


@app.get("/", response_class=HTMLResponse)
def root():
    return """
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>강의자료 업로드 테스트</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 60px auto; }
    h2 { margin-bottom: 24px; }
    input[type=file] { display: block; margin-bottom: 16px; }
    button { padding: 10px 24px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    #result { margin-top: 24px; padding: 16px; border-radius: 6px; display: none; }
    .success { background: #d1fae5; color: #065f46; }
    .error   { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h2>강의자료 업로드</h2>
  <input type="file" id="fileInput" accept=".pdf,.ppt,.pptx,.docx,.txt">
  <button id="uploadBtn" onclick="uploadFile()">업로드</button>
  <div id="result"></div>
  <script>
    async function uploadFile() {
      const file = document.getElementById('fileInput').files[0];
      if (!file) { alert('파일을 선택해주세요.'); return; }
      const btn = document.getElementById('uploadBtn');
      const result = document.getElementById('result');
      btn.disabled = true;
      btn.textContent = '업로드 중...';
      result.style.display = 'none';
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('upload', { method: 'POST', body: formData });
        const data = await res.json();
        result.style.display = 'block';
        if (res.ok) {
          result.className = 'success';
          result.textContent = '✅ 업로드 성공: ' + data.file_path;
        } else {
          result.className = 'error';
          result.textContent = '❌ 오류: ' + (data.detail || '업로드 실패');
        }
      } catch (e) {
        result.style.display = 'block';
        result.className = 'error';
        result.textContent = '❌ 네트워크 오류: ' + e.message;
      }
      btn.disabled = false;
      btn.textContent = '업로드';
    }
  </script>
</body>
</html>
"""


MAGIC_NUMBERS = {
    ".pdf":  b"%PDF",
    ".pptx": b"PK\x03\x04",
    ".docx": b"PK\x03\x04",
    ".ppt":  b"\xd0\xcf\x11\xe0",
}

CONTENT_TYPES = {
    ".pdf":  "application/pdf",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt":  "text/plain; charset=utf-8",
}

@app.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    allowed_types = {".pdf", ".ppt", ".pptx", ".docx", ".txt"}
    original_name = os.path.basename(file.filename or "")[:255]
    ext = os.path.splitext(original_name)[1].lower()
    if not original_name or ext not in allowed_types:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다.")

    try:
        contents = await file.read()
    finally:
        await file.close()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    magic = MAGIC_NUMBERS.get(ext)
    if magic and not contents.startswith(magic):
        raise HTTPException(status_code=400, detail="파일 형식이 올바르지 않습니다.")
    if ext == ".txt":
        try:
            contents.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="파일 형식이 올바르지 않습니다.")

    file_path = f"{uuid.uuid4()}{ext}"

    try:
        content_type = CONTENT_TYPES[ext]
        supabase.storage.from_("documents").upload(file_path, contents, {"content-type": content_type})
    except Exception as e:
        logger.error("스토리지 업로드 실패: %s", e)
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    try:
        supabase.table("documents").insert({
            "original_file_name": original_name,
            "file_path": file_path,
            "parsing_status": "PENDING",
        }).execute()
    except Exception as e:
        logger.error("DB 저장 실패: %s", e)
        try:
            supabase.storage.from_("documents").remove([file_path])
        except Exception as cleanup_err:
            logger.error("스토리지 정리 실패 (좀비 파일 발생 가능): %s", cleanup_err)
        raise HTTPException(status_code=500, detail="파일 저장 중 오류가 발생했습니다.")

    return {"file_path": file_path, "original_file_name": file.filename}


@app.get("/test/users")
def get_users():
    res = supabase.table("users").select("student_id, name, login_id").limit(5).execute()
    return {"users": res.data}


@app.get("/test/categories")
def get_categories():
    res = supabase.table("categories").select("*").limit(5).execute()
    return {"categories": res.data}


@app.get("/test/documents")
def get_documents():
    res = supabase.table("documents").select("*").limit(5).execute()
    return {"documents": res.data}


@app.get("/test/chat-sessions")
def get_chat_sessions():
    res = supabase.table("chat_sessions").select("*").limit(5).execute()
    return {"chat_sessions": res.data}


@app.get("/test/chat-messages")
def get_chat_messages():
    res = supabase.table("chat_messages").select("*").limit(5).execute()
    return {"chat_messages": res.data}

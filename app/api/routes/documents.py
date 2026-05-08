import os

from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import HTMLResponse

from app.core.config import MAX_FILE_SIZE
from app.models.document import UploadResponse
from app.services.document import validate_file, upload_document

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
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


@router.post("/upload", response_model=UploadResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 50MB를 초과할 수 없습니다.")

    original_name = os.path.basename(file.filename or "")[:255]

    try:
        contents = await file.read()
    finally:
        await file.close()

    ext = validate_file(original_name, contents)
    file_path = upload_document(original_name, contents, ext)

    return UploadResponse(file_path=file_path, original_file_name=original_name)

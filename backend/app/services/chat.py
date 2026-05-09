import logging
import re
from typing import List, Optional
from google.genai import types

from fastapi import HTTPException
from app.core.supabase import supabase
from app.services.document import CHAT_MODEL, REWRITE_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, client

logger = logging.getLogger(__name__)


def _rewrite_query(content: str, history: list) -> str:
    """대화 맥락을 반영해 팔로업 질문을 독립적인 검색 쿼리로 재작성."""
    if not history:
        return content
    recent = history[-4:]
    history_str = "\n".join([
        f"{'사용자' if m.get('sender_type') == 'USER' or m.get('sender') == 'user' else 'AI'}: {m.get('content', '')[:300]}"
        for m in recent
    ])
    prompt = f"""아래 대화 내역을 참고하여 사용자의 질문을 문서 검색에 적합한 독립적인 쿼리로 변환하세요.
변환된 쿼리만 한 줄로 출력하세요.

대화 내역:
{history_str}

현재 질문: {content}

검색 쿼리:"""
    try:
        response = client.models.generate_content(model=REWRITE_MODEL, contents=prompt)
        rewritten = (response.text or "").strip()
        logger.info(f"쿼리 재작성: '{content}' → '{rewritten}'")
        return rewritten or content
    except Exception:
        return content


async def get_relevant_chunks_with_sources(
    query_vector: List[float],
    document_ids: Optional[List[int]] = None,
    limit: int = 6,
) -> list:
    chunks = await get_relevant_chunks(query_vector, document_ids, limit)
    if not chunks:
        return []

    doc_ids = list({c['document_id'] for c in chunks})
    docs_res = supabase.table("documents").select("id, original_file_name, category_id").in_("id", doc_ids).execute()
    doc_map = {d['id']: d for d in (docs_res.data or [])}

    cat_ids = list({d['category_id'] for d in doc_map.values() if d.get('category_id')})
    cat_map = {}
    if cat_ids:
        cats_res = supabase.table("categories").select("id, name").in_("id", cat_ids).execute()
        cat_map = {c['id']: c['name'] for c in (cats_res.data or [])}

    for chunk in chunks:
        doc = doc_map.get(chunk['document_id'], {})
        chunk['filename'] = doc.get('original_file_name', '알 수 없음')
        chunk['category'] = cat_map.get(doc.get('category_id'), '분류 없음')
        match = re.search(r'\[(\d+)페이지\]', chunk.get('content', ''))
        chunk['page'] = int(match.group(1)) if match else None

    return chunks


def _build_context(chunks: list) -> str:
    if not chunks:
        return "자료에서 관련 내용을 찾을 수 없습니다."
    parts = []
    for c in chunks:
        label = f"[출처: {c['category']} > {c['filename']}"
        if c.get('page'):
            label += f" {c['page']}페이지"
        label += "]"
        parts.append(f"{label}\n{c['content']}")
    return "\n\n".join(parts)


def _extract_sources(chunks: list) -> list:
    seen, sources = set(), []
    for c in chunks:
        key = c.get('filename', '알 수 없음')
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": key,
                "category": c.get('category', '분류 없음'),
            })
    return sources


def _filter_used_sources(ai_answer: str, all_sources: list) -> tuple[str, list]:
    """Gemini가 명시한 파일명만 출처로 필터링하고 마커를 답변에서 제거."""
    match = re.search(r'\[참고자료:([^\]]*)\]', ai_answer)
    if not match:
        return ai_answer, []
    used_names = {f.strip() for f in match.group(1).split('|') if f.strip()}
    filtered = [s for s in all_sources if s['filename'] in used_names]
    cleaned = re.sub(r'\[참고자료:[^\]]*\]', '', ai_answer).strip()
    return cleaned, filtered


async def get_relevant_chunks(query_vector: List[float], document_ids: Optional[List[int]] = None, limit: int = 6):
    try:
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.5,
            "match_count": limit,
        }
        if document_ids:
            rpc_params["filter_document_ids"] = document_ids

        logger.info(f"Calling RPC match_document_chunks with params: {rpc_params}")
        res = supabase.rpc("match_document_chunks", rpc_params).execute()
        return res.data
    except Exception as e:
        logger.error(f"Vector search failed: {str(e)}")
        return []


async def ask_question(session_id: int, content: str, document_ids: Optional[List[int]] = None):
    try:
        # 1. 과거 대화 내역 먼저 가져오기 (현재 질문 저장 전에 조회해야 정확함)
        history_res = supabase.table("chat_messages") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(6) \
            .execute()
        history = history_res.data[::-1]

        # 2. 사용자 질문 저장
        logger.info(f"Saving user message to session {session_id}")
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "sender_type": "USER",
            "content": content
        }).execute()

        # 3. 쿼리 재작성 + 임베딩
        search_query = _rewrite_query(content, history)
        logger.info(f"Generating embedding using {EMBEDDING_MODEL}")
        embedding_res = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=search_query,
            config=types.EmbedContentConfig(
                task_type="retrieval_query",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        query_vector = embedding_res.embeddings[0].values

        # 4. 관련 청크 검색 (document_ids 없으면 해당 유저의 문서만 사용)
        if document_ids is None:
            session_res = supabase.table("chat_sessions").select("user_id").eq("id", session_id).execute()
            user_id = session_res.data[0]["user_id"]
            docs_res = supabase.table("documents").select("id").eq("user_id", user_id).execute()
            document_ids = [d["id"] for d in docs_res.data]

        if document_ids:
            chunks = await get_relevant_chunks_with_sources(query_vector, document_ids)
        else:
            chunks = []  # 유저의 문서가 없으면 빈 결과
        context = _build_context(chunks)
        sources = _extract_sources(chunks)
        logger.info(f"Found {len(chunks)} relevant chunks.")

        # 5. 프롬프트 생성 및 답변
        history_str = "\n".join([f"{m['sender_type']}: {m['content']}" for m in history])
        filenames = "|".join(s['filename'] for s in sources)
        prompt = f"""당신은 대학생의 학습을 돕는 AI 어시스턴트입니다.
제공된 [강의자료 내용]을 바탕으로 사용자의 질문에 답변하세요.
자료에서 답을 찾을 수 없다면 솔직하게 말하세요.
페이지를 묻는 질문이라면 강의자료 내용의 페이지 표시를 참고하여 알려주세요.

답변 맨 끝에 실제로 참고한 파일명만 아래 형식으로 추가하세요 (참고하지 않은 파일은 제외):
[참고자료: 파일명1|파일명2]
가능한 파일명: {filenames}

[강의자료 내용]
{context}

[이전 대화 내역]
{history_str}

사용자 질문: {content}

답변:"""

        logger.info(f"Prompting Gemini model: {CHAT_MODEL}")
        response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
        ai_answer, sources = _filter_used_sources(response.text, sources)

        # 6. AI 답변 저장
        logger.info("Saving AI response to DB")
        res = supabase.table("chat_messages").insert({
            "session_id": session_id,
            "sender_type": "AI",
            "content": ai_answer,
            "sources": sources,
        }).execute()

        if not res.data:
            raise Exception("Failed to insert AI message into database")

        return {"message": res.data[0], "sources": sources}

    except Exception as e:
        logger.exception(f"Error in ask_question: {str(e)}")
        raise e


async def ask_about_document(document_id: int, content: str) -> dict:
    # 1. 사용자 메시지 저장
    supabase.table("document_chat_messages").insert({
        "document_id": document_id,
        "sender_type": "USER",
        "content": content,
    }).execute()

    # 2. 대화 내역 DB에서 로드
    history_res = supabase.table("document_chat_messages") \
        .select("sender_type, content") \
        .eq("document_id", document_id) \
        .order("created_at", desc=True) \
        .limit(6) \
        .execute()
    history = history_res.data[::-1]

    # 3. 쿼리 재작성 + 임베딩
    search_query = _rewrite_query(content, history)
    embedding_res = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=search_query,
        config=types.EmbedContentConfig(
            task_type="retrieval_query",
            output_dimensionality=EMBEDDING_DIMENSIONS,
        ),
    )
    query_vector = embedding_res.embeddings[0].values

    chunks = await get_relevant_chunks_with_sources(query_vector, [document_id])
    context = _build_context(chunks)

    history_str = "\n".join([
        f"{'사용자' if m['sender_type'] == 'USER' else 'AI'}: {m['content'][:300]}"
        for m in history
    ])

    prompt = f"""당신은 대학생의 학습을 돕는 AI 어시스턴트입니다.
아래 [문서 내용]을 바탕으로 질문에 간결하게 답변하세요.
자료에 없는 내용은 솔직하게 모른다고 말하세요.

[문서 내용]
{context}

[이전 대화 내역]
{history_str}

질문: {content}

답변:"""

    response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
    answer = response.text or ""

    # 4. AI 답변 저장
    supabase.table("document_chat_messages").insert({
        "document_id": document_id,
        "sender_type": "AI",
        "content": answer,
    }).execute()

    return {"answer": answer, "sources": []}


def delete_session(session_id: int) -> None:
    exists = supabase.table("chat_sessions").select("id").eq("id", session_id).execute()
    if not exists.data:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")

    try:
        supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
        supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    except Exception as e:
        logger.error("채팅방 삭제 실패: %s", e)
        raise HTTPException(status_code=500, detail="채팅방 삭제 중 오류가 발생했습니다.")

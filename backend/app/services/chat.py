import logging
import re
from typing import List, Optional
from google.genai import types

from fastapi import HTTPException
from app.core.supabase import supabase
from app.services.document import CHAT_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, client

logger = logging.getLogger(__name__)

async def get_relevant_chunks_with_sources(
    query_vector: List[float],
    document_ids: Optional[List[int]] = None,
    limit: int = 5,
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
        key = (c.get('filename'), c.get('page'))
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": c.get('filename', '알 수 없음'),
                "category": c.get('category', '분류 없음'),
                "page": c.get('page'),
            })
    return sources


async def get_relevant_chunks(query_vector: List[float], document_ids: Optional[List[int]] = None, limit: int = 5):
    try:
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.3, # 검색 범위를 좀 더 넓힘
            "match_count": limit,
        }
        if document_ids:
            rpc_params["filter_document_ids"] = document_ids

        logger.info(f"Calling RPC match_document_chunks with params: {rpc_params}")
        res = supabase.rpc("match_document_chunks", rpc_params).execute()
        return res.data
    except Exception as e:
        logger.error(f"Vector search failed: {str(e)}")
        # RPC 함수가 없으면 여기서 에러가 납니다.
        return []

async def ask_question(session_id: int, content: str, document_ids: Optional[List[int]] = None):
    try:
        # 1. 사용자 질문 저장
        logger.info(f"Saving user message to session {session_id}")
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "sender_type": "USER",
            "content": content
        }).execute()

        # 2. 질문 임베딩 생성
        logger.info(f"Generating embedding for question using {EMBEDDING_MODEL}")
        embedding_res = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=content,
            config=types.EmbedContentConfig(
                task_type="retrieval_query",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        query_vector = embedding_res.embeddings[0].values

        # 3. 관련 텍스트 조각 검색 (Vector Search)
        chunks = await get_relevant_chunks_with_sources(query_vector, document_ids)
        context = _build_context(chunks)
        sources = _extract_sources(chunks)
        logger.info(f"Found {len(chunks)} relevant chunks.")

        # 4. 과거 대화 내역 가져오기
        history_res = supabase.table("chat_messages") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()
        
        history = history_res.data[::-1]
        history_str = "\n".join([f"{m['sender_type']}: {m['content']}" for m in history])

        # 5. Gemini 2.0에게 프롬프트 전달
        logger.info(f"Prompting Gemini model: {CHAT_MODEL}")
        prompt = f"""
당신은 대학생의 학습을 돕는 유능한 AI 어시스턴트입니다. 
제공된 [강의자료 내용]을 바탕으로 사용자의 질문에 답변하세요. 
만약 자료에서 답을 찾을 수 없다면, 자료에 없는 내용이라고 솔직하게 말하세요.

[강의자료 내용]
{context}

[이전 대화 내역]
{history_str}

사용자 질문: {content}

답변:
"""
        
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=prompt,
        )
        ai_answer = response.text

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


async def ask_about_document(document_id: int, content: str, history: list = None) -> dict:
    embedding_res = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=content,
        config=types.EmbedContentConfig(
            task_type="retrieval_query",
            output_dimensionality=EMBEDDING_DIMENSIONS,
        ),
    )
    query_vector = embedding_res.embeddings[0].values

    chunks = await get_relevant_chunks_with_sources(query_vector, [document_id])
    context = _build_context(chunks)
    sources = _extract_sources(chunks)

    history_str = ""
    if history:
        lines = [
            f"{'사용자' if m.get('sender') == 'user' else 'AI'}: {m.get('content', '')}"
            for m in history[-5:]
        ]
        history_str = "\n".join(lines)

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
    return {"answer": response.text, "sources": sources}


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

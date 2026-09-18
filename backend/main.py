"""
ZotSort Backend — FastAPI
将 zotero_export.py 的逻辑包装为 REST API，支持 SSE 实时进度推送。
"""

import os
import sys
import asyncio
import json
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.insert(0, os.path.expanduser('~'))
import zotero_export as ze

import database as db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="ZotSort API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ── Models ────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    collection_keys: list[str]
    item_keys: list[str] | None = None
    force_reanalyze: bool = False


class PaperUpdate(BaseModel):
    priority: int | None = None      # 0 = 未设置, 1 = 低, 2 = 中, 3 = 高
    importance: int | None = None    # 0-5 星
    user_notes: str | None = None
    # 手动编辑的 AI 字段
    摘要原文: str | None = None
    研究方法: str | None = None
    主要结论: str | None = None
    创新点: str | None = None
    关键词: str | None = None
    # 恢复某个字段的 AI 原始值
    reset_field: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/collections")
async def get_collections():
    try:
        collections = ze.get_all_collections()
        return [
            {
                "key": c["data"]["key"],
                "name": c["data"]["name"],
                "count": c["meta"].get("numItems", 0),
            }
            for c in collections
        ]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Zotero API 不可用: {e}")


@app.get("/api/collections/{collection_key}/papers")
async def get_papers_in_collection(collection_key: str):
    """
    返回指定集合中所有文献，已合并数据库缓存（AI 分析、优先级等）。
    """
    try:
        items = ze.get_items_in_collection(collection_key)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Zotero API 不可用: {e}")

    zotero_metas = [ze.extract_metadata(item) for item in items]
    merged = await asyncio.to_thread(db.merge_zotero_with_cache, zotero_metas, collection_key)
    return merged


@app.patch("/api/papers/{paper_key}")
async def update_paper(paper_key: str, body: PaperUpdate):
    """更新文献的优先级、重要性、笔记，或手动编辑 AI 字段。"""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return {"ok": True}
    await asyncio.to_thread(db.update_paper_user_fields, paper_key, updates)
    paper = await asyncio.to_thread(db.get_paper, paper_key)
    return paper or {"ok": True}


@app.post("/api/analyze")
async def analyze_stream(req: AnalyzeRequest):
    """
    SSE 流式端点：逐篇分析文献，结果实时推送并写入数据库。
    """
    async def generate() -> AsyncGenerator[str, None]:
        try:
            all_items = []
            for col_key in req.collection_keys:
                items = ze.get_items_in_collection(col_key)
                if req.item_keys:
                    items = [i for i in items if i['data']['key'] in req.item_keys]
                for item in items:
                    item['_collection_key'] = col_key
                all_items.extend(items)

            total = len(all_items)
            yield f"data: {json.dumps({'type': 'total', 'total': total})}\n\n"

            for idx, item in enumerate(all_items, 1):
                meta = ze.extract_metadata(item)
                title = meta.get("标题", "")
                col_key = item.get('_collection_key', req.collection_keys[0])

                yield f"data: {json.dumps({'type': 'progress', 'index': idx, 'total': total, 'title': title})}\n\n"

                try:
                    row = await asyncio.to_thread(ze.process_item, item, idx, total)
                    row['collection_key'] = col_key

                    # 写入数据库
                    await asyncio.to_thread(db.upsert_paper, row)

                    # 读取完整缓存（含优先级等用户字段）
                    cached = await asyncio.to_thread(db.get_paper, row['key'])
                    yield f"data: {json.dumps({'type': 'result', 'index': idx, 'data': cached or row})}\n\n"

                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'index': idx, 'title': title, 'message': str(e)})}\n\n"

                await asyncio.sleep(0)

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

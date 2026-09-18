"""
ZotSort 本地 SQLite 缓存
存储 AI 分析结果、用户编辑、优先级和重要性标注
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'zotsort.db')
DB_PATH = os.path.abspath(DB_PATH)

AI_FIELDS = ['摘要原文', '研究方法', '主要结论', '创新点', '关键词']
META_FIELDS = ['标题', '作者', '发表年份', '期刊名称', 'DOI', '备注', 'collection_key']


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS papers (
            key             TEXT PRIMARY KEY,
            collection_key  TEXT DEFAULT '',
            标题            TEXT DEFAULT '',
            作者            TEXT DEFAULT '',
            发表年份        TEXT DEFAULT '',
            期刊名称        TEXT DEFAULT '',
            DOI             TEXT DEFAULT '',
            摘要原文        TEXT DEFAULT '',
            研究方法        TEXT DEFAULT '',
            主要结论        TEXT DEFAULT '',
            创新点          TEXT DEFAULT '',
            关键词          TEXT DEFAULT '',
            备注            TEXT DEFAULT '',
            user_edits      TEXT DEFAULT '{}',
            priority        INTEGER DEFAULT 0,
            importance      INTEGER DEFAULT 0,
            user_notes      TEXT DEFAULT '',
            analyzed_at     TEXT,
            updated_at      TEXT
        )
    ''')
    conn.commit()
    conn.close()


def row_to_dict(row) -> dict:
    if row is None:
        return None
    d = dict(row)
    # Parse user_edits JSON
    try:
        d['user_edits'] = json.loads(d.get('user_edits') or '{}')
    except Exception:
        d['user_edits'] = {}
    return d


def get_paper(key: str) -> dict | None:
    conn = get_conn()
    row = conn.execute('SELECT * FROM papers WHERE key = ?', (key,)).fetchone()
    conn.close()
    return row_to_dict(row)


def get_papers_by_collection(collection_key: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        'SELECT * FROM papers WHERE collection_key = ?', (collection_key,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


def upsert_paper(data: dict):
    """
    插入或更新一篇文献。
    - 元数据字段（标题、作者等）：始终覆盖
    - AI 字段（研究方法等）：只有用户未手动编辑过的字段才覆盖
    """
    conn = get_conn()
    now = datetime.now().isoformat()
    existing_row = conn.execute(
        'SELECT * FROM papers WHERE key = ?', (data['key'],)
    ).fetchone()

    if existing_row:
        existing = row_to_dict(existing_row)
        user_edits = existing.get('user_edits', {})

        to_update = {'updated_at': now}

        for field in META_FIELDS:
            val = data.get(field)
            if val is not None:
                to_update[field] = val

        has_new_ai = False
        for field in AI_FIELDS:
            val = data.get(field)
            if val and field not in user_edits:
                to_update[field] = val
                has_new_ai = True

        if has_new_ai:
            to_update['analyzed_at'] = now

        if to_update:
            set_clause = ', '.join(f'"{k}" = ?' for k in to_update)
            conn.execute(
                f'UPDATE papers SET {set_clause} WHERE key = ?',
                list(to_update.values()) + [data['key']]
            )
    else:
        row = {
            'key': data.get('key', ''),
            'collection_key': data.get('collection_key', ''),
            '标题': data.get('标题', ''),
            '作者': data.get('作者', ''),
            '发表年份': data.get('发表年份', ''),
            '期刊名称': data.get('期刊名称', ''),
            'DOI': data.get('DOI', ''),
            '摘要原文': data.get('摘要原文', ''),
            '研究方法': data.get('研究方法', ''),
            '主要结论': data.get('主要结论', ''),
            '创新点': data.get('创新点', ''),
            '关键词': data.get('关键词', ''),
            '备注': data.get('备注', ''),
            'user_edits': '{}',
            'priority': 0,
            'importance': 0,
            'user_notes': '',
            'analyzed_at': now if any(data.get(f) for f in AI_FIELDS) else None,
            'updated_at': now,
        }
        cols = ', '.join(f'"{k}"' for k in row)
        placeholders = ', '.join('?' for _ in row)
        conn.execute(
            f'INSERT INTO papers ({cols}) VALUES ({placeholders})',
            list(row.values())
        )

    conn.commit()
    conn.close()


def update_paper_user_fields(key: str, updates: dict):
    """
    更新用户相关字段：priority、importance、user_notes、手动编辑的 AI 字段。
    对于 AI 字段编辑：把旧值存入 user_edits（用于"恢复 AI 原文"），再更新字段。
    对于 reset_field：从 user_edits 移除该字段，恢复 AI 原始值。
    """
    conn = get_conn()
    now = datetime.now().isoformat()

    existing_row = conn.execute(
        'SELECT * FROM papers WHERE key = ?', (key,)
    ).fetchone()
    if not existing_row:
        conn.close()
        return

    existing = row_to_dict(existing_row)
    user_edits = existing.get('user_edits', {})
    to_update = {'updated_at': now}

    # Simple scalar fields
    for field in ('priority', 'importance', 'user_notes'):
        if field in updates and updates[field] is not None:
            to_update[field] = updates[field]

    # AI field edits
    for field in AI_FIELDS:
        if field in updates and updates[field] is not None:
            # Save the current DB value as "original" before overwriting
            if field not in user_edits:
                user_edits[field] = existing.get(field, '')
            to_update[field] = updates[field]

    # Reset a field to AI original
    reset_field = updates.get('reset_field')
    if reset_field and reset_field in user_edits:
        to_update[reset_field] = user_edits.pop(reset_field)

    to_update['user_edits'] = json.dumps(user_edits, ensure_ascii=False)

    set_clause = ', '.join(f'"{k}" = ?' for k in to_update)
    conn.execute(
        f'UPDATE papers SET {set_clause} WHERE key = ?',
        list(to_update.values()) + [key]
    )
    conn.commit()
    conn.close()


def merge_zotero_with_cache(zotero_items: list[dict], collection_key: str) -> list[dict]:
    """
    将 Zotero 条目列表与数据库缓存合并。
    - 数据库中没有的条目：插入（仅元数据，无 AI 字段）
    - 数据库中已有的条目：用缓存补充 AI 分析、优先级等字段
    """
    cached = {r['key']: r for r in get_papers_by_collection(collection_key)}
    result = []

    for item in zotero_items:
        # item 已经是 extract_metadata 处理后的 dict
        key = item.get('key', '')
        item['collection_key'] = collection_key

        if key not in cached:
            # 新文献，存入数据库（仅元数据）
            upsert_paper(item)
            result.append({**item, 'priority': 0, 'importance': 0, 'user_notes': '', 'user_edits': {}})
        else:
            cache = cached[key]
            # 用缓存的 AI 字段补充
            merged = {**item}
            for field in AI_FIELDS + ['priority', 'importance', 'user_notes', 'user_edits', 'analyzed_at']:
                if cache.get(field):
                    merged[field] = cache[field]
            result.append(merged)

    return result

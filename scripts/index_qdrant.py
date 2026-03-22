#!/usr/bin/env python3
"""Index all markdown files from base/ into Qdrant for semantic search."""

import os
import re
import uuid
import yaml
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer

BASE_DIR = Path("/Users/zeizel/projects/Obsidian-base/base")
QDRANT_URL = "http://localhost:6333"
COLLECTION = "codebase"
VECTOR_NAME = "fast-all-minilm-l6-v2"
SKIP_DIRS = {".obsidian", ".trash", ".makemd", ".space", "_png"}
CHUNK_SIZE = 1500  # chars per chunk (roughly fits model's sweet spot)
OVERLAP = 200


def extract_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata, body)."""
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
                return meta, parts[2].strip()
            except yaml.YAMLError:
                pass
    return {}, content


def clean_markdown(text: str) -> str:
    """Remove markdown artifacts that hurt embedding quality."""
    text = re.sub(r"```[\s\S]*?```", "[code block]", text)
    text = re.sub(r"`[^`]+`", "", text)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    """Split text into overlapping chunks by paragraphs."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) > chunk_size and current:
            chunks.append(current.strip())
            # Keep overlap from end of current chunk
            current = current[-overlap:] + "\n\n" + para if overlap else para
        else:
            current = current + "\n\n" + para if current else para
    if current.strip():
        chunks.append(current.strip())
    return chunks if chunks else [text[:chunk_size]]


def get_md_files() -> list[Path]:
    """Collect all content markdown files."""
    files = []
    for f in BASE_DIR.rglob("*.md"):
        if any(skip in f.parts for skip in SKIP_DIRS):
            continue
        if f.stat().st_size < 50:  # skip near-empty files
            continue
        files.append(f)
    return sorted(files)


def main():
    print("Loading embedding model...")
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    client = QdrantClient(url=QDRANT_URL, check_compatibility=False)

    # Clear old points (keep collection config)
    info = client.get_collection(COLLECTION)
    if info.points_count > 0:
        print(f"Clearing {info.points_count} existing points...")
        # Delete all points by scrolling
        records, _ = client.scroll(COLLECTION, limit=10000)
        if records:
            ids = [r.id for r in records]
            client.delete(COLLECTION, points_selector=ids)
        print("Cleared.")

    files = get_md_files()
    print(f"Found {len(files)} markdown files to index.")

    points = []
    total_chunks = 0

    for i, fpath in enumerate(files):
        rel = fpath.relative_to(BASE_DIR)
        domain = rel.parts[0] if len(rel.parts) > 1 else "root"

        content = fpath.read_text(encoding="utf-8", errors="ignore")
        meta, body = extract_frontmatter(content)
        cleaned = clean_markdown(body)

        if len(cleaned) < 30:
            continue

        tags = meta.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]
        title = meta.get("title", fpath.stem)

        chunks = chunk_text(cleaned)

        for ci, chunk in enumerate(chunks):
            # Prepend title context to improve embedding quality
            embed_text = f"{title}. Domain: {domain}. {chunk}"
            point_id = str(uuid.uuid4())
            points.append({
                "id": point_id,
                "text": embed_text,
                "payload": {
                    "document": chunk[:2000],  # store readable chunk
                    "metadata": {
                        "file": str(rel),
                        "domain": domain,
                        "title": title,
                        "tags": tags,
                        "chunk_index": ci,
                        "total_chunks": len(chunks),
                    }
                }
            })
            total_chunks += 1

        if (i + 1) % 50 == 0:
            print(f"  Processed {i+1}/{len(files)} files ({total_chunks} chunks)...")

    print(f"\nTotal: {len(files)} files -> {total_chunks} chunks")
    print("Generating embeddings (batch)...")

    texts = [p["text"] for p in points]
    # Batch encode all at once for efficiency
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

    print(f"Uploading {total_chunks} points to Qdrant...")

    # Upsert in batches of 100
    batch_size = 100
    for start in range(0, len(points), batch_size):
        batch = points[start:start + batch_size]
        batch_embeddings = embeddings[start:start + batch_size]
        qdrant_points = [
            PointStruct(
                id=p["id"],
                vector={VECTOR_NAME: emb.tolist()},
                payload=p["payload"],
            )
            for p, emb in zip(batch, batch_embeddings)
        ]
        client.upsert(COLLECTION, points=qdrant_points)
        print(f"  Uploaded {min(start + batch_size, len(points))}/{len(points)}")

    # Verify
    info = client.get_collection(COLLECTION)
    print(f"\nDone! Qdrant collection '{COLLECTION}' now has {info.points_count} points.")
    print(f"Indexed vectors: {info.indexed_vectors_count}")


if __name__ == "__main__":
    main()

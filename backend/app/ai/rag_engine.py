import math
import re
from typing import List, Dict, Any, Tuple
from app.core.logging import logger

class RAGEngine:
    """
    RAG engine that chunks documents, extracts features/embeddings,
    and performs semantic/keyword similarity retrieval to augment AI planning.
    """

    @staticmethod
    def extract_text_from_file(content_bytes: bytes, filename: str) -> str:
        filename_lower = filename.lower()
        if filename_lower.endswith(".pdf"):
            try:
                import pypdf
                import io
                reader = pypdf.PdfReader(io.BytesIO(content_bytes))
                text_list = []
                for page in reader.pages:
                    text_list.append(page.extract_text() or "")
                return "\n".join(text_list)
            except Exception as e:
                logger.error(f"Failed to parse PDF {filename}: {e}")
                return content_bytes.decode("utf-8", errors="ignore")
        else:
            return content_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
        cleaned = re.sub(r'\s+', ' ', text).strip()
        if not cleaned:
            return []
        
        words = cleaned.split(" ")
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += (chunk_size - overlap)
            if i >= len(words):
                break
        return chunks

    @staticmethod
    def compute_simple_embedding(text: str) -> List[float]:
        # Fast deterministic semantic hash embedding for zero-dependency vector storage
        # Produces a normalized 64-dimensional feature vector
        words = re.findall(r'\w+', text.lower())
        vec = [0.0] * 64
        for w in words:
            h = hash(w)
            idx = abs(h) % 64
            vec[idx] += 1.0
        
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 5) for x in vec]

    @classmethod
    def similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b))

    @classmethod
    def retrieve_relevant_chunks(
        cls, query: str, chunks_with_embeddings: List[Dict[str, Any]], top_k: int = 4
    ) -> List[str]:
        if not chunks_with_embeddings:
            return []

        query_vec = cls.compute_simple_embedding(query)
        scored_chunks: List[Tuple[float, str]] = []

        query_words = set(re.findall(r'\w+', query.lower()))

        for item in chunks_with_embeddings:
            content = item.get("content", "")
            emb = item.get("embedding", [])
            
            # Vector cosine similarity
            v_score = cls.similarity(query_vec, emb) if emb else 0.0
            
            # Keyword overlap boost
            content_words = set(re.findall(r'\w+', content.lower()))
            overlap_score = len(query_words.intersection(content_words)) / (len(query_words) or 1)
            
            final_score = 0.6 * v_score + 0.4 * overlap_score
            scored_chunks.append((final_score, content))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [c for score, c in scored_chunks[:top_k]]

import os
import chromadb
import uuid
MEMORY_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=MEMORY_DIR)
collection = client.get_or_create_collection(name="rem_conversations")
def add_memory(role: str, content: str):
    doc_id = str(uuid.uuid4())
    collection.add(
        documents=[content],
        metadatas=[{"role": role}],
        ids=[doc_id]
    )
def search_memory(query: str, n_results: int = 3) -> list:
    if collection.count() == 0:
        return []
    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, collection.count())
        )
        if results and results['documents'] and len(results['documents']) > 0:
            return results['documents'][0]
        return []
    except Exception as e:
        print(f"Memory search error: {e}")
        return []
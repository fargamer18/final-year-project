import json
import textwrap

INPUT_FILE = "bda_regulations_cleaned.json"
OUTPUT_FILE = "bda_chunks.json"

# maximum characters per chunk (approx. 512–800 tokens)
CHUNK_SIZE = 1500  
OVERLAP = 200  # to preserve context between chunks

def chunk_text(text, size=CHUNK_SIZE, overlap=OVERLAP):
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start += size - overlap
    return chunks

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

chunked_data = []
for entry in data:
    text = entry["clean_text"]
    page_no = entry["page_no"]
    chunks = chunk_text(text)
    for i, chunk in enumerate(chunks, start=1):
        chunked_data.append({
            "page_no": page_no,
            "chunk_id": f"{page_no}_{i}",
            "chunk_text": chunk
        })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(chunked_data, f, ensure_ascii=False, indent=2)

print(f"Created {len(chunked_data)} text chunks → saved to {OUTPUT_FILE}")

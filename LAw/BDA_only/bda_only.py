import json
import re

INPUT_FILE = "bda_regulations.json"
OUTPUT_FILE = "bda_regulations_cleaned.json"

def clean_text(text):
    # Remove multiple spaces and line breaks
    text = re.sub(r'\s+', ' ', text)
    
    # Remove page numbers or isolated numbers
    text = re.sub(r'^\s*\d+\s*$', '', text)
    
    # Remove common headers/footers if present
    text = re.sub(r'Bangalore Development Authority', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Page \d+', '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # remove non-English junk
    text = re.sub(r"\.{5,}", " ", text)  # remove long dotted lines
    text = re.sub(r"\s{2,}", " ", text)  # collapse multiple spaces
    text = re.sub(r"\bPage\s*\d+\b", "", text, flags=re.IGNORECASE)  # remove "Page 12"
    text = re.sub(r"\d+\s*\.\d+", "", text)  # remove section numbers like 4.3 or 2.1
    text = re.sub(r"[\r\n]+", " ", text)  # remove newlines

    # Trim leading and trailing spaces
    text = text.strip()
    
    return text


with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)
'''
cleaned = []
for entry in data:
    if entry.get("text_en"):
        cleaned_text = clean_text(entry["text_en"])
        if len(cleaned_text) > 20:  # skip blank or too short junk
            cleaned.append({
                "page_no": entry.get("page_no"),
                "text": cleaned_text
            })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(cleaned, f, ensure_ascii=False, indent=2)

print(f"Cleaned {len(cleaned)} entries and saved to {OUTPUT_FILE}")

import json
import re

INPUT_FILE = "bda_corpus.json"
OUTPUT_FILE = "bda_corpus_cleaned_en.json"

def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'Page\s*\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # remove non-English junk
    text = text.strip()
    return text

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)
'''
cleaned_data = []
for entry in data:
    raw_text = entry.get("text_en", "") or entry.get("text", "")
    cleaned = clean_text(raw_text)
    if cleaned:
        cleaned_data.append({
            "page_no": entry.get("page_no"),
            "clean_text": cleaned
        })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(cleaned_data, f, ensure_ascii=False, indent=2)

print(f"Cleaned {len(cleaned_data)} entries → saved to {OUTPUT_FILE}")

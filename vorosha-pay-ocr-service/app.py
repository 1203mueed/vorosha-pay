#!/usr/bin/env python3
"""
FastAPI NID OCR service (simplified to mirror testing_ocr/test.py)
- English-only OCR with EasyOCR
- Parses Name, Date of Birth, ID NO using simple label-based search
- Saves nid_extraction_results.json (with only those fields in summary) to uploads/nid_documents/{userId}_nid_extraction_results.json
- Returns extractedInfo with only nidNumber, name, dateOfBirth and confidenceScore (0-1)
"""

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional

import easyocr
import cv2
import numpy as np
import os
import json
import gc
import tempfile
import warnings
import re

warnings.filterwarnings('ignore')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OptimizedNIDExtractor:
    def __init__(self):
        self.use_gpu = self._check_gpu_availability()
        self.reader = None
        self._initialize_reader()

    def _check_gpu_availability(self) -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False

    def _initialize_reader(self):
        try:
            self._clear_gpu_memory()
            # English only (to mirror testing script)
            self.reader = easyocr.Reader(['en'], gpu=self.use_gpu, verbose=False, download_enabled=True)
        except Exception:
            if self.use_gpu:
                self.use_gpu = False
                self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            else:
                raise

    def _clear_gpu_memory(self):
        try:
            import torch
            if torch.cuda.is_available() and self.use_gpu:
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
        except ImportError:
            pass
        gc.collect()

    def preprocess_nid_image(self, image_path: str) -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        height, width = image_rgb.shape[:2]

        # Optimized resizing (only if very small or large)
        if width < 800 or width > 2000:
            target_width = 1200 if width > 2000 else 800
            scale_factor = target_width / width
            new_width = target_width
            new_height = int(height * scale_factor)
            image_rgb = cv2.resize(image_rgb, (new_width, new_height), interpolation=cv2.INTER_LINEAR)

        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        enhanced = cv2.addWeighted(enhanced, 0.7, sharpened, 0.3, 0)

        enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
        if enhanced_rgb.dtype != np.uint8:
            enhanced_rgb = enhanced_rgb.astype(np.uint8)

        return enhanced_rgb

    def extract_text_from_nid(self, image_path: str) -> Dict:
        if not os.path.exists(image_path):
            return {"error": f"Image not found: {image_path}"}
        try:
            processed_image = self.preprocess_nid_image(image_path)
            results = self.reader.readtext(processed_image, detail=1, width_ths=0.7, height_ths=0.7, paragraph=False)
            extracted_text: List[Dict[str, object]] = []
            for bbox, text, confidence in results:
                cleaned = self._clean_text(text)
                # Keep English-heavy text only
                if cleaned and confidence > 0.2 and self._is_english_text(cleaned):
                    extracted_text.append({"text": cleaned, "confidence": round(float(confidence), 3)})
            return {"extracted_text": extracted_text}
        except Exception as e:
            return {"error": f"Error processing {image_path}: {str(e)}"}

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        return ' '.join(text.strip().split())

    def _is_english_text(self, text: str) -> bool:
        if not text:
            return False
        ascii_chars = sum(1 for ch in text if ord(ch) < 128)
        return ascii_chars / len(text) > 0.7


def collect_all_text(results: Dict[str, Dict]) -> List[str]:
    texts: List[str] = []
    for key in ["nid_image_1.jpg", "nid_image_2.jpg"]:
        block = results.get(key)
        if isinstance(block, dict) and 'extracted_text' in block:
            for entry in block['extracted_text']:
                if 'text' in entry:
                    texts.append(entry['text'])
    return texts


def find_and_extract_field(field_name: str, texts: List[str]) -> str:
    variants = [f"{field_name}:", f"{field_name} :", field_name.upper() + ":", field_name.upper() + " :", field_name.lower() + ":", field_name.lower() + " :"]
    for i, t in enumerate(texts):
        for v in variants:
            if v in t:
                if ":" in t:
                    parts = t.split(":", 1)
                    if len(parts) > 1:
                        value = parts[1].strip()
                        if value:
                            return value
                if i + 1 < len(texts):
                    nxt = texts[i + 1].strip()
                    if nxt:
                        return nxt
                return ""
    return ""


def build_summary(results: Dict[str, Dict]) -> Dict[str, str]:
    texts = collect_all_text(results)
    name = find_and_extract_field("Name", texts) or "Not found"
    dob = find_and_extract_field("Date of Birth", texts) or "Not found"
    nid_no = find_and_extract_field("ID NO", texts) or "Not found"
    return {"Name:": name, "Date of Birth:": dob, "ID NO:": nid_no}


def compute_confidence01(results: Dict[str, Dict]) -> float:
    # average of all extracted confidences (0-1)
    confs: List[float] = []
    for key in ["nid_image_1.jpg", "nid_image_2.jpg"]:
        block = results.get(key)
        if isinstance(block, dict) and 'extracted_text' in block:
            for entry in block['extracted_text']:
                try:
                    c = float(entry.get('confidence', 0.0))
                    confs.append(c)
                except Exception:
                    pass
    return round((sum(confs) / len(confs)) if confs else 0.0, 4)


def derive_user_id(default_user_id: Optional[str], nid_front: UploadFile, nid_back: UploadFile) -> str:
    if default_user_id and default_user_id.strip():
        return default_user_id.strip()
    for fn in [nid_front.filename or "", nid_back.filename or ""]:
        m = re.match(r"^(\d+)[-_]", fn)
        if m:
            return m.group(1)
    env_id = os.getenv("VOROSHA_USER_ID", "").strip()
    return env_id or "unknown"


def save_results_json(results: Dict[str, Dict], user_id: str) -> str:
    # Use configurable path with fallback
    base_dir = os.getenv("UPLOAD_DIR", "./uploads/nid_documents")
    os.makedirs(base_dir, exist_ok=True)
    path = os.path.join(base_dir, f"{user_id}_nid_extraction_results.json")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return path


@app.post('/ocr/nid')
async def ocr_nid(
    nid_front: UploadFile = File(...),
    nid_back: UploadFile = File(...),
    user_id: Optional[str] = Query(default=None)
) -> Dict:
    resolved_user_id = derive_user_id(user_id, nid_front, nid_back)

    with tempfile.NamedTemporaryFile(delete=False, suffix='-front.jpg') as tf_front:
        front_path = tf_front.name
        tf_front.write(await nid_front.read())
        tf_front.flush()
    with tempfile.NamedTemporaryFile(delete=False, suffix='-back.jpg') as tf_back:
        back_path = tf_back.name
        tf_back.write(await nid_back.read())
        tf_back.flush()

    extractor = None
    try:
        extractor = OptimizedNIDExtractor()
        front = extractor.extract_text_from_nid(front_path)
        back = extractor.extract_text_from_nid(back_path)
        results: Dict[str, Dict] = {
            "nid_image_1.jpg": front if 'extracted_text' in front else {"extracted_text": []},
            "nid_image_2.jpg": back if 'extracted_text' in back else {"extracted_text": []},
        }

        # Build summary (only Name, Date of Birth, ID NO)
        results["summary"] = build_summary(results)

        # Save JSON
        json_path = save_results_json(results, resolved_user_id)

        # Confidence 0-1
        conf01 = compute_confidence01(results)

        # Extracted info for DB mapping
        summary = results["summary"]
        extracted_info = {
            "nidNumber": summary.get("ID NO:", ""),
            "name": summary.get("Name:", ""),
            "dateOfBirth": summary.get("Date of Birth:", ""),
            "confidenceScore": conf01,
        }

        print("success")
        return {
            "success": True,
            "frontText": "\n".join([t['text'] for t in results["nid_image_1.jpg"]["extracted_text"]]),
            "backText": "\n".join([t['text'] for t in results["nid_image_2.jpg"]["extracted_text"]]),
            "extractedInfo": extracted_info,
            "confidenceScore": conf01,
            "jsonPath": json_path,
            "userId": resolved_user_id,
            "used": "easyocr-en"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try:
            if extractor is not None:
                extractor._clear_gpu_memory()
        except Exception:
            pass
        try:
            os.unlink(front_path)
        except Exception:
            pass
        try:
            os.unlink(back_path)
        except Exception:
            pass


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8500) 
    
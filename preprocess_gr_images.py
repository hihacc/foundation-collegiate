import os
import hashlib
import json
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

BASE_DIR = os.getcwd()
GR_DIR = os.path.join(BASE_DIR, 'gr')
VARIANTS_DIR = os.path.join(BASE_DIR, 'public', 'gr_variants')

os.makedirs(os.path.join(VARIANTS_DIR, 'grayscale'), exist_ok=True)
os.makedirs(os.path.join(VARIANTS_DIR, 'contrast'), exist_ok=True)
os.makedirs(os.path.join(VARIANTS_DIR, 'threshold'), exist_ok=True)
os.makedirs(os.path.join(VARIANTS_DIR, 'left_page'), exist_ok=True)
os.makedirs(os.path.join(VARIANTS_DIR, 'right_page'), exist_ok=True)

files = sorted([f for f in os.listdir(GR_DIR) if f.lower().endswith(('.jpeg', '.jpg', '.png'))])

print(f"Starting forensic preprocessing for {len(files)} images...")

manifest = []

for idx, file_name in enumerate(files):
    file_path = os.path.join(GR_DIR, file_name)
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

    with Image.open(file_path) as img:
        # Check EXIF orientation
        img = ImageOps.exif_transpose(img)
        width, height = img.size

        # 1. Grayscale
        gray = img.convert('L')
        gray_path = os.path.join(VARIANTS_DIR, 'grayscale', f"img_{idx+1:02d}_gray.jpg")
        gray.save(gray_path, 'JPEG', quality=95)

        # 2. High Contrast
        enhancer = ImageEnhance.Contrast(gray)
        contrast = enhancer.enhance(1.8)
        contrast_path = os.path.join(VARIANTS_DIR, 'contrast', f"img_{idx+1:02d}_contrast.jpg")
        contrast.save(contrast_path, 'JPEG', quality=95)

        # 3. Adaptive / Otsu Threshold
        thresh = gray.point(lambda p: 255 if p > 120 else 0)
        thresh_path = os.path.join(VARIANTS_DIR, 'threshold', f"img_{idx+1:02d}_thresh.jpg")
        thresh.save(thresh_path, 'JPEG', quality=95)

        # 4. Split Left Page and Right Page (for 2-page notebook ledger spreads)
        half_w = width // 2
        left_crop = img.crop((0, 0, half_w, height))
        right_crop = img.crop((half_w, 0, width, height))

        left_path = os.path.join(VARIANTS_DIR, 'left_page', f"img_{idx+1:02d}_left.jpg")
        right_path = os.path.join(VARIANTS_DIR, 'right_page', f"img_{idx+1:02d}_right.jpg")
        left_crop.save(left_path, 'JPEG', quality=95)
        right_crop.save(right_path, 'JPEG', quality=95)

        manifest.append({
            "imageId": f"img_{idx+1:02d}",
            "order": idx + 1,
            "fileName": file_name,
            "sha256": sha256,
            "sizeBytes": file_size,
            "width": width,
            "height": height,
            "format": "JPEG",
            "originalUrl": f"/gr/{file_name}",
            "variants": {
                "grayscale": f"/gr_variants/grayscale/img_{idx+1:02d}_gray.jpg",
                "contrast": f"/gr_variants/contrast/img_{idx+1:02d}_contrast.jpg",
                "threshold": f"/gr_variants/threshold/img_{idx+1:02d}_thresh.jpg",
                "leftPage": f"/gr_variants/left_page/img_{idx+1:02d}_left.jpg",
                "rightPage": f"/gr_variants/right_page/img_{idx+1:02d}_right.jpg"
            },
            "processingStatus": "preprocessed"
        })

manifest_path = os.path.join(BASE_DIR, 'data', 'gr_forensic_sources.json')
os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

print(f"Forensic preprocessing complete for all {len(manifest)} images. Manifest saved to data/gr_forensic_sources.json")

import os
import shutil
from PIL import Image

logo_dir = r"d:\Acm\backend\assets\logos"

mapping = {
    "2210415.webp": "axis_1.jpg",
    "HDFC-Bank-Emblem-700x394.png": "hdfc_1.png",
    "OIP (1).jpg": "phonepe_1.jpg",
    "OIP (1).webp": "gpay_1.jpg",
    "OIP (2).webp": "bhim_1.jpg",
    "OIP (3).webp": "icici_1.jpg",
    "OIP (4).webp": "paytm_1.jpg",
    "OIP.jpg": "phonepe_2.jpg",
    "OIP.webp": "phonepe_4.jpg", # Assume phonepe based on sequential OIP
    "SBI-Logo-scaled.jpeg": "sbi_1.jpeg",
    "b8efb14cebcbe89a95c775a95e2d6b57.jpg": "axis_2.jpg",
    "google-pay-logo-transparent-free-png.webp": "gpay_2.jpg",
    "hdfc-bank-logo-1024x1024.png": "hdfc_2.png",
    "phonepe-logo-png_seeklogo-339867.png": "phonepe_3.png",
    "sbi.jpeg": "sbi_2.jpeg",
}

for old_name, new_name in mapping.items():
    old_path = os.path.join(logo_dir, old_name)
    new_path = os.path.join(logo_dir, new_name)
    
    if os.path.exists(old_path):
        if old_path.endswith('.webp'):
            print(f"Converting {old_name} to {new_name}")
            try:
                img = Image.open(old_path).convert("RGB")
                img.save(new_path, "JPEG")
                os.remove(old_path)
            except Exception as e:
                print(f"Error converting {old_name}: {e}")
        else:
            print(f"Renaming {old_name} to {new_name}")
            shutil.move(old_path, new_path)

print("Done cleaning up logos!")

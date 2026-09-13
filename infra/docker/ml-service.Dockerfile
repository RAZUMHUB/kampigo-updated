FROM python:3.11-slim

# tesseract-ocr: required by the Tesseract OCR adapter.
# libgl1 / libglib2.0-0: required by opencv-python-headless / Pillow image ops.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY apps/ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/ml-service .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

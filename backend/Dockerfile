# Use Python 3.12 as specified in README
FROM python:3.12-slim

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for the project root
WORKDIR /project

# Create directory structure
RUN mkdir -p /project/app/backend

# Copy requirements first to leverage Docker cache
COPY requirements.txt /project/app/backend/

# Install Python dependencies
WORKDIR /project/app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application files
COPY . /project/app/backend/

# Create __init__.py files to make directories proper packages
RUN touch /project/__init__.py
RUN touch /project/app/__init__.py

# Create a non-root user
RUN useradd -m myuser
USER myuser

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/project

# Command to run the application
WORKDIR /project
CMD ["uvicorn", "app.backend.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Create non-root user, ensure uploads folder, and grant ownership
RUN addgroup --system app && adduser --system --group app \
    && mkdir -p /app/uploads && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["./start.sh"]

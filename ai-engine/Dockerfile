FROM python:3.10-slim

WORKDIR /app

# Copy dependencies file first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure the model file is accessible if it needs to be read
# Expose the API port
EXPOSE 8002

# Run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]

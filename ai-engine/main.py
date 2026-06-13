from fastapi import FastAPI
from pydantic import BaseModel
import model

app = FastAPI(title="OpsToday AI Engine", version="1.0")

class TicketRequest(BaseModel):
    title: str
    description: str = ""

class TicketResponse(BaseModel):
    category: str
    keyword: str | None = None
    confidence_score: float

@app.post("/analyze-ticket", response_model=TicketResponse)
def analyze_ticket(ticket: TicketRequest):
    # Combine title and description for better context
    text_to_analyze = f"{ticket.title} {ticket.description}"
    
    result = model.predict_category(text_to_analyze)
    
    return TicketResponse(
        category=result["category"],
        keyword=result["keyword"],
        confidence_score=result["confidence"]
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model.get_model() is not None}

import asyncio
import retrain

async def auto_retrain_task():
    # Tunggu 60 detik saat pertama kali server menyala 
    # untuk memastikan container database (MySQL) sudah siap menerima koneksi
    await asyncio.sleep(60)
    
    while True:
        try:
            print("Auto-retrain triggered by background task...")
            retrain.retrain_from_db()
            print("Model successfully retrained and saved to disk.")
        except Exception as e:
            print(f"Auto-retrain failed: {e}")
            
        # Tunggu 24 jam sebelum retrain berikutnya (86400 detik)
        await asyncio.sleep(86400)

@app.on_event("startup")
async def startup_event():
    # Jalankan proses retrain di latar belakang tanpa memblokir API
    asyncio.create_task(auto_retrain_task())

import sys
import os
 
sys.path.insert(0, os.path.dirname(__file__))
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat
 
app = FastAPI(title="Genie Contabilizei API")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(chat.router)
 
 
@app.get("/health")
def health():
    return {"status": "ok"}
 
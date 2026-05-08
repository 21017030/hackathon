import logging

from fastapi import FastAPI

from app.api.routes import documents, test

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="Hackathon API")

app.include_router(documents.router)
app.include_router(test.router)

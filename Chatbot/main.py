from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

# Allow CORS for your frontend app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can specify your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a request model
class UserMessage(BaseModel):
    message: str

# Sample bot responses
bot_responses = [
    "I'm here to assist you!",
    "What can I help you with today?",
    "Feel free to ask me anything.",
    "I'm glad to be of service!",
    "How can I assist you further?"
]

@app.post("/send_message/")
async def send_message(user_message: UserMessage):
    # Simulate a bot response
    # bot_response = random.choice(bot_responses)

    bot_response = input("input bot text: ")
    return {"response": bot_response}

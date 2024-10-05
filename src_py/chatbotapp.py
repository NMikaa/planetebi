from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from src_py.GptAssistant import Chatbot  # Import the updated Chatbot class

app = FastAPI()
chatbot = Chatbot()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, can be changed to specific domain
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Define a Pydantic model for the request body
class MessagePayload(BaseModel):
    message: str
    id: str = None  # Optional thread_id to continue conversation

@app.post("/message")
def send_message(payload: MessagePayload):
    """Send a message to the assistant and get the response."""
    user_message = payload.message
    if not user_message:
        raise HTTPException(status_code=400, detail="Message not provided.")


    if payload.id:
        # Continue conversation with provided thread_id
        thread_id = payload.id
        chatbot.set_thread_id(thread_id)
    else:
        # Start a new conversation
        thread_id = chatbot.start_new_conversation()

    # Send the user message to the assistant
    chatbot.send_message(user_message=user_message, thread_id=thread_id)

    # Get the assistant's response
    assistant_response = chatbot.get_response(thread_id=thread_id)[0].text.value

    return {"assistant_response": assistant_response, "id": thread_id}

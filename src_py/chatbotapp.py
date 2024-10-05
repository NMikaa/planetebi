from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src_py.GptAssistant import Chatbot  # Import the updated Chatbot class

app = FastAPI()
chatbot = Chatbot()

# Define a Pydantic model for the request body
class MessagePayload(BaseModel):
    message: str
    thread_id: str = None  # Optional thread_id to continue conversation

@app.post("/message")
def send_message(payload: MessagePayload):
    """Send a message to the assistant and get the response."""
    user_message = payload.message
    if not user_message:
        raise HTTPException(status_code=400, detail="Message not provided.")

    if payload.thread_id:
        # Continue conversation with provided thread_id
        thread_id = payload.thread_id
        chatbot.set_thread_id(thread_id)
    else:
        # Start a new conversation
        thread_id = chatbot.start_new_conversation()

    # Send the user message to the assistant
    chatbot.send_message(user_message=user_message, thread_id=thread_id)

    # Get the assistant's response
    assistant_response = chatbot.get_response(thread_id=thread_id)

    return {"assistant_response": assistant_response, "thread_id": thread_id}

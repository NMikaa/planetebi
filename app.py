from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from GptApi import PlanetAssistant
import pandas as pd
import requests
from io import BytesIO
from starlette.responses import StreamingResponse
import motor.motor_asyncio  # <-- Added motor for MongoDB
from bson import ObjectId  # <-- For working with MongoDB object IDs

# Load your data
df = pd.read_csv('Data/merged.csv')

# Initialize the FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, can be changed to specific domain
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)
# Create a global instance of PlanetAssistant that can be switched
current_assistant = PlanetAssistant()

# MongoDB setup
MONGODB_URL = "mongodb://localhost:27017"  # Replace with your MongoDB connection string
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.chat_db  # Database name
conversations_collection = db.conversations  # Collection name

# Define the request model
class UserInputModel(BaseModel):
    user_input: str


# Helper function to save conversation
async def save_conversation(user_input, bot_response):
    conversation_data = {
        "user_input": user_input,
        "bot_response": bot_response
    }
    result = await conversations_collection.insert_one(conversation_data)
    return str(result.inserted_id)  # Return the ID of the inserted conversation


@app.post("/switch_convo/")
def switch_convo():
    """
    Switch to a new conversation by creating a new PlanetAssistant instance.
    """
    global current_assistant
    current_assistant = PlanetAssistant()  # Create a new instance of PlanetAssistant
    return {"message": "Switched to a new conversation. You can now start fresh."}


@app.post("/start_of_conversation/")
async def start_of_conversation(user_input: UserInputModel):
    """
    Start or continue the current conversation using the globally tracked PlanetAssistant.
    """
    global current_assistant
    try:
        # Start the conversation with the provided user input
        current_assistant.start_conversation(user_input.user_input, df)

        # Finalize and get the image URL
        image_url = current_assistant.finalize_conversation()
        if image_url:
            # Download the image from the URL
            response = requests.get(image_url)
            if response.status_code == 200:
                # Read the image content
                img = BytesIO(response.content)
                # Save the conversation to MongoDB
                await save_conversation(user_input.user_input, image_url)
                # Return the image as a streaming response
                return StreamingResponse(img, media_type="image/png")
            else:
                raise HTTPException(status_code=500, detail="Failed to download the image")
        else:
            raise HTTPException(status_code=500, detail="Image generation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/continue_conversation/")
async def continue_conversation(user_input: UserInputModel):
    """
    Continue the current conversation using the globally tracked PlanetAssistant.
    """
    global current_assistant
    try:
        # Add more information to the conversation
        current_assistant.add_to_prompt(user_input.user_input)

        # Finalize and get the image URL
        image_url = current_assistant.finalize_conversation()
        if image_url:
            # Download the image from the URL
            response = requests.get(image_url)
            if response.status_code == 200:
                # Read the image content
                img = BytesIO(response.content)
                # Save the conversation to MongoDB
                await save_conversation(user_input.user_input, image_url)
                # Return the image as a streaming response
                return StreamingResponse(img, media_type="image/png")
            else:
                raise HTTPException(status_code=500, detail="Failed to download the image")
        else:
            raise HTTPException(status_code=500, detail="Image generation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

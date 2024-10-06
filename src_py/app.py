from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src_py.GptApi import PlanetAssistant  # Import the PlanetAssistant class
import pandas as pd
import requests
from io import BytesIO
from starlette.responses import StreamingResponse
import openai
import os
from dotenv import load_dotenv, find_dotenv
import cloudinary.uploader as uploader
import cloudinary
from typing import List
from pydantic import BaseModel
from src_py.GptAssistant import Chatbot

cloudinary.config(
  cloud_name = "dqfgluj1j",
  api_key = "171765552355944",
  api_secret = "jvvqDYqUNO0rJsvU-ruwunonuBs",
  secure = True
)

# Load environment variables (e.g., OpenAI API key)
load_dotenv(find_dotenv())
openai.api_key = os.getenv('OPENAI_API_KEY')

# Load your data
df = pd.read_csv('Data/merged.csv')

# Initialize the FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins; change as needed
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Create a global instance of PlanetAssistant that can be switched
current_assistant = PlanetAssistant()



# Define the request models
class UserInputModel(BaseModel):
    user_input: str

class FeaturesModel(BaseModel):
    temperature: str
    types:  List[str]
    color: str

class MessagePayload(BaseModel):
    message: str
    id: str = None
# Helper function to save conversation

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
    Start the conversation using the globally tracked PlanetAssistant.
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
    Continue the conversation using the globally tracked PlanetAssistant.
    """
    global current_assistant
    try:
        # Add more information to the conversation
        current_assistant.continue_conversation(user_input.user_input)

        # Finalize and get the image URL
        image_url = current_assistant.finalize_conversation()
        if image_url:
            # Download the image from the URL
            response = requests.get(image_url)
            if response.status_code == 200:
                # Read the image content
                img = BytesIO(response.content)
                # Save the conversation to MongoDB
                # Return the image as a streaming response
                return StreamingResponse(img, media_type="image/png")
            else:
                raise HTTPException(status_code=500, detail="Failed to download the image")
        else:
            raise HTTPException(status_code=500, detail="Image generation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_image/")
async def generate_image(features: FeaturesModel):
    """
    Generate an image based on the provided features using the predefined prompt.
    """
    second_assistant = PlanetAssistant()

    try:
        # Extract values from the features
        temperature = features.temperature or 'temperate'
        planet_type = ", ".join(features.types or 'terrestrial')
        color = features.color or 'earthy'

        # Predefined prompt with placeholders
        prompt_template = (
            "The image presents a panoramic view of a [temperature] [type] planet, "
            "highlighted in a palette of [color] tones. It captures the dynamic and complex "
            "surface and atmospheric features, conveying a sense of depth and motion. "
            "The planet is centrally positioned in the composition. don't generate any shadows in this picture."
        )
        print("mihvelet")
        # Replace placeholders with actual values
        prompt = prompt_template.replace('[temperature]', temperature)
        prompt = prompt.replace('[type]', planet_type)
        prompt = prompt.replace('[color]', color)

        # Generate the image URL
        print(prompt)
        image_url = second_assistant.generate_dalle_image(prompt=prompt)
        print(image_url)

        # Preprocess the image
        image = second_assistant.preprocess_dalle_image(image_url)  # Use the standalone function

        if image:
            # Convert the image to bytes
            img_bytes = BytesIO()
            image.save(img_bytes, format='PNG')
            img_byte_array = img_bytes.getvalue()  # Get the bytes data
            final_url = uploader.upload(file=img_byte_array, unique_filename=True, overwrite=True)['secure_url']
            print(final_url)
            return {"img_url": final_url}
        else:
            raise HTTPException(status_code=500, detail="Image generation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

  # Import the updated Chatbot class

chatbot = Chatbot()



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

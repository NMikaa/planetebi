from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
from openai import OpenAI

client = OpenAI()

class Chatbot:
    def __init__(self):
        """Initialize the chatbot by uploading files and creating an assistant."""
        # Upload the planets.json file for use by the assistant
        file = client.files.create(
            file=open("Data/planets.json", "rb"),
            purpose='assistants'
        )

        # Create the assistant
        self.assistant = client.beta.assistants.create(
            name="Educator",
            description=(
                "You are an assistant for middle schoolers and high schoolers "
                "who are interested in cosmos and exoplanets. Your messages "
                "should always be enjoyable to read and not plain and boring. "
                "Always explain everything that the student asks you."
            ),
            model="gpt-4o-mini",
            tools=[{"type": "code_interpreter"}],
            tool_resources={
                "code_interpreter": {
                    "file_ids": [file.id]
                }
            }
        )
        print(f"Assistant created with ID: {self.assistant.id}")

        # Initialize thread_id to None
        self.thread_id = None

    def start_new_conversation(self):
        """Start a new conversation thread."""
        thread = client.beta.threads.create()
        self.thread_id = thread.id
        print(f"Started new conversation with thread ID: {self.thread_id}")
        return self.thread_id

    def set_thread_id(self, thread_id):
        """Set the current thread ID to continue an existing conversation."""
        self.thread_id = thread_id

    def get_thread_id(self):
        """Get the current thread ID."""
        return self.thread_id

    def send_message(self, user_message, thread_id=None):
        """Send a message to the assistant within a thread."""
        if thread_id is None:
            if self.thread_id is None:
                raise ValueError("No thread ID provided and no current thread set.")
            thread_id = self.thread_id
        else:
            self.thread_id = thread_id  # Update current thread ID

        message = client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message
        )
        return message

    def get_response(self, thread_id=None):
        """Get the assistant's response using create_and_poll."""
        if thread_id is None:
            if self.thread_id is None:
                raise ValueError("No thread ID provided and no current thread set.")
            thread_id = self.thread_id
        else:
            self.thread_id = thread_id  # Update current thread ID

        # Run the assistant and wait for completion
        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread_id,
            assistant_id=self.assistant.id,
        )
        if run.status == 'completed':
            # Retrieve all messages in the thread
            messages_response = client.beta.threads.messages.list(
                thread_id=thread_id
            )
            messages = messages_response.data  # Assuming messages are in the 'data' attribute
            # Find the last assistant's response
            assistant_messages = [m for m in messages if m.role == 'assistant']
            if assistant_messages:
                last_assistant_message = assistant_messages[-1]
                return last_assistant_message.content
            else:
                return "No assistant response found."
        else:
            return f"Run status: {run.status}"


1. **Install Dependencies**:
   
   You can install the required packages using the `requirements.txt` file, but it is recommended to create virtual environment before:
   ```bash
   python -m venv myenv
   myenv/Scripts/activate
   ```
   
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. **Start the FastAPI Server**:

   Navigate to the directory where your `chatbotapp.py` file is located (in this case Chatbot) and run:
   
   ```bash
   uvicorn src_py.app:app --reload
   ```

   The server will start at `http://localhost:8000`.

2. **Open the Frontend**:

   Open the HTML file in a web browser. You can use a simple server (like Python's built-in HTTP server) or just open it directly if CORS is not an issue.

   If using Python's HTTP server, you can run:

   ```bash
   python -m http.server
   ```

   Then navigate to `http://localhost:8000` (or the respective port) in your web browser.

## How to Use

1. Type your message in the input field at the bottom of the chat interface.
2. Press "Enter" to send your message.
3. The bot will respond with one of its pre-defined messages.

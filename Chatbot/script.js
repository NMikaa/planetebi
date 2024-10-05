document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    promptInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && promptInput.value.trim() !== '') {
            // Hide the prompt section and show the chat view and input
            promptSection.style.display = 'none';
            promptInput.style.display = 'none';
            chatView.style.display = 'block';
            chatInput.style.display = 'block';

            // Append the initial prompt to the chat messages
            const userMessage = document.createElement('div');
            userMessage.classList.add('user-message');
            userMessage.textContent = promptInput.value;
            chatMessages.appendChild(userMessage);
            
            const response = await fetch("http://localhost:8000/send_message/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: promptInput.value }),
            });
    
            const data = await response.json();
            const botMessage = data.response;
    
            // Display bot message in chat view
            displayMessage(botMessage, "bot");


            // Clear the prompt input field
            promptInput.value = '';

            // Scroll to the bottom of chat view
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
});


document.getElementById('chat-input').addEventListener("keypress", async function (e) {
    if (e.key === "Enter") {
        const userMessage = e.target.value.trim();

        if (userMessage === "") {
            return; // Stop the function if the input is empty
        }
        
        // Display user message in chat view
        displayMessage(userMessage, "user");
        e.target.value = "";

        // Send the user message to the FastAPI server
        const response = await fetch("http://localhost:8000/send_message/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: userMessage }),
        });

        const data = await response.json();
        const botMessage = data.response;



        // Display bot message in chat view
        displayMessage(botMessage, "bot");
    }
});

function displayMessage(message, sender) {
    const chatMessages = document.getElementById("chat-messages");
    const messageElement = document.createElement("div");
    
    if (sender === "user") {
        messageElement.className = "user-message";
    } else {
        messageElement.className = "bot-message";
    }

    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
}

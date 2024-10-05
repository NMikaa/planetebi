document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    let isWaitingForBot = false;

    promptInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && promptInput.value.trim() !== '' && !isWaitingForBot) {
            isWaitingForBot = true;
            try {
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

                // Scroll to the bottom of chat view
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Send the prompt to the server
                const response = await fetch("http://127.0.0.1:8000/start_of_conversation/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_input: promptInput.value }),  // Properly format the body as JSON
            });

            if (response.ok) {
                // Get the image from the response as a blob
                const blob = await response.blob();

                // Create an object URL for the image
                const imageUrl = URL.createObjectURL(blob);

                // Create an image element and set its source to the image URL
                const botMessage = document.createElement('img');
                botMessage.src = imageUrl;
                botMessage.classList.add('bot-image');  // Optional: Add a class for styling

                // Append the image to the chat messages
                chatMessages.appendChild(botMessage);
            }

            } catch (error) {
                console.error('Error fetching bot response:', error);
            } finally {
                // Ensure flag is reset even if there's an error
                isWaitingForBot = false;
                chatInput.focus();
            }
        }
    });

    chatInput.addEventListener("keypress", async function (e) {
        if (e.key === "Enter" && !isWaitingForBot) {
            const userMessage = e.target.value.trim();

            if (userMessage === "") {
                return; // Stop the function if the input is empty
            }

            isWaitingForBot = true;
            try {
                // Display user message in chat view
                displayMessage(userMessage, "user");
                e.target.value = "";

                // Send the user message to the FastAPI server
                const response = await fetch("http://127.0.0.1:8000/continue_conversation/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_input: userMessage }),
        });

        if (response.ok) {
            // Get the image from the response as a blob
            const blob = await response.blob();

            // Create an object URL for the image
            const imageUrl = URL.createObjectURL(blob);

            // Create an image element and set its source to the image URL
            const botMessage = document.createElement('img');
            botMessage.src = imageUrl;
            botMessage.classList.add('bot-image');  // Optional: Add a class for styling

            // Append the image to the chat messages
            chatMessages.appendChild(botMessage);
            }

            } catch (error) {
                console.error('Error fetching bot response:', error);
            } finally {
                // Ensure flag is reset even if there's an error
                isWaitingForBot = false;
                chatInput.focus();
            }
        }
    });
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

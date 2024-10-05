document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    let isWaitingForBot = false;

    // Add loader during bot response
    function showLoader() {
        const loader = document.createElement('div');
        loader.classList.add('bot-message');
        loader.id = 'loading';
        loader.textContent = 'Generating...';
        chatMessages.appendChild(loader);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    }

    // Remove loader after bot response
    function removeLoader() {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.remove();
        }
    }

    // Function to display messages (user or bot)
    function displayMessage(message, sender) {
        const messageElement = document.createElement("div");
        messageElement.className = sender === "user" ? "user-message" : "bot-message";
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    }

    // Function to display image in chat
    function displayImage(imageUrl) {
        const botMessage = document.createElement('img');
        botMessage.src = imageUrl;
        botMessage.classList.add('bot-image');  // Optional: Add a class for styling
        botMessage.style.maxWidth = '300px';    // Limit image size without affecting quality
        botMessage.style.height = 'auto';       // Maintain aspect ratio
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    }

    // Event listener for the initial prompt
    promptInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && promptInput.value.trim() !== '' && !isWaitingForBot) {
            isWaitingForBot = true;
            try {
                // Hide the prompt section and show the chat view and input
                promptSection.style.display = 'none';
                promptInput.style.display = 'none';
                chatView.style.display = 'block';
                chatInput.style.display = 'block';

                // Display user message
                displayMessage(promptInput.value, "user");

                // Show typing indicator
                showLoader();

                // Send the prompt to the server
                const response = await fetch("http://127.0.0.1:8000/start_of_conversation/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ user_input: promptInput.value }),
                });

                // Handle bot response
                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    removeLoader();  // Remove typing indicator
                    displayImage(imageUrl);  // Display the image in chat
                }

            } catch (error) {
                console.error('Error fetching bot response:', error);
                removeLoader();
            } finally {
                isWaitingForBot = false;
                chatInput.focus();
            }
        }
    });

    // Event listener for chat input (continuation of conversation)
    chatInput.addEventListener("keypress", async function (e) {
        if (e.key === "Enter" && !isWaitingForBot) {
            const userMessage = e.target.value.trim();
            if (userMessage === "") return;

            isWaitingForBot = true;
            try {
                displayMessage(userMessage, "user");
                e.target.value = "";
                showLoader();

                // Send user message to the server
                const response = await fetch("http://127.0.0.1:8000/continue_conversation/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ user_input: userMessage }),
                });

                // Handle bot response
                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    removeLoader();  // Remove typing indicator
                    displayImage(imageUrl);  // Display the image in chat
                }

            } catch (error) {
                console.error('Error fetching bot response:', error);
                removeLoader();
            } finally {
                isWaitingForBot = false;
                chatInput.focus();
            }
        }
    });
});

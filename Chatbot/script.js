document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const newChatButton = document.querySelector('.new-chat');
    const chatArchiveSection = document.getElementById('chat-archive'); // Selector for the chat archive section
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

  // Function to clear chat messages
  function clearChat() {
    chatMessages.innerHTML = ""; // Clear previous messages
    promptInput.value = ""; // Clear the prompt input
    chatInput.value = ""; // Clear the chat input
}

// Function to archive the current chat
// Function to archive the current chat
function archiveCurrentChat() {
    const date = new Date().toLocaleString(); // Get current date and time
    const archiveButton = document.createElement('button'); // Create a button for the archived chat
    archiveButton.textContent = `Chat from ${date}`; // Set title with date
    archiveButton.classList.add('archive-button'); // Add a class for styling

    // Create a new div to contain the new archive button
    const archiveContainer = document.createElement('div');
    archiveContainer.classList.add('archive-container'); // Optional: add a class for styling
    archiveContainer.appendChild(archiveButton);

    // Insert the new container at the beginning of the chat archive section
    chatArchiveSection.insertBefore(archiveContainer, chatArchiveSection.firstChild);
}


// Add event listener for the new chat button
newChatButton.addEventListener('click', async () => {
    archiveCurrentChat(); // Archive the current chat before clearing
    clearChat(); // Clear chat when new chat button is clicked
    const response = await fetch("http://127.0.0.1:8000/switch_convo/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    promptSection.style.display = 'none'; // Hide the prompt section
    chatView.style.display = 'block'; // Show the chat view
    chatInput.style.display = 'block'; // Show the chat input
    promptInput.style.display = 'none'; // Hide prompt input after new chat
    chatInput.focus(); // Focus on chat input for immediate messaging
});


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

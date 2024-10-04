document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    promptInput.addEventListener('keydown', (e) => {
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

            // Clear the prompt input field
            promptInput.value = '';

            // Scroll to the bottom of chat view
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            // Append user's message to chat view
            const userMessage = document.createElement('div');
            userMessage.classList.add('user-message');
            userMessage.textContent = chatInput.value;
            chatMessages.appendChild(userMessage);

            // Clear the chat input field
            chatInput.value = '';

            // Optionally, simulate a bot response
            setTimeout(() => {
                const botMessage = document.createElement('div');
                botMessage.classList.add('bot-message');
                botMessage.textContent = "I'm here to assist you!";
                chatMessages.appendChild(botMessage);

                // Scroll to the bottom of chat view
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000);
        }
    });
});

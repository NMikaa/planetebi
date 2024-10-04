document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const mainChat = document.getElementById('main-chat');
    const promptSection = document.getElementById('prompt-section');
    const chatView = document.getElementById('chat-view');

    promptInput.addEventListener('focus', () => {
        // Add the typing-active class when the input is focused
        mainChat.classList.add('typing-active');
    });

    promptInput.addEventListener('blur', () => {
        if (promptInput.value.trim() === '') {
            // Remove the typing-active class if input is empty when losing focus
            mainChat.classList.remove('typing-active');
        }
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && promptInput.value.trim() !== '') {
            // Create a new message and append to chat view
            const newMessage = document.createElement('div');
            newMessage.classList.add('user-message');
            newMessage.textContent = promptInput.value;
            document.getElementById('chat-messages').appendChild(newMessage);
            
            // Clear the input field
            promptInput.value = '';

            // Scroll to bottom of chat view
            chatView.scrollTop = chatView.scrollHeight;
        }
    });
});

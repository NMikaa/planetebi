// Get elements
    const chatPopup = document.getElementById("chat-popup");
    const chatButton = document.getElementById("chat-button");
    const closeChatButton = document.getElementById("close-chat");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    var firstMessage = true;
    var currentThreadId = null;

    // Open chat when the button is clicked
    chatButton.addEventListener("click", () => {
        if (chatPopup.style.display === "block") {
            chatPopup.style.display = "none"; // Close the chat if it is already open
        } else {
            chatPopup.style.display = "block"; // Open the chat
        }
    });

    // Close chat when the close button is clicked
    closeChatButton.addEventListener("click", () => {
        chatPopup.style.display = "none";
    });

    // Send chat message on pressing Enter
    chatInput.addEventListener("keydown", async (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                addMessage(message); // Add message to the chat on the right side
                
                // Assuming you have a way to get the current thread ID
                if(firstMessage){                          
                    try {
                        const response = await fetch("http://127.0.0.1:8000/message/", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({message: message}),
                        });
        
                        // Check if the response is okay
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
        
                        const data = await response.json(); // Parse the JSON response
                        const answer = data.assistant_response; // Extract the answer from the response
                        currentThreadId = data.id; // Extract the thread ID from the response
                        firstMessage = false;
                        addResponse(answer); // Add the response to the chat
                    } catch (error) {
                        console.error('Error fetching response:', error);
                        addResponse('An error occurred. Please try again later.'); // Optionally handle errors
                    }
                }
                else{
                    try {
                        console.log(currentThreadId)
                        const response = await fetch("http://127.0.0.1:8000/message/", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ message: message, id: currentThreadId}),
                        });
                        console.log('patronimetkvneba mishvelet agar shemidzlia')
                        // Check if the response is okay
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
        
                        const data = await response.json(); // Parse the JSON response
                        const answer = data.assistant_response; // Extract the answer from the response
                        currentThreadId = data.id; // Extract the thread ID from the response
                        console.log(answer);
                        
                        addResponse(answer); // Add the response to the chat
                        currentThreadId = data.id; // Update the thread ID for future messages
                    } catch (error) {
                        console.error('Error fetching response:', error);
                        addResponse('An error occurred. Please try again later.'); // Optionally handle errors
                    }
                }

                firstMessage = false;
                
            }
            e.preventDefault(); // Prevent default behavior of form submission
        }
    });

// Function to add user's message on the right side (blue circle)
function addMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", "right-message"); // Apply right message style

    // Use marked to parse markdown
    messageElement.innerHTML = marked.parse(message); 

    chatBody.appendChild(messageElement); // Add message to chat body
    chatInput.value = ""; // Clear the input
    chatBody.scrollTop = chatBody.scrollHeight; // Scroll to the bottom
}

// Function to add response on the left side (gray circle)
function addResponse(response) {
    const responseElement = document.createElement("div");
    responseElement.classList.add("chat-response", "left-response"); // Apply left response style
    console.log(typeof marked); // Should log "function"
    // Use marked to parse markdown
    responseElement.innerHTML = marked.parse(response); 

    chatBody.appendChild(responseElement); // Add response to chat body
    chatBody.scrollTop = chatBody.scrollHeight; // Scroll to the bottom
}

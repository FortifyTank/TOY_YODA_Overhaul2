document.addEventListener('DOMContentLoaded', () => {
    
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');

    let currentUsername = "";
    let isFirstLoad = true;

    // 1. Figure out who is logged in so we can color their messages blue!
    async function getUserData() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                currentUsername = data.username;
            } else {
                // If not logged in, disable the chat input
                chatInput.disabled = true;
                chatInput.placeholder = "PLEASE LOG IN TO CHAT";
                sendBtn.disabled = true;
            }
        } catch (err) { console.error(err); }
    }

    // 2. Load the messages from the database
    async function loadMessages() {
        try {
            const res = await fetch('/api/messages');
            const messages = await res.json();

            if (messages.length === 0) {
                chatWindow.innerHTML = '<p class="text-muted text-center mt-20">> NO MESSAGES YET. BE THE FIRST.</p>';
                return;
            }

            // SMART SCROLL: Are we within 150px of the bottom of the chat?
            const isScrolledToBottom = chatWindow.scrollHeight - chatWindow.clientHeight <= chatWindow.scrollTop + 150;

            chatWindow.innerHTML = messages.map(msg => {
                const isMe = msg.username === currentUsername;
                const alignClass = isMe ? 'chat-message-self' : 'chat-message-other';
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="chat-message-group ${alignClass}">
                        <span class="chat-meta">${msg.username} | ${time}</span>
                        <div class="chat-bubble">${msg.text}</div>
                    </div>
                `;
            }).join('');

            // ONLY scroll to the bottom if it's the first time loading, OR if they are actively at the bottom!
            if (isFirstLoad || isScrolledToBottom) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
                isFirstLoad = false; // Turn off the flag after the first load
            }

        } catch (err) {
            chatWindow.innerHTML = '<p class="text-red text-center mt-20">> CONNECTION ERROR.</p>';
        }
    }

    // 3. Handle sending a new message
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value;
            if (!text) return;

            sendBtn.innerText = '[ ...]';

            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });

                if (res.ok) {
                    chatInput.value = ''; // Clear the input box
                    await loadMessages(); // Instantly refresh chat
                    chatWindow.scrollTop = chatWindow.scrollHeight; // Force scroll to bottom for your own message
                } else {
                    const data = await res.json();
                    if (window.showSystemAlert) window.showSystemAlert(data.error);
                }
            } catch (err) {
                if (window.showSystemAlert) window.showSystemAlert("Failed to connect to server.");
            } finally {
                sendBtn.innerText = '[ SEND ]';
            }
        });
    }

    // 4. Ignite the Engine
    async function initChat() {
        await getUserData();
        await loadMessages();
        
        // This makes the chat feel "Live" by quietly updating every 3 seconds!
        setInterval(loadMessages, 3000); 
    }

    initChat();
});
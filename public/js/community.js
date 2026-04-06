document.addEventListener('DOMContentLoaded', () => {
    
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');

    let currentUsername = "";
    let isFirstLoad = true;

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    async function getUserData() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                currentUsername = data.username;
            } else {
                chatInput.disabled = true;
                chatInput.placeholder = "PLEASE LOG IN TO CHAT";
                sendBtn.disabled = true;
            }
        } catch (err) { console.error("Auth check failed:", err); }
    }

    async function loadMessages() {
        try {
            const res = await fetch('/api/messages');
            const messages = await res.json();

            if (messages.length === 0) {
                chatWindow.innerHTML = '<p class="text-muted text-center mt-20">> NO MESSAGES YET. BE THE FIRST.</p>';
                return;
            }

            const isScrolledToBottom = chatWindow.scrollHeight - chatWindow.clientHeight <= chatWindow.scrollTop + 150;

            chatWindow.innerHTML = messages.map(msg => {
                const isMe = msg.username === currentUsername;
                const alignClass = isMe ? 'chat-message-self' : 'chat-message-other';
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Route all database text through the security filter before rendering!
                const safeText = escapeHTML(msg.text);
                const safeUsername = escapeHTML(msg.username);

                return `
                    <div class="chat-message-group ${alignClass}">
                        <span class="chat-meta">${safeUsername} | ${time}</span>
                        <div class="chat-bubble">${safeText}</div>
                    </div>
                `;
            }).join('');

            if (isFirstLoad || isScrolledToBottom) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
                isFirstLoad = false; 
            }

        } catch (err) {
            console.error("Chat sync failed.");
        }
    }

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value;
            if (!text) return;

            sendBtn.innerText = '[ ...]';
            
            // lock input to prevent spam lol
            chatInput.disabled = true; 

            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });

                if (res.ok) {
                    chatInput.value = ''; 
                    await loadMessages(); 
                    chatWindow.scrollTop = chatWindow.scrollHeight; 
                } else {
                    const data = await res.json();
                    if (window.showSystemAlert) window.showSystemAlert(data.error);
                }
            } catch (err) {
                if (window.showSystemAlert) window.showSystemAlert("> CONNECTION TO CHAT SERVER LOST.");
            } finally {
                sendBtn.innerText = '[ SEND ]';
                
                chatInput.disabled = false;
                chatInput.focus(); 
            }
        });
    }

    async function initChat() {
        await getUserData();
        await loadMessages();
        
        setInterval(loadMessages, 3000); 
    }

    initChat();
});
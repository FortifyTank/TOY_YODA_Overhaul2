document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STATE & DOM ELEMENTS
    // ==========================================
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');

    let currentUsername = "";
    let isFirstLoad = true;

    // ==========================================
    // 2. UTILITY & SECURITY
    // ==========================================
    // SECURITY UPGRADE: Prevents Cross-Site Scripting (XSS) Attacks in the chat!
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

    // ==========================================
    // 3. DATA FETCHING & RENDERING
    // ==========================================
    // Figure out who is logged in so we can color their messages blue
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
        } catch (err) { console.error("Auth check failed:", err); }
    }

    // Load the messages from the database
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

            // ONLY scroll to the bottom if it's the first load, OR if they are actively at the bottom!
            if (isFirstLoad || isScrolledToBottom) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
                isFirstLoad = false; 
            }

        } catch (err) {
            // Replaced the alert with a quiet console log so it doesn't spam the UI if internet drops
            console.error("Chat sync failed.");
        }
    }

    // ==========================================
    // 4. EVENT LISTENERS
    // ==========================================
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value;
            if (!text) return;

            sendBtn.innerText = '[ ...]';
            
            // UX UPGRADE: Lock the input so they can't spam enter 10 times
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
                
                // UX UPGRADE: Unlock and auto-focus the box so they can keep typing seamlessly!
                chatInput.disabled = false;
                chatInput.focus(); 
            }
        });
    }

    // ==========================================
    // 5. BOOT SEQUENCE
    // ==========================================
    async function initChat() {
        await getUserData();
        await loadMessages();
        
        // This makes the chat feel "Live" by quietly updating every 3 seconds!
        setInterval(loadMessages, 3000); 
    }

    initChat();
});
// DOM Elements
const sidebar = document.querySelector('.sidebar');
const chatMessages = document.querySelector('.chat-messages');
const messageForm = document.querySelector('.message-form');
const messageInput = document.querySelector('.message-input');
const newChatBtn = document.querySelector('.new-chat-btn');
const chatHistory = document.querySelector('.chat-history');
const welcomeMessage = document.querySelector('.welcome-message');
const deleteChatBtn = document.querySelector('.delete-chat-btn');

// State
let currentChatId = Date.now().toString();
let chats = JSON.parse(localStorage.getItem('chats')) || {};

// Initialize
function init() {
    renderChatHistory();
    loadChat(currentChatId);
    
    // Mobile sidebar toggle (you'll need to add a menu button in HTML)
    document.querySelector('.menu-btn')?.addEventListener('click', toggleSidebar);
}

// Event Listeners
messageForm.addEventListener('submit', handleSubmit);
newChatBtn.addEventListener('click', startNewChat);
document.querySelectorAll('.menu-option').forEach(btn => {
    btn.addEventListener('click', () => {
        alert(`You clicked: ${btn.textContent}`);
    });
});

if (deleteChatBtn) {
    deleteChatBtn.addEventListener('click', () => {
        if (chats[currentChatId]) {
            delete chats[currentChatId];
            saveChat();
            startNewChat();
        }
    });
}

// Functions
function handleSubmit(e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'ai');
        saveChat();
    }, 1000);
}

function addMessage(content, sender) {
    if (!chats[currentChatId]) {
        chats[currentChatId] = { messages: [], title: content.slice(0, 30) };
    }
    
    chats[currentChatId].messages.push({ content, sender, timestamp: new Date() });
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Hide welcome message after first message
    if (welcomeMessage) welcomeMessage.style.display = 'none';
}

function startNewChat() {
    currentChatId = Date.now().toString();
    chatMessages.innerHTML = '';
    if (welcomeMessage) welcomeMessage.style.display = 'flex';
    saveChat();
}

function saveChat() {
    localStorage.setItem('chats', JSON.stringify(chats));
    renderChatHistory();
}

function loadChat(chatId) {
    if (!chats[chatId]) return;
    
    chatMessages.innerHTML = '';
    currentChatId = chatId;
    
    if (chats[chatId].messages.length === 0 && welcomeMessage) {
        welcomeMessage.style.display = 'flex';
    } else {
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        chats[chatId].messages.forEach(msg => {
            addMessage(msg.content, msg.sender);
        });
    }
}

function renderChatHistory() {
    chatHistory.innerHTML = '';
    
    Object.entries(chats).forEach(([id, chat]) => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${id === currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `
            <span class="chat-title">${chat.title || 'New Chat'}</span>
            <span class="chat-time">${new Date(parseInt(id)).toLocaleDateString()}</span>
        `;
        
        chatItem.addEventListener('click', () => loadChat(id));
        chatHistory.appendChild(chatItem);
    });
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

// Mock AI response (replace with actual API call)
function generateAIResponse(prompt) {
    const responses = [
        `I analyzed your question about "${prompt}" and found that...`,
        `Based on my knowledge, ${prompt} can be understood as...`,
        `Interesting question about ${prompt}. Here's what I discovered...`,
        `Regarding ${prompt}, the information suggests that...`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
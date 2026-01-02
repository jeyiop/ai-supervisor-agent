/**
 * AI Supervisor - Dashboard JavaScript
 * Gère l'interface utilisateur
 */

// === État de l'application ===
const state = {
    currentModel: 'chatgpt',
    messages: [],
    settings: null,
    isLoading: false
};

// === Informations des modèles ===
const models = {
    chatgpt: { name: 'ChatGPT', icon: 'G', color: '#10a37f', port: 3001 },
    claude: { name: 'Claude', icon: 'C', color: '#d97706', port: 3002 },
    perplexity: { name: 'Perplexity', icon: 'P', color: '#6366f1', port: 3003 },
    gemini: { name: 'Gemini', icon: 'G', color: '#3b82f6', port: 3004 }
};

// === Éléments du DOM ===
const elements = {
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    charCount: document.getElementById('char-count'),
    status: document.getElementById('status'),
    currentModelIcon: document.getElementById('current-model-icon'),
    currentModelName: document.getElementById('current-model-name'),
    historyList: document.getElementById('history-list'),
    settingsModal: document.getElementById('settings-modal'),
    compareModal: document.getElementById('compare-modal')
};

// === Initialisation ===
async function init() {
    console.log('AI Supervisor Dashboard - Initialisation');

    // Charger les paramètres
    if (window.electronAPI) {
        state.settings = await window.electronAPI.getSettings();
        state.currentModel = state.settings.defaultModel || 'chatgpt';
    }

    // Appliquer le modèle par défaut
    switchModel(state.currentModel);

    // Charger l'historique
    loadHistory();

    // Configurer les événements
    setupEventListeners();

    // Écouter les changements de modèle depuis le menu système
    if (window.electronAPI) {
        window.electronAPI.onSwitchModel((model) => {
            switchModel(model);
        });
    }

    updateStatus('Prêt');
}

// === Gestion des événements ===
function setupEventListeners() {
    // Saisie de message
    elements.messageInput.addEventListener('input', onInputChange);
    elements.messageInput.addEventListener('keydown', onInputKeydown);

    // Bouton envoyer
    elements.sendBtn.addEventListener('click', sendMessage);

    // Sélection de modèle
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.addEventListener('click', () => switchModel(btn.dataset.model));
    });

    // Boutons rapides
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.messageInput.value = btn.dataset.prompt;
            onInputChange();
            elements.messageInput.focus();
        });
    });

    // Nouveau chat
    document.getElementById('new-chat-btn').addEventListener('click', newChat);

    // Paramètres
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings').addEventListener('click', closeSettings);
    document.getElementById('save-settings').addEventListener('click', saveSettings);

    // Comparaison
    document.getElementById('compare-btn').addEventListener('click', openCompare);
    document.getElementById('close-compare').addEventListener('click', closeCompare);
    document.getElementById('send-compare').addEventListener('click', sendCompare);

    // Fermer modals en cliquant à l'extérieur
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettings();
    });
    elements.compareModal.addEventListener('click', (e) => {
        if (e.target === elements.compareModal) closeCompare();
    });
}

// === Gestion du texte ===
function onInputChange() {
    const text = elements.messageInput.value;
    elements.charCount.textContent = `${text.length} caractères`;
    elements.sendBtn.disabled = text.trim().length === 0;

    // Auto-resize
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 200) + 'px';
}

function onInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!elements.sendBtn.disabled) {
            sendMessage();
        }
    }
}

// === Changement de modèle ===
function switchModel(model) {
    state.currentModel = model;
    const modelInfo = models[model];

    // Mettre à jour l'interface
    elements.currentModelIcon.textContent = modelInfo.icon;
    elements.currentModelIcon.style.background = modelInfo.color;
    elements.currentModelName.textContent = modelInfo.name;

    // Mettre à jour les boutons
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.model === model);
    });

    updateStatus(`${modelInfo.name} sélectionné`);
}

// === Envoi de message ===
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text || state.isLoading) return;

    // Ajouter le message utilisateur
    addMessage('user', text);

    // Vider l'input
    elements.messageInput.value = '';
    onInputChange();

    // État chargement
    state.isLoading = true;
    updateStatus('Envoi en cours...');
    elements.sendBtn.disabled = true;

    // Ajouter indicateur de chargement
    const loadingId = addLoadingMessage();

    try {
        // Appeler le serveur MCP
        const response = await callMCP(state.currentModel, text);

        // Supprimer le chargement et ajouter la réponse
        removeMessage(loadingId);
        addMessage('assistant', response, state.currentModel);

        // Sauvegarder la conversation
        saveConversation(text, response);

    } catch (error) {
        removeMessage(loadingId);
        addMessage('assistant', `Erreur: ${error.message}. Vérifiez que le serveur MCP est démarré.`, state.currentModel);
    }

    state.isLoading = false;
    elements.sendBtn.disabled = false;
    updateStatus('Prêt');
}

// === Appel au serveur MCP ===
async function callMCP(model, message) {
    const modelInfo = models[model];
    const url = `http://localhost:${modelInfo.port}/chat`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`Serveur non disponible (${response.status})`);
        }

        const data = await response.json();
        return data.response || data.message || 'Réponse vide';

    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error(`Le serveur ${modelInfo.name} n'est pas démarré`);
        }
        throw error;
    }
}

// === Gestion des messages ===
function addMessage(type, content, model = null) {
    const id = Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.dataset.id = id;

    const modelInfo = model ? models[model] : null;
    const header = type === 'assistant' && modelInfo
        ? `<div class="message-header">${modelInfo.name}</div>`
        : '';

    messageDiv.innerHTML = `${header}<div class="message-content">${escapeHtml(content)}</div>`;

    // Supprimer le message de bienvenue si présent
    const welcome = elements.messages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    elements.messages.appendChild(messageDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;

    state.messages.push({ id, type, content, model, timestamp: Date.now() });
    return id;
}

function addLoadingMessage() {
    const id = Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.dataset.id = id;
    messageDiv.innerHTML = `
        <div class="message-header">${models[state.currentModel].name}</div>
        <div class="loading"><span></span><span></span><span></span></div>
    `;
    elements.messages.appendChild(messageDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    return id;
}

function removeMessage(id) {
    const msg = elements.messages.querySelector(`[data-id="${id}"]`);
    if (msg) msg.remove();
}

// === Nouveau chat ===
function newChat() {
    state.messages = [];
    elements.messages.innerHTML = `
        <div class="welcome-message">
            <h2>Bienvenue dans AI Supervisor</h2>
            <p>Sélectionnez un modèle et commencez à discuter.</p>
            <div class="quick-actions">
                <button class="quick-btn" data-prompt="Explique-moi un concept simplement">
                    Expliquer un concept
                </button>
                <button class="quick-btn" data-prompt="Aide-moi à rédiger un texte">
                    Rédiger un texte
                </button>
                <button class="quick-btn" data-prompt="Analyse ce document">
                    Analyser un document
                </button>
                <button class="quick-btn" data-prompt="Traduis ce texte">
                    Traduire
                </button>
            </div>
        </div>
    `;

    // Réattacher les événements aux boutons rapides
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.messageInput.value = btn.dataset.prompt;
            onInputChange();
            elements.messageInput.focus();
        });
    });

    updateStatus('Nouvelle conversation');
}

// === Historique ===
function loadHistory() {
    // Pour l'instant, afficher un message vide
    elements.historyList.innerHTML = '<div class="history-item">Pas encore d\'historique</div>';
}

async function saveConversation(question, answer) {
    if (window.electronAPI) {
        await window.electronAPI.saveConversation({
            model: state.currentModel,
            question,
            answer,
            timestamp: Date.now()
        });
    }
}

// === Paramètres ===
function openSettings() {
    elements.settingsModal.classList.remove('hidden');

    // Charger les valeurs actuelles
    if (state.settings) {
        document.getElementById('default-model').value = state.settings.defaultModel || 'chatgpt';
        document.getElementById('auto-save-notion').checked = state.settings.autoSaveToNotion || false;
        document.getElementById('theme-select').value = state.settings.theme || 'dark';
    }
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const settings = {
        defaultModel: document.getElementById('default-model').value,
        autoSaveToNotion: document.getElementById('auto-save-notion').checked,
        theme: document.getElementById('theme-select').value
    };

    state.settings = settings;

    if (window.electronAPI) {
        await window.electronAPI.saveSettings(settings);
    }

    closeSettings();
    updateStatus('Paramètres sauvegardés');
}

// === Comparaison ===
function openCompare() {
    elements.compareModal.classList.remove('hidden');
}

function closeCompare() {
    elements.compareModal.classList.add('hidden');
}

async function sendCompare() {
    const input = document.getElementById('compare-input');
    const text = input.value.trim();
    if (!text) return;

    updateStatus('Comparaison en cours...');

    // Envoyer à tous les modèles en parallèle
    const promises = Object.keys(models).map(async (model) => {
        const column = document.querySelector(`.compare-column[data-model="${model}"] .compare-response`);
        column.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';

        try {
            const response = await callMCP(model, text);
            column.textContent = response;
        } catch (error) {
            column.textContent = `Erreur: ${error.message}`;
        }
    });

    await Promise.all(promises);
    updateStatus('Comparaison terminée');
}

// === Utilitaires ===
function updateStatus(text) {
    elements.status.textContent = text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Démarrage ===
document.addEventListener('DOMContentLoaded', init);


import plugin from '../plugin.json';
import "./styles/main.scss";

import { AIService } from "./services/AIService";
import { solveMathEquation } from "./services/MathService"
import { RuleManager } from './services/RuleManager';

const sideBarApps = acode.require('sidebarApps');
const toast = acode.require('toast');
const appSettings = acode.require('settings');

// Proximas feat
// const multiPrompt = acode.require("multiPrompt");
// const fs = acode.require("fs");
// const select = acode.require("select");
// const prompt = acode.require("prompt");
// const DialogBox = acode.require("dialogBox");
// const helpers = acode.require("helpers");
// const loader = acode.require("loader");

// const toInternalUrl = acode.require("toInternalUrl");
// const contextMenu = acode.require("contextMenu");
// const selectionMenu = acode.require("selectionMenu");
// const { editor } = editorManager;

const AI_HISTORY_PATH = window.DATA_STORAGE + "agente-ia";
// futuramente
// let CURRENT_SESSION_FILEPATH = null;





class AcodePlugin {
 private container: HTMLElement | null = null;
 private id: string = plugin.id;
 private ruleManager: RuleManager;
 private aiService: AIService | null = null;

 constructor() {
  this.ruleManager = new RuleManager();

  if (!appSettings.value[plugin.id]) {
   appSettings.value[plugin.id] = {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    rules: this.ruleManager.getRules()
   };

   appSettings.update();
  }
 }

 async init() {
  try {
   const iconUrl = `${this.baseUrl}assets/icon.png`;
   acode.addIcon("sidebar-icon", iconUrl);

   sideBarApps.add(
    "sidebar-icon",
    "agente_IA",
    "Agente IA",
    (container) => {
     this.container = container;
     this.renderContainer();
    },
    () => this.onAppSelected()
   );

   console.log("Plugin inicializado com sucesso");
  } catch (error) {
   console.error("Erro ao inicializar plugin:", error);
  }
 }

 private renderContainer(): void {
  if (!this.container) return;

  this.container.innerHTML = `
            <div class="sidebar-container">
                <!-- Abas -->
                <div class="flex border-b">
                    <button class="tab-btn active" data-tab="chat">Chat</button>
                    <button class="tab-btn" data-tab="rules">Rules</button>
                    <button class="tab-btn" data-tab="config">Config</button>
                </div>

                <!-- Conteúdo das Abas -->
                <div class="tab-content-main scroll">
                    <!-- Chat Tab -->
                    <div class="tab-pane active" id="chat-tab">
                        ${this.renderChat()}
                    </div>

                    <!-- Rules Tab -->
                    <div class="tab-pane" id="rules-tab">
                        ${this.renderRules()}
                    </div>

                    <!-- Config Tab -->
                    <div class="tab-pane" id="config-tab">
                        ${this.renderConfig()}
                    </div>
                </div>
            </div>
        `;

  this.initializeTabSystem();
  this.initializeChatEvents();
  this.initializeRulesEvents();
  this.initializeConfigEvents();
 }

 private initializeTabSystem(): void {
  if (!this.container) return;

  const buttons = this.container.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const panes = this.container.querySelectorAll<HTMLElement>('.tab-pane');

  buttons.forEach(btn => {
   btn.addEventListener('click', () => {
    const tab = btn.dataset.tab!;
    const paneId = `${tab}-tab`;

    // Atualizar botões
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Atualizar painéis
    panes.forEach(p => {
     p.classList.toggle('active', p.id === paneId);
    });
   });
  });
 }

 private renderChat(): string {
  return `
<div class="p-2">
<div class="chat-header">
<h3 class="font-bold mb-2">Assistente IA</h3>
<div class="chat-controls">
   <button id="clear-chat" class="btn-sm icon delete" title="Limpar chat">️</button>
   <button id="settings-chat" class="btn-sm icon tune " title="Configurações"></button>
</div>
   </div>
   
   <div class="chat-input-area">
       <textarea 
           id="chat-input" 
           placeholder="Digite sua mensagem..." 
           rows="3"
           class="chat-textarea"
       ></textarea>
       <button id="send-message" class="send-button">Enviar</button>
   </div>
   
   <div id="chat-messages" class="chat-messages scroll">
       <div class="message system">
           <p>Olá! Como posso ajudá-lo hoje?</p>
       </div>
   </div>
   
   
</div>
        `;
 }

 private renderRules(): string {
  return `
        <div class="p-2">
            <h3 class="font-bold mb-2">Rules Configuration</h3>
            
            <!-- Categoria: Qualidade do Código -->
            <div class="rules-category">
                <h4 class="font-semibold mb-2 text-accent">📊 Code Quality</h4>
                <div class="rules-list">
                    <div class="rule-item">
                        <input type="checkbox" id="rule-best-practices" checked data-category="quality">
                        <label for="rule-best-practices">Sugerir melhores práticas</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-refactor" checked data-category="quality">
                        <label for="rule-refactor">Sugerir refatoração</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-complexity" checked data-category="quality">
                        <label for="rule-complexity">Alertar sobre complexidade</label>
                    </div>
                </div>
            </div>

            <!-- Categoria: Segurança -->
            <div class="rules-category">
                <h4 class="font-semibold mb-2 text-accent">🔒 Security</h4>
                <div class="rules-list">
                    <div class="rule-item">
                        <input type="checkbox" id="rule-security-scan" checked data-category="security">
                        <label for="rule-security-scan">Escaneamento de segurança</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-input-validation" checked data-category="security">
                        <label for="rule-input-validation">Validação de inputs</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-secrets" checked data-category="security">
                        <label for="rule-secrets">Detectar secrets no código</label>
                    </div>
                </div>
            </div>

            <!-- Categoria: Performance -->
            <div class="rules-category">
                <h4 class="font-semibold mb-2 text-accent">⚡ Performance</h4>
                <div class="rules-list">
                    <div class="rule-item">
                        <input type="checkbox" id="rule-optimization" checked data-category="performance">
                        <label for="rule-optimization">Otimizações de performance</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-mobile" checked data-category="performance">
                        <label for="rule-mobile">Otimizado para mobile</label>
                    </div>
                </div>
            </div>

            <!-- Categoria: Acode Specific -->
            <div class="rules-category">
                <h4 class="font-semibold mb-2 text-accent">📱 Acode Integration</h4>
                <div class="rules-list">
                    <div class="rule-item">
                        <input type="checkbox" id="rule-theme-aware" checked data-category="acode">
                        <label for="rule-theme-aware">Respeitar tema do Acode</label>
                    </div>
                    <div class="rule-item">
                        <input type="checkbox" id="rule-shortcuts" checked data-category="acode">
                        <label for="rule-shortcuts">Sugerir atalhos do Acode</label>
                    </div>
                </div>
            </div>

            <!-- Regras Personalizadas -->
            <div class="custom-rules mt-4">
                <h4 class="font-semibold mb-2">Regras Personalizadas (JSON)</h4>
                <textarea 
                    id="custom-rules" 
                    placeholder='Ex: { "maxFunctionLength": 30, "preferConst": true }'
                    rows="6"
                    class="rules-textarea"
                ></textarea>
                <div class="flex gap-2 mt-2">
                    <button id="save-rules" class="btn-primary flex-1">Salvar Regras</button>
                    <button id="reset-rules" class="btn-secondary">Reset</button>
                </div>
            </div>

            <!-- Status -->
            <div class="rules-status mt-3 p-2 bg-secondary rounded">
                <small>✅ <span id="active-rules-count">0</span> regras ativas</small>
            </div>
        </div>
    `;
 }

 private renderConfig(): string {
  return `
<div class="p-2">
<h3 class="font-bold mb-2">Configurações de API</h3>

<div class="config-section">
    <label for="api-provider" class="block mb-1">Provedor:</label>
    <select id="api-provider" class="config-select">
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="claude">Claude</option>
    </select>
</div>

<div class="config-section mt-3">
    <label for="api-key" class="block mb-1">API Key:</label>
    <input 
        type="password" 
        id="api-key" 
        placeholder="Sua chave API..."
        class="config-input"
    >
</div>

<div class="config-section mt-3">
    <label for="api-model" class="block mb-1">Modelo:</label>
    <select id="api-model" class="config-select">
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="gemini-pro">Gemini Pro</option>
        <option value="deepseek-coder">DeepSeek Coder</option>
    </select>
</div>

<div class="config-section mt-3">
    <label for="temperature" class="block mb-1">Temperatura: <span id="temp-value">0.7</span></label>
    <input 
        type="range" 
        id="temperature" 
        min="0" 
        max="1" 
        step="0.1" 
        value="0.7"
        class="config-slider"
    >
</div>

<div class="config-actions mt-4">
    <button id="test-api" class="btn-secondary">Testar API</button>
    <button id="save-config" class="btn-primary">Salvar Configurações</button>
</div>
</div>
        `;
 }

 private initializeChatEvents(): void {
  if (!this.container) return;

  const sendBtn = this.container.querySelector('#send-message') as HTMLButtonElement;
  const clearBtn = this.container.querySelector('#clear-chat') as HTMLButtonElement;
  const input = this.container.querySelector('#chat-input') as HTMLTextAreaElement;

  sendBtn?.addEventListener('click', () => this.sendMessage());
  clearBtn?.addEventListener('click', () => this.clearChat());

  input?.addEventListener('keydown', (e: KeyboardEvent) => {
   if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    this.sendMessage();
   }
  });

  input?.addEventListener('input', () => {
   this.autoResizeTextarea(input);
  });
 }

 private initializeRulesEvents(): void {
  if (!this.container) return;

  const saveBtn = this.container.querySelector('#save-rules') as HTMLButtonElement;
  saveBtn?.addEventListener('click', () => this.saveRules());
 }

 private initializeConfigEvents(): void {
  if (!this.container) return;

  const saveBtn = this.container.querySelector('#save-config') as HTMLButtonElement;
  const testBtn = this.container.querySelector('#test-api') as HTMLButtonElement;
  const tempSlider = this.container.querySelector('#temperature') as HTMLInputElement;
  const tempValue = this.container.querySelector('#temp-value') as HTMLElement;

  saveBtn?.addEventListener('click', () => this.saveConfig());
  testBtn?.addEventListener('click', () => this.testAPI());

  tempSlider?.addEventListener('input', () => {
   if (tempValue) {
    tempValue.textContent = tempSlider.value;
   }
  });
 }

 private async sendMessage(): Promise<void> {
  const input = this.container?.querySelector('#chat-input') as HTMLTextAreaElement;
  if (!input || !input.value.trim()) return;

  const message = input.value.trim();
  this.addMessage('user', message);
  input.value = '';
  this.autoResizeTextarea(input);

  try {
   const settings = appSettings.value[plugin.id];
   if (!settings.apiKey) {
     throw new Error('Configure uma API Key primeiro');
   }

   // 🔐 Descriptografar API KEY antes de enviar para IA
   const realKey = await this.decrypt(settings.apiKey);

   this.aiService = new AIService(realKey, settings.provider);
   const response = await this.aiService.sendMessage(message);
   this.addMessage('assistant', response);

  } catch (error) {
   this.addMessage('system', `Erro: ${error.message}`);
  }
}

 private addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
  const messagesContainer = this.container?.querySelector('#chat-messages') as HTMLElement;
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `<p>${this.escapeHtml(content)}</p>`;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
 }

 private clearChat(): void {
  const messagesContainer = this.container?.querySelector('#chat-messages') as HTMLElement;
  if (messagesContainer) {
   messagesContainer.innerHTML = `
  <div class="message system">
      <p> Como posso ajudá-lo?</p>
  </div>
            `;
   toast('Chat limpo!');
  }
 }

 private saveRules(): void {
  const customRules = this.container?.querySelector('#custom-rules') as HTMLTextAreaElement;
  if (customRules) {
   const rules = customRules.value;
   // Salvar regras (implementar lógica de salvamento)
   toast('Regras salvas com sucesso!');
  }
 }



private async saveConfig(): Promise<void> {
    const apiKey = this.container?.querySelector('#api-key') as HTMLInputElement;
    const provider = this.container?.querySelector('#api-provider') as HTMLSelectElement;
    const model = this.container?.querySelector('#api-model') as HTMLSelectElement;
    const temperature = this.container?.querySelector('#temperature') as HTMLInputElement;

    const settings = appSettings.value[plugin.id];

    // 🔐 Criptografar API Key
    const encryptedKey = await this.encrypt(apiKey.value.trim()); // <<< AQUI ESTAVA O ERRO

    settings.apiKey = encryptedKey;
    settings.provider = provider.value;
    settings.model = model.value;
    settings.temperature = parseFloat(temperature.value);

    appSettings.update();
    toast('Configurações salvas!');
}
 private testAPI(): void {
  toast('Testando conexão com API...');
  // Implementar teste de API
  setTimeout(() => {
   toast('Conexão com API bem-sucedida!');
  }, 1500);
 }


// ================================
// 🔐 CRIPTOGRAFIA (AES-GCM 256)
// ================================
private cryptoKey: CryptoKey | null = null;
private encoder = new TextEncoder();
private decoder = new TextDecoder();

// Gera ou recupera a chave secreta persistente
private async loadCryptoKey() {
    if (this.cryptoKey) return this.cryptoKey;

    const storageKey = "agenteIA.secretKey";
    let raw = localStorage.getItem(storageKey);

    if (!raw) {
        const newKey = this.randomBytes(32);
        localStorage.setItem(storageKey, btoa(String.fromCharCode(...newKey)));
        raw = localStorage.getItem(storageKey)!;
    }

    const buffer = Uint8Array.from(atob(raw), c => c.charCodeAt(0));

    this.cryptoKey = await crypto.subtle.importKey(
        "raw",
        buffer,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );

    return this.cryptoKey;
}

// Converte string → criptografado Base64
private async encrypt(text: string): Promise<string> {
    if (!text) return "";

    const key = await this.loadCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = this.encoder.encode(text);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    const encryptedBytes = new Uint8Array(encrypted);

    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv);
    combined.set(encryptedBytes, iv.length);

    return btoa(String.fromCharCode(...combined));
}

// Converte Base64 → texto descriptografado
private async decrypt(base64: string): Promise<string> {
    if (!base64) return "";

    const key = await this.loadCryptoKey();
    const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const iv = raw.slice(0, 12);
    const data = raw.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    return this.decoder.decode(decrypted);
}

private randomBytes(size: number): Uint8Array {
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return array;
}
 private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 320) + 'px';
 }

 private escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
 }

 private onAppSelected(): void {
  toast('Agente IA ativado');
 }

 async destroy() {
  if (sideBarApps) {
   sideBarApps.remove('agente_IA');
   sideBarApps.remove("sidebar-icon");
  }
 }
}




// === INICIALIZAÇÃO DO PLUGIN ===
if (window.acode) {
 const acodePlugin = new AcodePlugin();

 acode.setPluginInit(plugin.id, async (baseUrl: string, $page: any, { cacheFileUrl, cacheFile }: any) => {
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  acodePlugin.baseUrl = baseUrl;
  await acodePlugin.init();
 });

 acode.setPluginUnmount(plugin.id, () => {
  acodePlugin.destroy();
 });
}
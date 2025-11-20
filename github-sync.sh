#!/data/data/com.termux/files/usr/bin/bash

# =====================================
# 🚀 AUTOMAÇÃO DE SINCRONIZAÇÃO GITHUB - VERSÃO SEGURA
# =====================================

set -e

# Configuração
GITHUB_USERNAME="ronilson-users"
REPO_NAME="agent-ia-acode"
PROJECT_DIR="/data/data/com.termux/files/home/Continua/agent-ia-acode"

# Ir para o diretório
cd "$PROJECT_DIR" || { 
    echo "❌ Diretório não encontrado: $PROJECT_DIR" 
    exit 1 
}

# =====================================
# 🔐 Gerenciamento SEGURO do Token
# =====================================
if [ -f .env ] && [ -z "$GITHUB_TOKEN" ]; then
    source .env
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN não encontrado."
    read -s -p "🔑 Digite seu token GitHub: " GITHUB_TOKEN
    echo
    # NÃO salva automaticamente no .env
fi

# Verificar token
if ! curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -q '"login"'; then
    echo "❌ Token inválido"
    exit 1
fi

# =====================================
# ⚙️ Configurar Git
# =====================================
if [ ! -d .git ]; then
    git init
fi

if [ -z "$GITHUB_EMAIL" ]; then
    read -p "📧 Digite seu email do GitHub: " GITHUB_EMAIL
fi

git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

# =====================================
# 📋 Garantir .gitignore
# =====================================
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
# Arquivos sensíveis
.env
.env.local
.env.*
*.key
*.pem

# Dados sensíveis
**/secrets/
**/config/
**/credentials*

# Logs e temporários
*.log
node_modules/
__pycache__/
*.pyc

# Sistema
.DS_Store
Thumbs.db
EOF
    echo "✅ .gitignore criado"
fi

# =====================================
# 🗂️ Adicionar arquivos (EXCLUINDO .env)
# =====================================
echo "💾 Adicionando arquivos seguros..."

# Remover .env se já estiver no git
git rm --cached .env 2>/dev/null || true

# Adicionar todos os arquivos exceto os listados no .gitignore
git add .

# Verificar se há mudanças
if git diff --cached --quiet; then
    echo "📝 Nenhuma mudança para commitar. Criando README..."
    
    if [ ! -f README.md ]; then
        cat > README.md << EOF
# $REPO_NAME

## Descrição
Projeto sincronizado automaticamente via script.

## ⚠️ Configuração
Crie um arquivo .env localmente com:
\`\`\`
GITHUB_TOKEN=seu_token_aqui
GITHUB_EMAIL=seu_email@exemplo.com
\`\`\`

**NUNCA compartilhe seu token!**
EOF
        git add README.md
    fi
fi

# =====================================
# 📝 Commit e Push
# =====================================
if ! git diff --cached --quiet; then
    git commit -m "🚀 Deploy seguro $(date '+%d/%m/%Y %H:%M')"
    
    # Configurar remote com autenticação
    AUTH_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$AUTH_URL"
    
    # Fazer push
    git branch -M main
    echo "📤 Enviando para GitHub..."
    git push -u origin main
    
    echo "✅ Sincronização concluída com segurança!"
else
    echo "✅ Nada para sincronizar."
fi

# Limpar token da memória
unset GITHUB_TOKEN
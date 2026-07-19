#!/bin/bash
# Método Perfektus — arranque com duplo clique
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "  MÉTODO PERFEKTUS — App de Cliente"
echo "═══════════════════════════════════════════"
echo ""

# 1. Verificar se a chave foi colada
if grep -q "COLA_AQUI" .env 2>/dev/null; then
  echo "⚠️  Falta colar a Publishable key no ficheiro .env"
  echo ""
  echo "   A abrir o .env no TextEdit..."
  echo "   Substitui COLA_AQUI_A_PUBLISHABLE_KEY pela chave"
  echo "   (sb_publishable_...) e guarda (Cmd+S)."
  echo ""
  open -e .env
  echo "   Depois de guardar, faz duplo clique neste ficheiro outra vez."
  echo ""
  read -p "Pressiona Enter para fechar..."
  exit 0
fi

# 2. Verificar Node.js
if ! command -v npm &> /dev/null; then
  echo "⚠️  O Node.js não está instalado."
  echo ""
  if command -v brew &> /dev/null; then
    echo "   A instalar via Homebrew (pode demorar uns minutos)..."
    brew install node
  else
    echo "   Instala em: https://nodejs.org (versão LTS) e volta a correr isto."
    read -p "Pressiona Enter para fechar..."
    exit 1
  fi
fi

# 3. Instalar dependências (só na primeira vez)
if [ ! -d "node_modules" ]; then
  echo "📦 Primeira execução — a instalar dependências (1-2 min)..."
  npm install
fi

# 4. Arrancar
echo ""
echo "🚀 A arrancar em http://localhost:5173"
echo "   Login de teste: teste@perfektus.pt / teste1234"
echo "   Para parar: fecha esta janela ou Ctrl+C"
echo ""
sleep 2 && open "http://localhost:5173" &
npm run dev

@echo off
title Snack Store BH - Servidor de Automacao WhatsApp
color 0E

echo ===================================================================
echo     SNACK STORE BH - DISTRIBUIDORA DE ALTA PERFUMARIA
echo     Servidor Local de Automacao para Catalogo WhatsApp Web
echo ===================================================================
echo.

cd /d "%~dp0"
if exist "automacao-whatsapp" cd automacao-whatsapp

echo [1/2] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    echo Instale o Node.js em: https://nodejs.org
    pause
    exit /b
)

echo [2/2] Iniciando servidor local na porta 3500...
echo.
echo ===================================================================
echo   COMO USAR NO WHATSAPP WEB:
echo   1. Mantenha esta janela aberta!
echo   2. Abra o WhatsApp Web no navegador (aba Catalogo).
echo   3. Pressione F12 (Console) e cole o comando:
echo.
echo   fetch('http://localhost:3500/injetor.js').then(r=^>r.text()).then(eval);
echo.
echo   4. O painel flutuante vai aparecer na tela. Clique em INICIAR!
echo ===================================================================
echo.

node server.js
pause

# 🚀 Como Hospedar o Catálogo & Copyboard no Easypanel

O projeto foi totalmente convertido para uma aplicação moderna em **React + Vite** com servidor **Nginx de alta performance** encapsulado em um **Dockerfile** multi-stage pronto para produção.

---

## 📦 O que foi criado no projeto:
- **`Dockerfile`**: Compila o React/Vite com Node 20 e serve com Nginx Alpine (consome menos de 20MB de RAM).
- **`nginx.conf`**: Configuração com compressão Gzip, cache de imagens e suporte a rotas SPA.
- **`.dockerignore`**: Otimiza o envio ignorando arquivos desnecessários.
- **`src/`**: Aplicação completa em React 18 com:
  - 1-Click Copyboard (SKU, Título Curto, Título Longo, Tags e Descrição Completa);
  - Busca instantânea e filtros por Linha Árabe, Brand Collection, Feminino, Masculino e Unissex;
  - Modal com galeria de todas as fotos em alta resolução;
  - Feedback visual e Toast com notificações rápidas.

---

## 🌐 Passo a Passo para Subir no Easypanel:

### Opção 1: Via Repositório GitHub / GitLab (Mais Recomendado)
1. Suba esta pasta para um repositório no seu **GitHub** ou **GitLab**;
2. Acesse seu painel do **Easypanel**;
3. No seu Projeto, clique em **+ Service** ➔ escolha **App**;
4. Na aba **Source**:
   - Selecione seu repositório Git;
   - Branch: `main` (ou a branch que você subiu);
5. Na aba **Build**:
   - Selecione o método de build: **Dockerfile**;
   - Dockerfile Path: `./Dockerfile` (ou deixe o padrão);
6. Na aba **Domains**:
   - Adicione seu domínio ou subdomínio (ex: `catalogo.snackstorebh.com.br`) ou use o domínio temporário do Easypanel;
7. Na aba **Ports**:
   - Certifique-se de que a porta de destino seja **80** (o Dockerfile já expõe a porta 80 do Nginx);
8. Clique em **Deploy**! 🚀
   - O Easypanel irá construir a imagem, empacotar todas as 52 pastas de fotos e o site entrará no ar com HTTPS/SSL automático!

---

### Opção 2: Testar Localmente na sua Máquina
Caso queira rodar o catálogo no seu computador antes de subir:
```bash
npm run dev
```
Acesse no seu navegador: `http://localhost:5173`
*(Todas as fotos e o copyboard já funcionam 100% no modo local!)*

---

### Opção 3: Testar com Docker Localmente
Se você tiver o Docker instalado na sua máquina:
```bash
docker build -t snack-catalogo .
docker run -d -p 8080:80 snack-catalogo
```
Acesse no navegador: `http://localhost:8080`

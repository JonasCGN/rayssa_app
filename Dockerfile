# Use a imagem oficial do Node.js
FROM node:22-alpine3.19

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie os arquivos de dependências
COPY . .

# Instale as dependências
RUN npm install

EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["node", "app.js"]

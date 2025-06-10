# Usa uma imagem Node.js oficial como base
FROM node:18-alpine

# Define o diretório de trabalho no container
WORKDIR /app

# Instala dumb-init para lidar corretamente com sinais
RUN apk add --no-cache dumb-init

# Copia os arquivos de configuração de dependências
COPY package*.json ./

# Instala as dependências de produção
RUN npm ci --only=production

# Copia o código-fonte da aplicação
COPY src/ ./src/

# Define as variáveis de ambiente para produção
ENV NODE_ENV=production

# Expõe portas que o serviço possa precisar (opcional)
# EXPOSE 3000

# Usa dumb-init como ponto de entrada para lidar corretamente com sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]
# Estágio 1: Build da aplicação Angular
FROM node:20-alpine as builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
    && npm install

# Copia o resto do projeto
COPY . .

# Compila a aplicação Angular (geralmente para dist/<nome>/browser)
RUN npm run build

# Estágio 2: Servidor Nginx
FROM nginx:alpine

# Limpa a pasta padrão
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do Angular
COPY --from=builder /app/dist/*/browser /usr/share/nginx/html

# Copia config do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

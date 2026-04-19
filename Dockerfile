FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build \
  && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["sh", "./docker-entrypoint.sh"]

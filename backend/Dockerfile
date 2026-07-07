FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

# Generate prisma client (schema must be present in prisma/schema.prisma)
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node server.js"]

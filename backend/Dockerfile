FROM node:20-slim

# Install OpenSSL — required by Prisma's native query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

# Generate prisma client (schema must be present in prisma/schema.prisma)
RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node server.js"]

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# We use host 0.0.0.0 to make it accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

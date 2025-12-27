FROM node:20-alpine

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm install

COPY . .
CMD ["npm", "run", "dev"]

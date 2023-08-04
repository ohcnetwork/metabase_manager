FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

COPY . .

RUN npm run build

CMD ["npm", "run", "server:prod"]

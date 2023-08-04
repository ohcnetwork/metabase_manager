FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

RUN npm run build

CMD ["npm", "run", "server:migrate:prod"]

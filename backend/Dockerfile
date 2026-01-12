FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package.json backend/tsconfig.json backend/prisma/schema.prisma ./
RUN npm ci

COPY backend/src ./src

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

RUN apk add --no-cache openssl curl

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY backend/package.json ./

EXPOSE 8000
CMD ["npm", "start"]

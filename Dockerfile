FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "--experimental-strip-types", "server/index.ts"]

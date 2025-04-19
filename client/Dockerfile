FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV WDS_SOCKET_PORT=0
ENV WATCHPACK_POLLING=true

EXPOSE 3000

CMD ["npm", "start"]
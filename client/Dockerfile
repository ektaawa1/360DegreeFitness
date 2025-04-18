FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV REACT_APP_BASE_URL=http://localhost:5050

EXPOSE 3000

CMD ["npm", "start"]
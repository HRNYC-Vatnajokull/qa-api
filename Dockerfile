FROM node:lts-slim

WORKDIR /USR/SRC/APP

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]

EXPOSE 3000
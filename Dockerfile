FROM node:20

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install --no-optional

COPY . .

CMD ["node", "main.js"]

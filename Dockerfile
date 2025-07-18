FROM node:20

WORKDIR /user/src/app

COPY package*.json ./

ENV PUPPETEET_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --no-optional

COPY . .

CMD ["node", "main.js"]

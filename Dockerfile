FROM node:14.9.0-alpine3.10
EXPOSE 80 443

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/

RUN npm ci

COPY . /app

RUN mkdir -p ~/.postgresql && wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" -O ~/.postgresql/root.crt && chmod 0600 ~/.postgresql/root.crt

CMD NODE_ENV=production npm run start

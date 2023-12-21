FROM node:14

#RUN apt-get update && apt-get install -y wget
#
#RUN wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
#    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
#    && rm dockerize-linux-amd64-v0.6.1.tar.gz

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY src .

ENTRYPOINT npm run start

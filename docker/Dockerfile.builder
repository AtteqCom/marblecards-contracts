FROM node:latest

RUN mkdir -p /marblegame/build
RUN mkdir -p /marblegame
ADD ./src /marblegame
WORKDIR /marblegame

ADD ./package.json /marblegame

RUN npm install -g truffle
RUN npm install

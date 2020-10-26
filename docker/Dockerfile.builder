FROM node:10.16.0

RUN mkdir -p /marblegame/build

ADD ./src /marblegame
WORKDIR /marblegame

ADD ./package.json /marblegame

RUN npm install

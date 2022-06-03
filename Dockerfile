FROM node:16-alpine

COPY . ./

RUN yarn install --frozen-lockfile

EXPOSE 3000/tcp

CMD yarn start
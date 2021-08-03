FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY assets .
COPY index.html .
COPY search.js .

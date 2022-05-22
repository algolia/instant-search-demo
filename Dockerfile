FROM nginx:1.21

COPY LICENSE /usr/share/nginx/html/

# TODO minimify files before copying it

COPY *.js *.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

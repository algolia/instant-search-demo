FROM nginx:1.21

# TODO minimify files before copying it

COPY *.js *.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

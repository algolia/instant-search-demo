FROM node:16-alpine AS build

WORKDIR /build

COPY . .

RUN yarn install --frozen-lockfile

FROM nginx:alpine

WORKDIR /app

COPY --from=build /build/dataset_import/ ./dataset_import/

COPY --from=build /build/assets/ ./assets/

COPY --from=build /build/index.html /build/index-simplified.html /build/search-simplified.js /build/search.js ./

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
ARG BASE_IMAGE=uber/web-base-image:10.15.2
FROM $BASE_IMAGE

WORKDIR /fusion-plugin-styletron-react

COPY . .

RUN yarn

RUN yarn build-test

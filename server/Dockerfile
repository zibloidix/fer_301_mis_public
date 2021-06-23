FROM node:14.16.0-alpine3.10
ENV UPDATE_SERVICE_URL="https://..."
ENV NODE_ENV=production
ENV PORT=3000
RUN mkdir /usr/src/app -p && chown -Rf node:node /usr/src/app 
WORKDIR /usr/src/app
COPY --chown=node:node . .
RUN npm ci && npm cache clean --force
USER node
CMD ["node", "bin/www"]

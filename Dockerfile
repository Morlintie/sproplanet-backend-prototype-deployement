FROM node:20-alpine as base
WORKDIR /usr/src/app
COPY ./src/package*.json ./
## base image for building the application
FROM base as development
RUN --mount=type=cache,target=/usr/src/app/.npm \
     npm set cache /usr/src/app/.npm && \
     npm install 
USER node
COPY ./src .
EXPOSE 5000
CMD ["npm", "run", "dev"]
## image for development environment
FROM base as production
ENV NODE_ENV=production
RUN --mount=type=cache,target=/usr/src/app/.npm \
      npm set cache /usr/src/app/.npm && \
      npm ci --only=production
USER node
COPY --chown=node:node ./src .
EXPOSE 5000
CMD ["node", "app.js"]   
## image for production environment   


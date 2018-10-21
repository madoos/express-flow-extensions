FROM node:9.4.0-slim
WORKDIR /home/app/
ADD . .
RUN npm install --only=dev
RUN npm run docs
EXPOSE 8080
ENV NODE_ENV=production
CMD [ "npm", "run", "serve:docs" ]
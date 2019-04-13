FROM node

# Create app directory
WORKDIR /app

COPY package.json /app
RUN npm install
COPY . .
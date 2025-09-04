# Use Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /Task-allllocation-Tracker/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose the port
EXPOSE 3000

# Command to run the app
CMD ["node", "app.js"]

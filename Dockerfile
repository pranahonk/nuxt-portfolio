# Use a base image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN yarn

# Copy the rest of the application files to the container
COPY . .

# Expose the port on which the application will run (if applicable)
EXPOSE 8000

# Set the startup command
CMD ["yarn", "start"]

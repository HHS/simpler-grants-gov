# Use the official Playwright image as a base
FROM mcr.microsoft.com/playwright:v1.49.0-noble

# Install make and any other necessary dependencies
RUN apt-get update

# Set the working directory to the root of the project inside the Docker container
WORKDIR /e2e

# Setup npm install layer that can be cached
COPY e2e/package.json e2e/package-lock.json ./

# install deps
RUN npm ci

# Copy entire e2e folder over
COPY e2e /e2e

CMD ["npm", "test", "--"]

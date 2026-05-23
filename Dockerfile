# Use the official Microsoft Playwright Ubuntu-based image
# This image comes pre-packaged with Node.js, NPM, and all required system libraries for Chromium
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set the working directory
WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate the Prisma client types
RUN npx prisma generate

# Build the Next.js application
# (This runs npm run build, which will fetch the exact matching Chromium version)
RUN npm run build

# Expose Next.js port (Railway overrides this dynamically)
EXPOSE 3000

# Set start command
CMD ["npm", "start"]

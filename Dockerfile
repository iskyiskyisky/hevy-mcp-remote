FROM node:20-slim

RUN npm install -g hevy-mcp mcp-proxy

COPY server.js /app/server.js

CMD ["node", "/app/server.js"]

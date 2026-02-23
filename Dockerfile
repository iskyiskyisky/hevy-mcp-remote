FROM node:20-slim

RUN npm install -g hevy-mcp mcp-proxy

CMD ["sh", "-c", "mcp-proxy --port ${PORT:-10000} -- hevy-mcp"]

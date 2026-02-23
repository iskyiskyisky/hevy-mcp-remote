FROM node:20-slim

RUN npm install -g hevy-mcp supergateway

CMD ["sh", "-c", "supergateway --stdio 'hevy-mcp' --port ${PORT:-10000} --outputTransport streamableHttp"]

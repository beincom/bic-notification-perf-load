FROM golang AS builder
WORKDIR /app

RUN go install go.k6.io/xk6/cmd/xk6@latest

RUN xk6 build \
    --with github.com/oleiade/xk6-kv \
    --with github.com/grafana/xk6-dashboard \
    --with github.com/Juandavi1/xk6-prompt

FROM debian:stable-slim as app
WORKDIR /app

COPY --from=builder --chmod=755 /app/k6 /
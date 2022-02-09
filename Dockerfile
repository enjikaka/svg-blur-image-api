FROM denoland/deno:alpine-1.18.2
EXPOSE 5000
WORKDIR /app
USER deno

ADD . .
RUN deno cache index.ts

CMD ["run", "--allow-net", "index.ts"]

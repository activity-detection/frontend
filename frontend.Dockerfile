# Obraz frontendu zbudowany w oparciu o przykład z dokumentacji dockera: Dockerfile dla aplikacji Angularowej

#Zmienne pliku Dockerfile
ARG NODE_VERSION=24.7.0-alpine
ARG NGINX_VERSION=alpine3.22

#Obraz do buildu, nie będzie zawarty w końcowym obrazie
FROM node:${NODE_VERSION} AS builder
WORKDIR /frontend
#package* oznacza "wszystkie pliki z początkiem package
COPY package* ./

# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

#Obraz serwera webowego z przesłanym zbudowanym projektem z buildera
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runner

#built-in non-root user for security best practices
USER nginx

#Przesłanie nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --chown=nginx:nginx --from=builder /frontend/dist/*/browser /usr/share/nginx/html

EXPOSE 8080

#Uruchomienie nginx z przesłaną konfiguracją przy uruchomieniu kontenera
ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]

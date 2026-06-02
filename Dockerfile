# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Backend Vendor
FROM composer:2.7 AS backend
WORKDIR /app
COPY composer.json composer.lock ./
# We run install without scripts first to cache dependencies, then copy rest
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize --no-dev

# Stage 3: Final Production Image (FrankenPHP)
FROM dunglas/frankenphp:php8.3-alpine

# Install required PHP extensions
# FrankenPHP alpine image comes with install-php-extensions
RUN install-php-extensions \
    pdo_mysql \
    redis \
    pcntl \
    opcache \
    zip \
    gd \
    bcmath \
    intl

# Set production environment
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV SERVER_NAME=":80"

# Opcache config for performance
RUN { \
        echo 'opcache.memory_consumption=256'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.revalidate_freq=0'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

WORKDIR /app

# Copy files from previous stages
COPY --from=backend /app /app
COPY --from=frontend /app/public/build /app/public/build

# Set permissions
RUN chown -R root:root /app && \
    chmod -R 755 /app && \
    chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Expose HTTP port
EXPOSE 80

# The base dunglas/frankenphp image automatically runs the web server.
# We just need to define the entrypoint or command if we want to run migrations first,
# but usually it's best to run migrations separately. 
# We'll use the default frankenphp entrypoint.

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Build Backend Vendor
FROM composer:2.7 AS backend
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize --no-dev

# Stage 3: Final Production Image (FrankenPHP)
FROM dunglas/frankenphp:php8.3-alpine

# Install required PHP extensions
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

# PHP production config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Opcache config for performance
RUN { \
        echo 'opcache.memory_consumption=256'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.revalidate_freq=0'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.enable_cli=1'; \
        echo 'opcache.jit=1255'; \
        echo 'opcache.jit_buffer_size=128M'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

# PHP hardening
RUN { \
        echo 'expose_php=Off'; \
        echo 'memory_limit=256M'; \
        echo 'upload_max_filesize=32M'; \
        echo 'post_max_size=48M'; \
        echo 'max_execution_time=60'; \
    } > /usr/local/etc/php/conf.d/hardening.ini

WORKDIR /app

# Copy files from previous stages
COPY --from=backend /app /app
COPY --from=frontend /app/public/build /app/public/build

# Set permissions
RUN chown -R root:root /app && \
    chmod -R 755 /app && \
    chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Cache Laravel config, routes, views for performance
RUN php artisan config:clear && \
    php artisan route:clear && \
    php artisan view:clear

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

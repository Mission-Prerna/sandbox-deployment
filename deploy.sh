#!/bin/bash

check_https_support() {
    domain="$1"

    response=$(curl -sI "http://$domain" | grep -i "Location: https://")

    if [[ -n "$response" ]]; then
        return 0  # Supports HTTPS
    else
        return 1  # Does not support HTTPS
    fi
}

odk_central_env_setup () {
    echo "Checking ODK central..."
    if [ ! -f "central/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "ODK Central>> Enter domain (e.g. central.example.com): "
        read ODK_CENTRAL_DOMAIN;

        check_https_support "$ODK_CENTRAL_DOMAIN"

        if [[ $? -eq 1 ]]; then
            echo "Domain $ODK_CENTRAL_DOMAIN must support HTTPs. Please setup the domain correctly & re-run the script."
            exit 1
        fi

        echo "Enter path to <fullchain.pem> certificate file (if you deploy ssl using certbot, the path should look like: </etc/letsencrypt/live/$ODK_CENTRAL_DOMAIN/fullchain.pem>): "
        read ODK_CENTRAL_FULLCHAIN_PATH;
        if [ ! -f "$ODK_CENTRAL_FULLCHAIN_PATH" ]; then
            echo "No certificate found at the specified location. Exiting.."
            exit 1
        fi

        echo "Enter path to <privkey.pem> certificate file (if you deploy ssl using certbot, the path should look like: </etc/letsencrypt/live/$ODK_CENTRAL_DOMAIN/privkey.pem>): "
        read ODK_CENTRAL_PRIVKEY_PATH;
        if [ ! -f "$ODK_CENTRAL_PRIVKEY_PATH" ]; then
            echo "No certificate found at the specified location. Exiting.."
            exit 1
        fi

        echo "ODK Central>> Enter HTTP_PORT (default: 8080): "
        read ODK_CENTRAL_HTTP_PORT;
        if [ "$ODK_CENTRAL_HTTP_PORT" = '' ]; then
            ODK_CENTRAL_HTTP_PORT=8080
        fi

        echo "ODK Central>> Enter HTTPS_PORT (default: 8443): "
        read ODK_CENTRAL_HTTPS_PORT;
        if [ "$ODK_CENTRAL_HTTPS_PORT" = '' ]; then
            ODK_CENTRAL_HTTPS_PORT=8443
        fi

        echo "DOMAIN=$ODK_CENTRAL_DOMAIN" >> ./central/.env
        echo "SSL_TYPE=customssl" >> ./central/.env
        echo "HTTP_PORT=$ODK_CENTRAL_HTTP_PORT" >> ./central/.env
        echo "HTTPS_PORT=$ODK_CENTRAL_HTTPS_PORT" >> ./central/.env

        cp "$ODK_CENTRAL_FULLCHAIN_PATH" central/files/local/customssl/fullchain.pem
        cp "$ODK_CENTRAL_PRIVKEY_PATH" central/files/local/customssl/privkey.pem
    else
        echo "Env setup already done. Skipping.."
    fi
}

fusion_auth_env_setup () {
    echo "Checking Fusion Auth..."
    if [ ! -f "fusion-auth/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Fusion Auth>> Enter FUSIONAUTH_POSTGRES_USER (default: postgres): "
        read FUSIONAUTH_POSTGRES_USER;
        if [ "$FUSIONAUTH_POSTGRES_USER" = '' ]; then
            FUSIONAUTH_POSTGRES_USER=postgres
        fi

        echo "Fusion Auth>> Enter FUSIONAUTH_POSTGRES_DBNAME (default: postgres): "
        read FUSIONAUTH_POSTGRES_DBNAME;
        if [ "$FUSIONAUTH_POSTGRES_DBNAME" = '' ]; then
            FUSIONAUTH_POSTGRES_DBNAME=postgres
        fi

        temp=$(openssl rand -hex 20)
        echo "Fusion Auth>> Enter FUSIONAUTH_POSTGRES_PASSWORD (default: $temp): "
        read FUSIONAUTH_POSTGRES_PASSWORD;
        if [ "$FUSIONAUTH_POSTGRES_PASSWORD" = '' ]; then
            FUSIONAUTH_POSTGRES_PASSWORD=$temp
        fi

        echo "Fusion Auth>> Enter FUSIONAUTH_DATABASE_USER (default: fusionauth): "
        read FUSIONAUTH_DATABASE_USER;
        if [ "$FUSIONAUTH_DATABASE_USER" = '' ]; then
            FUSIONAUTH_DATABASE_USER=fusionauth
        fi

        temp=$(openssl rand -hex 20)
        echo "Fusion Auth>> Enter FUSIONAUTH_DATABASE_PASSWORD (default: $temp): "
        read FUSIONAUTH_DATABASE_PASSWORD;
        if [ "$FUSIONAUTH_DATABASE_PASSWORD" = '' ]; then
            FUSIONAUTH_DATABASE_PASSWORD=$temp
        fi

        temp=$(openssl rand -hex 24)
        echo "Fusion Auth>> Enter FUSIONAUTH_API_KEY (default: $temp): "
        read FUSIONAUTH_API_KEY;
        if [ "$FUSIONAUTH_API_KEY" = '' ]; then
            FUSIONAUTH_API_KEY=$temp
        fi

        echo "Fusion Auth>> Enter FUSIONAUTH_URL (absolute base url e.g. http://fusionauth.example.com): "
        read FUSIONAUTH_URL;

        temp=$(openssl rand -hex 10)
        echo "Fusion Auth>> Enter FUSIONAUTH_ADMIN_PASSWORD (default: $temp): "
        read FUSIONAUTH_ADMIN_PASSWORD;
        if [ "$FUSIONAUTH_ADMIN_PASSWORD" = '' ]; then
            FUSIONAUTH_ADMIN_PASSWORD=$temp
        fi

        echo "Fusion Auth>> Enter FUSIONAUTH_ADMIN_EMAIL: "
        read FUSIONAUTH_ADMIN_EMAIL;

        temp=$(curl ifconfig.me)
        echo "Fusion Auth>> Enter FUSIONAUTH_IP ($temp): "
        read FUSIONAUTH_IP;
        if [ "$FUSIONAUTH_IP" = '' ]; then
            FUSIONAUTH_IP=$temp
        fi

        echo "FUSIONAUTH_POSTGRES_USER=$FUSIONAUTH_POSTGRES_USER" >> ./fusion-auth/.env
        echo "FUSIONAUTH_POSTGRES_DBNAME=$FUSIONAUTH_POSTGRES_DBNAME" >> ./fusion-auth/.env
        echo "FUSIONAUTH_POSTGRES_PASSWORD=$FUSIONAUTH_POSTGRES_PASSWORD" >> ./fusion-auth/.env
        echo "FUSIONAUTH_DATABASE_USER=$FUSIONAUTH_DATABASE_USER" >> ./fusion-auth/.env
        echo "FUSIONAUTH_DATABASE_PASSWORD=$FUSIONAUTH_DATABASE_PASSWORD" >> ./fusion-auth/.env
        echo "FUSIONAUTH_APP_KICKSTART_FILE=/usr/local/fusionauth/kickstart/kickstart.json" >> ./fusion-auth/.env
        echo "FUSIONAUTH_API_KEY=$FUSIONAUTH_API_KEY" >> ./fusion-auth/.env
        echo "ES_JAVA_OPTS=-Xms1024m -Xmx1024m" >> ./fusion-auth/.env
        echo "FUSIONAUTH_URL=$FUSIONAUTH_URL" >> ./fusion-auth/.env
        echo "FUSIONAUTH_MEMORY=2048M" >> ./fusion-auth/.env
        echo "FUSIONAUTH_APP_MEMORY=2048M" >> ./fusion-auth/.env
        echo "FUSIONAUTH_ADMIN_PASSWORD=$FUSIONAUTH_ADMIN_PASSWORD" >> ./fusion-auth/.env
        echo "FUSIONAUTH_ADMIN_EMAIL=$FUSIONAUTH_ADMIN_EMAIL" >> ./fusion-auth/.env
        echo "IP=$FUSIONAUTH_IP" >> ./fusion-auth/.env
        echo "FA_PORT=8012" >> ./fusion-auth/.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

gatekeeper_env_setup () {
    echo "Checking Gatekeeper..."
    if [ ! -f "gatekeeper/.gatekeeper.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Gatekeeper>> Enter Application ID (e.g. APP_org_example_nl_app): "
        read GATEKEEPER_APP_ID;
        if [ "$GATEKEEPER_APP_ID" = '' ]; then
            GATEKEEPER_APP_ID=APP_org_example_nl_app
        fi

        echo "Gatekeeper>> Enter Application Name (e.g. NL-Sandbox): "
        read GATEKEEPER_APP_NAME;
        if [ "$GATEKEEPER_APP_NAME" = '' ]; then
            GATEKEEPER_APP_NAME=NL-Sandbox
        fi

        apiKey=$(openssl rand -hex 10)
        adminSecret=$(openssl rand -hex 30)
        # shellcheck disable=SC2140
        echo "$GATEKEEPER_APP_ID={"\"name"\": "\"NL Sandbox"\", "\"apiKey"\": "\"$apiKey"\", "\"adminSecret"\": "\"$adminSecret"\"}" >> ./gatekeeper/.gatekeeper.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

prometheus_metrics_env_setup () {
    echo "Checking Prometheus Metrics..."
    if [ ! -f "metrics/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Prometheus Metrics>> Enter ADMIN_USER (e.g. sandbox-admin): "
        read ADMIN_USER;
        if [ "$ADMIN_USER" = '' ]; then
            ADMIN_USER=sandbox-admin
        fi

        temp=$(openssl rand -hex 16)
        echo "Prometheus Metrics>> Enter ADMIN_PASSWORD (default: $temp): "
        read ADMIN_PASSWORD;
        if [ "$ADMIN_PASSWORD" = '' ]; then
            ADMIN_PASSWORD=$temp
        fi

        echo "Installing <apache2-utils> (sudo access is required)..."
        sudo apt-get install apache2-utils

        ADMIN_PASSWORD_HASH=$(htpasswd -bnBC 10 "" $ADMIN_PASSWORD | tr -d ':\n');

        echo "ADMIN_USER=$ADMIN_USER" >> ./metrics/.env
        echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> ./metrics/.env
        echo "ADMIN_PASSWORD_HASH='$ADMIN_PASSWORD_HASH'" >> ./metrics/.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

odk_zip_nginx_env_setup () {
    echo "Checking Form Zip Downloader..."
    if [ ! -f "odk-zip-nginx/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Form Zip Downloader>> Enter PORT (default: 8988): "
        read PORT;
        if [ "$PORT" = '' ]; then
            PORT=8988
        fi

        echo "PORT=$PORT" >> ./odk-zip-nginx/.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

form_transformer_env_setup () {
    echo "Checking Form Transformer..."
    if [ ! -f "quml2xform/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Form Transformer>> Enter PORT (default: 8061): "
        read PORT;
        if [ "$PORT" = '' ]; then
            PORT=8061
        fi

        echo "PORT=$PORT" >> ./quml2xform/.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

backend_env_setup () {
    echo "Checking Backend..."
    if [ ! -f "hasura/.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        echo "Backend>> Enter Postgres DB_USER (default: postgres): "
        read DB_USER;
        if [ "$DB_USER" = '' ]; then
            DB_USER=postgres
        fi

        echo "Backend>> Enter Postgres DB_DATABASE (default: postgres): "
        read DB_DATABASE;
        if [ "$DB_DATABASE" = '' ]; then
            DB_DATABASE=postgres
        fi

        temp=$(openssl rand -hex 20)
        echo "Backend>> Enter Postgres DB_PASSWORD (default: $temp): "
        read DB_PASSWORD;
        if [ "$DB_PASSWORD" = '' ]; then
            DB_PASSWORD=$temp
        fi

        temp=$(openssl rand -hex 20)
        echo "Backend>> Enter HASURA_GRAPHQL_ADMIN_SECRET (default: $temp): "
        read HASURA_GRAPHQL_ADMIN_SECRET;
        if [ "$HASURA_GRAPHQL_ADMIN_SECRET" = '' ]; then
            HASURA_GRAPHQL_ADMIN_SECRET=$temp
        fi

        temp=100
        echo "Backend>> Enter HASURA_GRAPHQL_PG_CONNECTIONS (default: $temp): "
        read HASURA_GRAPHQL_PG_CONNECTIONS;
        if [ "$HASURA_GRAPHQL_PG_CONNECTIONS" = '' ]; then
            HASURA_GRAPHQL_PG_CONNECTIONS=$temp
        fi

        temp="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArEkCyOK1dNhh/73beayRLpg5xSNAc5Ba/NvbX/dGszXloBUkwg1Em1NhNI6RftOHQIWMF7T619ls4VI73SGv51ZimvI0nVR/rjj+0mB9JkuLIJtdm+OQc3+kazCbGUlT599UxjFHq9xmVcQdE66EGDcWbC7r9hF/KbZoav6+9knXjcAbVu5hG3i9SuKqmeUBNwiAVzwa1CaNdhW+dZh9Ab36WuS32P7BqN9qKhWYup0r6NIC5HoIyGLvT0fY6ZnmTqXLIZaoY+bgrz7TzpwoYnesTCCx5yeW4/stHzIB/vrTRhq9VIw3Q7ZRibB96BTtBoSudcX6oKDiew9xorl9kwIDAQAB"
        echo "Backend>> Enter HASURA_GRAPHQL_PUBLIC_KEY (if empty, we'll set a random key; you can change it later): "
        read HASURA_GRAPHQL_PUBLIC_KEY;
        if [ "$HASURA_GRAPHQL_PUBLIC_KEY" = '' ]; then
            HASURA_GRAPHQL_PUBLIC_KEY=$temp
        fi

        echo "Backend>> Enter FUSIONAUTH_URL (where fusion auth is hosted): "
        read FA_URL;

        echo "Backend>> Enter FUSIONAUTH_API KEY (API key generated via Fusion Auth): "
        read FA_API_KEY;

        echo "Backend>> Enter FUSIONAUTH Application ID (Application ID for NL): "
        read FA_APPLICATION_ID;

        echo "Backend>> Enter FUSIONAUTH Application ID for Admin (Application ID for Admin Console): "
        read FA_ADMIN_APPLICATION_ID;

        temp=$(openssl rand -hex 10)
        echo "Backend>> Enter Default FUSIONAUTH Login password (default: $temp): "
        read FA_DEFAULT_PASSWORD;
        if [ "$FA_DEFAULT_PASSWORD" = '' ]; then
            FA_DEFAULT_PASSWORD=$temp
        fi

        echo "Backend>> Enter UCI Chatbot Helper HASURA_GRAPHQL_URL: "
        read HASURA_GRAPHQL_URL;

        echo "Backend>> Enter UCI Chatbot Helper HASURA_ADMIN_SECRET: "
        read HASURA_ADMIN_SECRET;

        temp="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArEkCyOK1dNhh/73beayRLpg5xSNAc5Ba/NvbX/dGszXloBUkwg1Em1NhNI6RftOHQIWMF7T619ls4VI73SGv51ZimvI0nVR/rjj+0mB9JkuLIJtdm+OQc3+kazCbGUlT599UxjFHq9xmVcQdE66EGDcWbC7r9hF/KbZoav6+9knXjcAbVu5hG3i9SuKqmeUBNwiAVzwa1CaNdhW+dZh9Ab36WuS32P7BqN9qKhWYup0r6NIC5HoIyGLvT0fY6ZnmTqXLIZaoY+bgrz7TzpwoYnesTCCx5yeW4/stHzIB/vrTRhq9VIw3Q7ZRibB96BTtBoSudcX6oKDiew9xorl9kwIDAQAB"
        echo "Backend>> Enter UCI Chatbot Helper FA_PUBLIC_KEY (if empty, we'll set a random key; you can change it later): "
        read FA_PUBLIC_KEY;
        if [ "$FA_PUBLIC_KEY" = '' ]; then
            FA_PUBLIC_KEY=$temp
        fi

        echo "# Postgres" >> ./hasura/.env
        echo "DB_USER=$DB_USER" >> ./hasura/.env
        echo "DB_DATABASE=$DB_DATABASE" >> ./hasura/.env
        echo "DB_PASSWORD=$DB_PASSWORD" >> ./hasura/.env
        echo "POSTGRES_CONF_FILE=postgresql.dev.conf" >> ./hasura/.env

        echo "" >> ./hasura/.env
        echo "# Hasura" >> ./hasura/.env
        echo "HASURA_GRAPHQL_ADMIN_SECRET=$HASURA_GRAPHQL_ADMIN_SECRET" >> ./hasura/.env
        echo "HASURA_GRAPHQL_PG_CONNECTIONS=$HASURA_GRAPHQL_PG_CONNECTIONS" >> ./hasura/.env
        # shellcheck disable=SC2140
        echo "HASURA_GRAPHQL_JWT_SECRET={"\"type"\":"\"RS256"\","\"key"\": "\"-----BEGIN PUBLIC KEY-----\\n$HASURA_GRAPHQL_PUBLIC_KEY\\n-----END PUBLIC KEY-----"\"}" >> ./hasura/.env

        echo "" >> ./hasura/.env
        echo "# NL APIs" >> ./hasura/.env
        echo "ENVIRONMENT=prod" >> ./hasura/.env
        echo "DEBUG=1" >> ./hasura/.env
        echo "APP_PORT=3000" >> ./hasura/.env
        echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@pgbouncer:6432/$DB_DATABASE?schema=public&pgbouncer=true" >> ./hasura/.env
        echo "FA_PUBLIC_KEY="\"-----BEGIN PUBLIC KEY-----\\n$HASURA_GRAPHQL_PUBLIC_KEY\\n-----END PUBLIC KEY-----"\"" >> ./hasura/.env
        echo "FA_URL=$FA_URL" >> ./hasura/.env
        echo "FA_API_KEY=$FA_API_KEY" >> ./hasura/.env
        echo "FA_APPLICATION_ID=$FA_APPLICATION_ID" >> ./hasura/.env
        echo "FA_ADMIN_APPLICATION_ID=$FA_ADMIN_APPLICATION_ID" >> ./hasura/.env
        echo "FA_DEFAULT_PASSWORD=$FA_DEFAULT_PASSWORD" >> ./hasura/.env
        echo "QUEUE_HOST=redis-nl-apis" >> ./hasura/.env
        echo "QUEUE_PORT=6379" >> ./hasura/.env
        echo "API_QUEUES=false" >> ./hasura/.env
        echo "WORKERS=1" >> ./hasura/.env
        echo "SENTRY_DSN=" >> ./hasura/.env

        echo "" >> ./hasura/.env
        echo "# UCI Chatbot helper" >> ./hasura/.env
        echo "HASURA_GRAPHQL_URL=$HASURA_GRAPHQL_URL" >> ./hasura/.env
        echo "HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET" >> ./hasura/.env
        echo "FA_PUBLIC_KEY="\"-----BEGIN PUBLIC KEY-----\\n$FA_PUBLIC_KEY\\n-----END PUBLIC KEY-----"\"" >> ./hasura/.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

user_service_env_setup () {
    echo "Checking User Service..."
    if [ ! -f "user-service/.user-service.env" ]; then
        echo "Env isn't setup yet.. Let's set it up.."

        temp="http://enterprise.smsgupshup.com/GatewayAPI/rest"
        echo "User Service>> Enter GUPSHUP_BASEURL (default: $temp): "
        read GUPSHUP_BASEURL;
        if [ "$GUPSHUP_BASEURL" = '' ]; then
            GUPSHUP_BASEURL=$temp
        fi

        temp=30
        echo "User Service>> Enter OTP_EXPIRY (default: $temp): "
        read OTP_EXPIRY;
        if [ "$OTP_EXPIRY" = '' ]; then
            OTP_EXPIRY=$temp
        fi

        echo "User Service>> Enter Postgres GUPSHUP_USERNAME (leave empty to change later): "
        read GUPSHUP_USERNAME;

        echo "User Service>> Enter Postgres GUPSHUP_PASSWORD (leave empty to change later): "
        read GUPSHUP_PASSWORD;

        echo "User Service>> Enter Postgres GUPSHUP_OTP_TEMPLATE (leave empty to change later): "
        read GUPSHUP_OTP_TEMPLATE;

        echo "User Service>> Enter Fusion Auth Application ID: "
        read FA_APPLICATION_ID;
        FA_APPLICATION_ID=`echo "$FA_APPLICATION_ID" | tr - _`  # replace hyphen with _

        echo "User Service>> Enter Fusion Auth Host URL: "
        read FA_URL;

        echo "User Service>> Enter Fusion Auth API KEY: "
        read FA_API_KEY;

        echo "# GUPSHUP" >> ./user-service/.user-service.env
        echo "GUPSHUP_BASEURL=$GUPSHUP_BASEURL" >> ./user-service/.user-service.env
        echo "OTP_EXPIRY=$OTP_EXPIRY" >> ./user-service/.user-service.env
        echo "GUPSHUP_USERNAME=$GUPSHUP_USERNAME" >> ./user-service/.user-service.env
        echo "GUPSHUP_PASSWORD=$GUPSHUP_PASSWORD" >> ./user-service/.user-service.env
        echo "GUPSHUP_OTP_TEMPLATE=$GUPSHUP_OTP_TEMPLATE" >> ./user-service/.user-service.env

        echo "# Fusion Auth application registration" >> ./user-service/.user-service.env
        # shellcheck disable=SC2140
        # shellcheck disable=SC1083
        echo "APP_$FA_APPLICATION_ID='{"\"host"\"": "\"$FA_URL"\", "\"apiKey"\": "\"$FA_API_KEY"\", "\"encryption"\": {"\"enabled"\": false, "\"key"\": "\""\"}}"'" >> ./user-service/.user-service.env
    else
        echo "Env setup already done. Skipping.."
    fi
}

BASE_DIR=$(pwd)

## ODK Central
odk_central_env_setup

## Fusion Auth
fusion_auth_env_setup

## Gatekeeper
gatekeeper_env_setup

## Prometheus Metrics
prometheus_metrics_env_setup

## Form Zip Downloader
odk_zip_nginx_env_setup

## Form Transformer
form_transformer_env_setup

## Backend Services
backend_env_setup

## User Service
user_service_env_setup

echo "Starting Services..."

echo "> cd central && docker-compose up -d"
cd central || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd fusion-auth && docker-compose up -d"
cd fusion-auth || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd gatekeeper && docker-compose up -d"
cd gatekeeper || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd metrics && docker-compose up -d"
cd metrics || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd odk-zip-nginx && docker-compose up -d"
cd odk-zip-nginx || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd quml2xform && docker-compose up -d"
cd quml2xform || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd hasura && docker-compose up -d"
cd hasura || exit
docker-compose up -d
cd "$BASE_DIR" || exit

echo "> cd user-service && docker-compose up -d"
cd user-service || exit
docker-compose up -d
cd "$BASE_DIR" || exit
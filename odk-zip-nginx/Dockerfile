FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled/* /etc/nginx/sites-enabled/
COPY sites-available/* /etc/nginx/sites-available/

# Static Files
COPY static/* /etc/nginx/static/

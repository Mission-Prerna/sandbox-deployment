FROM brainsam/pgbouncer:latest
ARG DB_USER
ARG DB_PASSWORD
RUN mkdir -p /etc/pgbouncer && echo "\"$DB_USER"\" "\"$DB_PASSWORD"\" > /etc/pgbouncer/userlist.txt
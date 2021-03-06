docker rm --force cloud
docker rm --force nginx-letsencrypt
docker rm --force nginx-gen
docker rm --force nginx

docker run -d -p 80:80 -p 443:443 \
    --name nginx \
    --log-opt max-size=10m \
    -v /etc/nginx/conf.d  \
    -v /etc/nginx/vhost.d \
    -v /usr/share/nginx/html \
    -v /home/scootbot/certs:/etc/nginx/certs:ro \
    nginx

docker run -d \
    --name nginx-gen \
    --log-opt max-size=10m \
    --volumes-from nginx \
    -v /home/scootbot/templates/nginx.tmpl:/etc/docker-gen/templates/nginx.tmpl:ro \
    -v /var/run/docker.sock:/tmp/docker.sock:ro \
    jwilder/docker-gen \
    -notify-sighup nginx -watch -wait 5s:30s /etc/docker-gen/templates/nginx.tmpl /etc/nginx/conf.d/default.conf

docker run -d \
    --name nginx-letsencrypt \
    --log-opt max-size=10m \
    --volumes-from nginx \
    -v /home/scootbot/certs:/etc/nginx/certs:rw \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -e NGINX_DOCKER_GEN_CONTAINER=nginx-gen \
    jrcs/letsencrypt-nginx-proxy-companion

docker run -d \
    --name cloud \
    --log-opt max-size=10m \
    -e VIRTUAL_HOST=cloud.gilgi.org \
    -e LETSENCRYPT_HOST=cloud.gilgi.org \
    -e LETSENCRYPT_EMAIL=admin@gilgi.org \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /home/scootbot/portainer:/data \
    portainer/portainer

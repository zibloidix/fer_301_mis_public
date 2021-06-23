#!/bin/bash
docker container run -d \
                     --name fer_301_server \
                     -p 3000:3000 \
                     zibloidix/fer_301_server:alpine
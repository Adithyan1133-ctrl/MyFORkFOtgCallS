#  DockerFile
#  -*- coding: utf-8 -*-

#  creates a layer from the base Docker image.
FROM nikolaik/python-nodejs:python3.9-nodejs12-slim

WORKDIR /app

# https://shouldiblamecaching.com/
ENV PIP_NO_CACHE_DIR 1

# fix "ephimeral" / "AWS" file-systems
RUN sed -i.bak 's/us-west-2\.ec2\.//' /etc/apt/sources.list

# to resynchronize the package index files from their sources.
RUN apt -qq update

# http://bugs.python.org/issue19846
# https://github.com/SpEcHiDe/PublicLeech/pull/97
ENV LANG C.UTF-8

# we don't have an interactive xTerm
ENV DEBIAN_FRONTEND noninteractive

# sets the TimeZone, to be used inside the container
ENV TZ Asia/Kolkata

# we don't have an interactive xTerm
ENV DEBIAN_FRONTEND noninteractive

# install required packages
RUN apt -qq install -y --no-install-recommends \
    # this package is required to fetch "contents" via "TLS"
    apt-transport-https \
    build-essential \
    # install coreutils
    coreutils \
    jq pv \
    # install gcc [ PEP 517 ]
    gcc \
    git \
    # install encoding tools
    ffmpeg \
    mediainfo && \
    # clean up previously installed SPC
    apt purge -y software-properties-common && \
    # clean up the container "layer", after we are done
    rm -rf /var/lib/apt/lists /var/cache/apt/archives /tmp

# each instruction creates one layer
# Only the instructions RUN, COPY, ADD create layers.
# copies 'requirements', to inside the container
# ..., there are multiple '' dependancies,
# requiring the use of the entire repo, hence
# adds files from your Docker client’s current directory.
COPY . .

# install requirements, inside the container
RUN pip3 install --no-cache-dir -r requirements.txt

RUN npm install && \
    npm run build

# specifies what command to run within the container.
CMD ["bash", "start.sh"]

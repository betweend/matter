FROM node:24-trixie-slim

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG MATTERJS_SERVER_COMMIT=83b79084c2c65ded92d9f5d61ab8d5417bf49699
ARG MATTERJS_SERVER_REPOSITORY=https://github.com/matter-js/matterjs-server.git

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        iputils-ping \
        curl \
        python3 \
        make \
        gcc \
        g++ \
        bluez \
        systemd \
        libbluetooth-dev \
        libudev-dev \
        libcap2-bin \
    && setcap cap_net_raw+ep "$(command -v ping)" \
    && rm -rf /var/lib/apt/lists/*

RUN git clone "${MATTERJS_SERVER_REPOSITORY}" . \
    && git checkout --detach "${MATTERJS_SERVER_COMMIT}" \
    && test "$(git rev-parse HEAD)" = "${MATTERJS_SERVER_COMMIT}"

COPY patches/allow-attestation-failure.patch /tmp/allow-attestation-failure.patch
RUN git apply /tmp/allow-attestation-failure.patch \
    && rm /tmp/allow-attestation-failure.patch \
    && npm install --foreground-scripts \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove \
        git \
        python3 \
        make \
        gcc \
        g++ \
        libbluetooth-dev \
        libudev-dev \
        libcap2-bin \
    && rm -rf /var/lib/apt/lists/* /usr/src/* /root/.npm /root/.cache \
    && mkdir -p /data \
    && chown 1000:1000 /data

COPY run.mjs /usr/local/bin/run.mjs
RUN chmod 0755 /usr/local/bin/run.mjs

ENV LOG_LEVEL=info
ENV STORAGE_PATH=/data

EXPOSE 5580
VOLUME ["/data"]

USER 1000:1000
ENTRYPOINT ["node", "/usr/local/bin/run.mjs"]

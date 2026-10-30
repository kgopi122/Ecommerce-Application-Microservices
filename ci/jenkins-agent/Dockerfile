
FROM jenkins/inbound-agent:jdk21

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    maven \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN ARCH="$(dpkg --print-architecture)" && \
    case "$ARCH" in \
      amd64) DOCKER_ARCH="x86_64" ;; \
      arm64) DOCKER_ARCH="aarch64" ;; \
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;; \
    esac && \
    curl -fsSL "https://download.docker.com/linux/static/stable/${DOCKER_ARCH}/docker-28.3.2.tgz" \
    -o /tmp/docker.tgz && \
    tar -xzf /tmp/docker.tgz -C /tmp && \
    install -m 0755 /tmp/docker/docker /usr/local/bin/docker && \
    rm -rf /tmp/docker /tmp/docker.tgz

RUN docker --version

USER jenkins

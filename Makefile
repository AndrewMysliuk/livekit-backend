IMAGE_NAME ?= livekit-backend

install:
	yarn install

run:
	yarn dev

build:
	yarn build

start:
	yarn start

docker-build:
	docker build . -t ${IMAGE_NAME}

docker-run:
	docker run -p 3001:3001 -d ${IMAGE_NAME}

.PHONY: install run build start docker-build docker-run
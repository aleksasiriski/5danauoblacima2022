# 5danauoblacima2022
Hakaton 5 dana u oblacima 2022/2023 Levi9

## How to build
1) Make sure you have `nodejs` and `npm` installed.
Example on Fedora: `sudo dnf install nodejs npm`
2) Make sure you have mongodb setup and add the url to `.env`, for example:
```
DATABASE_URL=mongodb://localhost:27017/ordersdatabase
```
3) Clone this repo and cd into it.
4) Run `npm install` to install all the dependencies.
5) Run `npm run devStart` to start the server on port `3000`. If you want to change the port you can set env variable `PORT` inside `.env`

## Run with docker
1) Make sure you have `docker` and `docker-compose-plugin` or `podman` and `podman-compose` installed.
2) Copy this [docker compose example](https://raw.githubusercontent.com/aleksasiriski/5danauoblacima2022/main/docker-compose.example.yml) and name it `docker-compose.yml`
3) Start the compose stack with `docker compose up -d` or `podman-compose up -d`

## Testing
You can use the [provided tests](https://raw.githubusercontent.com/aleksasiriski/5danauoblacima2022/main/Insomnia_2022-11-16.json) and import them inside [Insomnia](https://insomnia.rest/).
The results can be found [here](https://github.com/aleksasiriski/5danauoblacima2022/tree/main/results).

## Technologies
1) Node - [Allows developers to write JavaScript code that runs directly in a computer process itself instead of in a browser](https://www.codecademy.com/article/what-is-node)
2) NPM - Node Package Manager, used to install required packages
3) Express - Web server for Node
4) MongoDB - NoSQL database
5) Mongoose - Integration with MongoDB for Node
6) Docker/Podman - [Containerized packaging](https://docs.docker.com/get-started/overview/)
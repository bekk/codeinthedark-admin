const express = require('express'),
    path = require('path'),
    fs = require('fs'),
    matcher = require('./matcher'),
    router = express.Router();

class Cache {
    constructor() {
        this.cache = {};
        this.winners = {};
    }

    updateCache(dirtyCache) {
        this.cache = dirtyCache;
    }

    updateWinners(dirtyWinners) {
        this.winners = dirtyWinners;
    }

    getCache() {
        return this.cache;
    }

    getParticipant(uuid) {
        return this.cache[uuid];
    }

    getWinners() {
        return this.winners;
    }

    deleteElement(uuid) {
        delete this.cache[uuid];
    }

    deleteWinner(uuid) {
        delete this.winners[uuid];
    }
}

const cache = new Cache();

const setupRouter = (middleware, io) => {
    router.post('/participant-data', (req, res) => {
        const body = req.body;

        cache.updateCache({
            ...cache.getCache(),
            [body.uuid]: body,
        });

        res.status(200).send();
        io.emit('participant-data', body);
    });

    router.get('/participant-data', (req, res) => {
        res.status(200).send(cache);
    });

    router.delete('/participant-data', (req, res) => {
        cache.updateCache({});

        res.status(200).send();
        io.emit('reset', cache.getCache());
    });

    router.delete('/participant-data/:uuid', (req, res) => {
        cache.deleteElement(req.params.uuid);

        res.status(200).send();
        io.emit('participants-data', cache.getCache());
    });

    router.get('/participant/:uuid', (req, res) => {
        const uuid = req.params.uuid;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(cache.getParticipant(uuid).content);
        res.end();
    });

    router.get('/matcher', (req, res) => {
        Object.values(cache.getCache()).map(participant => {
            console.log(
                'Likhet: ',
                matcher.getMatchRate(
                    `http://localhost:9000/participant/${participant.uuid}`,
                    participant.uuid,
                    'http://localhost:9000/fagdag-okt-19/puljer'
                ),
                '%'
            );
        });

        res.status(200).send();
    });

    router.post('/new-winner', (req, res) => {
        const body = req.body;

        cache.updateWinners({
            ...cache.getWinners(),
            [body.uuid]: body,
        });

        res.status(200).send();
        io.emit('participants-winners', cache.getWinners());
    });

    router.delete('/winners/:uuid', (req, res) => {
        cache.deleteWinner(req.params.uuid);

        res.status(200).send();
        io.emit('participants-winners', cache.getWinners());
    });

    router.get('/:arrangement/:pulje', (req, res) => {
        res.status(200).send(
            fs.readFileSync(
                path.join(__dirname, `./assets/${req.params.arrangement}/${req.params.pulje}.html`),
                'UTF-8'
            )
        );
    });

    router.get('/ressurshjelp/:arrangement/:pulje', (req, res) => {
        res.status(200).send(
            fs.readFileSync(
                path.join(__dirname, `./assets/${req.params.arrangement}/${req.params.pulje}.json`),
                'UTF-8'
            )
        );
    });

    if (process.env.NODE_ENV === 'development') {
        router.get('*', (req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(
                middleware.fileSystem.readFileSync(
                    path.join(__dirname, `../development/index.html`)
                )
            );
            res.end();
        });
    } else {
        router.get('*', (req, res) => {
            res.sendFile('index.html', {
                root: path.join(__dirname, '../production'),
            });
        });
    }

    return router;
};

exports.setupRouter = setupRouter;
exports.cache = cache;

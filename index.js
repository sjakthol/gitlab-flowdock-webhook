'use strict';

const bodyParser = require('body-parser');
const bunyan = require('bunyan');
const express = require('express');

const mergeHook = require('./lib/merge-request-hook');

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;



const app = express();
const logger = bunyan.createLogger({ level: bunyan.INFO, name: 'root' });

app.use(bodyParser.json());
app.use(function(req, res, next) {
    const gitlab = {
        token: req.get('X-Gitlab-Token'),
        event: req.get('X-Gitlab-Event'),
    };

    logger.info({ gitlab: gitlab }, 'Got request');

    if (gitlab.token != GITLAB_TOKEN) {
        logger.warn({ headers: req.headers }, 'GitLab secret token mismatch');
        return res.send({});
    }

    if (!gitlab.event) {
        logger.warn({ headers: req.headers }, 'GitLab event missing');
        return res.send({});
    }

    req.gitlab = gitlab;

    next();
});

app.post('/event', function(req, res, next) {
    logger.info({ event: req.body, gl: req.gitlab }, 'Got event');
    if (req.gitlab.event === 'Merge Request Hook') {
        return mergeHook(req, res, next);
    }

    logger.warn({ type: req.gitlab.event }, 'Ignored unexpected request');
    // Ignore others
    return res.send({});
});

app.use(function(err, req, res, next) {
    logger.error({ err, stack: err.stack }, 'Error occurred');

    // Silence the error :)
    res.send({});
    next();
});

const port = process.env.PORT || 8080;
app.listen(port, function () {
    logger.info('Listening on port ' + port);
});
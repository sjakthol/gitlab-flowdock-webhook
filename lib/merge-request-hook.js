const request = require('request');
const util = require('util');
const bunyan = require('bunyan');

const FLOWDOCK_URL = 'https://api.flowdock.com/messages';
const FLOW_TOKEN = process.env.FLOW_TOKEN;

const ACTION_TO_MESSAGE = {
    approved: 'approved merge request',
    close: 'closed merge request',
    merge: 'merged merge request',
    open: 'opened merge request',
    reopen: 'reopened merge request',
    update: 'updated merge request',
}

const STATE_TO_COLOR = {
    opened: 'green',
    reopened: 'yellow',
    merged: 'purple',
    closed: 'red',
};

const logger = bunyan.createLogger({ level: bunyan.INFO, name: 'hook::merge_request' });


module.exports = (req, res) => {
    const details = req.body.object_attributes;
    const project = req.body.project;
    const user = req.body.user;

    const action = details.action;
    const description = details.description;
    const iid = details.iid;
    const state = details.state;
    const target = details.target;
    const target_branch = details.target_branch;
    const title = details.title;
    const url = details.url;

    if (action === 'update' && state === 'closed') {
        logger.info('Ignoring update to closed MR');
        return res.send({});
    }

    // Example: gitlab:sjakthol/tst:mr:1
    const threadId = 'gitlab:' + project.path_with_namespace + ':mr:' + iid;

    // Example: Merge #1: Title of the merge request (to master at sjakthol/tst)
    const threadTitle = util.format('Merge #%s: %s (to %s at %s)',
        iid, title, target_branch, target.path_with_namespace
    );

    // Shown as a list in the sidebar
    const activityMessage = ACTION_TO_MESSAGE[action] || 'caused something to happen';

    // The flowdock request body
    const flowdockMessage = {
        flow_token: FLOW_TOKEN,
        event: 'activity',
        author: {
            name: user.name || user.username || 'Unknown',
            avatar: user.avatar_url
        },
        title: activityMessage,
        external_thread_id: threadId,
        thread: {
            title: threadTitle,
            body: description,
            external_url: url,
            status: {
                color: STATE_TO_COLOR[state] || 'grey',
                value: state
            }
        }
    };

    const options = {
        body: flowdockMessage,
        json: true,
        url: FLOWDOCK_URL,
    };

    logger.info({ options }, 'Sending message to Flowdock');
    request.post(options, function(err, res, body) {
        logger.info({ err, status: res.status, body: body }, 'Got response');
    });

    // Don't wait for the Flowdock request to finish
    res.end();
}
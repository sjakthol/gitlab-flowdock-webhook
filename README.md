A GitLab webhook handler that posts messages to the team inbox in Flowdock.

## Features
Currently the following GitLab events are supported:
* Merge request create, update, close, reopen, merge

## Setup
To deploy the webhook handler, you need two things:
1. `FLOW_TOKEN`- a flow token from Flowdock that allows posting messages to the inbox.
2. `GITLAB_TOKEN` - a random token for authenticating GitLab events (generate one securely)

Once you have those, just run:
```
FLOW_TOKEN=<your flow token> GITLAB_TOKEN=<your gitlab token> node index.js
```

After that is done, go to your project's webhook settings in GitLab and set
1. the URL to `https://$HOSTNAME/event` (replace `$HOSTNAME` with the server name)
2. set the token to `GITLAB_TOKEN`

That's it. You are now ready to receive events to your Flowdock inbox!

### Creating FLOW_TOKEN
To create a flow token, you need to do the following in Flowdock:
1. Create a new developer application from your account settings with the
   shortcut application checkbox checked.
2. Create a new source for the flow you want the messages to be posted
   to. Store the Flow Token securely as it will be needed later on.

### Creating the GITLAB_TOKEN
Use your preferred method for generating secure tokens but for example
```
dd if=/dev/urandom bs=1024 count=100 | sha256sum
```
should do the trick.

## Testing
The repository contains some sample events that can be used to test the
integration. `FLOW_TOKEN` must be defined but if you don't want to send
anything to Flowdock, just use invalid token. The tests require `curl`
and `jq` to function.

The tests can be executed with
```
FLOW_TOKEN=<your token> ./run_integration_test.sh
```

## Licences

This codebase is released under the terms of the MIT license. Please refer to the `LICENSE` file at the root directory for details.

The GitLab logo is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/). Original version of the logo is available at the [GitLab website](https://about.gitlab.com/press/).

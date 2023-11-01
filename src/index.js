const core = require('@actions/core');
const github = require('@actions/github');
const { runAction } = require('./action');

try{

    // these variables are set using the inputs defined in action.yml
    const githubToken = core.getInput('repo-token', {required: true})
    const organization = core.getInput('github-organization', {required: true})

// the object which will interact with GitHub APIs
const octokit = github.getOctokit(githubToken);

// this will contain information related to the issue that was just opened
const contextPayload = github.context.payload;

const val = await runAction(octokit, contextPayload)
core.setOutput(`Issue nodeId = ${val}`)
}catch (error) {
    core.setFailed(error.message);
}
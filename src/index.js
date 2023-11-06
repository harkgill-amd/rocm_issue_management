import { getInput, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { runAction } from './action';

// Grabs the inputs that get passed in when the workflow starts
// These inputs are defined in the action.yml file
const octokit = getOctokit('authentication-token', {required: true})
const orgName = getInput('github-organization', {required: true})
const repo = getInput('github-repo', {required: true})

try {

    runAction(octokit, orgName, repo, context)

}catch (error) {
    setFailed(error.message)
}
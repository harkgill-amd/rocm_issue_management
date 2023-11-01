const core = require('@actions/core');
const github = require('@actions/github');
// const { runAction } = require('./action');

try{

const githubToken = core.getInput('repo-token', {required: true})
const octokit = github.getOctokit(githubToken);

const query =  `query {
                    viewer {
                        login
                    }
                }`
                
const user = await octokit.graphql(query)
const contextPayload = github.context.payload;

console.log(JSON.stringify(user))
console.log(JSON.stringify(contextPayload))

}catch (error) {
    core.setFailed(error.message);
}
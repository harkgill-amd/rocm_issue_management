const core = require('@actions/core');
const github = require('@actions/github');


try{

const githubToken = core.getInput('repo-token', {required: true})
const octokit = github.getOctokit(githubToken);
console.log(`octokit: ${octokit}`, typeof(octokit))

const query =  `query {
                    viewer {
                        login
                    }
                }`

const user = octokit.graphql(query)
const contextPayload = github.context.payload;

console.log(JSON.stringify(user))
console.log(JSON.stringify(contextPayload))

}catch (error) {
    core.setFailed(error.message);
}
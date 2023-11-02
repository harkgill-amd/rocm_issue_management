const core = require('@actions/core');
const github = require('@actions/github');

const thingy  = async () => { 

    try{

        const githubToken = core.getInput('repo-token', {required: true})
        const octokit = github.getOctokit(githubToken);
        
        const query =  `
        query GetEachRowInProjectTable {
            organization(login: "temporarysupersecretorganization"){
             projectV2(number: 1) {
                 id
               }
           }
         }
        `
        
        const user = await octokit.graphql(query)
        const contextPayload = github.context.payload;
        
        console.log(JSON.stringify(user))
        console.log(JSON.stringify(contextPayload))
        
        }catch (error) {
            core.setFailed(error.message);
        }

}
thingy()
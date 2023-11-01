const core = require('@actions/core');
const github = require('@actions/github');

const thingy  = async () => { 

    try{

        const githubToken = core.getInput('repo-token', {required: true})
        const octokit = github.getOctokit(githubToken);
        
        const query =  `
        query GetEachRowInProjectTabel {
            node(id: "PVT_kwHOCESN7M4AW9ai") {
              ... on ProjectV2 {
                items(first: 10) {
                  nodes {
                    id
                              __typename
                    fieldValues(first: 10){
                      __typename
                      # edges{
                      #   node{
                      #     __typename
                      #   }
                      # }
                      rows: nodes{
                        # __typename
                        ... on ProjectV2ItemFieldSingleSelectValue{
                          name
                          field {
                            ... on ProjectV2FieldCommon {
                              name
                              id
                            }
                          }
                        }
                      }
                    }
                  }
                }
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
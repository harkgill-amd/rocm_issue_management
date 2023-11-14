const core = require('@actions/core');
const github = require('@actions/github');

const osDelim = "### Operating System"
const cpuDelim = "### CPU"
const gpuDelim = "### GPU"
const rocmVersionDelim = "### ROCm Version"
const rocmComponentDelim = "### ROCm Component"

const orgName = core.getInput('github-organization', {required: true})
const repo = core.getInput('github-repo', {required: true})

const extractInfo = async (octokit, body, issueNum) => {
    let osIndex = body.indexOf(osDelim) + osDelim.length + 2
    let cpuIndex = body.indexOf(cpuDelim) - 2
    
    const os = body.slice(osIndex, cpuIndex)
    
    cpuIndex = body.indexOf(cpuDelim) + cpuDelim.length + 2
    let gpuIndex = body.indexOf(gpuDelim) - 2

    const cpu = body.slice(cpuIndex, gpuIndex)

    gpuIndex = body.indexOf(gpuDelim) + gpuDelim.length + 2
    let rocmVersionIndex = body.indexOf("### Other") - 2


    let gpu = body.slice(gpuIndex, rocmVersionIndex)

    rocmVersionIndex = body.indexOf(rocmVersionDelim) + rocmVersionDelim.length + 2
    let rocmComponentIndex = body.indexOf(rocmComponentDelim) - 2

    let rocmVersion = body.slice(rocmVersionIndex, rocmComponentIndex)
    gpu = gpu.split(",").map(version => {
        return version.trim()
    })
    rocmVersion = rocmVersion.split(",").map(version => {
        return version.trim()
    })
    let labels = gpu.concat(rocmVersion)
    await octokit.rest.issues.addLabels({owner: orgName, repo: repo, issue_number:issueNum, labels:labels})
    return [gpu, rocmVersion]

}


const queryToGetLatestOnDash =  `{
    organization(login: "temporarysupersecretorganization") {
      projectV2(number: 1) {
        project_id: id
        gpu_column_id:field(name:"GPUs"){
          ... on ProjectV2Field{
            id
          }
        }
        rocm_version_column_id:field(name:"ROCmVersions"){
          ... on ProjectV2Field{
            id
          }
        }
        items(last: 1){
          last_item:nodes {
            __typename
            latest_row_id: id
            fieldValueByName(name: "GPUs"){
              ... on ProjectV2ItemFieldTextValue{
                id
                text
              }
            }
          }
        }
      }
    }
  }`


  function constructColumnMutationQuery(columnToChange, rowToChange, projectId, text){
    const mutationQuery = `mutation{
      updateProjectV2ItemFieldValue(input: {
        fieldId: "${columnToChange}",
        itemId: "${rowToChange}",
        projectId: "${projectId}",
        value: {text: "${text}"}
        
      }){
        clientMutationId
      }
    }`
    
    return mutationQuery
  }
  




const run  = async () => { 

    try{

        const githubToken = core.getInput('authentication-token', {required: true})
        const octokit = github.getOctokit(githubToken);
        const contextPayload = github.context.payload;
        const body = contextPayload.issue.body
        const num = contextPayload.issue.number
        console.log("JSON contextPayload.issue:  ",JSON.stringify(contextPayload.issue))
        let [gpu, rocmVersions] = await extractInfo(octokit, body, num)
        gpu = String(gpu)
        rocmVersions = String(rocmVersions)
        
        let graphQL = await octokit.graphql(queryToGetLatestOnDash)
        const project_id = graphQL.organization.projectV2.project_id
        const gpu_column_id = graphQL.organization.projectV2.gpu_column_id.id
        const rocm_version_column_id = graphQL.organization.projectV2.rocm_version_column_id.id
        const latest_row_id = graphQL.organization.projectV2.items.last_item[0].latest_row_id

        let response 
        response = await octokit.graphql(constructColumnMutationQuery(gpu_column_id, latest_row_id, project_id, gpu))
        console.log("Updating GPU columns: ",JSON.stringify(response, null, 4))

        response = await octokit.graphql(constructColumnMutationQuery(rocm_version_column_id, latest_row_id, project_id, rocmVersions))
        console.log("Updating GPU columns: ",JSON.stringify(response, null, 4))

        }catch (error) {
            core.setFailed(error.message);
        }

}
run()
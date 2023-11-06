const core = require('@actions/core');
const github = require('@actions/github');

const osDelim = "### Operating System"
        const cpuDelim = "### CPU"
        const gpuDelim = "### GPU"
        const rocmVersionDelim = "### ROCm Version"
        const rocmComponentDelim = "### ROCm Component"

        const orgName = "temporarysupersecretorganization"
        const repo = "tempfortesting"

const extractInfo = async (octokit, body) => {
    let osIndex = body.indexOf(osDelim) + osDelim.length + 2
    let cpuIndex = body.indexOf(cpuDelim) - 2
    
    const os = body.slice(osIndex, cpuIndex)
    
    cpuIndex = body.indexOf(cpuDelim) + cpuDelim.length + 2
    let gpuIndex = body.indexOf(gpuDelim) - 2

    const cpu = body.slice(cpuIndex, gpuIndex)

    gpuIndex = body.indexOf(gpuDelim) + gpuDelim.length + 2
    let rocmVersionIndex = body.indexOf(rocmVersionDelim) - 2

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
    console.table([os, cpu, gpu, rocmVersion])

    }


const thingy  = async () => { 

    try{

        const githubToken = core.getInput('repo-token', {required: true})
        const octokit = github.getOctokit(githubToken);
        const contextPayload = github.context.payload;

        const body = contextPayload.issue.issue.body
        extractInfo(octokit, body)

            // const query =  `
            // query GetEachRowInProjectTable {
            //     organization(login: "temporarysupersecretorganization"){
            //      projectV2(number: 1) {
            //          id
            //        }
            //    }
            //  }
            // `
            
            // const user = await octokit.graphql(query)
            // const contextPayload = github.context.payload;
            
            // console.log(JSON.stringify(user))
            // console.log(JSON.stringify(contextPayload.issue))
        
        }catch (error) {
            core.setFailed(error.message);
        }

}
thingy()
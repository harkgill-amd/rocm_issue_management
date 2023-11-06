const osDelim = "### Operating System"
const cpuDelim = "### CPU"
const gpuDelim = "### GPU"
const rocmVersionDelim = "### ROCm Version"
const rocmComponentDelim = "### ROCm Component"

const extractInfoFromIssue = async (octokit, body, orgName, repo, issueNum) => {
    
    // Indices that are used to find the delimiters in the issue body
    let osIndex 
    let cpuIndex 
    let gpuIndex
    let rocmVersionIndex
    let rocmComponentIndex
    
    // Arrays that will contain one or more of each
    let gpu
    let rocmVersion
    

    osIndex = body.indexOf(osDelim) + osDelim.length + 2
    cpuIndex = body.indexOf(cpuDelim) - 2
    
    const os = body.slice(osIndex, cpuIndex)
    
    cpuIndex = body.indexOf(cpuDelim) + cpuDelim.length + 2
    gpuIndex = body.indexOf(gpuDelim) - 2
    
    const cpu = body.slice(cpuIndex, gpuIndex)

    gpuIndex = body.indexOf(gpuDelim) + gpuDelim.length + 2
    rocmVersionIndex = body.indexOf(rocmVersionDelim) - 2

    gpu = body.slice(gpuIndex, rocmVersionIndex)

    rocmVersionIndex = body.indexOf(rocmVersionDelim) + rocmVersionDelim.length + 2
    rocmComponentIndex = body.indexOf(rocmComponentDelim) - 2

    rocmVersion = body.slice(rocmVersionIndex, rocmComponentIndex)
    
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
    


const runAction = (octokit, orgName, repo, context) => {

    const issueBody = context.payload.issue.body
    const issueNum = context.payload.issue.number

    extractInfoFromIssue(octokit, issueBody, orgName, repo, issueNum)
}

export{ runAction }
import { getInput, setFailed } from "@actions/core"
import { getOctokit } from "@actions/github"
import { queryToGetLatestOnDash, 
         constructColumnMutationQuery, 
         createSWDEVTicketBody, 
         extractInfoFromIssueBody,
         transformRocmVersions,
         transformGpuVersions,
         gpuToJiraProgram,
         createJiraDescription } from "./utils.js"

import axios from "axios"
// change to production later on
const SWDEVURL = "https://dalwebapiuat.amd.com/DALWebApiLinuxJDC/CreateSwdevTicket"
let jiraLink = "https://ontrack-internal-jdcuat.amd.com/browse/"

async function run(){
    
    try {

   
    // Getting the fields set in the workflow file in the repository
    const orgName = getInput('github-organization', {required: true});
    const repo = getInput('github-repo', {required: true});
    const githubToken = core.getInput('authentication-token', {required: true})


    const octokit = getOctokit(githubToken);
    const issue = github.context.payload.issue;

    const body = issue.body
    const issueNum = issue.number
    const title = issue.title
    
    console.log(body)
    let parsedIssueBody = extractInfoFromIssueBody(body)
    console.log(parsedIssueBody)

    let selectedGpus = parsedIssueBody.gpu.split(", ").map(v => {
        return v.trim()
    })

    let rocmVersions = parsedIssueBody.rocmVersions.split(", ").map(v => {
        return v.trim()
    })

    let labels = [... selectedGpus, ...rocmVersions]

    // Adding labels to the issue using the GPU and ROCm versions
    try{
        await octokit.rest.issues.addLabels({owner: orgName, repo: repo, issue_number:issueNum, labels:labels})
    }
    catch(e){
        console.log("Could not add labels to the newly created issue", e)
    }

    let latestEntry;
    try {
        latestEntry = await octokit.graphql(queryToGetLatestOnDash)
    }
    catch(e){
        console.log("Could not get latest row from GitHub dashboard", e)
    }

    const project_id = latestEntry.organization.projectV2.project_id
    const gpu_column_id = latestEntry.organization.projectV2.gpu_column_id.id
    const rocm_version_column_id = latestEntry.organization.projectV2.rocm_version_column_id.id
    const jira_link_column_id = latestEntry.organization.projectV2.jira_link_column_id.id
    const component_column_id = latestEntry.organization.projectV2.component_column_id.id
    const os_column_id = latestEntry.organization.projectV2.os_column_id.id
    const latest_row_id = latestEntry.organization.projectV2.items.last_item[0].latest_row_id

    let rocmTransform = transformRocmVersions(rocmVersions)
    let gpuTransform = transformGpuVersions(selectedGpus)
    

    let graphqlResponse;

    try{
        graphqlResponse = await octokit.graphql((constructColumnMutationQuery(gpu_column_id, latest_row_id, project_id, gpuTransform)))
        console.log("Successfully added GPU versions to dashboard")
    }
    catch(e){
        console.log("Could not add GPU versions to dashboard", e)
    }

    try{
        graphqlResponse = await octokit.graphql((constructColumnMutationQuery(rocm_version_column_id, latest_row_id, project_id, rocmTransform)))
        console.log("Successfully added ROCm versions to dashboard")
    }
    catch(e){
        console.log("Could not add ROCm versions to dashboard", e)
    }

    try{
        graphqlResponse = await octokit.graphql((constructColumnMutationQuery(component_column_id, latest_row_id, project_id, repo)))
        console.log("Successfully added component to dashboard")
    }
    catch(e){
        console.log("Could not add component to dashboard", e)
    }

    try{
        graphqlResponse = await octokit.graphql((constructColumnMutationQuery(os_column_id, latest_row_id, project_id, parsedIssueBody.os)))
        console.log("Successfully added OS to dashboard")
    }
    catch(e){
        console.log("Could not add OS to dashboard", e)
    }
    selectedGpus = selectedGpus.sort()
    const program = gpuToJiraProgram(selectedGpus[selectedGpus.length - 1])
    const jiraBody = createJiraDescription(parsedIssueBody)
    
    selectedGpus = selectedGpus.map(v => {
        v.replace(" ", "_")
    })
    rocmVersions = rocmVersions.map(v => {
        v.replace(" ", "_")
    })

    const swdevTicket = createSWDEVTicketBody(program, title, jiraBody, String(selectedGpus), String(rocmVersions))
    
    const username = String.raw`amd\z1_jira_account`
    const password = "dy75!cbmkt65ft"

    const instance = axios.create({
        httpsAgent: new https.Agent({  
          rejectUnauthorized: false
        })
      })
    const jiraResponse = await instance.post(SWDEVURL, swdevTicket, {
    auth:{
        username:username,
        password:password
    }
    })
    .then(async res => {
        const link = res.data["key"]
        response = await octokit.graphql(constructColumnMutationQuery(jira_link_column_id, latest_row_id, project_id, jiraLink+link ))
        console.log("Updating Jira Link column: ",JSON.stringify(response, null, 4))
    })
    .catch(error => console.log("ERROR: ", error))

    }catch (error) {
        setFailed(error.message);
    }


}   
run()
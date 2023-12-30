// const core = require('@actions/core');
// const https = require('https');
// const fs = require('fs');
// const path = require("path");
// const github = require('@actions/github');
// const { error } = require('console');
// const axios = require('axios').default;
// const osDelim = "### Operating System"
// const cpuDelim = "### CPU"
// const gpuDelim = "### GPU"
// const rocmVersionDelim = "### ROCm Version"
// const rocmComponentDelim = "### ROCm Component"
// const SWDEVURL = "https://dalwebapiuat.amd.com/DALWebApiLinuxJDC/CreateSwdevTicket"
// let jiraLink = "https://ontrack-internal-jdcuat.amd.com/browse/"
// const orgName = core.getInput('github-organization', {required: true})
// const repo = core.getInput('github-repo', {required: true})
// console.log(orgName, repo)
// async function extractInfo(octokit, body, issueNum){
//     let osIndex = body.indexOf(osDelim) + osDelim.length + 2
//     let cpuIndex = body.indexOf(cpuDelim) - 2
    
//     const os = body.slice(osIndex, cpuIndex)
    
//     cpuIndex = body.indexOf(cpuDelim) + cpuDelim.length + 2
//     let gpuIndex = body.indexOf(gpuDelim) - 2

//     const cpu = body.slice(cpuIndex, gpuIndex)

//     gpuIndex = body.indexOf(gpuDelim) + gpuDelim.length + 2
//     let rocmVersionIndex = body.indexOf("### Other") - 2


//     let gpu = body.slice(gpuIndex, rocmVersionIndex)

//     rocmVersionIndex = body.indexOf(rocmVersionDelim) + rocmVersionDelim.length + 2
//     let rocmComponentIndex = body.indexOf(rocmComponentDelim) - 2

//     let rocmVersion = body.slice(rocmVersionIndex, rocmComponentIndex)
//     gpu = gpu.split(",").map(version => {
//         return version.trim()
//     })
//     rocmVersion = rocmVersion.split(",").map(version => {
//         return version.trim()
//     })
//     let labels = gpu.concat(rocmVersion)
//     try{
//       await octokit.rest.issues.addLabels({owner: orgName, repo: repo, issue_number:issueNum, labels:labels})
//     }
//     catch(e){
//       console.log("Error here:", e)
//     }
//     return [gpu, rocmVersion]

// }


// const queryToGetLatestOnDash =  `{
//     organization(login: "RadeonOpenCompute") {
//       projectV2(number: 11) {
//         project_id: id
//         gpu_column_id:field(name:"GPUs"){
//           ... on ProjectV2Field{
//             id
//           }
//         }
//         rocm_version_column_id:field(name:"ROCmVersions"){
//           ... on ProjectV2Field{
//             id
//           }
//         }
//         jira_link_column_id:field(name:"JIRA Link"){
//           ... on ProjectV2Field{
//             id
//           }
//         }
//         items(last: 1){
//           last_item:nodes {
//             __typename
//             latest_row_id: id
//             fieldValueByName(name: "GPUs"){
//               ... on ProjectV2ItemFieldTextValue{
//                 id
//                 text
//               }
//             }
//           }
//         }
//       }
//     }
//   }`


//   function constructColumnMutationQuery(columnToChange, rowToChange, projectId, text){
//     const mutationQuery = `mutation{
//       updateProjectV2ItemFieldValue(input: {
//         fieldId: "${columnToChange}",
//         itemId: "${rowToChange}",
//         projectId: "${projectId}",
//         value: {text: "${text}"}
        
//       }){
//         clientMutationId
//       }
//     }`
    
//     return mutationQuery
//   }
  
//   function createSWDEVTicketBody(summary, description, gpu, rocm){
//     // TODO: Fix GPU and ROCm to not be space separated strings
//     return {"FieldValues": {
//       "summary": `${summary}`,
//       "description": `${description}`,
//       "issuetype": "Defect",
//       "Program": "ROCm on Radeon",
//       "TriageCategory": "Radeon Open Compute",
//       "TriageAssignment": "Triage - ML SDK",
//       "labels": `github_community,${gpu},${rocm}`,
//       "Severity": "Low",
//       "comments": "testing",
//       "assignee": "abhimeda",
//       "watchers": "abhimeda"
//   }}
// }
  
// function hasInstinct(gpuList){
//   for(const element of gpuList){
//     if (element.includes("Instinct")){
//       return true;
//     }
//   }

//   return false
// }

// async function run() { 
//     console.log("running")

//     try{

//         const githubToken = core.getInput('authentication-token', {required: true})
//         const octokit = github.getOctokit(githubToken);
//         const contextPayload = github.context.payload;
//         console.log(JSON.stringify(contextPayload, null, 4))
        
//         const body = contextPayload.issue.body
//         console.log(body)
//         const num = contextPayload.issue.number
//         const title = "TESTING-AMD-GITHUB-RUNNER"
//         // console.log("JSON contextPayload.issue:  ",JSON.stringify(contextPayload.issue))
//         let [gpu, rocmVersions] = await extractInfo(octokit, body, num);
//         let gpuLabel = hasInstinct(gpu) === true ? "Instinct" : "Radeon";
//         let rocmLabel = rocmVersions.sort()
//         rocmLabel = rocmLabel[rocmLabel.length - 1].replace(" ", "_")

        
//         console.log(gpu, rocmVersions)
//         gpu = String(gpu)
//         rocmVersions = String(rocmVersions)
        
//         let graphQL = await octokit.graphql(queryToGetLatestOnDash)
//         const project_id = graphQL.organization.projectV2.project_id
//         const gpu_column_id = graphQL.organization.projectV2.gpu_column_id.id
//         const rocm_version_column_id = graphQL.organization.projectV2.rocm_version_column_id.id
//         const jira_link_column_id = graphQL.organization.projectV2.jira_link_column_id.id
//         const latest_row_id = graphQL.organization.projectV2.items.last_item[0].latest_row_id

//         let response 
//         response = await octokit.graphql(constructColumnMutationQuery(gpu_column_id, latest_row_id, project_id, gpu))
//         console.log("Updating GPU columns: ",JSON.stringify(response, null, 4))

//         response = await octokit.graphql(constructColumnMutationQuery(rocm_version_column_id, latest_row_id, project_id, rocmVersions))
//         console.log("Updating rocmVersions column: ",JSON.stringify(response, null, 4))

//         // const username = "z1_jira_account"
//         // const password = "dy75!cbmkt65ft"
//         const username = String.raw`amd\z1_jira_account`
//         const password = "dy75!cbmkt65ft"

//         const swdevBody = createSWDEVTicketBody(title, body, gpuLabel, rocmLabel)
        
//         const instance = axios.create({
//           httpsAgent: new https.Agent({  
//             rejectUnauthorized: false
//           })
//         });

//         const jiraResponse = await instance.post(SWDEVURL, swdevBody, {
//           auth:{
//             username:username,
//             password:password
//           }
//         })
//         .then(async res => {
//           const link = res.data["key"]
//           response = await octokit.graphql(constructColumnMutationQuery(jira_link_column_id, latest_row_id, project_id, jiraLink+link ))
//           console.log("Updating Jira Link column: ",JSON.stringify(response, null, 4))
//         })
//         .catch(error => console.log("ERROR: ", error))




//         }catch (error) {
//             core.setFailed(error.message);
//         }

// }
// run()

// ======================================================================================================

import { getInput, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";
import axios from "axios";
import https from "https"
import { queryToGetLatestOnDash, 
         constructColumnMutationQuery, 
         createSWDEVTicketBody, 
         extractInfoFromIssueBody,
         transformRocmVersions,
         transformGpuVersions,
         gpuToJiraProgram,
         createJiraDescription } from "./utils.js"

// change to production later on
const SWDEVURL = "https://dalwebapiuat.amd.com/DALWebApiLinuxJDC/CreateSwdevTicket"
let jiraLink = "https://ontrack-internal-jdcuat.amd.com/browse/"

async function run(){
    
    try {

   
    // Getting the fields set in the workflow file in the repository
    const orgName = getInput('github-organization', {required: true});
    const repo = getInput('github-repo', {required: true});
    const githubToken = getInput('authentication-token', {required: true})


    const octokit = getOctokit(githubToken);
    const issue = context.payload.issue;
    console.log(issue)
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
    selectedGpus.sort()
    rocmVersions.sort()

    const program = gpuToJiraProgram(selectedGpus[selectedGpus.length - 1])
    const jiraBody = createJiraDescription(parsedIssueBody)
    
    selectedGpus = selectedGpus.map(v => {
        v.replace(" ", "_")
    })
    rocmVersions = rocmVersions.map(v => {
        v.replace(" ", "_")
    })

    const swdevTicket = createSWDEVTicketBody(program, title, jiraBody, String(selectedGpus[selectedGpus.length - 1]), String(rocmVersions[rocmVersions.length - 1]))
    
    const username = String.raw`amd\z1_jira_account`
    const password = "dy75!cbmkt65ft"
    let response;
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
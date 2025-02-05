import { getInput, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";
import { queryToGetLatestOnDash, 
         constructColumnMutationQuery, 
         extractInfoFromIssueBody,
         transformRocmVersions,
         transformGpuVersions,
         addIssueToProject,
         getProjectId } from "./utils.js"


async function run(){
    try {

   
    // Getting the fields set in the workflow file in the repository
    const orgName = getInput('github-organization', {required: true});
    const projectNum = getInput('project-num', {required: true});
    const githubToken = getInput('authentication-token', {required: true})
    

    const octokit = getOctokit(githubToken);

    console.log(context.payload)

    const issue = context.payload.issue;
    
    let repoName = context.payload.repository.full_name
    repoName = repoName.split("/")[1] // get the name after the organization name
 
    const body = issue.body
    const issueNum = issue.number
    const issue_node_id = issue.node_id
    
    if(!body.includes('### Problem Description\n')){
        return;
    }
    
    let parsedIssueBody = extractInfoFromIssueBody(body)
    

    const validRocmLabels = new Set([
        "ROCm 6.0.0", "ROCm 6.0.2", "ROCm 6.1.0", "ROCm 6.1.1", "ROCm 6.1.2", "ROCm 6.2.0", "ROCm 6.2.1",
        "ROCm 6.2.2", "ROCm 6.2.4", "ROCm 6.3.0", "ROCm 6.3.1", "ROCm 6.3.2"
    ]);
    
    let selectedGpus = parsedIssueBody.gpu.split(", ").map(v => v.trim());
    
    // Add "ROCm" to the version and check against set of valid labels
    let rocmVersions = parsedIssueBody.rocmVersions.split(", ").map(v => {
        v = v.trim();
        let formattedVersion = v.startsWith("ROCm") ? v : `ROCm ${v}`;
        return validRocmLabels.has(formattedVersion) ? formattedVersion : null;
    }).filter(Boolean);

    let labels = [... selectedGpus, ...rocmVersions]




    
    // Adding labels to the issue using the GPU and ROCm versions
    try{
        await octokit.rest.issues.addLabels({owner: orgName, repo: repoName, issue_number:issueNum, labels:labels})
        console.log("Successfully added labels to issue")
    }
    catch(e){
        console.log("Could not add labels to the newly created issue", e)
    }

    let gettingProjectIdResponse; 
    try {
        gettingProjectIdResponse = await octokit.graphql(getProjectId(orgName, projectNum))
        console.log("Successfully got project id")
    }
    catch(e){
        console.log("Could not get project id", e)
    }

    const project_id = gettingProjectIdResponse.organization.projectV2.project_id

    try {
        await octokit.graphql(addIssueToProject(project_id, issue_node_id))
        console.log("Successfully added issue to dashboard")

    }
    catch(e){
        console.log("Could not add issue to project", e)
    }
    
    let component;
    if (repoName === "ROCm"){

        // issues from ROCm/ROCm can have multiple components to be targetted
        component = parsedIssueBody.component.split(", ").map(v => {
            return v.trim()
        })
    }
    // issues from non ROCm repos have only a single component to deal with
    else{
        component = repoName
    }


    let latestEntry;
    try {
        latestEntry = await octokit.graphql(queryToGetLatestOnDash(orgName, projectNum))
    }
    catch(e){
        console.log("Could not get latest row from GitHub dashboard", e)
    }

    const gpu_column_id = latestEntry.organization.projectV2.gpu_column_id.id
    const rocm_version_column_id = latestEntry.organization.projectV2.rocm_version_column_id.id
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
        graphqlResponse = await octokit.graphql((constructColumnMutationQuery(component_column_id, latest_row_id, project_id, component)))
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
    

    }catch (error) {
        setFailed(error.message);
    }


}   
run()
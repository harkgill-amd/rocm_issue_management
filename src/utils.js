/**
 * GraphQL Query that returns information needed to mutate the project.
 * @param {String} orgName      The organization
 * @param {String} projectNum   The project number
 * @returns String
 */
function queryToGetLatestOnDash(orgName, projectNum){
    return `{
        organization(login: "${orgName}") {
            projectV2(number: ${projectNum}) {
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
            jira_link_column_id:field(name: "JIRA Link"){
                ... on ProjectV2Field{
                    id
                }
            }
            component_column_id:field(name: "Component"){
                ... on ProjectV2Field{
                    id
                }
            }
            os_column_id:field(name: "OS"){
                ... on ProjectV2Field{
                    id
                }
            }
            items(last: 1){
                last_item:nodes {
                __typename
                latest_row_id: id
                }
            }
            }
        }
        }`
}

/**
 * Get Project Id query
 * @param {String} orgName 
 * @param {String} projectNum 
 * @returns String
 */
function getProjectId(orgName, projectNum){
    return`{
        organization(login: "${orgName}") {
            projectV2(number: ${projectNum}) {
                project_id: id
            }
        }
    }`
        
}

/**
 * Create add issue to project mutation query
 * @param {String} project_id 
 * @param {String} issue_node_id 
 * @returns 
 */
function addIssueToProject(project_id, issue_node_id){
    return `mutation{
        addProjectV2ItemById(input: {projectId:"${project_id}" contentId: "${issue_node_id}"}) {
        item {
            id
        }
        }
    }`
    
}

/**
 * Change the cell defined at (rowToChange, colToChange) inside of
 * projectId to contain text
 * @param {String} colToChange The ID of the column
 * @param {String} rowToChange The ID of the row
 * @param {String} projectId   The ID of the project
 * @param {String} text        Text will be placed inside the cell
 * @returns String
 */
function constructColumnMutationQuery(colToChange, rowToChange, projectId, text){
const mutationQuery = `mutation{
    updateProjectV2ItemFieldValue(input: {
    fieldId: "${colToChange}",
    itemId: "${rowToChange}",
    projectId: "${projectId}",
    value: {text: "${text}"}
    
    }){
    clientMutationId
    }
}`

return mutationQuery
}



/**
 * Extracts each portion of the GitHub Issue and returns an object with all portions. All values
 * in the object will be strings and lists of values will be comma separated strings.
 * @param {String} body text taken directly from the GitHub Issue
 * @returns Object
 */ 
function extractInfoFromIssueBody(body){

    const descriptionDelim = "### Problem Description\n\n"
    const osDelim = "### Operating System\n\n"
    const cpuDelim = "### CPU\n\n"
    const gpuDelim = "### GPU\n\n"
    const rocmVersionDelim = "### ROCm Version\n\n"
    const rocmComponent = "### ROCm Component\n\n"
    const stepsDelim = "### Steps to Reproduce\n\n"
    const rocmInfoDelim = "### (Optional for Linux users) Output of /opt/rocm/bin/rocminfo --support\n\n"
    const additionalInfoDelim = "### Additional Information\n\n"
    const delims = [descriptionDelim, osDelim, cpuDelim, gpuDelim, rocmVersionDelim, rocmComponent, stepsDelim, rocmInfoDelim, additionalInfoDelim]
    
    let issueBody = {}
    for (const [index, delim] of delims.entries()) {
        let text = ""
        let start = body.indexOf(delim)
        if (index + 1 != 9){
            let end = body.indexOf(delims[index + 1])
            start += delim.length
            text = body.substring(start, end).trim()

        }
        else{
            start += delim.length
            text = body.substring(start).trim()
        }
        switch(delim){
            case descriptionDelim:
                issueBody["description"] = text
                break
            case osDelim:
                issueBody["os"] = text
                break
            case cpuDelim:
                issueBody["cpu"] = text
                break
            case gpuDelim:
                issueBody["gpu"] = text
                break
            case rocmVersionDelim:
                issueBody["rocmVersions"] = text
                break
            case rocmComponent:
                issueBody["component"] = text
                break
            case stepsDelim:
                issueBody["steps"] = text
                break
            case rocmInfoDelim:
                issueBody["rocmInfo"] = text
                break
            case additionalInfoDelim:
                issueBody["additionalInfo"] = text
                break
        }
        
    }
    return issueBody

}
/**
 * Removes ROCm keyword and just returns an array of version numbers as strings
 * @param {Array} rocmVersions
 * @returns String
 */
function transformRocmVersions(rocmVersions){
    let ls = []
    const rocm = "ROCm "
    for(const v of rocmVersions){
        ls.push(v.slice(v.indexOf(rocm) + rocm.length))
    }
    return ls.toString()
}


/**
 * Removes AMD lingo and just returns an array of versions as strings
 * @param {Array} selectedGpus
 * @returns String
 */
function transformGpuVersions(selectedGpus){
    let ls = []
    const instinct = "Instinct "
    const radeon = "Radeon "
    for(const v of selectedGpus){
        
       if(v.includes(instinct)){
        ls.push(v.slice(v.indexOf(instinct) + instinct.length))
       }
       else if(v.includes(radeon)){
        ls.push(v.slice(v.indexOf(radeon) + radeon.length))
       }

    }
    return ls.toString()
}

export {
    queryToGetLatestOnDash,
    constructColumnMutationQuery,
    extractInfoFromIssueBody,
    transformRocmVersions,
    transformGpuVersions,
    addIssueToProject,
    getProjectId
}

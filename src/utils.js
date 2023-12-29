/**
 * GraphQL Query that returns information needed to mutate the project.
 * @returns project_id, gpu_column_id, rocm_version_column_id, latest_row_id
 */
const queryToGetLatestOnDash =  `{
organization(login: "RadeonOpenCompute") {
    projectV2(number: 11) {
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
 * Creates the JSON body that will be used to POST to the JIRA ticket creation endpoint
 * @param {String} program JIRA ticket Program. Follows the table represented in [TODO]
 * @param {String} title Title of ticket taken directly from the GitHub issue
 * @param {String} description Description of ticket taken directly from GitHub issue
 * @param {String} gpuLabel The GPU with the greatest version number that will be used to label this ticket
 * @param {String} rocmLabel The ROCm version with the greatest version number that will be used to label this ticket
 * @returns String
 */
function createSWDEVTicketBody(program, title, description, gpuLabel, rocmLabel){
return {"FieldValues": {
    "summary": `${title}`,
    "description": `${description}`,
    "issuetype": "Defect",
    "Program": `${program}`,
    "TriageCategory": "Radeon Open Compute",
    "TriageAssignment": "Triage - ML SDK",
    "labels": `github_community,${gpuLabel},${rocmLabel}`,
    "Severity": "Low",
    "comments": "testing",
    "assignee": "abhimeda",
    "watchers": "abhimeda"
}}
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
        if (index + 1 != 10){
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

/**
 * Returns the JIRA program corresponding to gpu
 * @param {String} gpu 
 * @returns String
 */
function gpuToJiraProgram(gpu){
    const map = {
        "AMD Instinct MI300X" : "MI-300",
        "AMD Instinct MI300A" : "MI-300",
        "AMD Instinct MI250X" : "MI-200",
        "AMD Instinct MI250" : "MI-200",
        "AMD Instinct MI210" : "MI-200",
        "AMD Instinct MI100" : "MI-100",
        "AMD Radeon Pro W7900": "Navi31",
        "AMD Radeon Pro W6800": "Navi21",
        "AMD Radeon Pro V620": "Navi21",
        "AMD Radeon Pro VII": "Vega20",
        "AMD Radeon RX 7900 XTX": "Navi31",
        "AMD Radeon RX 7900 XT": "Navi31",
        "AMD Radeon VII": "Vega20"
    }
    return map[gpu]
}


/**
 * @param {Object} parsedIssueBody
 * @returns String
 */
function createJiraDescription(parsedIssueBody){
    return `Description:
    ${parsedIssueBody.description}

    OS:
    ${parsedIssueBody.os}

    GPU:
    ${parsedIssueBody.gpu}

    ROCm Versions:
    ${parsedIssueBody.rocmVersions}

    Component:
    ${parsedIssueBody.component}

    Steps:
    ${parsedIssueBody.steps}

    rocmInfo:
    ${parsedIssueBody.rocmInfo}

    Additional Info:
    ${parsedIssueBody.additionalInfo}
    `
}
export {
    queryToGetLatestOnDash,
    constructColumnMutationQuery,
    createSWDEVTicketBody,
    extractInfoFromIssueBody,
    transformRocmVersions,
    transformGpuVersions,
    gpuToJiraProgram,
    createJiraDescription,

}

// let sample = "### Problem Description\n\n_No response_\n\n### Operating System\n\n_No response_\n\n### CPU\n\n_No response_\n\n### GPU\n\n_No response_\n\n### Other\n\n_No response_\n\n### ROCm Version\n\n_No response_\n\n### ROCm Component\n\naomp-extras\n\n### Steps to Reproduce\n\n_No response_\n\n### (Optional for Linux users) Output of /opt/rocm/bin/rocminfo --support\n\n_No response_\n\n### Additional Information\n\n_No response_"
// let sample2 = "### Problem Description\n\nI'm training a [FastSpeech2](https://github.com/ming024/FastSpeech2) model on my 7900 XTX, using the latest rocm/pytorch:rocm6.0_ubuntu22.04_py3.9_pytorch_2.0.1 docker image.\r\n\r\nWhat I've noticed is that increasing batch size does not necessarily translate to shorter epoch times. Adding simple instrumentation showed that increasing batch size has also increased time required to compute each of the steps in the pipeline.\r\n\r\nTimes for all of forward_pass, calc_loss and backward_pass have lengthened.\r\nFor forward_pass and calc_loss roughly inline with batch size increase (4x), and for backward_pass increase was 6x!\r\n\r\nIs this expected behaviour?\r\n\r\nBatch size = 16\r\n\r\n![Screenshot 2023-12-28 at 17-53-06 amd - Google Search](https://github.com/RadeonOpenCompute/github_action_poc/assets/138710508/9ddb4c6d-b710-4947-a1cb-804dfd5000c8)\r\n\n\n### Operating System\n\nUbuntu 22.04.3 LTS (Jammy Jellyfish)\n\n### CPU\n\nAMD Ryzen 5 4500 6-Core Processor\n\n### GPU\n\nAMD Instinct MI250X, AMD Instinct MI250, AMD Instinct MI210, AMD Instinct MI100, AMD Instinct MI50, AMD Instinct MI25\n\n### Other\n\n_No response_\n\n### ROCm Version\n\nROCm 5.7.1, ROCm 5.7.0, ROCm 5.6.0, ROCm 5.5.1\n\n### ROCm Component\n\nHIPIFY\n\n### Steps to Reproduce\n\n![Screenshot 2023-12-28 at 17-53-06 amd - Google Search](https://github.com/RadeonOpenCompute/github_action_poc/assets/138710508/861659b1-f49c-404d-8355-c379b39a7bf1)\r\n![Screenshot 2023-12-28 at 17-53-06 amd - Google Search](https://github.com/RadeonOpenCompute/github_action_poc/assets/138710508/998be483-b8b0-490a-965d-d11be122e480)\r\n\n\n### (Optional for Linux users) Output of /opt/rocm/bin/rocminfo --support\n\nI'm training a [FastSpeech2](https://github.com/ming024/FastSpeech2) model on my 7900 XTX, using the latest rocm/pytorch:rocm6.0_ubuntu22.04_py3.9_pytorch_2.0.1 docker image.\r\n\r\nWhat I've noticed is that increasing batch size does not necessarily translate to shorter epoch times. Adding simple instrumentation showed that increasing batch size has also increased time required to compute each of the steps in the pipeline.\r\n\r\nTimes for all of forward_pass, calc_loss and backward_pass have lengthened.\r\nFor forward_pass and calc_loss roughly inline with batch size increase (4x), and for backward_pass increase was 6x!\r\n\r\nIs this expected behaviour?\r\n\r\nBatch size = 16\n\n### Additional Information\n\nI'm training a [FastSpeech2](https://github.com/ming024/FastSpeech2) model on my 7900 XTX, using the latest rocm/pytorch:rocm6.0_ubuntu22.04_py3.9_pytorch_2.0.1 docker image.\r\n\r\nWhat I've noticed is that increasing batch size does not necessarily translate to shorter epoch times. Adding simple instrumentation showed that increasing batch size has also increased time required to compute each of the steps in the pipeline.\r\n\r\nTimes for all of forward_pass, calc_loss and backward_pass have lengthened.\r\nFor forward_pass and calc_loss roughly inline with batch size increase (4x), and for backward_pass increase was 6x!\r\n\r\nIs this expected behaviour?\r\n\r\nBatch size = 16"


// let parsedIssueBody = extractInfoFromIssueBody(sample2)


// let selectedGpus = parsedIssueBody.gpu.split(", ").map(v => {
//     return v.trim()
// })

// let rocmVersions = parsedIssueBody.rocmVersions.split(", ").map(v => {
//     return v.trim()
// })

// let labels = [... selectedGpus, ...rocmVersions]
// console.log(transformGpuVersions(selectedGpus))
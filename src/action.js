/**
 * @param {Object} octokit
 * @param {Object} context
 * @param {string} parameters.organization
 * @param {number} parameters.projectNum
 */
const runAction = async (octokit, contextPayload, organization) => {
    
    issueNumber = context.issue?.number

    if (!issueNumber) {
        throw new Error(`Couldn't find issue info in current context`);
    }

    
    const issueResponse = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: organization,
        repo: 'tempfortesting',
        issue_number: issueNumber,
        headers: {
        'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    const nodeId = issueResponse.node_id
    return nodeId
}

module.exports = {
    runAction
};
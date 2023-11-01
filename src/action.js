/**
 * @param {Object} octokit
 * @param {Object} context
 */
const runAction = async (octokit, contextPayload) => {
    
    issueNumber = contextPayload.issue?.number

    if (!issueNumber) {
        throw new Error(`Couldn't find issue info in current context`);
    }

    
    const issueResponse = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: contextPayload.repository_owner,
        repo: contextPayload.repository,
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
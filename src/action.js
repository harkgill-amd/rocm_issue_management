/**
 * @param {Object} octokit
 * @param {Object} context
 */
const runAction = async (octokit, contextPayload) => {
    
    issueNumber = contextPayload.issue?.number

    if (!issueNumber) {
        throw new Error(`Couldn't find issue info in current context`);
    }

    const nodeId = issueResponse.node_id
    return {nodeId: nodeId, owner: contextPayload.repository_owner,
        repo: contextPayload.repository}
}

module.exports = {
    runAction
};
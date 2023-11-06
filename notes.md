# Github Issue Management

The basic ideas are as follows:
- Auto add an issue to a GitHub project
- Extract meaningful information from the issue
- Populate the project with meaningful information so it is easy to triage

# OAuth Apps vs GitHub Apps

OAuth apps are tied to the user meaning each request is made using a user access token. If someone were to leave GitHub or the organization, the app would stop working because the access token is no longer valid. 

GitHub apps is the recommended way create any apps that interact with GitHub and is highly suitable for GitHub projects. Each request will generate its own access token and requests are made inpendent from any user. This link

https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-appmaking-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflowexplains 

how to create a GitHub app and use it to make requests


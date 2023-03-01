/** @type {import('houdini').ConfigFile} */
const config = {
  watchSchema: {
    url: 'http://localhost:3333/graphql?houdini=true',
  },
  "plugins": {
    'houdini-svelte': {
      client: './app/frontend/client.js'
    }
  }
}

export default config

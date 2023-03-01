<script>
  import { graphql } from '../../../$houdini'

  // export let entries

    const store = graphql(`
        query Entries {
          entries {
            id,
            name,
            description
          }
        }
    `)

  $: entriesStore = $store.data?.entries
  $: console.log('entries', entriesStore)
</script>

<ul class="
  flex
  flex-wrap
  gap-4
">
  {#each entriesStore as entry }
    <li>
      <p>Name: {entry.id}</p>
      <p>Name: {entry.name}</p>
      <p>Description: {entry.description}</p>
    </li>
  {/each}
</ul>

<script>
  import Entries from '../../components/Entries.svelte';

  export let entries
</script>

<div class="bg-white min-h-screen max-w-screen-2xl m-auto font-sans">
  <div class='flex flex-col'>
    <div class="flex">
      <div class="flex-1 py-8 px-4 lg:p-8">
        <Entries entries={entries} />
      </div>
    </div>
  </div>
</div>
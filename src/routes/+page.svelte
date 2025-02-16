<script>
  import SplineEditor from './SplineEditor.svelte';
  import Robot from './Robot.svelte';

  let activeTab = 'robot'; // Default to robot view
</script>

<div class="fixed inset-0 flex flex-col">
  <!-- Tab Navigation -->
  <div class="bg-gray-800 text-white flex">
    <button class="px-4 py-2 {activeTab === 'robot' ? 'bg-gray-700' : 'hover:bg-gray-700'}" on:click={() => (activeTab = 'robot')}> Robot View </button>
    <button class="px-4 py-2 {activeTab === 'spline' ? 'bg-gray-700' : 'hover:bg-gray-700'}" on:click={() => (activeTab = 'spline')}> Spline Editor </button>
  </div>

  <!-- Tab Content -->
  <div class="flex-1">
    {#if activeTab === 'robot'}
      <Robot class="w-full h-full" />
    {:else}
      <SplineEditor class="w-full h-full" />
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  :global(html, body) {
    width: 100%;
    height: 100%;
  }
</style>

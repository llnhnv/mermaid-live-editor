<script lang="ts">
  import { Button, buttonVariants } from '$/components/ui/button';
  import * as Dialog from '$/components/ui/dialog';
  import {
    deleteDiagram,
    loadAllDiagrams,
    setCurrentDiagram,
    type SavedDiagram
  } from '$/util/diagramService';
  import { defaultState } from '$/util/state';
  import { serializeState } from '$/util/serde';
  import { isSupabaseEnabled } from '$/util/supabase';
  import { goto } from '$app/navigation';
  import CloudIcon from '~icons/material-symbols/cloud';
  import DeleteIcon from '~icons/material-symbols/delete-outline';
  import OpenIcon from '~icons/material-symbols/open-in-new-rounded';

  let isOpen = $state(false);
  let isLoading = $state(false);
  let diagrams = $state<SavedDiagram[]>([]);
  let totalCount = $state<number | null>(null);
  let error = $state<string | null>(null);

  const loadDiagrams = async () => {
    if (!isSupabaseEnabled) {
      error = 'Database is not configured.';
      return;
    }

    isLoading = true;
    error = null;

    const result = await loadAllDiagrams(50, 0);
    diagrams = result.diagrams;
    totalCount = result.count;

    isLoading = false;
  };

  const handleOpen = async () => {
    isOpen = true;
    await loadDiagrams();
  };

  const handleOpenDiagram = async (diagram: SavedDiagram) => {
    setCurrentDiagram(diagram);

    const state = {
      ...defaultState,
      code: diagram.code,
      mermaid: diagram.config || defaultState.mermaid
    };
    const serialized = serializeState(state);
    isOpen = false;
    await goto(`/edit#${serialized}`);
    window.location.reload();
  };

  const handleDelete = async (shortId: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) {
      return;
    }

    const success = await deleteDiagram(shortId);
    if (success) {
      diagrams = diagrams.filter((d) => d.short_id !== shortId);
      if (totalCount !== null) {
        totalCount--;
      }
    } else {
      alert('Failed to delete diagram.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getPreview = (code: string) => {
    const lines = code.split('\n').slice(0, 3);
    const preview = lines.join('\n');
    return preview.length > 100 ? preview.slice(0, 100) + '...' : preview;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Trigger class={buttonVariants({ size: 'sm' })} onclick={handleOpen}>
    <CloudIcon class="size-4" />
    Saved Diagrams
  </Dialog.Trigger>
  <Dialog.Content class="max-h-[80vh] max-w-2xl overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-xl">
        <CloudIcon class="size-5" /> Saved Diagrams
      </Dialog.Title>
      <Dialog.Description>
        {#if totalCount !== null}
          {totalCount} diagram{totalCount !== 1 ? 's' : ''} saved
        {:else}
          Your diagrams saved to cloud
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="max-h-[50vh] overflow-y-auto">
      {#if isLoading}
        <div class="flex items-center justify-center py-8">
          <p class="text-muted-foreground">Loading...</p>
        </div>
      {:else if error}
        <div class="py-4 text-center">
          <p class="text-sm text-red-600">{error}</p>
        </div>
      {:else if diagrams.length === 0}
        <div class="py-8 text-center">
          <p class="text-muted-foreground">No diagrams saved yet.</p>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          {#each diagrams as diagram (diagram.id)}
            <div
              class="flex items-start justify-between gap-2 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
              <div class="min-w-0 flex-1">
                {#if diagram.title}
                  <p class="mb-1 font-medium">{diagram.title}</p>
                {/if}
                <p class="mb-1 text-xs text-muted-foreground">
                  {formatDate(diagram.created_at)} &bull; {diagram.short_id}
                </p>
                <pre
                  class="overflow-hidden text-xs text-ellipsis whitespace-pre-wrap text-muted-foreground">{getPreview(
                    diagram.code
                  )}</pre>
              </div>
              <div class="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onclick={() => handleOpenDiagram(diagram)}>
                  <OpenIcon class="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-red-600 hover:text-red-700"
                  onclick={() => handleDelete(diagram.short_id)}>
                  <DeleteIcon class="size-4" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <Button variant="outline" onclick={() => (isOpen = false)}>Close</Button>
      <Button onclick={loadDiagrams} disabled={isLoading}>Refresh</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

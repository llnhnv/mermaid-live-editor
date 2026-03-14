<script lang="ts">
  import { Button } from '$/components/ui/button';
  import { Input } from '$/components/ui/input';
  import * as Dialog from '$/components/ui/dialog';
  import {
    saveDiagram,
    updateDiagram,
    currentDiagram,
    setCurrentDiagram,
    type SavedDiagram
  } from '$/util/diagramService';
  import { stateStore } from '$/util/state';
  import { isSupabaseEnabled } from '$/util/supabase';
  import { notifySuccess, notifyError } from '$/util/notify';
  import SaveIcon from '~icons/material-symbols/save';
  import CopyInput from './CopyInput.svelte';

  let isOpen = $state(false);
  let isSaving = $state(false);
  let savedDiagram = $state<SavedDiagram | null>(null);
  let error = $state<string | null>(null);
  let diagramTitle = $state('');

  const isEditing = $derived($currentDiagram !== null);

  $effect(() => {
    if (isOpen && $currentDiagram) {
      diagramTitle = $currentDiagram.title || '';
    }
  });

  const handleSave = async () => {
    if (!isSupabaseEnabled) {
      error = 'Database is not configured.';
      return;
    }

    isSaving = true;
    error = null;

    let result: SavedDiagram | null = null;

    if ($currentDiagram) {
      result = await updateDiagram(
        $currentDiagram.short_id,
        $stateStore.code,
        $stateStore.mermaid,
        diagramTitle.trim() || undefined
      );

      if (result) {
        setCurrentDiagram(result);
        notifySuccess('Diagram updated successfully!');
      } else {
        error = 'Failed to update diagram. Please try again.';
        notifyError('Failed to update diagram');
      }
    } else {
      result = await saveDiagram(
        $stateStore.code,
        $stateStore.mermaid,
        diagramTitle.trim() || undefined
      );

      if (result) {
        setCurrentDiagram(result);
        notifySuccess('Diagram saved successfully!');
      } else {
        error = 'Failed to save diagram. Please try again.';
        notifyError('Failed to save diagram');
      }
    }

    if (result) {
      savedDiagram = result;
    }

    isSaving = false;
  };

  const getShortUrl = (shortId: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/d/${shortId}`;
  };

  const handleOpenChange = (open: boolean) => {
    isOpen = open;
    if (!open) {
      savedDiagram = null;
      error = null;
      if (!$currentDiagram) {
        diagramTitle = '';
      }
    }
  };
</script>

<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Trigger>
    <Button variant="accent" size="sm" onclick={() => (isOpen = true)}>
      <SaveIcon class="size-4" />
      SAVE
    </Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-xl">
        <SaveIcon class="size-5" />
        {isEditing ? 'Update Diagram' : 'Save Diagram'}
      </Dialog.Title>
      <Dialog.Description>
        {#if isEditing}
          Update your diagram to save the latest changes.
        {:else}
          Save your diagram to get a shareable short link.
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4">
      {#if savedDiagram}
        <div class="flex flex-col gap-2">
          <p class="text-sm text-green-600">
            {isEditing ? 'Diagram updated successfully!' : 'Diagram saved successfully!'}
          </p>
          <CopyInput value={getShortUrl(savedDiagram.short_id)} />
          <p class="text-xs text-muted-foreground">
            Share this link with others to view your diagram.
          </p>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <label for="diagram-title" class="text-sm font-medium">Diagram name (optional)</label>
          <Input
            id="diagram-title"
            type="text"
            placeholder="My awesome diagram"
            bind:value={diagramTitle} />
        </div>
        {#if isEditing}
          <p class="text-xs text-muted-foreground">
            Editing: <span class="font-medium">{$currentDiagram?.title || 'Untitled diagram'}</span>
          </p>
        {/if}
        {#if error}
          <p class="text-sm text-red-600">{error}</p>
        {/if}
        <Button onclick={handleSave} disabled={isSaving}>
          {#if isSaving}
            {isEditing ? 'Updating...' : 'Saving...'}
          {:else}
            {isEditing ? 'Update' : 'Save to Cloud'}
          {/if}
        </Button>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

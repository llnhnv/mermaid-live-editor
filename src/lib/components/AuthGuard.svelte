<script lang="ts">
  import { Button } from '$/components/ui/button';
  import { Input } from '$/components/ui/input';
  import * as Dialog from '$/components/ui/dialog';
  import { currentUser, login } from '$/util/auth';
  import {
    loadAllDiagrams,
    clearCurrentDiagram,
    setCurrentDiagram,
    type SavedDiagram
  } from '$/util/diagramService';
  import { notifyError, notifySuccess } from '$/util/notify';
  import { isSupabaseEnabled } from '$/util/supabase';
  import { defaultState, updateCodeStore } from '$/util/state';
  import { goto } from '$app/navigation';
  import type { Snippet } from 'svelte';
  import LockIcon from '~icons/material-symbols/lock';
  import NewDocIcon from '~icons/material-symbols/note-add-outline';
  import FolderIcon from '~icons/material-symbols/folder-open-outline';

  const WELCOME_SESSION_KEY = 'mermaid_welcome_shown';

  let { children }: { children: Snippet } = $props();

  let username = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let isLoading = $state(false);
  let showWelcomeDialog = $state(false);
  let recentDiagrams = $state<SavedDiagram[]>([]);
  let isLoadingDiagrams = $state(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      error = 'Please enter username and password';
      notifyError('Please enter username and password');
      return;
    }

    isLoading = true;
    error = null;

    const user = await login(username.trim(), password);

    if (user) {
      notifySuccess(`Welcome back, ${user.username}!`);
      // Only show welcome dialog once per browser session
      const alreadyShown = sessionStorage.getItem(WELCOME_SESSION_KEY);
      if (!alreadyShown) {
        sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
        setTimeout(async () => {
          isLoadingDiagrams = true;
          showWelcomeDialog = true;
          const { diagrams } = await loadAllDiagrams(5);
          recentDiagrams = diagrams;
          isLoadingDiagrams = false;
        }, 100);
      }
    } else {
      error = 'Invalid username or password';
      notifyError('Invalid username or password');
    }

    isLoading = false;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const startNewDiagram = () => {
    showWelcomeDialog = false;
    clearCurrentDiagram();
    updateCodeStore({ code: defaultState.code });
  };

  const openDiagram = async (diagram: SavedDiagram) => {
    showWelcomeDialog = false;
    setCurrentDiagram(diagram);
    await goto(`/d/${diagram.short_id}`);
  };

  const closeWelcomeDialog = () => {
    showWelcomeDialog = false;
  };
</script>

{#if !isSupabaseEnabled || $currentUser}
  {@render children()}
{:else}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-background">
    <div class="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
      <div class="mb-6 flex flex-col items-center gap-2">
        <div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <LockIcon class="size-8 text-primary" />
        </div>
        <h1 class="text-2xl font-bold">Mermaid Live Editor</h1>
        <p class="text-center text-sm text-muted-foreground">
          Please login to access the diagram editor
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label for="auth-username" class="text-sm font-medium">Username</label>
          <Input
            id="auth-username"
            type="text"
            placeholder="Enter username"
            bind:value={username}
            onkeydown={handleKeydown}
            autofocus />
        </div>

        <div class="flex flex-col gap-2">
          <label for="auth-password" class="text-sm font-medium">Password</label>
          <Input
            id="auth-password"
            type="password"
            placeholder="Enter password"
            bind:value={password}
            onkeydown={handleKeydown} />
        </div>

        {#if error}
          <p class="text-sm text-red-600">{error}</p>
        {/if}

        <Button onclick={handleLogin} disabled={isLoading} class="w-full">
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </div>
    </div>
  </div>
{/if}

<Dialog.Root bind:open={showWelcomeDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Welcome back!</Dialog.Title>
      <Dialog.Description>What would you like to do?</Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-3 py-4">
      <button
        type="button"
        class="flex items-center gap-3 rounded-lg border border-input p-4 text-left transition-colors hover:bg-muted"
        onclick={startNewDiagram}>
        <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <NewDocIcon class="size-5 text-primary" />
        </div>
        <div>
          <p class="font-medium">Create new diagram</p>
          <p class="text-sm text-muted-foreground">Start with a sample flowchart</p>
        </div>
      </button>

      {#if isLoadingDiagrams}
        <div class="py-4 text-center text-sm text-muted-foreground">Loading your diagrams...</div>
      {:else if recentDiagrams.length > 0}
        <div class="rounded-lg border border-input">
          <div class="flex items-center gap-2 border-b border-input px-4 py-2">
            <FolderIcon class="size-4 text-muted-foreground" />
            <span class="text-sm font-medium">Recent diagrams</span>
          </div>
          <div class="max-h-48 overflow-y-auto">
            {#each recentDiagrams as diagram (diagram.id)}
              <button
                type="button"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                onclick={() => openDiagram(diagram)}>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium">
                    {diagram.title || 'Untitled diagram'}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {new Date(diagram.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="flex justify-end">
      <Button variant="outline" onclick={closeWelcomeDialog}>Skip</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

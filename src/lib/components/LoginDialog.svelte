<script lang="ts">
  import { Button } from '$/components/ui/button';
  import { currentUser, logout } from '$/util/auth';
  import { isSupabaseEnabled } from '$/util/supabase';
  import UserIcon from '~icons/material-symbols/person';
  import LogoutIcon from '~icons/material-symbols/logout';

  const handleLogout = () => {
    logout();
  };
</script>

{#if isSupabaseEnabled && $currentUser}
  <div class="flex items-center gap-2">
    <UserIcon class="size-4 text-muted-foreground" />
    <span class="text-sm text-muted-foreground">{$currentUser.username}</span>
    <Button variant="ghost" size="sm" onclick={handleLogout} title="Logout">
      <LogoutIcon class="size-4" />
    </Button>
  </div>
{/if}

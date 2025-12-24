import { trpc } from '@/lib/trpc';

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: merchant } = trpc.auth.myMerchant.useQuery(undefined, {
    enabled: !!user, // Ne charger que si l'utilisateur est connecté
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
    // Recharger la page pour effacer le cache
    window.location.href = '/';
  };

  return {
    user,
    merchant,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}

/**
 * Générer l'URL de connexion Manus OAuth
 */
export function getLoginUrl(redirectTo?: string) {
  const currentPath = redirectTo || window.location.pathname;
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || 'https://portal.manus.im';
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!appId) {
    console.error('VITE_APP_ID is not defined');
    return '#';
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = encodeURIComponent(currentPath);
  
  return `${oauthPortalUrl}/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`;
}

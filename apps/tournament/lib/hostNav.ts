/** Capacitor serviert Next-Export nur zuverlässig als Ordner (`/host/index.html`). */
export function hostLobbyPath(inviteCode: string): string {
  return `/host/?code=${encodeURIComponent(inviteCode)}`;
}

export function goToHostLobby(inviteCode: string): void {
  window.location.assign(hostLobbyPath(inviteCode));
}

export function goToNewEventStart(): void {
  window.location.assign("/?new=1");
}

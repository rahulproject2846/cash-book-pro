// Shared session cache for sniper logic
export const snipedInSession = new Set<string>();

export const clearSessionCache = () => {
  snipedInSession.clear();
  console.log('🧹 [SESSION GUARD] Cache cleared');
};

/**
 * MarketMindPro Authentication Configuration
 * 
 * Default system administrator & terminal access credentials.
 * You can modify these credentials directly in this file at any time.
 */

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Plaintext or hashed comparison
  name: string;
  role: string;
  lastLogin?: number;
}

// Configured credentials
export const DEFAULT_AUTH_CONFIG: UserAccount = {
  id: 'admin_terminal_01',
  email: 'kabuirobah198@gmail.com',
  passwordHash: 'P4vpxw@$',
  name: 'Kabui Robah',
  role: 'Senior Market Analyst & Terminal Admin',
};

// In-memory credential store (allows updating credentials dynamically)
export let currentAuthConfig: UserAccount = { ...DEFAULT_AUTH_CONFIG };

export function updateAuthConfig(newEmail?: string, newPassword?: string, newName?: string) {
  if (newEmail) currentAuthConfig.email = newEmail.trim();
  if (newPassword) currentAuthConfig.passwordHash = newPassword;
  if (newName) currentAuthConfig.name = newName.trim();
  return currentAuthConfig;
}

// packages/app-store/src/slack/types.ts

export interface SlackCredentials {
  teamId: string;
  accessToken: string;
  botUserId: string;
  teamName?: string;
}

export interface SlackAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  // Add other response fields as needed
}

// Add other type definitions as needed

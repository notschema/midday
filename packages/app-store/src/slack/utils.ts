// packages/app-store/src/slack/utils.ts

import { SlackCredentials } from './types';

// Add utility functions for Slack integration
export const sendSlackMessage = async (
  credentials: SlackCredentials,
  channel: string,
  text: string
) => {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.accessToken}`,
    },
    body: JSON.stringify({
      channel,
      text,
    }),
  });
  
  return await response.json();
};

// Add other utility functions as needed

// src/slack/adapter.ts
import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';

// Export wrappers instead of direct re-exports
export const createSlackClient = (token: string) => new WebClient(token);

export const createSlackApp = (options: any) => new App(options);

// Wrap other functions as needed
export const verifySlackRequestWrapper = (params: any) => {
  // Implement verification logic that doesn't directly re-export
  // the CommonJS functions
};

// src/slack/index.ts
export { config } from './config';
export { createSlackClient, createSlackApp, verifySlackRequestWrapper as verifySlackRequest } from './adapter';

// Re-implement handleSlackEvent with ES Module syntax
export const handleSlackEvent = async (event: any, options: any) => {
  // Implementation using the wrappers
};

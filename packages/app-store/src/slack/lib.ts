// packages/app-store/src/slack/lib.ts

export const getInstallUrl = async (teamId: string): Promise<string> => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/apps/slack/oauth_callback`;
  const scope = "chat:write,channels:read,channels:join,files:read,files:write";
  
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${teamId}`;
};

export const slackInstaller = async (code: string, teamId: string) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/apps/slack/oauth_callback`;
  
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri,
    }),
  });
  
  return await response.json();
};

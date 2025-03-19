// packages/app-store/src/slack/lib.ts

// Check for credentials
const hasSlackCredentials = typeof process !== 'undefined' && process.env && 
  !!process.env.SLACK_CLIENT_ID && 
  !!process.env.SLACK_CLIENT_SECRET;

export const getInstallUrl = async (teamId: string): Promise<string> => {
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available');
    return '#slack-not-configured';
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/apps/slack/oauth_callback`;
  const scope = "chat:write,channels:read,channels:join,files:read,files:write";
  
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${teamId}`;
};

export const slackInstaller = async (code: string, teamId: string) => {
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available');
    return { ok: false, error: 'Slack not configured' };
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/apps/slack/oauth_callback`;
  
  try {
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
  } catch (error) {
    console.error('Error in slackInstaller:', error);
    return { ok: false, error: 'Failed to install Slack' };
  }
};

export const handleSlackEvent = async (payload: any, options?: any) => {
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available');
    return { ok: true, warning: 'Slack not configured' };
  }
  
  // Simple implementation that logs the event
  console.log('Slack event received:', payload, options);
  return { ok: true };
};

export const createSlackApp = async (code: string, teamId: string) => {
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available');
    return { success: false, error: 'Slack not configured' };
  }
  
  try {
    const result = await slackInstaller(code, teamId);
    
    return { 
      success: true, 
      data: { 
        teamId, 
        team: result.team?.name || 'Unknown Team',
        accessToken: result.access_token 
      } 
    };
  } catch (error) {
    console.error('Error creating Slack app:', error);
    return {
      success: false,
      error: 'Failed to create Slack app'
    };
  }
};

export const onInitialize = async () => {
  if (!hasSlackCredentials) {
    console.warn('Slack credentials not available for initialization');
    return;
  }

  try {
    const response = await fetch("/api/apps/slack/install-url").then((res) =>
      res.json(),
    );
    const { url } = response;
    const width = 600;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    const popup = window.open(
      url,
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`,
    );
    
    if (!popup) {
      window.location.href = url;
      return;
    }
    
    const listener = (e: MessageEvent) => {
      if (e.data === "app_oauth_completed") {
        window.location.reload();
        window.removeEventListener("message", listener);
        popup.close();
      }
    };
    
    window.addEventListener("message", listener);
  } catch (error) {
    console.error('Error in onInitialize:', error);
  }
};

// packages/app-store/src/slack/index.ts

// First, import everything needed
import image from "./assets/image.png";
import { Logo } from "./assets/logo";

// Define the missing functions that are being imported by the routes
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

// Define the initialization function directly in this file
export const onInitialize = async () => {
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
  // The popup might have been blocked, so we redirect the user to the URL instead
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
};

// Export the Slack verification utility
export { verifySlackRequest } from "@slack/bolt";

// If you have a lib file, export from it
export * from "./lib";

// Define the config object
export const config = {
  name: "Slack",
  id: "slack",
  category: "Assistant",
  active: true,
  logo: Logo,
  short_description:
    "Integrating with Slack enables you to use Midday Assistant right from your Slack workspace, you will also get notifications when you have new transactions and more.",
  description:
    "Integrating Midday with Slack brings powerful financial management capabilities directly into your team's communication hub. With this integration, you can seamlessly interact with Midday Assistant without leaving your Slack workspace, enabling quick access to financial insights and actions. \n\nYou'll receive timely notifications about new transactions, ensuring you're always up-to-date with your financial activities. Moreover, this integration streamlines your workflow by allowing you to upload attachments for transactions directly from Slack. \n\nWhether it's receipts, invoices, or any other relevant documents, you can easily attach them to your transactions without switching between multiple applications. This feature not only saves time but also ensures that all your financial documentation is properly organized and linked to the correct transactions, enhancing your overall bookkeeping efficiency.",
  images: [image],
  onInitialize,
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description:
        "Get notified when a new transaction is added. This will notify you in the channel you have selected.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};

// Also export the config as default for compatibility
export default config;

import { SNSClient } from "@aws-sdk/client-sns";

const IS_OFFLINE = process.env.IS_OFFLINE === "true";

export const sns = IS_OFFLINE
  ? {
      send: async (command: any) => {
        console.log("Mock SNS Publish:", command);
        return Promise.resolve({ MessageId: "mock-message-id" });
      },
    }
  : new SNSClient({ region: "us-east-1" });

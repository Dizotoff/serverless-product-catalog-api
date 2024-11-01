import dotenv from "dotenv";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

dotenv.config();

export const testConfig = {
  local: {
    baseUrl: "http://localhost:3000/local",
    // Mock tokens for local testing
    customerToken: JSON.stringify({
      claims: {
        sub: "test-user-id",
        "custom:custom:role": "customer",
      },
    }),
    adminToken: JSON.stringify({
      claims: {
        sub: "admin-user-id",
        "custom:custom:role": "admin",
      },
    }),
    viewerToken: JSON.stringify({
      claims: {
        "custom:custom:role": "viewer",
      },
    }),
  },
  prod: {
    baseUrl: process.env.API_URL,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    customerUsername: process.env.CUSTOMER_USERNAME,
    customerPassword: process.env.CUSTOMER_PASSWORD,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    viewerUsername: process.env.VIEWER_USERNAME,
    viewerPassword: process.env.VIEWER_PASSWORD,
  },
};

export const isLocal = process.env.IS_OFFLINE === "true";
export const baseUrl = isLocal
  ? testConfig.local.baseUrl
  : testConfig.prod.baseUrl;

export const getAuthToken = async (
  username: string,
  password: string,
  role: "admin" | "customer" | "viewer"
) => {
  if (isLocal) {
    return testConfig.local[`${role}Token`];
  }

  const client = new CognitoIdentityProviderClient({ region: "us-east-1" });
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH" as const,
    ClientId: testConfig.prod.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);
    return response?.AuthenticationResult?.IdToken;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

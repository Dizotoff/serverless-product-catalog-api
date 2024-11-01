import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const IS_OFFLINE = process.env.IS_OFFLINE === "true";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: IS_OFFLINE ? "http://localhost:8000" : undefined,
});

export const docClient = DynamoDBDocumentClient.from(client);

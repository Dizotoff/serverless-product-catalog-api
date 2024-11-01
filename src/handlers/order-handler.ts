import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../clients/db";
import { PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import { Handler } from "aws-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { sns } from "../clients/sns";

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const ORDERS_TOPIC_ARN = process.env.ORDERS_TOPIC_ARN;
const IS_OFFLINE = process.env.IS_OFFLINE === "true";
const TEST_USER_ID = "test-user-123"; // For local development only

export const createOrder: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = IS_OFFLINE
    ? TEST_USER_ID
    : event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized - User ID not found" }),
    };
  }

  const { products } = JSON.parse(event.body ?? "");

  if (!Array.isArray(products) || products.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Products array is required" }),
    };
  }

  const orderId = uuidv4();
  const order = {
    orderId,
    userId,
    products,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  try {
    // Save order to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: ORDERS_TABLE,
        Item: order,
      })
    );

    // Send SNS notification
    await sns.send(
      new PublishCommand({
        TopicArn: ORDERS_TOPIC_ARN,
        Message: JSON.stringify({
          type: "ORDER_CREATED",
          order,
        }),
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create order" }),
    };
  }
};

export const getOrdersByUser: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = IS_OFFLINE
    ? TEST_USER_ID
    : event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized - User ID not found" }),
    };
  }

  try {
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: "UserIdIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(Items),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve orders" }),
    };
  }
};

export const updateOrderStatus: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = IS_OFFLINE
    ? TEST_USER_ID
    : event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized - User ID not found" }),
    };
  }

  const { orderId } = event.pathParameters ?? {};
  const { status } = JSON.parse(event.body ?? "");

  if (!["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].includes(status)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid status" }),
    };
  }

  try {
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
        ReturnValues: "ALL_NEW",
      })
    );

    // Send SNS notification for status update
    await sns.send(
      new PublishCommand({
        TopicArn: ORDERS_TOPIC_ARN,
        Message: JSON.stringify({
          type: "ORDER_STATUS_UPDATED",
          order: Attributes,
        }),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update order status" }),
    };
  }
};

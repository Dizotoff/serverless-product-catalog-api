import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../clients/db";
import { PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import { Handler, SQSEvent } from "aws-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { sns } from "../clients/sns";
import { sqs } from "../clients/sqs";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

const IS_OFFLINE = process.env.IS_OFFLINE === "true";
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const ORDERS_TOPIC_ARN = process.env.ORDERS_TOPIC_ARN;
const ORDERS_QUEUE_URL = process.env.IS_OFFLINE
  ? "http://localhost:9324/queue/serverless-product-catalog-api-orders-queue-local"
  : process.env.ORDERS_QUEUE_URL;
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

    // Send message to SQS queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: ORDERS_QUEUE_URL,
        MessageBody: JSON.stringify(order),
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

export const processOrder = async (event: SQSEvent) => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const order = JSON.parse(record.body);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update order status to PROCESSING
      await docClient.send(
        new UpdateCommand({
          TableName: ORDERS_TABLE,
          Key: { orderId: order.orderId },
          UpdateExpression: "set #status = :status",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":status": "PROCESSING" },
        })
      );

      // Process the order (add your business logic here)
      // ...

      // Update order status to COMPLETED
      const { Attributes } = await docClient.send(
        new UpdateCommand({
          TableName: ORDERS_TABLE,
          Key: { orderId: order.orderId },
          UpdateExpression: "set #status = :status",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":status": "COMPLETED" },
          ReturnValues: "ALL_NEW",
        })
      );

      // Send notification about completed order
      await sns.send(
        new PublishCommand({
          TopicArn: ORDERS_TOPIC_ARN,
          Message: JSON.stringify({
            type: "ORDER_COMPLETED",
            order: Attributes,
          }),
        })
      );
    } catch (error) {
      console.error(
        `Error processing order from message ${record.messageId}:`,
        error
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return {
    batchItemFailures,
  };
};

export const getOrder: Handler = async (
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

  try {
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
      })
    );

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Order not found" }),
      };
    }

    // Optional: Check if the user has permission to view this order
    if (Item.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Forbidden - Not authorized to view this order",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(Item),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve order" }),
    };
  }
};

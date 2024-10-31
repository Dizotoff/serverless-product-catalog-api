const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE === "true";

// Configure the DynamoDB client to connect to DynamoDB Local when offline
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: IS_OFFLINE ? "http://localhost:8000" : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

exports.getProductById = async (event) => {
  const productId = event.pathParameters.productId;

  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { productId },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);

    if (Item) {
      return {
        statusCode: 200,
        body: JSON.stringify(Item),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Could not find product with provided "productId"' }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve product" }),
    };
  }
};

exports.createProduct = async (event) => {
  const { productId, name } = JSON.parse(event.body);

  if (typeof productId !== "string" || typeof name !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '"productId" and "name" must be strings' }),
    };
  }

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: { productId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({ productId, name }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create product" }),
    };
  }
};

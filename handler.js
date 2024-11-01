const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE === "true";

// Configure the DynamoDB client to connect to DynamoDB Local when offline
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: IS_OFFLINE ? "http://localhost:8000" : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

const verifyUserRole = (event, allowedRoles) => {
  try {
    // For local testing
    if (IS_OFFLINE) {
      const authHeader = event.headers.Authorization || "";
      const token = authHeader.split(" ")[1];
      if (!token) return false;

      const decodedToken = JSON.parse(token);
      const userRole = decodedToken.claims["custom:custom:role"];
      return allowedRoles.includes(userRole);
    }

    // For production Cognito
    const claims = event.requestContext.authorizer.claims;
    const userRole = claims["custom:custom:role"];
    return allowedRoles.includes(userRole);
  } catch (error) {
    console.error("Error verifying user role:", error);
    return false;
  }
};

exports.getProductById = async (event) => {
  // Allow both admin and viewer roles to get products
  if (!verifyUserRole(event, ["admin", "viewer"])) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Insufficient permissions" }),
    };
  }

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
        body: JSON.stringify({
          error: 'Could not find product with provided "productId"',
        }),
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
  // Only allow admin role to create products
  if (!verifyUserRole(event, ["admin"])) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Insufficient permissions" }),
    };
  }

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

exports.updateProduct = async (event) => {
  // Only allow admin role to update products
  if (!verifyUserRole(event, ["admin"])) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Insufficient permissions" }),
    };
  }

  const { productId } = event.pathParameters;
  const { name } = JSON.parse(event.body);

  if (typeof name !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '"name" must be a string' }),
    };
  }

  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { productId },
    UpdateExpression: "set #name = :name",
    ExpressionAttributeNames: { "#name": "name" },
    ExpressionAttributeValues: { ":name": name },
    ReturnValues: "ALL_NEW",
  };

  try {
    const command = new UpdateCommand(params);
    const { Attributes } = await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update product" }),
    };
  }
};

exports.deleteProduct = async (event) => {
  // Only allow admin role to delete products
  if (!verifyUserRole(event, ["admin"])) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Insufficient permissions" }),
    };
  }

  const { productId } = event.pathParameters;

  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { productId },
  };

  try {
    const command = new DeleteCommand(params);
    await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product deleted successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete product" }),
    };
  }
};

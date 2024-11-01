import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./../clients/db";
import { verifyUserRole } from "../auth/verifyUserRole";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

export const getProductById = async (event) => {
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

export const createProduct = async (event) => {
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

export const updateProduct = async (event) => {
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
    ReturnValues: "ALL_NEW" as const,
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

export const deleteProduct = async (event) => {
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

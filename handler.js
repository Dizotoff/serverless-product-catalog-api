const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const isOffline = process.env.IS_OFFLINE === "true";
// Configure the DynamoDB client to connect to DynamoDB Local when offline
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: isOffline ? "http://localhost:8000" : undefined,
});


const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

// GET /users/:userId - Retrieve user by ID
app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res.status(404).json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

// POST /users - Create a new user
app.post("/users", async (req, res) => {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    return res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    return res.status(400).json({ error: '"name" must be a string' });
  }

  console.log(1, USERS_TABLE, isOffline)
  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json({ userId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

// Default 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Export the handler for Serverless
exports.handler = serverless(app);

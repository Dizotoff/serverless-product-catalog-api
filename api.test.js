const request = require("supertest");
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

describe("Product API", () => {
  // Configuration for both local and production environments
  const config = {
    local: {
      baseUrl: "http://localhost:3000/local",
      // Mock tokens for local testing
      adminToken: JSON.stringify({
        claims: {
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
      adminUsername: process.env.ADMIN_USERNAME,
      adminPassword: process.env.ADMIN_PASSWORD,
      viewerUsername: process.env.VIEWER_USERNAME,
      viewerPassword: process.env.VIEWER_PASSWORD,
    },
  };

  const isLocal = process.env.IS_OFFLINE === "true";
  const { baseUrl } = isLocal ? config.local : config.prod;

  let adminToken;
  let viewerToken;
  const productId = "testProductId432";
  const productName = "Test Product";

  const getAuthToken = async (username, password) => {
    if (isLocal) {
      return config.local[
        username === config.prod.adminUsername ? "adminToken" : "viewerToken"
      ];
    }

    const client = new CognitoIdentityProviderClient({ region: "us-east-1" });
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: config.prod.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    try {
      const command = new InitiateAuthCommand(params);
      const response = await client.send(command);
      return response.AuthenticationResult.IdToken;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  };

  beforeAll(async () => {
    if (!isLocal) {
      // Get real tokens for production testing
      adminToken = await getAuthToken(
        config.prod.adminUsername,
        config.prod.adminPassword
      );
      viewerToken = await getAuthToken(
        config.prod.viewerUsername,
        config.prod.viewerPassword
      );
    } else {
      // Use mock tokens for local testing
      adminToken = config.local.adminToken;
      viewerToken = config.local.viewerToken;
    }
  });

  describe("Admin Operations", () => {
    it("should create a new product", async () => {
      const response = await request(baseUrl)
        .post("/products")
        .send({ productId, name: productName })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ productId, name: productName });
    });

    it("should update a product", async () => {
      const response = await request(baseUrl)
        .put(`/products/${productId}`)
        .send({ name: "Updated Product" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Updated Product");
    });

    it("should delete a product", async () => {
      const response = await request(baseUrl)
        .delete(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Product deleted successfully"
      );
    });
  });

  describe("Viewer Operations", () => {
    beforeEach(async () => {
      // Ensure there's a product to view
      await request(baseUrl)
        .post("/products")
        .send({ productId, name: productName })
        .set("Authorization", `Bearer ${adminToken}`);
    });

    it("should retrieve a product by ID", async () => {
      const response = await request(baseUrl)
        .get(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("productId", productId);
    });

    it("should not allow product creation", async () => {
      const response = await request(baseUrl)
        .post("/products")
        .send({ productId: "newProduct", name: "New Product" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });

    it("should not allow product updates", async () => {
      const response = await request(baseUrl)
        .put(`/products/${productId}`)
        .send({ name: "Viewer Update Attempt" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });

    it("should not allow product deletion", async () => {
      const response = await request(baseUrl)
        .delete(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });
  });

  describe("Unauthorized Operations", () => {
    it("should reject requests without authentication", async () => {
      const response = await request(baseUrl)
        .get(`/products/${productId}`)
        .set("Accept", "application/json");

      expect([403, 401]).toContain(response.status);
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(baseUrl)
        .get(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", "Bearer invalid-token");

      expect([403, 401]).toContain(response.status);
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test product using admin token
    await request(baseUrl)
      .delete(`/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Accept", "application/json");
  });
});

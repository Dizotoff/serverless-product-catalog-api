import supertest from "supertest";
import { testConfig, isLocal, baseUrl, getAuthToken } from "./test-utils";

describe("Product API", () => {
  let adminToken;
  let viewerToken;
  const productId = "testProductId412342";
  const productName = "Test Product";

  beforeAll(async () => {
    if (!isLocal) {
      adminToken = await getAuthToken(
        testConfig.prod.adminUsername!,
        testConfig.prod.adminPassword!,
        "admin"
      );
      viewerToken = await getAuthToken(
        testConfig.prod.viewerUsername!,
        testConfig.prod.viewerPassword!,
        "viewer"
      );
    } else {
      adminToken = testConfig.local.adminToken;
      viewerToken = testConfig.local.viewerToken;
    }
  });

  describe("Admin Operations", () => {
    it("should create a new product", async () => {
      const response = await supertest(baseUrl!)
        .post("/products")
        .send({ productId, name: productName })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ productId, name: productName });
    });

    it("should update a product", async () => {
      const response = await supertest(baseUrl!)
        .put(`/products/${productId}`)
        .send({ name: "Updated Product" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Updated Product");
    });

    it("should delete a product", async () => {
      const response = await supertest(baseUrl!)
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
      await supertest(baseUrl!)
        .post("/products")
        .send({ productId, name: productName })
        .set("Authorization", `Bearer ${adminToken}`);
    });

    it("should retrieve a product by ID", async () => {
      const response = await supertest(baseUrl!)
        .get(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("productId", productId);
    });

    it("should not allow product creation", async () => {
      const response = await supertest(baseUrl!)
        .post("/products")
        .send({ productId: "newProduct", name: "New Product" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });

    it("should not allow product updates", async () => {
      const response = await supertest(baseUrl!)
        .put(`/products/${productId}`)
        .send({ name: "Viewer Update Attempt" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });

    it("should not allow product deletion", async () => {
      const response = await supertest(baseUrl!)
        .delete(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Insufficient permissions");
    });
  });

  describe("Unauthorized Operations", () => {
    it("should reject requests without authentication", async () => {
      const response = await supertest(baseUrl!)
        .get(`/products/${productId}`)
        .set("Accept", "application/json");

      expect([403, 401]).toContain(response.status);
    });

    it("should reject requests with invalid token", async () => {
      const response = await supertest(baseUrl!)
        .get(`/products/${productId}`)
        .set("Accept", "application/json")
        .set("Authorization", "Bearer invalid-token");

      expect([403, 401]).toContain(response.status);
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test product using admin token
    await supertest(baseUrl!)
      .delete(`/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Accept", "application/json");
  });
});

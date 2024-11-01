import supertest from "supertest";
import { testConfig, isLocal, baseUrl, getAuthToken } from "./test-utils";

describe("Order API", () => {
  let customerToken;
  let adminToken;
  const testOrder = {
    products: [
      { productId: "prod1", quantity: 2 },
      { productId: "prod2", quantity: 1 },
    ],
  };
  let createdOrderId: string;

  beforeAll(async () => {
    if (!isLocal) {
      customerToken = await getAuthToken(
        testConfig.prod.customerUsername!,
        testConfig.prod.customerPassword!,
        "customer"
      );
      adminToken = await getAuthToken(
        testConfig.prod.adminUsername!,
        testConfig.prod.adminPassword!,
        "admin"
      );
    } else {
      customerToken = testConfig.local.customerToken;
      adminToken = testConfig.local.adminToken;
    }
  });

  describe("Customer Operations", () => {
    it("should create a new order", async () => {
      const response = await supertest(baseUrl!)
        .post("/orders")
        .send(testOrder)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("orderId");
      expect(response.body).toHaveProperty("status", "PENDING");
      expect(response.body.products).toEqual(testOrder.products);

      createdOrderId = response.body.orderId;
    });

    it("should get user orders", async () => {
      const response = await supertest(baseUrl!)
        .get("/orders")
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("orderId");
    });
  });

  describe("Admin Operations", () => {
    it("should update order status", async () => {
      const response = await supertest(baseUrl!)
        .put(`/orders/${createdOrderId}/status`)
        .send({ status: "PROCESSING" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "PROCESSING");
    });

    it("should reject invalid status updates", async () => {
      const response = await supertest(baseUrl!)
        .put(`/orders/${createdOrderId}/status`)
        .send({ status: "INVALID_STATUS" })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid status");
    });
  });

  describe("Validation Tests", () => {
    it("should reject order creation without products", async () => {
      const response = await supertest(baseUrl!)
        .post("/orders")
        .send({ products: [] })
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Products array is required"
      );
    });
  });
});

import supertest from "supertest";
import {
  testConfig,
  isLocal,
  baseUrl,
  getAuthToken,
  waitForOrderStatus,
} from "./test-utils";

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

  describe("Order Processing Lifecycle", () => {
    it("should process an order through the complete lifecycle", async () => {
      const createResponse = await supertest(baseUrl!)
        .post("/orders")
        .send(testOrder)
        .set("Accept", "application/json")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty("orderId");
      expect(createResponse.body).toHaveProperty("status", "PENDING");

      const orderId = createResponse.body.orderId;

      const completedOrder = await waitForOrderStatus(
        orderId,
        "COMPLETED",
        10,
        customerToken
      );
      expect(completedOrder.status).toBe("COMPLETED");
    }, 60000);

    it("should handle multiple orders sequentially", async () => {
      // Create three orders in quick succession
      const orderPromises = Array(3)
        .fill(null)
        .map(() =>
          supertest(baseUrl!)
            .post("/orders")
            .send(testOrder)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${customerToken}`)
        );

      const orders = await Promise.all(orderPromises);
      const orderIds = orders.map((response) => response.body.orderId);

      // Wait for all orders to complete
      const completedOrders = await Promise.all(
        orderIds.map((id) =>
          waitForOrderStatus(id, "COMPLETED", 10, customerToken)
        )
      );

      // Verify all orders completed successfully
      completedOrders.forEach((order) => {
        expect(order.status).toBe("COMPLETED");
      });

      // Only verify timestamps if they exist
      const timestamps = completedOrders
        .map((order) => order.completedAt)
        .filter(Boolean)
        .map((date) => new Date(date).getTime());

      if (timestamps.length > 1) {
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
        }
      }
    }, 120000);
  });
});

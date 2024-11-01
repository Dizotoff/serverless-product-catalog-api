const request = require('supertest');

describe('Product API', () => {
  const baseUrl = 'https://5fv7ibacrc.execute-api.us-east-1.amazonaws.com/dev';
  const productId = 'testProductId';
  const productName = 'Test Product';

  it('should create a new product', async () => {
    const response = await request(baseUrl)
      .post('/products')
      .send({ productId, name: productName })
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ productId, name: productName });
  });

  it('should retrieve a product by ID', async () => {
    const response = await request(baseUrl)
      .get(`/products/${productId}`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productId', productId);
  });

  it('should update a product', async () => {
    const response = await request(baseUrl)
      .put(`/products/${productId}`)
      .send({ name: 'Updated Product' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Updated Product');
  });

  it('should delete a product', async () => {
    const response = await request(baseUrl)
      .delete(`/products/${productId}`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Product deleted successfully');
  });

  afterAll(async () => {
    // Cleanup: Attempt to delete the product after all tests
    await request(baseUrl)
      .delete(`/products/${productId}`)
      .set('Accept', 'application/json');
  });
});
# Project Concept: Product Catalog API

The project will start with a basic setup that allows users to view a catalog of products. As it progresses, we’ll add functionality for managing products, authentication, ordering, and real-time notifications. Each level builds on the previous one.

## Level 1: Basic Product Retrieval API

**Goal:** Set up a simple API endpoint to retrieve product information from a database.

### Features

- Create a Lambda function to fetch product data.
- Store sample product data in DynamoDB (e.g., product ID, name, description, and price).
- Set up API Gateway to expose the Lambda function as a REST API endpoint.

### AWS Services

- **AWS Lambda:** Hosts the function for retrieving product data.
- **DynamoDB:** Stores basic product information.
- **API Gateway:** Exposes a public endpoint for the Lambda function.

### CI/CD Setup

- Set up a GitHub Actions workflow to automatically deploy any changes to the Lambda function.
- Define `.github/workflows/deploy.yml` to run `serverless deploy` on each push to the main branch.

**Outcome:** An endpoint that retrieves and returns product data, automatically deployed via GitHub Actions.

---

## Level 2: Product Management API with CRUD Operations

**Goal:** Extend the API to include CRUD (Create, Read, Update, Delete) operations for product management.

### Features

- Add endpoints for creating, updating, and deleting products.
- Implement input validation and error handling for each CRUD operation.
- Use IAM policies to restrict DynamoDB access to the Lambda functions as a security measure.

### AWS Services

- Same as Level 1 (API Gateway, Lambda, DynamoDB).
- **IAM:** Manages permissions for Lambda’s access to DynamoDB, ensuring it has only the necessary privileges.

### CI/CD Update

- GitHub Actions workflow automatically deploys new or updated endpoints.
- Set up additional testing steps in the GitHub Actions workflow to ensure CRUD operations work as expected (e.g., linting, basic API tests).

**Outcome:** A complete Product Management API that supports full CRUD operations, with continuous deployment through GitHub Actions.

---

## Level 3: Authentication & Authorization with AWS Cognito

**Goal:** Introduce authentication and authorization to secure API access.

### Features

- Set up AWS Cognito for user authentication, defining roles (e.g., admin vs. viewer).
- Restrict API endpoints based on roles, allowing only authenticated users with specific permissions to access certain functions (e.g., only admins can update or delete products).
- Update API Gateway with a Cognito Authorizer to secure endpoints.

### AWS Services

- **Cognito:** Manages user authentication and roles.
- **API Gateway:** Configured to require Cognito authentication for certain endpoints.

### CI/CD Update

- Update the GitHub Actions workflow to handle Cognito environment configuration if needed (e.g., using parameterized deployment for different stages like dev and prod).
- Run integration tests in the workflow to ensure authentication and role-based access are functioning correctly.

**Outcome:** A secure API where only authorized users can perform certain operations, continuously deployed with GitHub Actions.

---

## Level 4: Order Management and Notifications

**Goal:** Introduce order management functionality and real-time notifications.

### Features

- Create a DynamoDB table for orders, with fields for user ID, product IDs, order status, etc.
- Develop endpoints for placing orders and viewing order history.
- Use Amazon SNS to send order confirmation notifications.

### AWS Services

- **DynamoDB:** Manages order data.
- **SNS:** Sends real-time notifications for order confirmations.
- **CloudWatch:** Monitors Lambda execution and tracks error rates.

### CI/CD Update

- Update the GitHub Actions workflow to deploy new order management and notification functions.
- Run end-to-end tests to validate the order creation, status updating, and SNS notifications.

**Outcome:** An order management API with real-time notifications, continuously deployed via GitHub Actions.

---

## Level 5: Inventory Management and Automated Stock Notifications

**Goal:** Add inventory tracking and notifications for low stock levels.

### Features

- Track inventory counts in DynamoDB for each product, reducing stock with each order.
- Set low-stock thresholds and send automated alerts when stock is low.
- Use CloudWatch Events to periodically check stock levels and send reminders to restock.

### AWS Services

- **DynamoDB:** Maintains inventory levels.
- **CloudWatch Events:** Schedules Lambda functions to check stock levels regularly.
- **SNS:** Sends low-stock notifications.

### CI/CD Update

- Add inventory-related functions to the GitHub Actions deployment pipeline.
- Run scheduled tests or manual approval steps to ensure stock-checking functions work as intended.

**Outcome:** A complete inventory management system with automated stock tracking and notifications, seamlessly deployed via GitHub Actions.

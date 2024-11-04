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

**Outcome:** An order management API with real-time notifications, continuously deployed via GitHub Actions.

## Level 5: Queue-Based Order Processing

**Goal:** Implement an asynchronous order processing system using a queue, ensuring that only one order is processed at a time.

### Features

- SQS Order Queue: Set up an Amazon SQS queue to hold incoming orders for processing.
- Sequential Processing: Configure a Lambda worker to process orders from the queue with concurrency limited to one, ensuring orders are handled one at a time.
- Error Handling: Implement retry logic within the Lambda function to handle failures, with a maximum number of retries before logging the error or triggering an alert.
- Monitoring and Alerts:
  - Use Amazon CloudWatch to monitor the queue length and Lambda function execution.
  - Set up alarms to notify when messages are not processed successfully after retries or when the queue length exceeds a threshold.

### AWS Services

- **Amazon SQS:** Acts as the message queue for incoming orders.
- **AWS Lambda:** Processes orders from the SQS queue, with concurrency set to one for sequential execution.
- **CloudWatch:** Monitors Lambda function performance and SQS queue metrics, providing alerts on failures or performance issues.

**Outcome:** A robust, queue-based order processing system that handles orders one at a time with effective error handling and monitoring, continuously deployed via GitHub Actions.

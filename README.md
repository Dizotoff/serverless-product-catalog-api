# Serverless Product Catalog API

A comprehensive serverless e-commerce API built with TypeScript and the Serverless Framework, featuring product management, authentication, order processing, and real-time notifications.

## Architecture Overview

- **API Gateway**: REST API endpoints with Cognito authorization
- **Lambda Functions**: TypeScript-based handlers for all operations
- **DynamoDB**: Two tables for products and orders data
- **Cognito**: User authentication and role-based access control
- **SNS**: Real-time notifications for order events
- **SQS**: Asynchronous order processing queue with DLQ
- **CloudWatch**: Monitoring and alerting for queue metrics

## Key Features

### Product Management

- Full CRUD operations for products
- Role-based access control (admin/viewer)
- Input validation and error handling

### Authentication & Authorization

- AWS Cognito user pools
- Role-based permissions (admin/viewer/customer)
- Protected endpoints with Cognito authorizer

### Order Management

- Order creation and status tracking
- User-specific order history
- Real-time notifications via SNS
- Asynchronous processing via SQS
- Sequential order processing (one at a time)
- Error handling with Dead Letter Queue

## Local Development

The entire stack can be run and tested locally using:

- DynamoDB Local
- Serverless Offline
- ElasticMQ (for SQS simulation)
- Mock SNS notifications

## Testing

Comprehensive test suite covering:

- Product CRUD operations
- Order lifecycle
- Authentication and authorization
- Queue processing
- Error handling scenarios

Tests can be run both locally and against deployed environments.

## Deployment

Automated CI/CD pipeline using GitHub Actions:

- Triggered on pushes to main branch
- Deploys to AWS using Serverless Framework
- Manages multiple environments (dev/prod)

## Security

- IAM roles with least privilege principle
- Cognito-based authentication
- Role-based access control
- Secure API endpoints
- Environment-specific configurations

## Monitoring

- CloudWatch metrics and alarms
- Queue length monitoring
- Error rate tracking
- Processing time metrics

## Project Structure

- `/src/handlers`: Lambda function handlers
- `/src/clients`: AWS service clients
- `/src/auth`: Authentication utilities
- `/src/tests`: Test suites
- `/serverless.yml`: Infrastructure as code
- `/.github/workflows`: CI/CD configuration

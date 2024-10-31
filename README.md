# This is not a documentation.

Frequently used commands:

```
serverless deploy --stage dev
serverless offline --stage local
serverless remove
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
aws dynamodb delete-table --table-name table-name --endpoint-url http://localhost:8000 --region us-east-1
curl --request POST 'http://localhost:3000/local/products' --header 'Content-Type: application/json' --data-raw '{"name": "Kek", "productId": "someProductId"}'
curl http://localhost:3000/local/products/someProductId
```

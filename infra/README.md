# Infrastructure

This folder contains a minimal AWS SAM template for the serverless prototype.

## Intended AWS Resources

| Resource | Purpose |
|---|---|
| Amazon S3 bucket | Private static frontend hosting |
| Amazon CloudFront distribution | HTTPS frontend delivery and caching |
| CloudFront Origin Access Control | Private access from CloudFront to S3 |
| Amazon API Gateway HTTP API | Product and order API endpoints |
| AWS Lambda functions | Product and order backend logic |
| Amazon DynamoDB Products table | Product catalog persistence |
| Amazon DynamoDB Orders table | Submitted order persistence |
| Amazon CloudWatch Logs | Lambda/API logs |

## Deploy

```bash
cd infra
sam build
sam deploy --guided
```

## After Deploy

1. Copy the `ApiBaseUrl` output.
2. Update `frontend/config.js` with that value.
3. Upload frontend files:

```bash
aws s3 sync ../frontend s3://<FrontendBucketName>/
```

4. Seed product data:

```bash
python ../scripts/seed_products.py --table <ProductsTableName> --file ../sample-data/products.json
```

5. Open the CloudFront domain from the `CloudFrontDomainName` output.

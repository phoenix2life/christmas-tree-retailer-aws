# Christmas Tree Retailer — AWS Serverless Ecommerce Prototype

## 1. Executive Summary

This repository contains a timeboxed AWS architecture and implementation prototype for a small, seasonal Christmas tree retailer.

The goal is to demonstrate a simple ecommerce customer journey:

1. Browse available Christmas trees.
2. View product details.
3. Submit an order.
4. View submitted order details.

This solution is intentionally scoped as a 60-minute technical assessment prototype, not a production ecommerce platform. The design prioritizes simplicity, low operating cost, clear AWS alignment, responsible AI usage, and a practical path to production.

## 2. Business Scenario

A local Christmas tree retailer needs a lightweight ecommerce platform running on AWS. The retailer is small, seasonal, cost-conscious, and focused on a simple customer ordering experience.

## 3. Challenge Interpretation

This exercise is interpreted as an architecture and engineering judgment assessment, not a full ecommerce delivery project.

The primary goal is to show how I would:

- Break down an ambiguous business problem.
- Make pragmatic decisions under a 60-minute constraint.
- Use AWS services appropriately.
- Use AI tools responsibly.
- Communicate technical decisions clearly.
- Design a prototype that can evolve into a production-ready system.

## 4. Assumptions

1. The product catalog is small and seasonal.
2. Customers do not need accounts for the prototype.
3. Payment processing is out of scope.
4. Orders can be submitted and stored for manual retailer follow-up.
5. Customers or reviewers can retrieve submitted order details using an order ID.
6. Inventory synchronization is out of scope.
7. Administrative product/order-management tooling is out of scope.
8. The retailer wants low fixed cost and low operational overhead.
9. Deployment is optional for this assessment; architecture and reasoning are primary evaluation areas.
10. A custom AWS VPC is not required for this prototype because the selected services are managed/serverless services and do not require private subnet placement.

## 5. In Scope

| Capability | Description |
|---|---|
| Product catalog | Display available Christmas trees |
| Product detail | Show tree type, size, price, and availability |
| Order submission | Allow a customer to submit an order request |
| Order confirmation | Show confirmation after successful order submission |
| Order details | Retrieve and display details for a submitted order |
| Lightweight order list API | Support reviewer/demo validation of submitted orders |
| Minimal static UI | Demonstrate customer journey through browser-based screens |
| Backend API | Provide simple API endpoints for products and orders |
| Data persistence | Store product and order data |
| AWS architecture | Show how the solution would run on AWS |

## 6. Out of Scope

| Capability | Reason |
|---|---|
| Payment processing | Explicitly excluded from suggested scope |
| Customer authentication | Not required for prototype customer journey |
| Admin portal | Not required within the 60-minute timebox |
| Inventory synchronization | Too broad for this prototype |
| Order editing/cancellation | Adds workflow complexity beyond the prototype |
| Fulfillment workflow | Future operational enhancement |
| Production CI/CD | Future production enhancement |
| Multi-region disaster recovery | Not justified for prototype scope |
| Full observability platform | Basic logging only for prototype |
| Custom VPC networking | Not needed for selected serverless services in prototype |

## 7. Architecture Overview

The intended architecture follows a simple serverless AWS pattern:

```text
Customer Browser
      |
      v
Amazon CloudFront
      |
      v
Private Amazon S3 Bucket
Static HTML / CSS / JavaScript
      |
      v
Browser-side JavaScript calls API Gateway
      |
      v
AWS Lambda
      |
      v
Amazon DynamoDB
      |
      v
Amazon CloudWatch Logs
```

The frontend delivery path and API transaction path are separate:

1. Frontend delivery flow: Browser → CloudFront → private S3 bucket → CloudFront → Browser
2. API/data transaction flow: Browser JavaScript → API Gateway → Lambda → DynamoDB → Lambda → API Gateway → Browser

CloudFront and S3 serve the static frontend. They do not directly call the backend. After the browser loads the static HTML/CSS/JavaScript, browser-side JavaScript calls API Gateway over HTTPS.

See `docs/architecture.md` for diagrams and request flows.

## 8. Proposed AWS Services

| Need | AWS Service | Rationale |
|---|---|---|
| Static frontend hosting | Amazon S3 | Low-cost hosting for static assets |
| Global content delivery | Amazon CloudFront | HTTPS delivery, caching, and production-ready frontend path |
| Private frontend origin | CloudFront Origin Access Control | Keeps S3 bucket private and avoids direct public S3 exposure |
| API endpoint | Amazon API Gateway | Managed API layer with throttling and future authorization options |
| Backend compute | AWS Lambda | Pay-per-use, low operational overhead, seasonal traffic fit |
| Data persistence | Amazon DynamoDB | Simple access patterns, serverless, scalable, low maintenance |
| Logging and monitoring | Amazon CloudWatch | Basic visibility into API and Lambda behavior |
| Future authentication | Amazon Cognito | Possible future customer/admin identity option |
| Future protection | AWS WAF | Optional production hardening for public endpoints |

## 9. VPC Decision

This prototype does not use a custom AWS VPC.

The selected services — Amazon S3, Amazon CloudFront, Amazon API Gateway, AWS Lambda, Amazon DynamoDB, and Amazon CloudWatch — support the prototype’s serverless architecture without requiring private subnet placement.

A VPC would be considered in a future production design if the solution introduces private Amazon RDS/Aurora databases, EC2/ECS/EKS workloads, private admin services, VPC endpoints, Direct Connect/VPN connectivity, NAT-controlled outbound traffic, or enterprise network segmentation requirements.

## 10. Static Frontend Security

For the static frontend, the intended production security pattern is:

```text
Customer Browser → CloudFront over HTTPS → Private S3 Bucket via Origin Access Control
```

Security controls:

- S3 Block Public Access enabled.
- CloudFront Origin Access Control for S3 access.
- HTTPS through CloudFront.
- No secrets in frontend code.
- Optional AWS WAF for production protection.
- Security headers and access logging as production enhancements.

## 11. API Security Without VPC

The API path can be secure enough for the prototype without a custom VPC if the design applies basic cloud-native controls:

- IAM least privilege for Lambda access to DynamoDB.
- Input validation for order submission.
- API Gateway CORS and future throttling.
- CloudWatch logging.
- No payment/card data stored.
- No secrets in code.
- Order list endpoint should be protected or removed before production unless admin authentication is added.

## 12. User Interface Scope

The prototype includes a minimal static frontend to demonstrate the customer journey.

| UI Area | Purpose |
|---|---|
| Product Catalog | Browse available Christmas trees |
| Product Detail | View selected tree information |
| Order Form | Submit customer order request |
| Order Confirmation | Display successful order submission and order ID |
| Order Details | Display complete details for a submitted order |
| Orders List | Reviewer/demo support for validating stored orders |

The UI is intentionally simple and customer-focused. It is not intended to be a full administrative console.

## 13. API Design

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| GET | `/products` | List available Christmas trees | Customer-facing catalog view |
| GET | `/products/{productId}` | Retrieve product details | Customer-facing detail page |
| POST | `/orders` | Submit a customer order | Customer-facing order submission |
| GET | `/orders/{orderId}` | Retrieve a submitted order | Order confirmation/details and reviewer validation |
| GET | `/orders` | List submitted orders | Reviewer/demo support; future admin capability |

The order retrieval APIs are included to demonstrate persistence and provide a simple review/demo path. Full administrative order management, authentication, payment, inventory synchronization, editing, cancellation, and fulfillment workflow remain out of scope.

## 14. Data Model

### Product

| Field | Description |
|---|---|
| productId | Unique product identifier |
| name | Tree name |
| type | Tree type |
| size | Tree size |
| price | Retail price |
| description | Product description |
| availableQuantity | Available quantity |
| imageUrl | Optional image reference |

### Order

| Field | Description |
|---|---|
| orderId | Unique order identifier |
| customerName | Customer name |
| customerEmail | Customer email |
| customerPhone | Optional customer phone |
| productId | Ordered product |
| productName | Product name snapshot at time of order |
| quantity | Requested quantity |
| unitPrice | Product price snapshot at time of order |
| estimatedTotal | Quantity × unit price |
| status | Submitted |
| createdAt | Order creation timestamp |

## 15. Repository Structure

```text
christmas-tree-retailer-aws/
├── README.md
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── config.js
├── backend/
│   └── src/
│       ├── products.py
│       └── orders.py
├── infra/
│   ├── README.md
│   └── template.yaml
├── docs/
│   └── architecture.md
├── sample-data/
│   ├── products.json
│   └── orders.example.json
└── scripts/
    └── seed_products.py
```

## 16. Local Setup Instructions

### Static UI Demo

Open `frontend/index.html` in a browser.

If `API_BASE_URL` is empty in `frontend/config.js`, the UI uses local sample data so the basic UI can be reviewed without AWS deployment.

### AWS Deployment Path

Prerequisites:

- AWS CLI configured
- AWS SAM CLI installed
- Python 3.12

Deploy:

```bash
cd infra
sam build
sam deploy --guided
```

After deployment:

1. Copy the API Gateway URL from SAM outputs.
2. Update `frontend/config.js` with the deployed API URL.
3. Upload frontend assets to the S3 bucket from the SAM output.
4. Access the site through the CloudFront distribution domain.
5. Seed product data using `scripts/seed_products.py`.

## 17. Configuration

| Variable | Purpose |
|---|---|
| PRODUCTS_TABLE_NAME | DynamoDB table for products |
| ORDERS_TABLE_NAME | DynamoDB table for orders |
| AWS_REGION | AWS region |
| STAGE | Local, dev, or prod stage |
| API_BASE_URL | Frontend API endpoint |

Production enhancement: use AWS Systems Manager Parameter Store or AWS Secrets Manager for sensitive configuration. Avoid hardcoded secrets.

## 18. AI Tools Used

AI tools may be used as a force multiplier during the assessment.

| AI Use | Purpose |
|---|---|
| Documentation structure | Help organize README sections |
| Code scaffolding | Generate initial boilerplate for review |
| Frontend scaffolding | Help create simple static UI |
| Debugging assistance | Help identify syntax or configuration issues |
| Tradeoff review | Compare simple AWS architecture options |
| Architecture review | Validate whether selected services fit business constraints |

## 19. Independent Decisions

The following decisions remain human-owned:

1. Final scope selection.
2. Architecture pattern.
3. AWS service choices.
4. VPC exclusion decision.
5. Static frontend security pattern.
6. UI scope.
7. API design.
8. Data model.
9. Security assumptions.
10. Tradeoffs.
11. Out-of-scope decisions.
12. Final review of generated code and documentation.
13. Production-readiness roadmap.

AI may assist with speed, but final responsibility for correctness and judgment remains with the candidate.

## 20. AI-Generated Suggestions Rejected

| Suggestion | Reason Rejected |
|---|---|
| Kubernetes or EKS | Too complex for small seasonal retailer prototype |
| Full payment processing | Out of scope and introduces PCI/security complexity |
| Full user authentication | Not required for minimum customer journey |
| Multi-region active-active design | Overengineered for prototype |
| Complex event-driven architecture | Not needed for initial browse/detail/order flow |
| Admin inventory portal | Out of scope for 60-minute assessment |
| Order editing/cancellation workflow | Adds complexity beyond order submission and retrieval |
| RDS-first design | DynamoDB better fits simple access patterns and low operations |
| Custom VPC in prototype | Not required for selected managed/serverless services |

## 21. Key Tradeoffs

| Decision | Tradeoff |
|---|---|
| Serverless over containers | Lower operations and cost, less runtime control than containers |
| No custom VPC | Simpler and lower cost, but future private resources may require VPC |
| CloudFront + private S3 | Better static site security, slightly more setup than public S3 website hosting |
| DynamoDB over RDS | Simpler and serverless, but less suitable for complex relational reporting |
| Static UI over full frontend framework | Faster and simpler, but less rich application structure |
| Order detail API included | Improves validation and user flow, but avoids full admin workflow |
| Order list API included | Useful for reviewer/demo validation, but not treated as production admin tooling |
| No authentication | Faster prototype, but not suitable for admin or account-based production use |
| No payment integration | Keeps scope safe and focused, but not a complete ecommerce platform |

## 22. Security Considerations

Prototype-level security considerations:

- No secrets committed to source control.
- S3 bucket should remain private.
- S3 Block Public Access should remain enabled.
- CloudFront Origin Access Control should be used for static asset access.
- HTTPS should be served through CloudFront.
- Basic input validation for order submission.
- Least-privilege IAM for Lambda access to DynamoDB.
- DynamoDB encryption at rest.
- API Gateway CORS and future throttling.
- No payment card data stored or processed.
- Order listing endpoint should be protected or removed before production unless admin authentication is added.

Production security enhancements:

- Amazon Cognito for customer/admin identity if needed.
- AWS WAF in front of CloudFront/API Gateway.
- Structured logging and security monitoring.
- Secrets Manager or Parameter Store for sensitive configuration.
- CI/CD security scanning and dependency scanning.
- CloudTrail and AWS Config integration.
- Backup and retention policies.
- Threat model before production launch.
- Separate customer-facing APIs from admin/fulfillment APIs.

## 23. Path to Production

| Area | Production Enhancement |
|---|---|
| Identity | Cognito for customer/admin access |
| Payments | Third-party payment provider; avoid storing cardholder data |
| Admin operations | Product, inventory, fulfillment, and order-management interface |
| CI/CD | Automated build, test, deploy pipeline |
| Infrastructure | Complete IaC using SAM, CDK, CloudFormation, or Terraform |
| Frontend security | CloudFront OAC, security headers, access logging |
| API security | WAF, throttling, validation, auth where needed |
| Observability | Structured logs, metrics, alarms, dashboards |
| Reliability | Backups, retry handling, error handling, runbooks |
| Cost control | Budgets, tags, usage alerts |
| Data model | Inventory reservations, order status transitions, audit fields |
| Networking | Add VPC only if private resources or enterprise network requirements emerge |

## 24. Known Limitations

1. Not production-ready.
2. No payment processing.
3. No authentication.
4. No admin console.
5. No real-time inventory management.
6. No order editing or cancellation.
7. No fulfillment workflow.
8. Limited testing.
9. Limited observability.
10. No custom VPC in the prototype.
11. Deployment may be represented through infrastructure definitions rather than live deployment.
12. Security hardening is documented as a production path rather than fully implemented.

## 25. Reviewer Summary

This solution demonstrates pragmatic AWS architecture judgment for a small, seasonal, cost-conscious retailer. It implements a minimum customer journey: product browsing, product details, order submission, order confirmation, and order detail retrieval. It avoids unnecessary complexity, documents assumptions and tradeoffs, uses AI responsibly, and provides a clear path from prototype to production.

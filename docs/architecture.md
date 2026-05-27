# Architecture Diagram and Request Flow

## 1. High-Level Architecture

```mermaid
flowchart TD
    U[Customer Browser]

    subgraph Frontend_Delivery["Frontend Delivery"]
        CF[Amazon CloudFront<br/>HTTPS + Caching]
        S3[Private Amazon S3 Bucket<br/>Static UI via Origin Access Control]
    end

    subgraph API_Backend["API Backend"]
        APIGW[Amazon API Gateway<br/>HTTPS API]
        LP[AWS Lambda<br/>Products API]
        LO[AWS Lambda<br/>Orders API]
        DDBP[(DynamoDB<br/>Products Table)]
        DDBO[(DynamoDB<br/>Orders Table)]
        CW[CloudWatch Logs]
    end

    U -->|Request website| CF
    CF -->|Fetch static assets via OAC| S3
    S3 -->|Return assets| CF
    CF -->|Serve HTML/CSS/JS| U

    U -->|Browser JavaScript calls API| APIGW
    APIGW --> LP
    APIGW --> LO
    LP --> DDBP
    LO --> DDBP
    LO --> DDBO
    LP --> CW
    LO --> CW
    LP --> APIGW
    LO --> APIGW
    APIGW -->|Return JSON response| U
```

## 2. Architecture Summary

The prototype uses a simple serverless AWS architecture.

| Layer | Component |
|---|---|
| User interface | Static HTML/CSS/JavaScript frontend |
| Frontend hosting | Amazon S3 |
| Content delivery | Amazon CloudFront |
| API layer | Amazon API Gateway |
| Backend logic | AWS Lambda |
| Data persistence | Amazon DynamoDB |
| Logging | Amazon CloudWatch |

## 3. Frontend Delivery and API Transaction Separation

CloudFront and S3 serve only the static frontend. They do not directly call the backend.

Once the browser loads the static HTML/CSS/JavaScript application, browser-side JavaScript calls API Gateway over HTTPS. API Gateway invokes Lambda functions, Lambda interacts with DynamoDB, and JSON responses return through API Gateway to the browser.

## 4. End-to-End Request / Response Sequence

```mermaid
sequenceDiagram
    actor Customer
    participant Browser as Browser / Static UI
    participant CloudFront as Amazon CloudFront
    participant S3 as Private S3 Bucket
    participant API as API Gateway
    participant Lambda as AWS Lambda
    participant DynamoDB as Amazon DynamoDB
    participant Logs as CloudWatch Logs

    Customer->>Browser: Open website URL
    Browser->>CloudFront: GET static site over HTTPS
    CloudFront->>S3: Fetch HTML/CSS/JS using OAC
    S3-->>CloudFront: Return static assets
    CloudFront-->>Browser: Serve static site
    Browser-->>Customer: Render UI

    Browser->>API: GET /products or POST /orders
    API->>Lambda: Invoke API handler
    Lambda->>DynamoDB: Read/write product or order data
    DynamoDB-->>Lambda: Return data/write result
    Lambda->>Logs: Write request log
    Lambda-->>API: Return JSON response
    API-->>Browser: Return API response
    Browser-->>Customer: Update UI
```

## 5. Customer Journey Flow

```mermaid
flowchart TD
    A[Customer opens website] --> B[View product catalog]
    B --> C[Select Christmas tree]
    C --> D[View product details]
    D --> E[Submit order form]
    E --> F[Order is saved]
    F --> G[Order confirmation displayed]
    G --> H[Customer or reviewer views order details]
```

## 6. API Request Flows

### 6.1 Product Catalog Request Flow

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Browser / Static UI
    participant API as API Gateway
    participant Lambda as Products Lambda
    participant DB as DynamoDB Products Table
    participant Logs as CloudWatch Logs

    Customer->>UI: Open product catalog
    UI->>API: GET /products
    API->>Lambda: Invoke Products Lambda
    Lambda->>DB: Query/scan available products
    DB-->>Lambda: Return product list
    Lambda->>Logs: Write request log
    Lambda-->>API: Product list response
    API-->>UI: 200 OK with products
    UI-->>Customer: Display product catalog
```

### 6.2 Product Detail Request Flow

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Browser / Static UI
    participant API as API Gateway
    participant Lambda as Products Lambda
    participant DB as DynamoDB Products Table
    participant Logs as CloudWatch Logs

    Customer->>UI: Select product
    UI->>API: GET /products/{productId}
    API->>Lambda: Invoke Products Lambda
    Lambda->>DB: Get product by productId
    DB-->>Lambda: Return product details
    Lambda->>Logs: Write request log
    Lambda-->>API: Product detail response
    API-->>UI: 200 OK with product details
    UI-->>Customer: Display product detail page
```

### 6.3 Order Submission Request Flow

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Browser / Static UI
    participant API as API Gateway
    participant Lambda as Orders Lambda
    participant ProductsDB as DynamoDB Products Table
    participant OrdersDB as DynamoDB Orders Table
    participant Logs as CloudWatch Logs

    Customer->>UI: Submit order form
    UI->>API: POST /orders
    API->>Lambda: Invoke Orders Lambda
    Lambda->>ProductsDB: Validate product exists
    ProductsDB-->>Lambda: Return product snapshot
    Lambda->>OrdersDB: Save submitted order
    OrdersDB-->>Lambda: Confirm write
    Lambda->>Logs: Write request log
    Lambda-->>API: Order confirmation response
    API-->>UI: 201 Created with orderId
    UI-->>Customer: Display order confirmation
```

### 6.4 Order Detail Request Flow

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Browser / Static UI
    participant API as API Gateway
    participant Lambda as Orders Lambda
    participant DB as DynamoDB Orders Table
    participant Logs as CloudWatch Logs

    Customer->>UI: View order details
    UI->>API: GET /orders/{orderId}
    API->>Lambda: Invoke Orders Lambda
    Lambda->>DB: Get order by orderId
    DB-->>Lambda: Return order
    Lambda->>Logs: Write request log
    Lambda-->>API: Order detail response
    API-->>UI: 200 OK with order details
    UI-->>Customer: Display order details
```

### 6.5 Order List Request Flow

```mermaid
sequenceDiagram
    actor Reviewer
    participant UI as Browser / Static UI
    participant API as API Gateway
    participant Lambda as Orders Lambda
    participant DB as DynamoDB Orders Table
    participant Logs as CloudWatch Logs

    Reviewer->>UI: Open orders list
    UI->>API: GET /orders
    API->>Lambda: Invoke Orders Lambda
    Lambda->>DB: Query/scan submitted orders
    DB-->>Lambda: Return order list
    Lambda->>Logs: Write request log
    Lambda-->>API: Orders response
    API-->>UI: 200 OK with orders
    UI-->>Reviewer: Display submitted orders
```

## 7. Data Model Diagram

```mermaid
erDiagram
    PRODUCT {
        string productId
        string name
        string type
        string size
        number price
        string description
        number availableQuantity
        string imageUrl
    }

    ORDER {
        string orderId
        string customerName
        string customerEmail
        string customerPhone
        string productId
        string productName
        number quantity
        number unitPrice
        number estimatedTotal
        string status
        string createdAt
    }

    PRODUCT ||--o{ ORDER : "ordered as snapshot"
```

## 8. Production Evolution View

```mermaid
flowchart TD
    P[Prototype] --> A[Add Cognito for auth]
    P --> B[Add payment provider]
    P --> C[Add admin inventory and order tools]
    P --> D[Add CI/CD pipeline]
    P --> E[Add WAF and API protection]
    P --> F[Add structured logs and alarms]
    P --> G[Add backup and retention policies]
    P --> H[Add cost monitoring and budgets]
    P --> I[Add VPC only if private resources emerge]
```

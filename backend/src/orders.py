import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3


dynamodb = boto3.resource("dynamodb")
products_table = dynamodb.Table(os.environ["PRODUCTS_TABLE_NAME"])
orders_table = dynamodb.Table(os.environ["ORDERS_TABLE_NAME"])


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None


def _validate_order_input(data):
    if not data:
        return "Request body must be valid JSON"

    required = ["customerName", "customerEmail", "productId", "quantity"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return f"Missing required field(s): {', '.join(missing)}"

    try:
        quantity = int(data["quantity"])
    except (TypeError, ValueError):
        return "Quantity must be a positive integer"

    if quantity < 1:
        return "Quantity must be at least 1"

    return None


def _create_order(event):
    data = _parse_body(event)
    validation_error = _validate_order_input(data)
    if validation_error:
        return _response(400, {"message": validation_error})

    product_id = data["productId"]
    product = products_table.get_item(Key={"productId": product_id}).get("Item")
    if not product:
        return _response(404, {"message": "Product not found"})

    quantity = int(data["quantity"])
    available = int(product.get("availableQuantity", 0))
    if quantity > available:
        return _response(409, {"message": "Requested quantity exceeds available inventory"})

    unit_price = Decimal(str(product.get("price", 0)))
    estimated_total = unit_price * Decimal(quantity)
    order_id = f"order-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

    order = {
        "orderId": order_id,
        "customerName": data["customerName"].strip(),
        "customerEmail": data["customerEmail"].strip(),
        "customerPhone": data.get("customerPhone", "").strip(),
        "productId": product["productId"],
        "productName": product["name"],
        "quantity": quantity,
        "unitPrice": unit_price,
        "estimatedTotal": estimated_total,
        "status": "Submitted",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    orders_table.put_item(Item=order)
    return _response(201, order)


def _get_order(order_id):
    item = orders_table.get_item(Key={"orderId": order_id}).get("Item")
    if not item:
        return _response(404, {"message": "Order not found"})
    return _response(200, item)


def _list_orders():
    result = orders_table.scan()
    orders = sorted(result.get("Items", []), key=lambda item: item.get("createdAt", ""), reverse=True)
    return _response(200, orders)


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params = event.get("pathParameters") or {}
    order_id = path_params.get("orderId")

    if method == "OPTIONS":
        return _response(200, {})

    try:
        if method == "POST":
            return _create_order(event)
        if method == "GET" and order_id:
            return _get_order(order_id)
        if method == "GET":
            return _list_orders()
        return _response(405, {"message": "Method not allowed"})
    except Exception as exc:
        print(f"Orders API error: {exc}")
        return _response(500, {"message": "Internal server error"})

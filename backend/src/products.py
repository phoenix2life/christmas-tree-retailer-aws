import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr


dynamodb = boto3.resource("dynamodb")
products_table = dynamodb.Table(os.environ["PRODUCTS_TABLE_NAME"])


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_params = event.get("pathParameters") or {}
    product_id = path_params.get("productId")

    if method == "OPTIONS":
        return _response(200, {})

    try:
        if product_id:
            item = products_table.get_item(Key={"productId": product_id}).get("Item")
            if not item:
                return _response(404, {"message": "Product not found"})
            return _response(200, item)

        result = products_table.scan(FilterExpression=Attr("availableQuantity").gt(0))
        products = sorted(result.get("Items", []), key=lambda item: item.get("name", ""))
        return _response(200, products)
    except Exception as exc:
        print(f"Products API error: {exc}")
        return _response(500, {"message": "Internal server error"})

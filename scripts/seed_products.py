#!/usr/bin/env python3
import argparse
import json
from decimal import Decimal
from pathlib import Path

import boto3


def decimalize(value):
    if isinstance(value, list):
        return [decimalize(item) for item in value]
    if isinstance(value, dict):
        return {key: decimalize(item) for key, item in value.items()}
    if isinstance(value, float):
        return Decimal(str(value))
    return value


def main():
    parser = argparse.ArgumentParser(description="Seed Christmas tree product data into DynamoDB.")
    parser.add_argument("--table", required=True, help="DynamoDB products table name")
    parser.add_argument("--file", default="sample-data/products.json", help="Path to products JSON file")
    args = parser.parse_args()

    products_path = Path(args.file)
    products = json.loads(products_path.read_text())
    table = boto3.resource("dynamodb").Table(args.table)

    with table.batch_writer() as batch:
        for product in products:
            batch.put_item(Item=decimalize(product))

    print(f"Seeded {len(products)} product(s) into {args.table}")


if __name__ == "__main__":
    main()

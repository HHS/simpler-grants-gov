"""Example usage of the SAM.gov client."""

import argparse
import logging
import os
import sys

from src.adapters.sam_gov import SamEntityRequest, create_sam_gov_client

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def main() -> int:
    """Example usage of the SAM.gov client."""
    parser = argparse.ArgumentParser(description="Example usage of the SAM.gov client.")
    parser.add_argument("--use-mock", action="store_true", help="Use mock client")
    parser.add_argument("--uei", required=True, help="UEI to look up")

    args = parser.parse_args()

    # Set up environment variables based on args
    if args.use_mock:
        os.environ["SAM_GOV_USE_MOCK"] = "true"

    # Create the client
    client = create_sam_gov_client()

    # Log what type of client we're using
    logger.info(f"Using client type: {type(client).__name__}")

    # Look up an entity
    try:
        entity = client.get_entity(SamEntityRequest(uei=args.uei))

        if entity:
            logger.info(f"Found entity: {entity.legal_business_name}")
            logger.info(f"UEI: {entity.uei}")
            logger.info(f"Status: {entity.entity_status}")
            logger.info(f"Type: {entity.entity_type}")
            logger.info(f"Physical address: {entity.physical_address}")

            if entity.mailing_address:
                logger.info(f"Mailing address: {entity.mailing_address}")

            logger.info(f"Created: {entity.created_date}")
            logger.info(f"Last updated: {entity.last_updated_date}")
        else:
            logger.warning(f"No entity found with UEI {args.uei}")

    except Exception as e:
        logger.error(f"Error retrieving entity: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

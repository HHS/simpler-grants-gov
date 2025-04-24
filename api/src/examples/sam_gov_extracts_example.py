"""Example usage of the SAM.gov extract download functionality."""

import argparse
import logging
import os
import sys
from datetime import datetime

from src.adapters.sam_gov import (
    ExtractType,
    FileFormat,
    FileType,
    SamExtractRequest,
    SensitivityLevel,
    create_sam_gov_client,
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def main() -> int:
    """Example usage of the SAM.gov extract download functionality."""
    parser = argparse.ArgumentParser(
        description="Example usage of the SAM.gov extract download API."
    )
    parser.add_argument("--use-mock", action="store_true", help="Use mock client")
    parser.add_argument("--output-dir", default="./downloads", help="Directory to save downloads")
    parser.add_argument("--username", help="Username for accessing sensitive data")
    parser.add_argument("--password", help="Password for accessing sensitive data")

    # File selection options
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file-name", help="Specific file name to download")
    group.add_argument(
        "--file-type",
        choices=["ENTITY", "EXCLUSION", "SCR", "BIO"],
        help="Type of extract to download",
    )

    # Options for file-type based download
    parser.add_argument(
        "--sensitivity",
        choices=["PUBLIC", "FOUO", "SENSITIVE"],
        default="PUBLIC",
        help="Sensitivity level of the extract",
    )
    parser.add_argument(
        "--extract-type",
        choices=["MONTHLY", "DAILY"],
        default="MONTHLY",
        help="Type of extract (monthly or daily)",
    )
    parser.add_argument(
        "--format", choices=["UTF8", "ASCII"], default="UTF8", help="Format of the extract file"
    )
    parser.add_argument("--create-date", help="Specific date for the extract in YYYYMMDD format")
    parser.add_argument("--include-expired", action="store_true", help="Include expired entities")

    args = parser.parse_args()

    # Set up environment variables based on args
    if args.use_mock:
        os.environ["SAM_GOV_USE_MOCK"] = "true"

    # Create the client
    config_override = None
    if args.username and args.password:
        config_override = {"username": args.username, "password": args.password}
    client = create_sam_gov_client(config_override=config_override)

    # Log what type of client we're using
    logger.info(f"Using client type: {type(client).__name__}")

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    # Set up the request
    extract_request = SamExtractRequest()

    if args.file_name:
        extract_request.file_name = args.file_name
        logger.info(f"Downloading file by name: {args.file_name}")
    else:
        # Using parameter-based download
        extract_request.file_type = FileType(args.file_type)
        extract_request.sensitivity = SensitivityLevel(args.sensitivity)
        extract_request.extract_type = ExtractType(args.extract_type)
        extract_request.format = FileFormat(args.format)
        extract_request.include_expired = args.include_expired

        if args.create_date:
            extract_request.create_date = args.create_date

        logger.info(
            f"Downloading {args.sensitivity} {args.extract_type} {args.file_type} extract "
            f"in {args.format} format"
        )

    try:
        # Determine output file path
        if args.file_name:
            output_path = os.path.join(args.output_dir, args.file_name)
        else:
            # Create a filename based on the parameters
            date_str = args.create_date or datetime.now().strftime("%Y%m%d")
            filename = (
                f"SAM_{args.sensitivity}_"
                f"{'UTF-8_' if args.format == 'UTF8' else ''}"
                f"{args.extract_type}_"
                f"V2_{date_str}.ZIP"
            )
            output_path = os.path.join(args.output_dir, filename)

        # Download the extract
        logger.info(f"Downloading to: {output_path}")

        extract_response = client.download_extract(extract_request, output_path)

        logger.info(f"Downloaded file: {extract_response.file_name}")
        logger.info(f"File size: {extract_response.file_size:,} bytes")
        logger.info(f"Content type: {extract_response.content_type}")
        logger.info(f"Sensitivity: {extract_response.sensitivity}")
        logger.info(f"Download date: {extract_response.download_date}")

        # Verify the file exists and has the expected size
        actual_size = os.path.getsize(output_path)
        if actual_size != extract_response.file_size:
            logger.warning(
                f"File size mismatch: reported {extract_response.file_size:,} bytes, "
                f"actual {actual_size:,} bytes"
            )
    except ValueError as e:
        logger.error(f"Invalid request: {e}")
        return 1
    except IOError as e:
        logger.error(f"IO Error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Error downloading extract: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

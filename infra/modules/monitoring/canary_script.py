from selenium.webdriver.common.by import By
from aws_synthetics.selenium import synthetics_webdriver as syn_webdriver
from aws_synthetics.common import synthetics_logger as logger


def main():

    url = "https://simpler.grants.gov"

    # Set screenshot option
    takeScreenshot = True

    browser = syn_webdriver.Chrome()
    browser.get(url)

    if takeScreenshot:
        browser.save_screenshot("loaded.png")

    response_code = syn_webdriver.get_http_response(url)
    if not response_code or response_code < 200 or response_code > 299:
        raise Exception("Failed to load page!")
    logger.info("Canary successfully executed.")

def handler(event, context):
    # user defined log statements using synthetics_logger
    logger.info("Selenium Python heartbeat canary.")
    return main()
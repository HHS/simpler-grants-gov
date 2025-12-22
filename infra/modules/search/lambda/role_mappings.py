import json
import os
import logging
import base64
import urllib.request
import urllib.error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def make_request(method, url, body, basic_auth):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {basic_auth}'
    }

    req = urllib.request.Request(
        url,
        data=body.encode() if body else None,
        headers=headers,
        method=method
    )
    return urllib.request.urlopen(req)

def handler(event, context):
    logger.info("Starting OpenSearch FGAC role mappings configuration")

    endpoint = os.environ['OPENSEARCH_ENDPOINT']
    username = event['username']
    password = event['password']
    ingest_role_arn = event['ingest_role_arn']
    query_role_arn = event['query_role_arn']
    sso_admin_role_arn = event['sso_admin_role_arn']

    logger.info(f"OpenSearch endpoint: {endpoint}")
    logger.info(f"Ingest role ARN: {ingest_role_arn}")
    logger.info(f"Query role ARN: {query_role_arn}")
    logger.info(f"SSO Admin role ARN: {sso_admin_role_arn}")

    basic_auth = base64.b64encode(f"{username}:{password}".encode()).decode()
    logger.info(f"Using master user: {username}")

    results = {}
    success = True

    # Map ingest role and SSO admin to all_access (full write permissions)
    logger.info("Configuring 'all_access' role mapping for ingest and SSO admin roles...")
    all_access_mapping = {
        "backend_roles": [ingest_role_arn, sso_admin_role_arn]
    }
    results['all_access'] = put_role_mapping(
        endpoint, 'all_access', all_access_mapping, basic_auth
    )
    if results['all_access']['status'] == 'error':
        logger.error(f"Failed to configure 'all_access' role mapping: {results['all_access']['error']}")
        success = False
    else:
        logger.info(f"Successfully configured 'all_access' role mapping: {results['all_access']['status']}")

    # Map query role to readall (read-only permissions)
    logger.info("Configuring 'readall' role mapping for query role...")
    readall_mapping = {
        "backend_roles": [query_role_arn]
    }
    results['readall'] = put_role_mapping(
        endpoint, 'readall', readall_mapping, basic_auth
    )
    if results['readall']['status'] == 'error':
        logger.error(f"Failed to configure 'readall' role mapping: {results['readall']['error']}")
        success = False
    else:
        logger.info(f"Successfully configured 'readall' role mapping: {results['readall']['status']}")

    if success:
        logger.info("OpenSearch FGAC role mappings configuration completed successfully!")
        # Verify the mappings by fetching them back
        logger.info("=" * 60)
        logger.info("VERIFYING ROLE MAPPINGS...")
        logger.info("=" * 60)
        verify_role_mapping(endpoint, 'all_access', basic_auth)
        verify_role_mapping(endpoint, 'readall', basic_auth)
        logger.info("=" * 60)
    else:
        logger.error("OpenSearch FGAC role mappings configuration completed with errors")

    return {
        'statusCode': 200 if success else 500,
        'body': json.dumps(results),
        'success': success
    }

def verify_role_mapping(endpoint, role_name, basic_auth):
    """Fetch and log the current role mapping to verify it was set correctly."""
    url = f"https://{endpoint}/_plugins/_security/api/rolesmapping/{role_name}"
    try:
        with make_request('GET', url, None, basic_auth) as response:
            response_body = response.read().decode()
            mapping = json.loads(response_body)
            if role_name in mapping:
                backend_roles = mapping[role_name].get('backend_roles', [])
                logger.info(f"VERIFIED '{role_name}' backend_roles:")
                for role in backend_roles:
                    logger.info(f"  - {role}")
            else:
                logger.warning(f"Role mapping '{role_name}' not found in response")
    except Exception as e:
        logger.error(f"Failed to verify '{role_name}' mapping: {str(e)}")

def put_role_mapping(endpoint, role_name, mapping, basic_auth):
    """Update a role mapping in OpenSearch by merging with existing backend_roles."""
    url = f"https://{endpoint}/_plugins/_security/api/rolesmapping/{role_name}"
    logger.info(f"Configuring role mapping for '{role_name}' at: {url}")

    new_backend_roles = mapping["backend_roles"]
    existing_backend_roles = []

    # First, try to GET the existing role mapping
    try:
        logger.info(f"Getting existing role mapping for '{role_name}'...")
        with make_request('GET', url, None, basic_auth) as response:
            response_body = response.read().decode()
            logger.info(f"GET response for '{role_name}': {response_body}")
            existing_mapping = json.loads(response_body)
            if role_name in existing_mapping:
                existing_backend_roles = existing_mapping[role_name].get('backend_roles', [])
                logger.info(f"Existing backend_roles for '{role_name}': {existing_backend_roles}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            logger.info(f"Role mapping '{role_name}' does not exist yet, will create new")
        else:
            error_body = e.read().decode()
            logger.warning(f"GET failed for '{role_name}': {e.code} - {error_body}")
    except Exception as e:
        logger.warning(f"Error getting existing mapping for '{role_name}': {str(e)}")

    # Merge existing and new backend_roles (deduplicated)
    merged_backend_roles = list(set(existing_backend_roles + new_backend_roles))
    logger.info(f"Merged backend_roles for '{role_name}': {merged_backend_roles}")

    # PUT the merged mapping
    merged_mapping = {"backend_roles": merged_backend_roles}
    body = json.dumps(merged_mapping)

    try:
        logger.info(f"PUT role mapping for '{role_name}' with backend_roles: {merged_backend_roles}")
        with make_request('PUT', url, body, basic_auth) as response:
            response_body = response.read().decode()
            logger.info(f"PUT successful for '{role_name}': {response_body}")
            return {'status': 'updated', 'response': response_body, 'backend_roles': merged_backend_roles}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        error_msg = f"PUT failed: {e.code} - {error_body}"
        logger.error(error_msg)
        return {'status': 'error', 'error': error_msg}
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unexpected error during PUT: {error_msg}")
        return {'status': 'error', 'error': error_msg}

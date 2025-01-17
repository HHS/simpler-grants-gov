# Dockerfile for building opensearch image with Ingest-attachment plugin

# Use OpenSearch base image
FROM opensearchproject/opensearch:latest

# Install the Ingest Attachment plugin
# This image is only used for local development
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch ingest-attachment


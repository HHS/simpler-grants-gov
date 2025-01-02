# Dockerfile for building opensearch image with Ingest-attachment plugin

# Use OpenSearch base image
FROM opensearchproject/opensearch:latest

# Install the Ingest Attachment plugin
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch ingest-attachment


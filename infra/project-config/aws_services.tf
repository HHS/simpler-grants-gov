locals {
  aws_services = [
    // AWS Certificate Manager – Manages SSL/TLS certificates for secure network connections. Used for HTTPS support.
    "acm",

    // Amazon API Gateway – Provides fully managed API management for REST, HTTP, and WebSocket APIs.
    "apigateway",

    // Application Auto Scaling – Enables automatic scaling of AWS services beyond EC2.
    "application-autoscaling",

    // AWS Auto Scaling – Automatically adjusts EC2 instance capacity based on demand.
    "autoscaling",

    // AWS Backup – Centralized service for automating backups across AWS resources.
    "backup",

    // Amazon CloudWatch – Monitors and logs AWS resources and applications.
    "cloudwatch",

    // Amazon Cognito Identity Provider – Manages authentication and authorization for applications.
    "cognito-idp",

    // Amazon DynamoDB – A NoSQL database for key-value and document storage. Used for Terraform state locks.
    "dynamodb",

    // Amazon EC2 – Provides compute capacity in the cloud with virtual servers.
    "ec2",

    // Amazon Elastic Container Registry – A managed container image registry for Docker images.
    "ecr",

    // Amazon ECS – A managed container orchestration service for running Docker containers.
    "ecs",

    // AWS Elastic Beanstalk – A platform-as-a-service for deploying and scaling web applications.
    "elasticbeanstalk",

    // Elastic Load Balancing (ELB) – Distributes incoming traffic across multiple targets.
    "elasticloadbalancing",

    // Amazon EventBridge – Serverless event bus for event-driven applications and AWS service integrations. Used for event-based jobs.
    "events",

    // AWS Identity and Access Management – Manages users, roles, and permissions for AWS services.
    "iam",

    // AWS Key Management Service – Manages encryption keys for securing AWS data.
    "kms",

    // AWS Lambda – Runs code without provisioning or managing servers in response to events.
    "lambda",

    // Amazon CloudWatch Logs – Collects, monitors, and analyzes log data from AWS services.
    "logs",

    // Amazon Pinpoint – Provides customer engagement and messaging capabilities. Used for notifications.
    "mobiletargeting",

    // Amazon EventBridge Pipes – Connects event producers to consumers with filtering and enrichment.
    "pipes",

    // Amazon RDS – A relational database service supporting multiple database engines.
    "rds",

    // Amazon Route 53 – A domain name system (DNS) service.
    "route53",

    // Amazon Route 53 Domains – Provides domain registration and management services.
    "route53domains",

    // Amazon S3 – Object storage for data archiving, backup, and web content hosting.
    "s3",

    // AWS Scheduler – A service for scheduling and automating AWS tasks. Used for scheduled (cron) jobs.
    "scheduler",

    // Amazon EventBridge Schemas – Helps define and discover event schemas for event-driven apps. Used in conjunction with Amazon EventBridge.
    "schemas",

    // AWS Secrets Manager – Securely stores and manages sensitive credentials and secrets.
    "secretsmanager",

    // AWS Cloud Map – Provides service discovery for microservices and applications.
    "servicediscovery",

    // Amazon Simple Email Service (SES) – An email sending and receiving service. Used in conjunction with Amazon Pinpoint for notifications.
    "ses",

    // Amazon Simple Notification Service (SNS) – A pub/sub messaging service.
    "sns",

    // AWS Systems Manager – Contains Parameter Store service which securely stores and manages configuration data and secrets.
    "ssm",

    // AWS Step Functions – Orchestrates workflows for AWS services with state machines. Used for background jobs.
    "states",

    // AWS WAF (Regional) – Protects web applications from common threats at the regional level.
    "waf-regional",

    // AWS WAF v2 – An updated web application firewall service for filtering and securing traffic.
    "wafv2",
  ]
}

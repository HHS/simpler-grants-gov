locals {
  aws_services = [
    // AWS Certificate Manager – Manages SSL/TLS certificates for secure network connections. Used for HTTPS support.
    "acm",

    // Amazon API Gateway – Provides fully managed API management for REST, HTTP, and WebSocket APIs.
    "apigateway",

    // Application Auto Scaling – Enables automatic scaling of AWS services beyond EC2.
    "application-autoscaling",

    // AWS Backup – Centralized service for automating backups across AWS resources.
    "backup",

    // Amazon CloudFront – Content delivery network for fast, secure content distribution.
    "cloudfront",

    // Amazon CloudWatch – Monitors and logs AWS resources and applications.
    "cloudwatch",

    // Amazon Cognito Identity Provider – Manages authentication and authorization for applications.
    "cognito-idp",

    // Amazon EC2 – Provides compute capacity in the cloud with virtual servers.
    "ec2",

    // Amazon Elastic Container Registry – A managed container image registry for Docker images.
    "ecr",

    // Amazon ECS – A managed container orchestration service for running Docker containers.
    "ecs",

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

    // Amazon RDS – A relational database service supporting multiple database engines.
    "rds",

    // Amazon Route 53 – A domain name system (DNS) service.
    "route53",

    // Amazon S3 – Object storage for data archiving, backup, and web content hosting.
    "s3",

    // AWS Scheduler – A service for scheduling and automating AWS tasks. Used for scheduled (cron) jobs.
    "scheduler",

    // AWS Secrets Manager – Securely stores and manages sensitive credentials and secrets.
    "secretsmanager",

    // Amazon Simple Email Service (SES) – An email sending and receiving service. Used for notifications.
    "ses",

    // Amazon Simple Notification Service (SNS) – A pub/sub messaging service.
    "sns",

    // AWS Systems Manager – Contains Parameter Store service which securely stores and manages configuration data and secrets.
    "ssm",

    // AWS Step Functions – Orchestrates workflows for AWS services with state machines. Used for background jobs.
    "states",

    // AWS WAF v2 – An updated web application firewall service for filtering and securing traffic.
    "wafv2",
  ]
}

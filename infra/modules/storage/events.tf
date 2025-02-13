# Tell S3 to publish events to EventBridge. Subscribers can then subscribe
# to these events in an event-based architecture.
# See https://docs.aws.amazon.com/AmazonS3/latest/userguide/ev-mapping-troubleshooting.html
resource "aws_s3_bucket_notification" "storage" {
  bucket      = aws_s3_bucket.storage.id
  eventbridge = true
}

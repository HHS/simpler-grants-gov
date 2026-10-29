# Lambda layer that bundles the ClamAV binaries (clamscan, clamdscan, clamd,
# freshclam) and their shared library dependencies. The layer.zip artifact is
# built by build-layer.sh — run that script whenever the binaries need
# refreshing. The signature database does NOT live in this layer; freshclam
# writes it to the EFS access point at runtime.

resource "aws_lambda_layer_version" "clamav" {
  layer_name          = local.layer_name
  description         = "ClamAV binaries (clamscan, clamdscan, clamd, freshclam) built from Amazon Linux 2023"
  compatible_runtimes = ["python3.12"]

  filename         = "${path.module}/layer.zip"
  source_code_hash = filebase64sha256("${path.module}/layer.zip")
}

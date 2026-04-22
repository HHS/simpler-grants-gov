resource "aws_wafv2_web_acl_association" "main" {
  count        = var.enable_waf ? 1 : 0
  resource_arn = aws_lb.alb.arn
  web_acl_arn  = module.network.waf_arn
}

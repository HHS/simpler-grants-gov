// Common functions used by test files
package test

import (
	"fmt"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
)

// Wrapper function for terraform init using a passed in backend config file. This is needed since
// terratest currently does not support passing a file as the -backend-config option
// so we need to manually call terraform rather than using terraform.Init
// see https://github.com/gruntwork-io/terratest/issues/517
// it looks like this PR would add functionality for this: https://github.com/gruntwork-io/terratest/pull/558
// after which we add BackendConfig: []string{"dev.s3.tfbackend": terraform.KeyOnly} to terraformOptions
// and replace the call to terraform.RunTerraformCommand with terraform.Init
func TerraformInit(t *testing.T, terraformOptions *terraform.Options, backendConfig string) {
	terraform.RunTerraformCommand(t, terraformOptions, "init", fmt.Sprintf("-backend-config=%s", backendConfig))
}

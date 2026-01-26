// Package test contains infrastructure tests for testing the service layer.
// Prerequisite: Ensure the container image for the current git hash has
// been built and published to the container image repository.
// When running in CI, use the build-and-publish workflow.
// When running locally, run `make release-build` followed by
// `make release-publish`.

package test

import (
	"crypto/tls"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
	"github.com/gruntwork-io/terratest/modules/shell"
	"github.com/gruntwork-io/terratest/modules/terraform"
)

var uniqueId = strings.ToLower(generateTestId())
var workspaceName = fmt.Sprintf("t-%s", uniqueId)
var testAppName = os.Getenv("APP_NAME")

func TestService(t *testing.T) {
	imageTag := shell.RunCommandAndGetOutput(t, shell.Command{
		Command:    "git",
		Args:       []string{"rev-parse", "HEAD"},
		WorkingDir: "./",
	})
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		Reconfigure:  true,
		TerraformDir: fmt.Sprintf("../%s/service/", testAppName),
		Vars: map[string]interface{}{
			"environment_name": "dev",
			"image_tag":        imageTag,
		},
	})

	fmt.Println("::group::Initialize service module")
	TerraformInit(t, terraformOptions, "dev.s3.tfbackend")
	fmt.Println("::endgroup::")

	defer terraform.WorkspaceDelete(t, terraformOptions, workspaceName)
	fmt.Println("::group::Select new terraform workspace")
	terraform.WorkspaceSelectOrNew(t, terraformOptions, workspaceName)
	fmt.Println("::endgroup::")

	defer DestroyService(t, terraformOptions)
	fmt.Println("::group::Create service layer")
	terraform.Apply(t, terraformOptions)
	fmt.Println("::endgroup::")

	WaitForServiceToBeStable(t, workspaceName)
	RunEndToEndTests(t, terraformOptions)
}

func WaitForServiceToBeStable(t *testing.T, workspaceName string) {
	fmt.Println("::group::Wait for service to be stable")
	appName := testAppName
	environmentName := "dev"
	serviceName := fmt.Sprintf("%s-%s-%s", workspaceName, appName, environmentName)
	shell.RunCommand(t, shell.Command{
		Command:    "aws",
		Args:       []string{"ecs", "wait", "services-stable", "--cluster", serviceName, "--services", serviceName},
		WorkingDir: "../../",
	})
	fmt.Println("::endgroup::")
}

func RunEndToEndTests(t *testing.T, terraformOptions *terraform.Options) {
	fmt.Println("::group::Check service for healthy status 200")
	serviceEndpoint := terraform.Output(t, terraformOptions, "service_endpoint")

	// if the service is using the `enable_https` option, there will be issues
	// with certs using `service_endpoint`, like:
	//
	// tls: failed to verify certificate: x509: certificate is valid for <app_name>.<acct>-<env>.navateam.com, not <workspace>-<app_name>-<env>-<acct>.<region>.elb.amazonaws.com. Sleeping for 1s and will try again.
	//
	// so have the test skip over invalid certs
	tlsConfig := tls.Config{InsecureSkipVerify: true}

	http_helper.HttpGetWithRetryWithCustomValidation(t, serviceEndpoint+"/health", &tlsConfig, 5, 1*time.Second, func(responseStatus int, responseBody string) bool {
		return responseStatus == 200
	})
	fmt.Println("::endgroup::")
}

func DestroyService(t *testing.T, terraformOptions *terraform.Options) {
	fmt.Println("::group::Destroy service layer")
	terraform.Destroy(t, terraformOptions)
	fmt.Println("::endgroup::")
}

func generateTestId() string {
	now := time.Now()
	timeNum := now.Unix()
	return toBase62(timeNum)
}

func toBase62(n int64) string {
	const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	if n == 0 {
		return "000000"
	}
	result := ""
	for n > 0 {
		result = string(charset[n%62]) + result
		n /= 62
	}
	// Pad with leading zeros to ensure at least 6 characters
	for len(result) < 6 {
		result = "0" + result
	}
	return result
}

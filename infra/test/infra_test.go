package test

import (
	"fmt"
	"strings"
	"testing"
	"time"

	http_helper "github.com/gruntwork-io/terratest/modules/http-helper"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/shell"
	"github.com/gruntwork-io/terratest/modules/terraform"
)

func TestDev(t *testing.T) {
	BuildAndPublish(t)

	uniqueId := strings.ToLower(random.UniqueId())
	workspaceName := fmt.Sprintf("t-%s", uniqueId)
	imageTag := shell.RunCommandAndGetOutput(t, shell.Command{
		Command:    "git",
		Args:       []string{"rev-parse", "HEAD"},
		WorkingDir: "./",
	})
	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		Reconfigure:  true,
		TerraformDir: "../app/service/",
		VarFiles:     []string{"dev.tfvars"},
		Vars: map[string]interface{}{
			"image_tag": imageTag,
		},
	})

	defer DestroyDevEnvironmentAndWorkspace(t, terraformOptions, workspaceName)
	CreateDevEnvironmentInWorkspace(t, terraformOptions, workspaceName)
	WaitForServiceToBeStable(t, workspaceName)
	RunEndToEndTests(t, terraformOptions)
}

func BuildAndPublish(t *testing.T) {
	// terratest currently does not support passing a file as the -backend-config option
	// so we need to manually call terraform rather than using terraform.Init
	// see https://github.com/gruntwork-io/terratest/issues/517
	// it looks like this PR would add functionality for this: https://github.com/gruntwork-io/terratest/pull/558
	// after which we add BackendConfig: []string{"dev.s3.tfbackend": terraform.KeyOnly} to terraformOptions
	// and replace the call to terraform.RunTerraformCommand with terraform.Init
	terraform.RunTerraformCommand(t, &terraform.Options{
		TerraformDir: "../app/build-repository/",
	}, "init", "-backend-config=shared.s3.tfbackend")

	shell.RunCommand(t, shell.Command{
		Command:    "make",
		Args:       []string{"release-build"},
		WorkingDir: "../../",
	})

	shell.RunCommand(t, shell.Command{
		Command:    "make",
		Args:       []string{"release-publish"},
		WorkingDir: "../../",
	})
}

func CreateDevEnvironmentInWorkspace(t *testing.T, terraformOptions *terraform.Options, workspaceName string) {
	fmt.Printf("::group::Create dev environment in new workspace '%s\n'", workspaceName)

	// terratest currently does not support passing a file as the -backend-config option
	// so we need to manually call terraform rather than using terraform.Init
	// see https://github.com/gruntwork-io/terratest/issues/517
	// it looks like this PR would add functionality for this: https://github.com/gruntwork-io/terratest/pull/558
	// after which we add BackendConfig: []string{"dev.s3.tfbackend": terraform.KeyOnly} to terraformOptions
	// and replace the call to terraform.RunTerraformCommand with terraform.Init
	terraform.RunTerraformCommand(t, terraformOptions, "init", "-backend-config=dev.s3.tfbackend")
	terraform.WorkspaceSelectOrNew(t, terraformOptions, workspaceName)
	terraform.Apply(t, terraformOptions)
	fmt.Println("::endgroup::")
}

func WaitForServiceToBeStable(t *testing.T, workspaceName string) {
	fmt.Println("::group::Wait for service to be stable")
	appName := "app"
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
	http_helper.HttpGetWithRetryWithCustomValidation(t, serviceEndpoint, nil, 5, 1*time.Second, func(responseStatus int, responseBody string) bool {
		return responseStatus == 200
	})
	fmt.Println("::endgroup::")
}

func EnableDestroy(t *testing.T, terraformOptions *terraform.Options, workspaceName string) {
	fmt.Println("::group::Setting force_destroy = true and prevent_destroy = false for s3 buckets")
	shell.RunCommand(t, shell.Command{
		Command: "sed",
		Args: []string{
			"-i.bak",
			"s/force_destroy = false/force_destroy = true/g",
			"infra/modules/service/access_logs.tf",
		},
		WorkingDir: "../../",
	})
	shell.RunCommand(t, shell.Command{
		Command: "sed",
		Args: []string{
			"-i.bak",
			"s/prevent_destroy = true/prevent_destroy = false/g",
			"infra/modules/service/access_logs.tf",
		},
		WorkingDir: "../../",
	})
	terraform.RunTerraformCommand(t, terraformOptions, "init", "-backend-config=dev.s3.tfbackend")
	terraform.Apply(t, terraformOptions)
}

func DestroyDevEnvironmentAndWorkspace(t *testing.T, terraformOptions *terraform.Options, workspaceName string) {
	EnableDestroy(t, terraformOptions, workspaceName)
	fmt.Println("::group::Destroy environment and workspace")
	terraform.RunTerraformCommand(t, terraformOptions, "init", "-backend-config=dev.s3.tfbackend")
	terraform.Destroy(t, terraformOptions)
	terraform.WorkspaceDelete(t, terraformOptions, workspaceName)
	fmt.Println("::endgroup::")
}

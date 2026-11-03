<?php

/**
 * @file
 * Drupal settings for the Simpler.Grants.gov CMS.
 *
 * Every environment-specific value comes from an environment variable so the
 * same image runs locally, in CI and in each AWS environment. Local values
 * live in cms/local.env. See default.settings.php for every available setting.
 */

$databases['default']['default'] = [
  'driver' => 'pgsql',
  'namespace' => 'Drupal\\pgsql\\Driver\\Database\\pgsql',
  'autoload' => 'core/modules/pgsql/src/Driver/Database/pgsql/',
  'host' => getenv('DB_HOST') ?: 'localhost',
  'port' => getenv('DB_PORT') ?: '5432',
  'database' => getenv('DB_NAME') ?: 'drupal',
  'username' => getenv('DB_USER') ?: 'drupal',
  'password' => getenv('DB_PASSWORD') ?: '',
  'prefix' => '',
];

$settings['hash_salt'] = getenv('DRUPAL_HASH_SALT') ?: '';

// Relative to the web root, so this resolves to cms/config/sync.
$settings['config_sync_directory'] = '../config/sync';

// Comma-separated regular expressions, e.g. "^localhost$,^cms\.example\.gov$".
$trusted_host_patterns = getenv('DRUPAL_TRUSTED_HOST_PATTERNS');
if ($trusted_host_patterns) {
  $settings['trusted_host_patterns'] = array_map('trim', explode(',', $trusted_host_patterns));
}

// Only /tmp is writable in the release image. Compiled Twig templates and
// temporary files go there. Public files move to S3 when the CMS is deployed.
$settings['file_public_path'] = getenv('DRUPAL_FILE_PUBLIC_PATH') ?: 'sites/default/files';
$settings['file_temp_path'] = '/tmp';
$settings['php_storage']['default']['directory'] = '/tmp/drupal-php';

// File permissions are managed by the container image, not by Drupal.
$settings['skip_permissions_hardening'] = TRUE;

$settings['update_free_access'] = FALSE;
$settings['entity_update_batch_size'] = 50;
$settings['entity_update_backup'] = TRUE;
$settings['file_scan_ignore_directories'] = [
  'node_modules',
  'bower_components',
];

// Optional, git-ignored overrides for an individual developer's machine.
if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}

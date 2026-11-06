<?php

declare(strict_types=1);

namespace Drupal\simpler_health\Controller;

use Drupal\Core\Database\Connection;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Reports whether Drupal is serving requests and can reach its database.
 */
final class HealthController implements ContainerInjectionInterface {

  public function __construct(
    private readonly Connection $database,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self($container->get('database'));
  }

  /**
   * Returns 200 when the database answers a query, otherwise 503.
   */
  public function check(): JsonResponse {
    try {
      $this->database->query('SELECT 1')->fetchField();
    }
    catch (\Throwable) {
      return new JsonResponse(['status' => 'unavailable'], 503);
    }

    return new JsonResponse(['status' => 'ok']);
  }

}

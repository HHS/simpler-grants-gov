<?php

declare(strict_types=1);

namespace Drupal\Tests\simpler_health\Unit;

use Drupal\Core\Database\Connection;
use Drupal\Core\Database\DatabaseExceptionWrapper;
use Drupal\Core\Database\StatementInterface;
use Drupal\simpler_health\Controller\HealthController;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the /health endpoint controller.
 */
#[CoversClass(HealthController::class)]
#[Group('simpler_health')]
final class HealthControllerTest extends UnitTestCase {

  /**
   * A reachable database returns 200 with status "ok".
   */
  public function testReachableDatabaseReturnsOk(): void {
    $statement = $this->createMock(StatementInterface::class);
    $statement->method('fetchField')->willReturn('1');
    $database = $this->createMock(Connection::class);
    $database->method('query')->willReturn($statement);

    $response = (new HealthController($database))->check();

    $this->assertSame(200, $response->getStatusCode());
    $this->assertSame('{"status":"ok"}', $response->getContent());
  }

  /**
   * A failing database query returns 503 with status "unavailable".
   */
  public function testDatabaseErrorReturnsServiceUnavailable(): void {
    $database = $this->createMock(Connection::class);
    $database->method('query')->willThrowException(new DatabaseExceptionWrapper('Connection refused'));

    $response = (new HealthController($database))->check();

    $this->assertSame(503, $response->getStatusCode());
    $this->assertSame('{"status":"unavailable"}', $response->getContent());
  }

}

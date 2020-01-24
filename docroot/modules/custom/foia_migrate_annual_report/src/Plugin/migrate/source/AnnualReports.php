<?php

namespace Drupal\foia_migrate_annual_report\Plugin\migrate\source;

use Drupal\migrate\Plugin\migrate\source\SqlBase;
use Drupal\migrate\Row;

/**
 * Source plugin for the annual reports from MySQL.
 *
 * @MigrateSource(
 *   id = "annual_reports",
 *   source_module = "foia_migrate_annual_report",
 * )
 */
class AnnualReports extends SqlBase {

  /**
   * {@inheritdoc}
   */
  public function query() {
    // Source data is queried here.
    $query = $this->select('foo', 'f')
      ->fields('f', [
          'bar',
        ]);
    return $query;
  }

  /**
   * {@inheritdoc}
   */
  public function fields() {
    $fields = [
      'foo_id' => $this->t('foo_id' ),
    ];
    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public function getIds() {
    return [
      'foo_id' => [
        'type' => 'integer',
        'alias' => 'f',
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function prepareRow(Row $row) {
    $row->setSourceProperty('foobar', 'some value');
    return parent::prepareRow($row);
  }
}

WITH anomaly_detector AS {{#398-etl-DATA-quality-anomaly-detector}}
SELECT etl_health_status
FROM anomaly_detector
UNION ALL
SELECT '✅ Data quality validated' AS etl_health_status
WHERE NOT EXISTS
    (SELECT 1
     FROM anomaly_detector);
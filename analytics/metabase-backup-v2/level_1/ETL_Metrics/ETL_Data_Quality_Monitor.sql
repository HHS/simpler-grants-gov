WITH anomaly_detector AS {{#restore:ETL_Data_Quality_Anomaly_Detector}}
SELECT etl_health_status
FROM anomaly_detector
UNION ALL
SELECT '✅ Data quality validated' AS etl_health_status
WHERE NOT EXISTS
    (SELECT 1
     FROM anomaly_detector);

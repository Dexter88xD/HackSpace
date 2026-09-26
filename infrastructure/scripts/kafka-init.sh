#!/bin/bash
set -e

echo 'Kafka is ready. Creating topics...'
/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic name --bootstrap-server broker:9092 --partitions 3 --replication-factor 1
/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic greeting --bootstrap-server broker:9092 --partitions 3 --replication-factor 1

echo 'Topic creation finished successfully!'
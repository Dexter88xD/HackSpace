#!/bin/bash

# echo 'Waiting for Kafka to start...'
# # Loop until the broker successfully responds to a --list command
# while ! /opt/kafka/bin/kafka-topics.sh --bootstrap-server broker:9092 --list; do
# 	sleep 2
# done

echo 'Kafka is ready. Creating topics...'
/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic name --bootstrap-server broker:9092 --partitions 3 --replication-factor 1
/opt/kafka/bin/kafka-topics.sh --create --if-not-exists --topic greeting --bootstrap-server broker:9092 --partitions 3 --replication-factor 1

echo 'Topic creation finished successfully!'
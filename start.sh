#!/bin/bash

# Start Kafka in KRaft mode in background
export KAFKA_NODE_ID=1
export KAFKA_LISTENER_SECURITY_PROTOCOL_MAP='CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT'
export KAFKA_ADVERTISED_LISTENERS='PLAINTEXT://localhost:29092'
export KAFKA_PROCESS_ROLES='broker,controller'
export KAFKA_CONTROLLER_QUORUM_VOTERS='1@localhost:29093'
export KAFKA_LISTENERS='PLAINTEXT://localhost:29092,CONTROLLER://localhost:29093'
export KAFKA_INTER_BROKER_LISTENER_NAME='PLAINTEXT'
export KAFKA_CONTROLLER_LISTENER_NAMES='CONTROLLER'
export KAFKA_LOG_DIRS='/var/lib/kafka/data'
export KAFKA_AUTO_CREATE_TOPICS_ENABLE='true'
export KAFKA_DELETE_TOPIC_ENABLE='true'
export KAFKA_NUM_PARTITIONS=1
export KAFKA_DEFAULT_REPLICATION_FACTOR=1
export KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
export KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
export KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1
export KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0
export CLUSTER_ID='MkU3OEVBNTcwNTJENDM2Qk'

# Reduce Kafka memory usage for 512MB container
export KAFKA_HEAP_OPTS="-Xmx256m -Xms128m"

# Clean up filesystem artifacts that Kafka doesn't like
rm -rf /var/lib/kafka/data/lost+found

echo "Starting Kafka in KRaft mode..."
/etc/confluent/docker/run &

# Wait for Kafka to be ready
echo "Waiting for Kafka to start..."
sleep 15

# Create the user_events topic
echo "Creating user_events topic..."
kafka-topics --bootstrap-server localhost:29092 --create --topic user_events --partitions 1 --replication-factor 1 --if-not-exists

# Check Node.js version for debugging
echo "Node.js version: $(node --version)"

# Start Node.js application
echo "Starting Node.js application..."
cd /app
KAFKAJS_NO_PARTITIONER_WARNING=1 node socketServer.js
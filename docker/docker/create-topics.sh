#!/bin/bash

# Esperar a que Kafka esté listo
echo "Esperando a que Kafka inicie..."
sleep 5

# Lista de topics requeridos según el TP (3 particiones por topic)
TOPICS=(
  "activation.requested"
  "activation.requested.dlq"
  "billing.events"
  "billing.events.dlq"
  "provisioning.events"
  "provisioning.events.dlq"
  "activation.events"
  "activation.events.dlq"
)

for TOPIC in "${TOPICS[@]}"; do
  echo "Creando topic: $TOPIC"
  /opt/kafka/bin/kafka-topics.sh --create \
    --bootstrap-server localhost:9092 \
    --replication-factor 1 \
    --partitions 3 \
    --topic "$TOPIC" \
    --if-not-exists
done

echo "¡Todos los topics fueron creados exitosamente!"
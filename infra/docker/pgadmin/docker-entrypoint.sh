#!/bin/sh
set -e

CONFIG_DIR="${PGADMIN_CONFIG_DIR:-/var/lib/pgadmin}"
PGPASS_FILE="${PGPASS_FILE:-${CONFIG_DIR}/pgpass}"
SERVERS_JSON="${PGADMIN_SERVER_JSON_FILE:-${CONFIG_DIR}/servers.json}"
PGADMIN_UID="${PGADMIN_UID:-5050}"
PGADMIN_GID="${PGADMIN_GID:-0}"

mkdir -p "$CONFIG_DIR"

if [ "$(id -u)" = "0" ]; then
  chown "$PGADMIN_UID:$PGADMIN_GID" "$CONFIG_DIR" 2>/dev/null || true
fi

cat > "$PGPASS_FILE" <<EOF
identity-postgres:5432:*:identity:${POSTGRES_IDENTITY_PASSWORD}
issues-postgres:5432:*:issues:${POSTGRES_ISSUES_PASSWORD}
attachment-postgres:5432:*:attachment:${POSTGRES_ATTACHMENT_PASSWORD}
attachment-scanner-postgres:5432:*:attachment_scanner:${POSTGRES_ATTACHMENT_SCANNER_PASSWORD}
notification-postgres:5432:*:notification:${POSTGRES_NOTIFICATION_PASSWORD}
platform-postgres:5432:*:platform:${POSTGRES_PLATFORM_PASSWORD}
audit-postgres:5432:*:audit:${POSTGRES_AUDIT_PASSWORD}
ory-postgres:5432:*:postgres:${POSTGRES_ADMIN_PASSWORD}
postgres:5432:*:postgres:${POSTGRES_ADMIN_PASSWORD}
EOF

chmod 600 "$PGPASS_FILE"

ory_server_json() {
  id="$1"
  cat <<EOF
    "$id": {
      "Name": "Ory Postgres",
      "Group": "Ory",
      "Host": "ory-postgres",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "postgres",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE",
      "Comment": "Shared instance for Kratos (db: kratos), Hydra (db: hydra), and Keto (db: keto)",
      "DBRestriction": "kratos,hydra,keto"
    }
EOF
}

if [ "$PGADMIN_CONFIG_TYPE" = "multi-db" ]; then
  cat > "$SERVERS_JSON" <<EOF
{
  "Servers": {
    "1": {
      "Name": "Identity Service DB",
      "Group": "Pine",
      "Host": "identity-postgres",
      "Port": 5432,
      "MaintenanceDB": "identity",
      "Username": "identity",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
    "2": {
      "Name": "Issues Service DB",
      "Group": "Pine",
      "Host": "issues-postgres",
      "Port": 5432,
      "MaintenanceDB": "issues",
      "Username": "issues",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
    "3": {
      "Name": "Attachment Service DB",
      "Group": "Pine",
      "Host": "attachment-postgres",
      "Port": 5432,
      "MaintenanceDB": "attachment",
      "Username": "attachment",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
    "4": {
      "Name": "Notification Service DB",
      "Group": "Pine",
      "Host": "notification-postgres",
      "Port": 5432,
      "MaintenanceDB": "notification",
      "Username": "notification",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
    "5": {
      "Name": "Platform Service DB",
      "Group": "Pine",
      "Host": "platform-postgres",
      "Port": 5432,
      "MaintenanceDB": "platform",
      "Username": "platform",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
    "6": {
      "Name": "Audit Service DB",
      "Group": "Pine",
      "Host": "audit-postgres",
      "Port": 5432,
      "MaintenanceDB": "audit",
      "Username": "audit",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
$(ory_server_json 7)
  }
}
EOF
else
  cat > "$SERVERS_JSON" <<EOF
{
  "Servers": {
    "1": {
      "Name": "Single DB (Minimal)",
      "Group": "Pine",
      "Host": "postgres",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "postgres",
      "SSLMode": "prefer",
      "PassFile": "$PGPASS_FILE"
    },
$(ory_server_json 2)
  }
}
EOF
fi

export PGADMIN_SERVER_JSON_FILE="$SERVERS_JSON"
export PGPASS_FILE="$PGPASS_FILE"

if [ "$(id -u)" = "0" ]; then
  chown -R "$PGADMIN_UID:$PGADMIN_GID" "$CONFIG_DIR" 2>/dev/null || true
  chmod 600 "$PGPASS_FILE"
fi

exec /entrypoint.sh

#!/bin/bash

# MONGO_MAGIC_URI="mongodb+srv://admin:admin123@cluster0-nemty.mongodb.net/alice" # for dev
MONGO_MAGIC_URI="mongodb+srv://app:HfZT5MszN4MSTDMF@alice-prod-55agh.mongodb.net/alice" # for prod
MONGO_DATABASE="alice"
TIMESTAMP=`date +%F-%H%M`
TMP_DIR="db-backups-"$TIMESTAMP
LOCAL_DB_NAME="alice_copy_"$TIMESTAMP
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="27017"
# MONGODUMP_EXECUTABLE = "/opt/bitnami/mongodb/bin/mongodump"
# MONGORESTORE_EXECUTABLE = "/opt/bitnami/mongodb/bin/mongorestore"
MONGODUMP_EXECUTABLE="mongodump"
MONGORESTORE_EXECUTABLE="mongorestore"

# Currently unused 
MONGO_HOST="cluster0-nemty.mongodb.net"
MONGO_PORT="27017"

# Create tmp dir
mkdir $TMP_DIR;

# Create backup
# MONGODUMP_EXECUTABLE -h $MONGO_HOST:$MONGO_PORT -u alice -p alice123 -d $MONGO_DATABASE -o $TMP_DIR
$MONGODUMP_EXECUTABLE --uri $MONGO_MAGIC_URI -o $TMP_DIR

# Restore db to localhost
$MONGORESTORE_EXECUTABLE --db $LOCAL_DB_NAME --host $LOCAL_DB_HOST --port $LOCAL_DB_PORT $TMP_DIR/$MONGO_DATABASE

# Remove tmp dir
rm -rf $TMP_DIR

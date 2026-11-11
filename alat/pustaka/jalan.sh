#!/bin/bash
# Unduh jar library (Java 8), cek versi class, rekam di browser dengan CheerpJ.
set -e
cd alat/pustaka
mvn -B -q dependency:copy-dependencies -DoutputDirectory=www/lib
for j in www/lib/*.jar; do echo "$j $(stat -c %s $j)"; done
cp ../../public/tools.jar www/
cp index.html www/
node server.mjs "$PWD/www" 8080 &
sleep 2
node probe.mjs

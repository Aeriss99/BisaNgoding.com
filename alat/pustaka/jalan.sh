#!/bin/bash
# Unduh jar library (Java 8), cek versi class, rekam di browser dengan CheerpJ.
set -x
cd alat/pustaka
mvn -B -q dependency:copy-dependencies -DoutputDirectory=www/lib
ls -la www/lib
for j in www/lib/*.jar; do v=$(unzip -l "$j" | awk '/\.class$/{print $4}' | grep -v -E 'module-info|META-INF/versions' | head -1); m=$(unzip -p "$j" "$v" | head -c 8 | od -An -tu1 | awk '{print $8}'); echo "$j major=$m ($v)"; done
cp ../../public/tools.jar www/
cp index.html www/
node server.mjs "$PWD/www" 8080 &
sleep 2
node probe.mjs

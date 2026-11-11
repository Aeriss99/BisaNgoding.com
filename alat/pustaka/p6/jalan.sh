#!/bin/bash
# Unduh jar library baru (Java 8), simpan ke cabang alat/java-lib-jar2, coba di browser (CheerpJ 3 dan 5).
set -e
cd alat/pustaka
mvn -B -q -f pom2.xml dependency:copy-dependencies -DoutputDirectory=www/lib
for j in www/lib/*.jar; do echo "$j $(stat -c %s $j) $(unzip -p $j $(unzip -Z1 $j | grep '\.class$' | grep -v module-info | head -1) | head -c 8 | od -An -tu1 | awk '{print $8}')"; done
cp ../../public/tools.jar www/
cp index.html index21.html www/
node server.mjs "$PWD/www" 8080 &
sleep 2
node probe6.mjs

#!/bin/bash
# Membuat public/java-lib/bisangoding.jar dari pustaka-java/src dan pustaka-java/res.
# Isinya: JalankanTest (menjalankan test JUnit 5 dari main), pola log Logback untuk praktik,
# dan pengaturan Mockito (mock-maker-proxy, karena pembuat mock bawaan Mockito macet di CheerpJ).
# Jar library lain di public/java-lib diunduh dari Maven Central (lihat src/lib/javaPustaka.json).
set -e
cd "$(dirname "$0")"
LIB=../public/java-lib
CP=$(ls $LIB/*.jar | grep -v bisangoding.jar | tr '\n' ':')
rm -rf /tmp/bisangoding-jar && mkdir -p /tmp/bisangoding-jar
javac --release 8 -nowarn -Xlint:-options -encoding UTF-8 -cp "$CP" -d /tmp/bisangoding-jar $(find src -name '*.java')
cp -r res/* /tmp/bisangoding-jar/
(cd /tmp/bisangoding-jar && jar --create --file "$OLDPWD/$LIB/bisangoding.jar" --date=2026-11-11T00:00:00Z .)
echo "dibuat $LIB/bisangoding.jar"

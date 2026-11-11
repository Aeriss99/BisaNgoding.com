#!/bin/bash
# Rekaman ketiga: HikariCP dengan SLF4J 2 + Logback, dan aplikasi Todolist Database dengan MySQL.
ASAL=$(cd "$(dirname "$0")" && pwd)
T=$ASAL/tambahan
P=src/main/java/com/bisangoding/todolist
J() { echo; echo "=================== $1"; }
sesi() {
  local nama=$1 arg=$2; shift 2
  J "SESI $nama"
  ( sleep 2; for b in "$@"; do printf '%s\n' "$b"; sleep 1.5; done; sleep 1 ) | script -q -c "mysql -h127.0.0.1 -uroot -p $arg" /dev/null 2>&1 | tr -d '\r'
}
export MYSQL_PWD=rahasia
mysql -h127.0.0.1 -uroot -e "CREATE DATABASE todolist; USE todolist; CREATE TABLE todo (id INT AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(100) NOT NULL, selesai BOOLEAN NOT NULL DEFAULT FALSE); INSERT INTO todo (judul) VALUES ('Belajar MySQL'), ('Beli kopi'), ('Olahraga pagi');" 2>&1 | grep -v "Using a password"
mkdir -p /tmp/sari && rm -rf /tmp/sari/todolist && cp -r $ASAL/proyek /tmp/sari/todolist && cd /tmp/sari/todolist
M="mvn -B -ntp"
dep() { python3 - "$1" <<'PY'
import sys
s = open('pom.xml').read()
s = s.replace('    <!--DEP-->', sys.argv[1] + '\n    <!--DEP-->')
open('pom.xml', 'w').write(s)
PY
}
D() { echo "    <dependency>
      <groupId>$1</groupId>
      <artifactId>$2</artifactId>
      <version>$3</version>${4:+
      <scope>$4</scope>}
    </dependency>"; }
dep "$(D com.mysql mysql-connector-j 9.1.0)"
dep "$(D com.zaxxer HikariCP 6.2.1)"
dep "$(D org.slf4j slf4j-api 2.0.16)"
dep "$(D ch.qos.logback logback-classic 1.5.12)"
mkdir -p src/main/resources
cat > src/main/resources/logback.xml <<'XML'
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="CONSOLE"/>
  </root>
</configuration>
XML
cp $T/AppHikari.java $P/App.java
$M -q compile > /dev/null 2>&1
J "J pom dependencies"; sed -n '/<dependencies>/,/<\/dependencies>/p' pom.xml
J "J hikari"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1
J "J tree hikari"; $M dependency:tree 2>&1 | grep -E "INFO\] [+|\\\\ ]|todolist:jar"
# Todolist database
mysql -h127.0.0.1 -uroot -e "DROP DATABASE todolist; CREATE DATABASE todolist;" 2>/dev/null
cp $T/TodoDb.java $P/Todo.java; cp $T/TodoRepositoryJdbc.java $P/; cp $T/AppTodoDb.java $P/App.java
cp $T/schema.sql src/main/resources/schema.sql
mkdir -p src/test/java/com/bisangoding/todolist && cp $T/TodoRepositoryJdbcTest.java src/test/java/com/bisangoding/todolist/
dep "$(D com.h2database h2 2.3.232 test)"
$M -q compile > /dev/null 2>&1
J "T cat schema"; cat src/main/resources/schema.sql
J "T schema"; mysql -h127.0.0.1 -uroot todolist < src/main/resources/schema.sql; echo "status $?"
J "T kosong"; DB_PASSWORD=rahasia $M -q compile exec:java 2>&1
J "T tambah1"; DB_PASSWORD=rahasia $M -q exec:java -Dexec.args="Belajar JDBC" 2>&1
J "T tambah2"; DB_PASSWORD=rahasia $M -q exec:java -Dexec.args="Rapikan kode" 2>&1
J "T test"; $M test 2>&1
sesi todolist todolist rahasia "SHOW TABLES;" "SELECT * FROM todo;" "UPDATE todo SET selesai = TRUE WHERE id = 1;" "exit"
J "T setelah update"; DB_PASSWORD=rahasia $M -q exec:java 2>&1
J "T package"; $M -q package -DskipTests 2>&1; ls target/*.jar
J "T sandi salah"; DB_PASSWORD=salah $M -q exec:java 2>&1 | head -12
J "T tanpa env"; $M -q exec:java 2>&1 | head -12
J "T matikan mysql"; docker stop $(docker ps -q --filter ancestor=mysql:8.4) > /dev/null; DB_PASSWORD=rahasia $M -q exec:java 2>&1 | head -40
J "SELESAI"

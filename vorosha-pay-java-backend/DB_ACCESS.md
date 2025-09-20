# Database Access

The Java backend uses H2 (in-memory) for development. You can browse it via the built-in H2 web console or switch to a file-based DB that persists between restarts.

## H2 Web Console

- URL: http://localhost:8000/h2-console
- Driver Class: org.h2.Driver
- JDBC URL: jdbc:h2:mem:vorosha_pay_db
- Username: sa
- Password: password

Quick open (macOS):

```bash
./scripts/open-db.sh
```

## Persist the database to disk (optional)

Switch to a file-based H2 DB so data survives restarts.

1. Edit `src/main/resources/application.properties`:

```properties
# Change the datasource URL from in-memory to file-based
spring.datasource.url=jdbc:h2:file:./data/vorosha_pay_db;DB_CLOSE_ON_EXIT=FALSE;AUTO_SERVER=TRUE
spring.jpa.hibernate.ddl-auto=update
```

2. Create the folder if needed:

```bash
mkdir -p data
```

3. Rebuild and restart the app:

```bash
mvn -q -DskipTests clean package
java -jar target/vorosha-pay-backend-1.0.0.jar
```

4. H2 Console updates:

- JDBC URL: jdbc:h2:file:./data/vorosha_pay_db
- Same username/password

## Tables

- `users`
- `user_roles`
- `transactions`
- `payments`
- `disputes`

These are created automatically by Hibernate.

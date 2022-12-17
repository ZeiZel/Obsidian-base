
Этот запрос сгенерирует код для запроса, который можно выполнить непосредственно в базе данных для получения итогового результата 

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script
```




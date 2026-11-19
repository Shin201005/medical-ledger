import { Umzug, SequelizeStorage } from "umzug";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(new URL("../../migrations/*.cjs", import.meta.url)),
  },
  context: db.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db }),
  logger: console,
});
try {
  await migrator.up();
} finally {
  await db.close();
}

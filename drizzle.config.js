// drizzle.config.js
/** @type { import("drizzle-kit").Config } */
export default {
  schema: './lib/db/schema.js',
  out: './drizzle',
  dialect: 'sqlite',  // or 'postgresql' if using PostgreSQL
  dbCredentials: {
    url: './data/thepopebot.sqlite'  // path to your SQLite database
  },
  verbose: true,
  strict: true
};

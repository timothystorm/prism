/**
 * @file Development-only GraphQL server that generates data from the shipment schema.
 * Importing this module starts a listener on port 4000 at /graphql.
 * No real shipment lookup is implemented; mock output is not production data.
 * Run with `pnpm --filter mock-graphql dev` for watch mode or
 * `pnpm --filter mock-graphql start` for a single run.
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";

const typeDefs = readFileSync(new URL("../schema.graphql", import.meta.url), "utf8");

const schema = addMocksToSchema({
  schema: makeExecutableSchema({ typeDefs }),
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
});

createServer(yoga).listen(4000, () => {
  process.stdout.write("GraphQL running at http://localhost:4000/graphql\n");
});

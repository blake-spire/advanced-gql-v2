const { ApolloServer } = require("apollo-server");
const { createTestClient } = require("apollo-server-testing");
const typeDefs = require("../src/typedefs");
const resolvers = require("../src/resolvers");

const createTestServer = ctx => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // only mock resolvers that aren't defined above
    mockEntireSchema: false,
    // ignore resolvers and used mocked data
    mocks: true,
    context: () => ctx,
  });

  // return `query` and `mutation` methods
  return createTestClient(server);
};

module.exports = createTestServer;

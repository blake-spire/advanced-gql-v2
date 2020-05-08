const { ApolloServer, AuthenticationError } = require("apollo-server");

const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { createToken, getUserFromToken } = require("./auth");
const db = require("./db");
const {
  DateFormatDirective,
  AuthenticationDirective,
  AuthorizationDirective,
} = require("./directives");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ connection, req }) {
    const context = { ...db };
    if (connection) {
      return { ...connection.context, ...context };
    }

    // else get user from token
    const token = req.headers.authorization;
    const user = getUserFromToken(token);
    return { ...context, user, createToken };
  },
  subscriptions: {
    // treat `params` as headers
    onConnect(connectionParams) {
      const token = connectionParams.authorization;
      const user = getUserFromToken(token);

      if (!user) {
        throw new AuthenticationError("Not Authorized");
      }

      return { user };
    },
  },
  schemaDirectives: {
    dateFormat: DateFormatDirective,
    authenticated: AuthenticationDirective,
    authorized: AuthorizationDirective,
  },
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

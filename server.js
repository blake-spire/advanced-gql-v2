const {
  ApolloServer,
  PubSub,
  AuthenticationError,
  SchemaDirectiveVisitor,
} = require("apollo-server");
const gql = require("graphql-tag");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.resolve = (root, { format, ...rest }, ctx, info) => {
      const { format: schemaFormat } = this.args;

      return resolver.call(this, root, rest, ctx, info);
    };

    return field.resolve();
  }
}

const typeDefs = gql`
  directive @log on FIELD_DEFINITION

  type User {
    id: ID! @log
    username: String!
    createdAt: String
    error: String
      @deprecated(reason: "this text will show in the graphql playground")
  }

  type Settings {
    user: User!
    theme: String
  }

  input NewSettingsInput {
    user: ID!
    theme: String
  }

  type Item {
    task: String
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    createItem(task: String): Item
  }

  type Subscription {
    newItem: Item
  }
`;

const resolvers = {
  Query: {
    me() {
      return { id: "1234", username: "blake", createdAt: Date.now() + "" };
    },

    settings(_rootVal, args) {
      const { user, settings } = args;
      return {
        user,
        theme: "dark",
      };
    },
  },

  User: {
    /**
     * example of throwing an apollo-server created error
     * @deprecated
     * */
    error() {
      return "";
      // return new AuthenticationError("Not authorized!");
    },
  },

  Mutation: {
    settings(_, { input }) {
      return input;
    },
    createItem(_, { task }) {
      const item = { task };

      // matches `subscription` typeDef
      const subscriptionType = { newItem: item };
      pubSub.publish(NEW_ITEM, subscriptionType);

      return item;
    },
  },

  Subscription: {
    newItem: {
      subscribe: () => pubSub.asyncIterator(NEW_ITEM),
    },
  },

  Settings: {
    user(_settings) {
      return {
        id: "1234",
        username: "blake",
        createdAt: Date.now() + "",
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ connection, req }) {
    if (connection) {
      return { ...connection.context };
    }

    return {};
  },
  subscriptions: {
    // treat `params` as headers
    onConnect(params) {},
  },
  formatError(err) {
    // all errors are caught here
    console.log(err);

    return err;
  },
  schemaDirectives: {
    log: LogDirective,
  },
});

server.listen().then((res) => console.log(`listening on ${res.url}`));

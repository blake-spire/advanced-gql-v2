const {
  SchemaDirectiveVisitor,
  AuthenticationError,
} = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");

const { formatDate } = require("./utils");

class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { format } = this.args;

    field.resolve = async (...args) => {
      const results = await resolver.apply(this, args);

      return formatDate(results, format);
    };

    field.type = GraphQLString;
  }
}

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.resolve = (root, args, ctx, info) => {
      if (!ctx.user) {
        throw new AuthenticationError("User not authenticated");
      }

      return resolver(root, args, ctx, info);
    };
  }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { role } = this.args;

    field.resolve = (root, args, ctx, info) => {
      if (!ctx.user.role !== role) {
        throw new AuthenticationError("User not authorized");
      }

      return resolver(root, args, ctx, info);
    };
  }
}

module.exports = {
  DateFormatDirective,
  AuthenticationDirective,
  AuthorizationDirective,
};

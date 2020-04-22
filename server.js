const { ApolloServer, PubSub } = require("apollo-server");
const gql = require("graphql-tag");

const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

const typeDefs = gql`
	type User {
		id: ID!
		username: String!
		createdAt: Int!
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
			return { id: "1234", username: "blake", createAt: Date.now() };
		},

		settings(_rootVal, args) {
			const { user, settings } = args;
			return {
				user,
				theme: "dark",
			};
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
				createAt: Date.now(),
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
	},
	subscriptions: {
		// treat `params` as headers
		onConnect(params) {},
	},
});

server.listen().then(res => console.log(`listening on ${res.url}`));

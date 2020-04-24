const gql = require("graphql-tag");
const createTestServer = require("./helper");
const user = { id: 1 };
const CREATE_POST = gql`
  mutation {
    createPost(input: { message: "this is a test" }) {
      message
    }
  }
`;

describe("mutations", () => {
  test("createPost", async () => {
    const { mutate } = createTestServer({
      user,
      models: {
        Post: {
          createOne() {
            return { message: "this is a test" };
          },
        },
        user,
      },
    });

    const res = await mutate({ query: CREATE_POST });

    // match snapshot in `mutation.test.js.snap`
    expect(res).toMatchSnapshot();
  });
});

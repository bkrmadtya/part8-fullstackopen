const {
  ApolloServer,
  PubSub,
  UserInputError,
  AuthenticationError,
  gql
} = require('apollo-server');
const mongoose = require('mongoose');
const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');

const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');

const pubsub = new PubSub();

const JWT_SECRET = 'SECRET';

const MONGODB_URI =
  'mongodb+srv://fullstack:fullstack@cluster-fullstackopen-92tid.mongodb.net/test?retryWrites=true';

mongoose.set('useFindAndModify', false);

console.log('connecting to ', MONGODB_URI);
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch(error => {
    console.log('error connecting to MongoDB: ', errror.message);
  });

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    id: ID!
    bookCount: Int!
    born: Int
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book

    editAuthor(name: String!, setBornTo: Int!): Author

    createUser(username: String!, favoriteGenre: String!): User

    login(username: String!, password: String): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),

    authorCount: () => Author.collection.countDocuments(),

    allBooks: async (root, { author, genre }) => {
      let books;

      if (author && genre) {
        const aut = await Author.findOne({ name: author });
        books = await Book.find({
          genres: { $in: [genre] },
          author: aut._id
        }).populate('author');
      } else if (author) {
        const aut = await Author.findOne({ name: author });
        books = await Book.find({ author: aut._id }).populate('author');
      } else if (genre) {
        books = await Book.find({ genres: { $in: [genre] } }).populate(
          'author'
        );
      } else {
        books = await Book.find({}).populate('author');
      }

      return books;
    },

    allAuthors: async () => {
      const author = await Author.find({});
      return author;
    },

    me: (root, args, context) => {
      return context.currentUser;
    }
  },
  Author: {
    bookCount: root => {
      const books = Book.find({ author: root.id });

      return books.countDocuments();
    }
  },

  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('Not authenticated!');
      }

      let book;
      let author = await Author.findOne({ name: args.author });

      try {
        if (!author) {
          author = new Author({ name: args.author });
        }

        book = new Book({ ...args, author });
        await book.save();

        // only save author if book creation is successful
        await author.save();
      } catch (e) {
        throw new UserInputError(e.message, {
          invalidArgs: args
        });
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book });

      return book;
    },

    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('Not authenticated!');
      }

      const { name, setBornTo } = args;

      const author = await Author.findOne({ name: name });

      try {
        author.born = setBornTo;
        await author.save();
      } catch (e) {
        throw new UserInputError(e.message, {
          invalidArgs: args
        });
      }
      return author;
    },

    createUser: (root, { username, favoriteGenre }) => {
      const user = new User({ username, favoriteGenre });

      return user.save().catch(e => {
        throw new UserInputError(e.message, {
          invalidArgs: { username, favoriteGenre }
        });
      });
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secret') {
        throw new UserInputError('Wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    }
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);

      return { currentUser };
    }
  }
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});

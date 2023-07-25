const {AuthenticationError} = require('apollo-server-express');
const { User } = require('../models');
const {signToken} =require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({_id: context.user._id}).populate("savedBooks");
            }
            throw new AuthenticationError("Please Log In!");
        },
    },

    Mutation: {
        login: async (parent, {email,password}) => {
            const user = await User.findOne({email});
            if (!user) {
                throw new AuthenticationError("Incorrect user");
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect password');
            }
            const token = signToken(user);
            return {token,user};
        },
        addUser: async (parent, {username,email,password}) => {
            const user = await User.create({ username,email,password });
            const token = signToken(user);
            return { token,user };
        },
        saveBook: async (parent, {newBook}, context) => {
            if (context.user) {
                const user = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    { $addToSet: {savedBooks: newBook}},
                    { new:true }
                );
                return user;
            }
            throw new AuthenticationError('Please log in!');
        },
        removeBook: async (parent, {bookId}, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId}}},
                    {new: true},
                );
            }
            throw new AuthenticationError('Please log in');
        }
    }
};

module.exports = resolvers;


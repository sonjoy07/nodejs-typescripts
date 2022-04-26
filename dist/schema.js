"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql = require('graphql');
const Categories = require('./models/category');
const redis_1 = require("redis");
const redisPort = process.env.REDISPORT;
const user = '123';
const client = (0, redis_1.createClient)({
    legacyMode: true
});
redisConnect();
function redisConnect() {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.connect();
    });
}
const { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLSchema, GraphQLID, } = graphql;
const Category = new GraphQLObjectType({
    name: 'Category',
    fields: () => ({
        id: {
            type: GraphQLID,
        },
        name: {
            type: GraphQLString,
        },
        parentId: {
            type: GraphQLString,
        },
        isActive: {
            type: graphql_1.GraphQLBoolean
        },
        subCategory: {
            type: Category,
            resolve: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                const data = yield Categories.findOne({ parentId: parent.id }).exec();
                return data;
            })
        },
        parentCategory: {
            type: Category,
            resolve: (parent, _args) => __awaiter(void 0, void 0, void 0, function* () {
                const data = yield Categories.findById(parent.parentId);
                return data;
            })
        }
    }),
});
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        categories: {
            type: new GraphQLList(Category),
            resolve: () => __awaiter(void 0, void 0, void 0, function* () {
                const categories = yield Categories.find().exec();
                const cache = yield client.lRange('categories', 0, -1);
                // client.get('categories', redis.print);
                console.log('cache', cache);
                if (categories === cache) {
                    return JSON.parse(cache);
                }
                else {
                    client.setEx('categories', 3600, JSON.stringify(categories));
                    return categories;
                }
            }),
        },
        category: {
            type: Category,
            args: {
                id: { type: GraphQLID },
            },
            resolve(_parent, args) {
                return Categories.findById(args.id);
            },
        },
    },
});
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createCategory: {
            type: Category,
            args: {
                name: { type: GraphQLString },
                parentId: { type: GraphQLID },
            },
            resolve(_parent, args) {
                const category = new Categories({
                    name: args.name,
                    parentId: args.parentId,
                    isActive: true
                });
                return category.save();
            },
        },
        updateCategory: {
            type: Category,
            args: {
                id: { type: GraphQLString },
                name: { type: GraphQLString },
                parentId: { type: GraphQLID },
                isActive: { type: graphql_1.GraphQLBoolean }
            },
            resolve: (parent, args) => __awaiter(void 0, void 0, void 0, function* () {
                if (args.isActive === false) {
                    const res = yield Categories.update({ id: parent === null || parent === void 0 ? void 0 : parent.parentId }, { isActive: false });
                }
                return Categories.findOneAndUpdate({
                    _id: args.id
                }, {
                    name: args.name,
                    parentId: args.parentId,
                    isActive: args.isActive,
                });
            }),
        },
        deleteCategory: {
            type: Category,
            args: {
                id: { type: GraphQLString },
            },
            resolve: (_parent, args) => __awaiter(void 0, void 0, void 0, function* () {
                return Categories.findByIdAndDelete({
                    _id: args.id,
                });
            }),
        },
    },
});
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});

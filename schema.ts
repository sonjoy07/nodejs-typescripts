import { GraphQLBoolean } from "graphql";

const graphql = require('graphql');
const Categories = require('./models/category');
import redis,{ createClient } from 'redis';


const redisPort:any = process.env.REDISPORT;
const user = '123'

const client = createClient({
    legacyMode: true
})
redisConnect()
async function redisConnect(){
    await client.connect()
}

const {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLSchema,
    GraphQLID,
} = graphql;

interface Icategory {
    id: string;
    name: string;
    parentId: string;
    isActive: boolean;
}

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
            type: GraphQLBoolean
        },
        subCategory: {
            type: Category,
            resolve: async (parent: Icategory) => {
                const data = await Categories.findOne({ parentId: parent.id }).exec()
                return data
            }
        },
        parentCategory: {
            type: Category,
            resolve: async (parent: Icategory, _args: any) => {
                const data = await Categories.findById(parent.parentId)
                return data
            }
        }
    }),
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        categories: {
            type: new GraphQLList(Category),
            resolve:async()=> {
                const categories = await Categories.find().exec();
                const cache:any = await client.lRange('categories',0,-1)
                // client.get('categories', redis.print);
                console.log('cache',cache)
                if(categories === cache){
                    return JSON.parse(cache)
                }else{
                    client.setEx('categories',3600,JSON.stringify(categories))
                    return categories
                }
            },
        },
        category: {
            type: Category,
            args: {
                id: { type: GraphQLID },
            },
            resolve(_parent: Icategory, args: Icategory) {
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
            resolve(_parent: Icategory, args: Icategory) {
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
                isActive: { type: GraphQLBoolean }
            },
            resolve: async (parent: Icategory, args: Icategory) => {
                if (args.isActive === false) {
                    const res = await Categories.update({ id: parent?.parentId }, { isActive: false });
                }
                return Categories.findOneAndUpdate({
                    _id: args.id
                }, {
                    name: args.name,
                    parentId: args.parentId,
                    isActive: args.isActive,
                });
            },
        },
        deleteCategory: {
            type: Category,
            args: {
                id: { type: GraphQLString },
            },
            resolve: async (_parent: Icategory, args: Icategory) => {
                return Categories.findByIdAndDelete({
                    _id: args.id,
                });
            },
        },
    },
});
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});

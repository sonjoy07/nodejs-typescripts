import { GraphQLBoolean } from "graphql";

const graphql = require('graphql');
const Categories = require('./models/category');
import mongoose from 'mongoose';
const Redis = require('ioredis');


const redis = new Redis({
    port: 6379,
    host: '127.0.0.1',
});
redisConnect()
async function redisConnect(){
  await redis.del('categories');
}

  // clear cache

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
            resolve: async () => {
                const categories = await Categories.find();
                const listings = (await redis.lrange('categories', 0, -1)) || [];
                if (listings.length > 0) {
                    const parseData = listings.map((x:any)=>{
                        const category =  JSON.parse(x);
                        category.id = new mongoose.Types.ObjectId(category.id)
                        return category                        
                    })                    
                    return parseData;
                } else {
                    const listingStrings = categories.map((x: string) => JSON.stringify(x));
                    if (listingStrings.length) {
                        await redis.lpush('categories', listingStrings);
                    }
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
            resolve:async(_parent: Icategory, args: Icategory)=> {
                const category = new Categories({
                    name: args.name,
                    parentId: args.parentId,
                    isActive: true
                });
                const saveData = await category.save();
                redis.lpush('categories', JSON.stringify(saveData));                
                return saveData
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
                const updateData = await Categories.findOneAndUpdate({
                    _id: args.id
                }, {
                    name: args.name,
                    parentId: args.parentId,
                    isActive: args.isActive,
                });
                
                redis.del('categories');
                return updateData
            },
        },
        deleteCategory: {
            type: Category,
            args: {
                id: { type: GraphQLString },
            },
            resolve: async (_parent: Icategory, args: Icategory) => {
                const deleteData =  Categories.findByIdAndDelete({
                    _id: args.id,
                });
                redis.del('categories');
                return deleteData
            },
        },
    },
});
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});

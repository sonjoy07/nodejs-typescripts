import { GraphQLBoolean } from "graphql";

const graphql = require('graphql');
const Categories = require('./models/category');
import { createClient } from 'redis';


const redisPort:any = process.env.REDISPORT;

const client = createClient()
client.on('connect',()=>{
    console.log('redis connected');
    
})

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
            resolve: async (parent: Icategory, args: any) => {
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
                const categories =  Categories.find();
                client.setEx('categories',3600,categories);
                // const cache = await client.get('categories')
                // console.log(cache);
                
                // if()
            },
        },
        category: {
            type: Category,
            args: {
                id: { type: GraphQLID },
            },
            resolve(parent: Icategory, args: Icategory) {
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
            resolve(parent: Icategory, args: Icategory) {
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
            resolve: async (parent: Icategory, args: Icategory) => {
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

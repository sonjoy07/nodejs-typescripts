import express, { Express, Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import mongoose from 'mongoose';
const schema = require('./schema');
import dotenv from 'dotenv';
import { createClient } from 'redis';
const client = createClient()
client.on('error', (err) => console.log('Redis Client Error', err));

//  console.log(client.connect());
 

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const username:string = encodeURIComponent('sonjoy');
const password:string = encodeURIComponent('sonjoy@123456');

main().catch((err) => console.log(err));

async function main() {
  const connect = await mongoose.connect(
    `mongodb+srv://${username}:${password}@cluster0.wvrbs.mongodb.net/test?retryWrites=true&w=majority`
  );
  await client.connect();
  if (connect) {
    console.log('connected');
  }
}
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
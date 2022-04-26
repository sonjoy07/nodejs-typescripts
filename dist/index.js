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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_graphql_1 = require("express-graphql");
const mongoose_1 = __importDefault(require("mongoose"));
const schema = require('./schema');
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const client = (0, redis_1.createClient)();
client.on('error', (err) => console.log('Redis Client Error', err));
//  console.log(client.connect());
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const username = encodeURIComponent('sonjoy');
const password = encodeURIComponent('sonjoy@123456');
main().catch((err) => console.log(err));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const connect = yield mongoose_1.default.connect(`mongodb+srv://${username}:${password}@cluster0.wvrbs.mongodb.net/test?retryWrites=true&w=majority`);
        yield client.connect();
        if (connect) {
            console.log('connected');
        }
    });
}
app.use('/graphql', (0, express_graphql_1.graphqlHTTP)({
    schema,
    graphiql: true,
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at https://localhost:${port}`);
});

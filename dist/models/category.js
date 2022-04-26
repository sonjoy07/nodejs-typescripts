"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CategorySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    parentId: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        required: false
    }
});
const Category = mongoose_1.default.model("Category", CategorySchema);
module.exports = Category;

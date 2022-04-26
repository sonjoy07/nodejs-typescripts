import mongoose from 'mongoose';

interface Icategory {
    name: string;
    parentId: string;
    isActive: boolean;
}
const CategorySchema = new mongoose.Schema<Icategory>({
    name: {
        type: String,
        required: true,
        trim: true,
        unique:true
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

const Category = mongoose.model<Icategory>("Category", CategorySchema);

module.exports = Category;
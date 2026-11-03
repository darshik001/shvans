const mongoose = require('mongoose')
const { CustomeError } = require('../../../middleware/globelError')
const cartModel = require('../../../model/cart.model')
const productModel = require('../../../model/product.model')

// 1. Add Cart (Bulk Insert Many)
exports.AddCart = async (req, res, next) => {
    try {
        let { carts } = req.body || [];

        if (!carts || !Array.isArray(carts) || carts.length === 0) {
            return next(CustomeError(422, "Carts data is required"));
        }

        const userId = req.user._id.toString();

        // Fetch existing cart items for this user
        const existingCartItems = await cartModel.find({ userId });

        // Map existing items to a Set for quick lookup by productId + variantId
        const existingSet = new Set(
            existingCartItems.map(item => `${item.productId?.toString()}_${item.variantId?.toString()}`)
        );

        const itemsToInsert = [];
        const seenInPayload = new Set();

        for (const item of carts) {
            const { productId, variantId, quantity } = item || {};

            if (!productId || !variantId) {
                continue;
            }

            const key = `${productId.toString()}_${variantId.toString()}`;

            // Only add if not already in user's cart in DB and not duplicated in current payload
            if (!existingSet.has(key) && !seenInPayload.has(key)) {
                seenInPayload.add(key);
                itemsToInsert.push({
                    userId,
                    productId,
                    variantId,
                    quantity: Number(quantity || quantity || 1)
                });
            }
        }

        if (itemsToInsert.length > 0) {
            const newCartItems = await cartModel.insertMany(itemsToInsert);
            const carts = await cartModel.find({ userId });
            return res.status(200).json({
                success: true,
                message: "Cart items added successfully",
                addedCount: newCartItems.length,
                carts
            });
        }

        return res.status(200).json({
            success: true,
            message: "All items already exist in user's cart",
            addedCount: 0,
            carts: existingCartItems
        });

    } catch (error) {
        return next(error);
    }
}

// 2. Get User Cart
exports.GetCart = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();

        const cartItems = await cartModel.find({ userId })
            .populate({
                path: 'productId',
                select: 'name sku description additionalInfo productImages variants packing status categoryId'
            })
            .sort({ createdAt: -1 });

        // Format cart items with matched variant and absolute image URLs
        const formattedCart = cartItems.map(item => {
            const product = item.productId;
            if (!product) {
                return {
                    _id: item._id,
                    userId: item.userId,
                    productId: null,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    product: null,
                    variant: null,
                    itemTotal: 0
                };
            }

            const productObj = product.toObject ? product.toObject() : product;

            // Format images with full backend URL
            const images = (productObj.productImages || []).map(img =>
                img ? (img.startsWith('http') ? img : `${process.env.BACKEND_DOMIN_URL || ''}${img}`) : ''
            );

            // Find matching variant
            const variant = (productObj.variants || []).find(
                v => v._id?.toString() === item.variantId?.toString()
            ) || null;

            const unitPrice = variant?.price || 0;
            const itemTotal = unitPrice * item.quantity;

            return {
                _id: item._id,
                userId: item.userId,
                productId: productObj._id,
                variantId: item.variantId,
                quantity: item.quantity,
                product: {
                    _id: productObj._id,
                    name: productObj.name,
                    sku: productObj.sku,
                    description: productObj.description,
                    productImages: images,
                    packing: productObj.packing,
                    status: productObj.status
                },
                variant,
                itemTotal,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            };
        });

        const cartTotal = formattedCart.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        const totalQuantity = formattedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);

        return res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            totalItems: formattedCart.length,
            totalQuantity,
            cartTotal,
            carts: formattedCart
        });

    } catch (error) {
        return next(error);
    }
}

// 3. Update Cart Item Quantity
exports.UpdateCart = async (req, res, next) => {
    try {
        const cartId = req.params.id || req.body?.cartId;
        const { quantity } = req.body || {};

        const newQty = Number(quantity ?? quantity);

        // Cart ID validation
        if (!cartId) {
            return next(CustomeError(422, "Cart ID is required"));
        }

        if (!mongoose.Types.ObjectId.isValid(cartId)) {
            return next(CustomeError(422, "Invalid Cart ID"));
        }

        // Quantity validation
        if (Number.isNaN(newQty) || !Number.isInteger(newQty)) {
            return next(CustomeError(422, "Quantity must be a valid integer"));
        }

        const userId = req.user._id.toString();

        // Find cart item
        const cartItem = await cartModel.findOne({ _id: cartId, userId });

        if (!cartItem) {
            return next(CustomeError(404, "Cart item not found"));
        }

        // If quantity is 0 or less, delete cart item
        if (newQty <= 0) {
            const cart = await cartModel.findByIdAndDelete({ _id: cartId, userId });
            return res.status(200).json({
                success: true,
                message: "Product removed from cart",
                deleted: true,
                cart,
            });
        }

        // Update quantity
        cartItem.quantity = newQty;
        await cartItem.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            deleted: false,
            cart: cartItem,
        });

    } catch (error) {
        return next(error);
    }
};

// 4. Delete Cart Item
exports.DeleteCart = async (req, res, next) => {
    try {
        const cartId = req.params.id || req.body?.cartId;

        if (!cartId) {
            return next(CustomeError(422, "Cart ID is required"));
        }

        if (!mongoose.Types.ObjectId.isValid(cartId)) {
            return next(CustomeError(422, "Invalid Cart ID"));
        }

        const userId = req.user._id.toString();

        const deletedItem = await cartModel.findOneAndDelete({ _id: cartId, userId });
        if (!deletedItem) {
            return next(CustomeError(404, "Cart item not found"));
        }

        return res.status(200).json({
            success: true,
            message: "Cart item deleted successfully",
            cartId: deletedItem._id
        });

    } catch (error) {
        return next(error);
    }
}

// 5. Clear Entire Cart for User
exports.ClearCart = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();

        const result = await cartModel.deleteMany({ userId });

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        return next(error);
    }
}


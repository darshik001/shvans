const { razorpay, razorpaySignature } = require("../../../config/razorpay.config")
const { CustomeError } = require("../../../middleware/globelError")
const productModel = require("../../../model/product.model")
const checkoutModel = require('../../../model/checkout.model')
const couponModel = require('../../../model/coupon.model')
const { getshippingcharg, CreatOrderINShiproket } = require("../../../services/shiproketapis")
const userModel = require("../../../model/user.model")
const orderModel = require("../../../model/order.model")


exports.RazorpayPaymentOrder = async (req, res, next) => {
    try {
        const { carts } = req.body

        if (!carts || !Array.isArray(carts)) {
            return next(CustomeError(422, "carts is required"))
        }


        const productIds = carts.map(item => item.productId);

        const products = await productModel.find({
            _id: { $in: productIds }
        });



        const line_items = carts.map(cart => {
            const product = products.find(
                p => p._id.toString() === cart.productId
            );

            if (!product) {
                throw CustomeError(404, `Product not found: ${cart.productId}`);
            }

            const variant = product.variants.find(
                v => v._id.toString() === cart.variantId
            );

            if (!variant) {
                throw CustomeError(404, `Variant not found: ${cart.variantId}`);
            }

            if (!Number.isInteger(cart.quantity) || cart.quantity < 1) {
                throw CustomeError(422, "Invalid product quantity");
            }

            if (variant.stock < cart.quantity) {
                throw CustomeError(400, `Insufficient stock for ${product.name}`);
            }

            const price = Math.round(variant.price * 100);

            return {
                type: "e-commerce",
                sku: product.sku,
                variant_id: variant._id.toString(),
                price,
                offer_price: price,
                quantity: cart.quantity,
                name: product.name,
                description: product.description || "",
                image_url: `${process.env.BACKEND_DOMIN_URL}${product.productImages?.[0]}`,
                product_url: `${process.env.BACKEND_DOMIN_URL}/products/${product._id}`
            };
        });


        const line_items_total = line_items.reduce((total, item) => total + item.offer_price * item.quantity, 0);
        const orderNumber = "SHV_" + Math.floor(100000 + Math.random() * 900000) + Date.now().toString().slice(-6);


        const options = {
            amount: line_items_total,
            currency: "INR",
            receipt: orderNumber,
            line_items_total,
            line_items,
        }

        const orderData = await razorpay.orders.create(options)


        if (!orderData) {
            return next(CustomeError(500, 'Server Error'))
        }
        console.log(orderData.id)
        console.log(line_items)
        console.log(line_items_total)
        const checkoutData = await checkoutModel.create({ order_id: orderData.receipt, line_items, line_items_total })

        return res.status(200).json({ success: true, message: 'Payment Order Successfully', PaymentOrder: orderData, razorpayKey: process.env.RAZORPAY_API_KEY })


    } catch (error) {
        return next(error)
    }
}



exports.RazorpayShippingInfo = async (req, res) => {
    try {
        const { addresses, razorpay_order_id, order_id } = req.body || {};

        // Security validation
        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return res.status(400).json({ error: "Addresses array is missing" });
        }

        const checkoutOrder = await checkoutModel.findOne({ order_id: order_id })
        if (!checkoutOrder) {
            return res.status(404).json({
                success: false,
                message: "Checkout order not found"
            });
        }

        const skuArray = checkoutOrder.line_items.map(item => item.sku);

        const products = await productModel.find({
            sku: { $in: skuArray }
        }).select("sku packing.weight");

        const productWeightMap = new Map(
            products.map(product => [
                product.sku,
                Number(product.packing?.weight) || 0
            ])
        );

        const totalWeight = checkoutOrder.line_items.reduce((total, item) => {
            const weight = productWeightMap.get(item.sku) || 0;
            return total + (weight * Number(item.quantity || 0));
        }, 0);
        console.log(totalWeight)
        const DEFAULT_WEIGHT_KG = totalWeight || "0.5"; // Parcel nu average weight (in kg)

        // Razorpay multiple addresses mokali shake chhe, darek address mate rates process karo
        const responseAddresses = await Promise.all(addresses.map(async (addr) => {
            const deliveryPincode = addr.zipcode;

            try {
                // 1. Shiprocket Serviceability API call કરવા માટે ડેટા ઓબ્જેક્ટ
                const data = {
                    pincode: deliveryPincode,
                    weight: DEFAULT_WEIGHT_KG,
                    cod: 1 // COD અને Prepaid બંને ચાર્જ એકસાથે મેળવવા માટે 1 રાખવો
                };

                const srRes = await getshippingcharg(data);

                // Shiprocket ના રિસ્પોન્સમાંથી અવેલેબલ કુરિયર્સ કાઢો
                const couriers = srRes.data?.data?.available_courier_companies || [];

                // Jo koi courier available na hoy to unserviceable return karo
                if (couriers.length === 0) {
                    return {
                        id: addr.id,
                        zipcode: addr.zipcode,
                        state_code: addr.state_code,
                        country: addr.country,
                        shipping_methods: [{
                            id: "standard",
                            name: "Standard Delivery",
                            description: "Delivery not available at this pincode",
                            serviceable: false,
                            shipping_fee: 0,
                            cod: false,
                            cod_fee: 0
                        }]
                    };
                }


                const sortedCouriers = couriers.sort((a, b) => a.rate - b.rate);
                const cheapestCourier = sortedCouriers[0];
                const livePrepaidRateInRupees = Math.round(cheapestCourier.freight_charge);
                const isCodAvailable = cheapestCourier.cod === 1;
                const liveCodFeeInRupees = isCodAvailable ? Math.round(cheapestCourier.cod_charges) : 0;
                const shippingFeeInPaise = livePrepaidRateInRupees * 100;
                const codFeeInPaise = liveCodFeeInRupees * 100;

                return {
                    id: addr.id,
                    zipcode: addr.zipcode,
                    state_code: addr.state_code,
                    country: addr.country,
                    shipping_methods: [{
                        id: String(cheapestCourier.courier_company_id),
                        name: cheapestCourier.courier_name || "Express Courier",
                        description: `Estimated Delivery: ${cheapestCourier.etd || '3-5 days'}`,
                        serviceable: true,
                        shipping_fee: shippingFeeInPaise,
                        cod: isCodAvailable,
                        cod_fee: codFeeInPaise
                    }]
                };

            } catch (err) {
                console.error(`Error fetching Shiprocket rate for pincode ${deliveryPincode}:`, err?.message);

                // Fallback / Default Flat Rate jo API fail thay to
                return {
                    id: addr.id,
                    zipcode: addr.zipcode,
                    state_code: addr.state_code,
                    country: addr.country,
                    shipping_methods: [{
                        id: "standard_fallback",
                        name: "Standard Shipping",
                        description: "Standard Delivery within 4-6 days",
                        serviceable: true,
                        shipping_fee: 6000,
                        cod: true,
                        cod_fee: 4500
                    }]
                };
            }
        }));

        return res.status(200).json({
            addresses: responseAddresses
        });

    } catch (error) {
        console.error("Internal Server Error in Shipping Info:", error);
        return res.status(500).json({ error: "Failed to calculate shipping" });
    }
};




exports.RazorpayGetPromotion = async (req, res, next) => {
    try {
        let promotions = await couponModel.find()

        promotions = promotions.map((promotion) => ({
            code: promotion.couponCode,
            summary: promotion.summary,
            description: promotion.description
        }));

        return res.status(200).json({ success: true, message: "Get Promation Successfully", promotions })
    } catch (error) {
        return next(error)
    }
}


exports.RazorpayGetPromotionApplay = async (req, res, next) => {
    try {
        const { order_id, code, contact, email } = req.body || {};
        const promotion = await couponModel.findOne({ couponCode: code })
        if (!promotion) {
            return res.status(200).json({
                failure_code: "INVALID_PROMOTION",
                failure_reason: "Invalid coupon code. Please enter a valid coupon code."
            })
        }

        const checkoutorder = await checkoutModel.findOne({ order_id: order_id })
        const cartvalue = (checkoutorder.line_items_total / 100)
        if (promotion.cart_value !== null) {
            if (promotion.cart_value > cartvalue) {
                return res.status(200).json({
                    failure_code: "REQUIREMENT_NOT_MET",
                    failure_reason: "Your cart value is too low to apply this coupon."
                })
            }
        }

        await checkoutModel.findByIdAndUpdate(checkoutorder._id, { coupon_id: promotion._id })
        const value = promotion.value_type == "fixed_amount" ? promotion.value * 100 : promotion.value
        const promotionData = {
            reference_id: promotion._id,
            type: "coupon",
            code: promotion.couponCode,
            value: value,
            value_type: promotion.value_type,
            description: promotion.description
        }


        return res.status(200).json({ success: true, message: "Coupon Applay Successfully", promotion: { ...promotionData } })

    } catch (error) {
        return next(error)
    }
}


exports.RazorapayVerifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}

        if (!razorpay_order_id) {
            return next(CustomeError(400, "Missing razorpay_order_id"));
        }

        // 1. Security Check for duplicate fraud detection
        const existingFinalOrder = await orderModel.findOne({ "paymentData.razorpay_order_id": razorpay_order_id });
        if (existingFinalOrder) {
            return next(CustomeError(400, "This order has already been processed and placed!"));
        }

        // 2. Fetch order data from Razorpay API
        const paymentOrderData = await razorpay.orders.fetch(razorpay_order_id);

        // 3. Auto-detect COD vs Prepaid
        const is_cod = paymentOrderData.status !== "paid";

        if (!is_cod) {
            // Safety parameter check for prepaid validation
            if (!razorpay_payment_id || !razorpay_signature) {
                return next(CustomeError(400, "Missing payment verification parameters"));
            }
            const signature = razorpaySignature(razorpay_order_id, razorpay_payment_id);
            if (signature !== razorpay_signature) {
                return next(CustomeError(409, "Payment Not Verified"));
            }
        }

        console.log("--- Full Order Data ---", JSON.stringify(paymentOrderData, null, 2));

        // Magic Checkout customer info formatting
        const magicCustomer = paymentOrderData.customer_details || {};
        const shippingAddress = magicCustomer.shipping_address || null;

        const promotion = (paymentOrderData.promotions && paymentOrderData.promotions[0]) || {};

        // 🛠️ Subunits to Rupees safety block with fallbacks fixed
        const cod_fee = (paymentOrderData.cod_fee || 0) / 100;
        const shipping_fee = (paymentOrderData.shipping_fee || 0) / 100;

        // 🛠️ Safe contact replacement check logic fixed
        const mobile = magicCustomer.contact ? magicCustomer.contact.replace(/^\+91/, "") : "";
        const email = magicCustomer.email || "";
        const name = magicCustomer.name || (shippingAddress && shippingAddress.name) || "Customer";

        // User profile engine processing
        let user;
        if (mobile) {
            user = await userModel.findOne({ phone: mobile });
        }

        if (user) {
            if (!user.email && email) user.email = email;
            if (!user.name && name) user.name = name;
            await user.save();
        } else if (email) {
            user = await userModel.findOne({ email });
            if (user) {
                if (!user.phone && mobile) user.phone = mobile;
                if (!user.name && name) user.name = name;
                await user.save();
            } else {
                user = await userModel.create({ name, phone: mobile, email });
            }
        } else {
            user = await userModel.create({ name, phone: mobile });
        }

        // Fetch user checkout items
        const checkoutOrder = await checkoutModel.findOne({ order_id: paymentOrderData.receipt });
        if (!checkoutOrder) {
            return next(CustomeError(404, 'Checkout Order Not Found Create New Order'));
        }

        const items = checkoutOrder.line_items.map(item => ({
            ...item.toObject?.() ?? item,
            price: item.price / 100
        }));

        const discount = (promotion.value || 0) / 100;
        const coupponId = promotion.reference_id || null;
        const shippingcharges = cod_fee + shipping_fee;
        const total = paymentOrderData.amount / 100;

        // 🛠️ FIX: Proper tracking properties assignment block
        let paymentData = {};
        if (paymentOrderData.status === "paid") {
            paymentData = {
                method: "prepaid",
                razorpay_order_id,
                razorpay_payment_id,
                status: 'paid',
                completeAt: Date.now()
            };
        } else {
            paymentData = {
                method: "cod",
                razorpay_order_id,
                razorpay_payment_id: null,
                status: 'pending'
            };
        }





        const skuArray = checkoutOrder.line_items.map(item => item.sku);

        const products = await productModel.find({
            sku: { $in: skuArray }
        }).select("sku packing.weight");

        const productWeightMap = new Map(
            products.map(product => [
                product.sku,
                Number(product.packing?.weight) || 0
            ])
        );

        const totalWeight = checkoutOrder.line_items.reduce((total, item) => {
            const weight = productWeightMap.get(item.sku) || 0;
            return total + (weight * Number(item.quantity || 0));
        }, 0);


        const totalWidth = checkoutOrder.line_items.reduce((total, item) => {
            const width = productWeightMap.get(item.sku)?.width || 0;
            return total + (width * Number(item.quantity || 0));
        }, 0);

        const totalHeight = checkoutOrder.line_items.reduce((total, item) => {
            const height = productWeightMap.get(item.sku)?.height || 0;
            return total + (height * Number(item.quantity || 0));
        }, 0);

        const totalLength = checkoutOrder.line_items.reduce((total, item) => {
            const length = productWeightMap.get(item.sku)?.length || 0;
            return total + (length * Number(item.quantity || 0));
        }, 0);

        const totalQuantity = checkoutOrder.line_items.reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );

        const width = totalQuantity ? totalWidth / totalQuantity : 0;
        const height = totalQuantity ? totalHeight / totalQuantity : 0;
        const length = totalQuantity ? totalLength / totalQuantity : 0;

        const packageDetails = {
            pincode: shippingAddress.zipcode,
            weight: totalWeight,
            cod: is_cod ? 1 : 0,
        };


        const srRes = await getshippingcharg(packageDetails);

        const bestCourier = srRes?.data.data.available_courier_companies.reduce((best, current) => current.rate < best.rate ? current : best);

        const courierDetails = {
            courierCompanyId: bestCourier.courier_company_id,
            courierId: bestCourier.id,
            courierName: bestCourier.courier_name,
            rate: bestCourier.rate,
            freightCharge: bestCourier.freight_charge,
            chargeWeight: bestCourier.charge_weight,
            estimatedDeliveryDays: bestCourier.estimated_delivery_days,
            etd: bestCourier.etd,
            zone: bestCourier.zone
        };

        const order_items = items.map(item => ({
            name: item.name,
            sku: item.sku,
            units: Number(item.quantity),
            selling_price: Number(item.price),
            discount: 0,
            tax: 0,
            hsn: item.HSCode || ""
        }))


        const createorderData = {
            order_id: paymentOrderData.receipt,
            order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
            pickup_location: process.env.SHIPROKET_PICKUP_LOCATION || "HOME",
            channel_id: "",
            comment: "Creat New Order",

            billing_customer_name: user.name,
            billing_last_name: user.name,
            billing_address: shippingAddress.line1,
            billing_address_2: shippingAddress.line2,
            billing_city: shippingAddress.city,
            billing_pincode: shippingAddress.zipcode,
            billing_state: shippingAddress.state,
            billing_country: "India",
            billing_email: user.email,
            billing_phone: user.phone,

            shipping_is_billing: true,
            order_items,
            payment_method: is_cod ? "COD" : "Prepaid",
            shipping_charges: shippingcharges,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: discount,
            sub_total: total,
            length,
            breadth: width,
            height,
            weight: totalWeight
        }


        const confirmshiproketorderData = await CreatOrderINShiproket(createorderData)


        const awsData = {
            shipment_id: confirmshiproketorderData.shipment_id,
            courier_id: courierDetails.courierId,

        }
        const shipmentData = {
            shipment_id: confirmshiproketorderData.shipment_id,
            shiprocket_order_id: confirmshiproketorderData.order_id,
            awb_number: null,
            courier_id: courierDetails.courierId,
            courier_partner: courierDetails.courierName
        }



        const placedOrderdata = {
            userId: user._id,
            couponId: coupponId,
            orderNumber: paymentOrderData.receipt,
            type: "forward",
            address: shippingAddress,
            items,
            discount,
            shippingcharges,
            total,
            paymentData,
            shipmentData
        };

        const NewOrder = await orderModel.create(placedOrderdata);

        await checkoutModel.findByIdAndDelete(checkoutOrder._id)
        return res.status(200).json({ success: true, message: 'Order Placed Successfully', order: NewOrder });

    } catch (error) {
        return next(error);
    }
};





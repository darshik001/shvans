
const inquiryModel = require("../../model/inquiry.model");
const orderModel = require("../../model/order.model");
const productModel = require("../../model/product.model");
const userModel = require("../../model/user.model");

const getPeriodDates = (period) => {
    const now = new Date();

    let start = new Date(now);
    let previousStart = new Date(now);
    let previousEnd = new Date(now);
    let next = new Date(now);

    if (period === "week") {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;

        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);

        next = new Date(start);
        next.setDate(next.getDate() + 7);

        previousEnd = new Date(start);
        previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 7);
    } else if (period === "year") {
        start = new Date(now.getFullYear(), 0, 1);
        next = new Date(now.getFullYear() + 1, 0, 1);

        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        previousEnd.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        );
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        previousEnd = new Date(previousStart);
        previousEnd.setDate(
            Math.min(now.getDate(), new Date(
                previousStart.getFullYear(),
                previousStart.getMonth() + 1,
                0
            ).getDate())
        );
        previousEnd.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        );
    }

    return { start, next, previousStart, previousEnd, now };
};

const getPercentage = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Number(
        (((current - previous) / previous) * 100).toFixed(1)
    );
};

const revenueMatch = {
    type: "forward",
    status: "delivered",
    "paymentData.status": "paid",
    completeAt: { $ne: null },
};

exports.GetDashboard = async (req, res, next) => {
    try {

        const period = ["week", "month", "year"].includes(req.query.period)
            ? req.query.period
            : "week";

        const {
            start,
            next,
            previousStart,
            previousEnd,
            now,
        } = getPeriodDates(period);

        // 1. Total Revenue - Current & Previous Period

        const revenueResults = await orderModel.aggregate([
            {
                $match: {
                    ...revenueMatch,
                    completeAt: {
                        $gte: previousStart,
                        $lt: next,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ["$completeAt", start] },
                            "previous",
                            "current",
                        ],
                    },
                    total: { $sum: "$total" },
                },
            },
        ]);

        const currentRevenue =
            revenueResults.find(x => x._id === "current")?.total || 0;

        const previousRevenue =
            revenueResults.find(x => x._id === "previous")?.total || 0;

        // 2. Total Orders - Current & Previous Period

        const [currentOrders, previousOrders] = await Promise.all([
            orderModel.countDocuments({
                createdAt: { $gte: start, $lt: now },
            }),
            orderModel.countDocuments({
                createdAt: { $gte: previousStart, $lt: previousEnd },
            }),
        ]);

        // 3. Total Products

        const totalProducts = await productModel.countDocuments();

        const [currentProducts, previousProducts] = await Promise.all([
            productModel.countDocuments({
                createdAt: { $gte: start, $lt: now },
            }),
            productModel.countDocuments({
                createdAt: { $gte: previousStart, $lt: previousEnd },
            }),
        ]);

        // 4. Total Customers

        const totalCustomers = await userModel.countDocuments({
            role: "user",
        });

        const [currentCustomers, previousCustomers] = await Promise.all([
            userModel.countDocuments({
                role: "user",
                createdAt: { $gte: start, $lt: now },
            }),
            userModel.countDocuments({
                role: "user",
                createdAt: { $gte: previousStart, $lt: previousEnd },
            }),
        ]);

        // 5. Order Summary

        const [
            completedOrders,
            processingOrders,
            pendingOrders,
        ] = await Promise.all([
            orderModel.countDocuments({ status: "delivered" }),
            orderModel.countDocuments({
                status: {
                    $in: [
                        "accepted",
                        "processing",
                        "pickup",
                        "shipped",
                        "out_for_delivery",
                    ],
                },
            }),
            orderModel.countDocuments({ status: "pending" }),
        ]);

        const totalSummary =
            completedOrders + processingOrders + pendingOrders;

        // 6. Recent Orders

        const recentOrders = await orderModel
            .find()
            .populate("userId", "name email phone")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();

        const formattedOrders = recentOrders.map(order => ({
            id: order.orderNumber,
            customer: order.userId?.name || "Guest",
            email: order.userId?.email || "",
            product:
                order.items?.map(item => item.name).join(", ") || "N/A",
            date: order.createdAt,
            amount: order.total,
            status: order.status,
            type: order.type,
        }));

        // 7. Top Selling Products
        // Only revenue eligible orders

        const topProducts = await orderModel.aggregate([
            {
                $match: revenueMatch,
            },
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.productId",
                    sold: { $sum: "$items.quantity" },
                },
            },
            {
                $sort: { sold: -1 },
            },
            {
                $limit: 5,
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    name: { $ifNull: ["$product.name", "Deleted Product"] },
                    category: { $ifNull: ["$product.sku", "N/A"] },
                    sold: 1,
                    price: {
                        $ifNull: [
                            { $arrayElemAt: ["$product.variants.price", 0] },
                            0,
                        ],
                    },
                    image: {
                        $arrayElemAt: ["$product.productImages", 0],
                    },
                },
            },
        ]);

        // 8. Sales Analytics Chart

        const chartOrders = await orderModel.aggregate([
            {
                $match: {
                    ...revenueMatch,
                    completeAt: {
                        $gte: start,
                        $lt: now,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format:
                                period === "year"
                                    ? "%Y-%m"
                                    : "%Y-%m-%d",
                            date: "$completeAt",
                        },
                    },
                    value: { $sum: "$total" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const chartMap = new Map(
            chartOrders.map(item => [item._id, item.value])
        );

        let chartData = [];

        if (period === "week") {
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

            chartData = days.map((day, index) => {
                const date = new Date(start);
                date.setDate(date.getDate() + index);

                const key = date.toLocaleDateString("en-CA");

                return {
                    day,
                    value: chartMap.get(key) || 0,
                };
            });
        } else if (period === "month") {
            const totalDays = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            ).getDate();

            chartData = Array.from({ length: totalDays }, (_, index) => {
                const date = new Date(start);
                date.setDate(index + 1);

                const key = date.toLocaleDateString("en-CA");

                return {
                    day: `${index + 1}`,
                    value: chartMap.get(key) || 0,
                };
            });
        } else {
            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];

            chartData = months.map((month, index) => {
                const key = `${now.getFullYear()}-${String(index + 1).padStart(2, "0")}`;

                return {
                    day: month,
                    value: chartMap.get(key) || 0,
                };
            });
        }

        // 9. Final Response

        const response = {
            success: true,
            period,

            stats: {
                totalRevenue: currentRevenue,
                revenueChange: getPercentage(
                    currentRevenue,
                    previousRevenue
                ),

                totalOrders: currentOrders,
                ordersChange: getPercentage(
                    currentOrders,
                    previousOrders
                ),

                totalProducts,
                productsChange: getPercentage(
                    currentProducts,
                    previousProducts
                ),

                totalCustomers,
                customersChange: getPercentage(
                    currentCustomers,
                    previousCustomers
                ),
            },

            comparison: {
                currentRevenue,
                previousRevenue,
                currentOrders,
                previousOrders,
            },

            orderSummary: {
                completedOrders,
                processingOrders,
                pendingOrders,
                total: totalSummary,
            },

            recentOrders: formattedOrders,

            topProducts,

            chartData,
        };



        return res.status(200).json({ success: true, message: "get dashboard data", dashboardData: response });

    } catch (error) {
        return next(error);
    }
};



exports.GetAdminInquiryes = async (req, res, next) => {
    try {
        const inquiryes = await inquiryModel.find().sort({ createdAt: -1 })

        return res.status(200).json({ success: true, message: "Get All Inquiryes", inquiryes })
    } catch (error) {
        return next(error)
    }
}

exports.GetAdminInquiryUpdate = async (req, res, next) => {
    try {
        const inquiryId = req.params.id
        const { status } = req.body || {}
        const inquiry = await inquiryModel.findByIdAndUpdate(inquiryId, { status: status }, { returnDocument: 'after' })

        return res.status(200).json({ success: true, message: 'Update Inquiery', inquiry })
    } catch (error) {
        return next(error)
    }
}

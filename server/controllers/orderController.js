import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const placeOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod = "COD" } = req.body;

    const {
        fullName,
        phone,
        address,
        city,
        state,
        postalCode,
        country = "India",
    } = shippingAddress || {};

    if (
        !fullName ||
        !phone ||
        !address ||
        !city ||
        !state ||
        !postalCode
    ) {
        throw new ApiError(400, "Complete shipping address is required");
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
        throw new ApiError(400, "Invalid payment method");
    }

    const cart = await Cart.findOne({ userId }).populate({
        path: "items.productId",
        select:
            "productName images price discountPrice stock isActive",
    });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty");
    }

    const orderItems = [];
    let totalItems = 0;
    let subtotal = 0;

    for (const item of cart.items) {
        const product = item.productId;

        if (!product || !product.isActive) {
            throw new ApiError(
                400,
                "One or more products are unavailable"
            );
        }

        if (item.quantity > product.stock) {
            throw new ApiError(
                400,
                `Insufficient stock for ${product.productName}`
            );
        }

        const sellingPrice =
            product.discountPrice ?? product.price;

        const itemTotal = sellingPrice * item.quantity;

        orderItems.push({
            productId: product._id,
            productName: product.productName,
            image: product.images?.[0]?.url || "",
            quantity: item.quantity,
            price: sellingPrice,
            totalPrice: itemTotal,
        });

        totalItems += item.quantity;
        subtotal += itemTotal;
    }

    const shippingCharge = subtotal >= 1000 ? 0 : 50;
    const tax = 0;
    const totalAmount = subtotal + shippingCharge + tax;

    const session = await mongoose.startSession();

    let createdOrder;

    try {
        await session.withTransaction(async () => {
            createdOrder = await Order.create(
                [
                    {
                        userId,
                        items: orderItems,
                        shippingAddress: {
                            fullName,
                            phone,
                            address,
                            city,
                            state,
                            postalCode,
                            country,
                        },
                        totalItems,
                        subtotal,
                        shippingCharge,
                        tax,
                        totalAmount,
                        paymentMethod,
                        paymentStatus:
                            paymentMethod === "COD" ? "Pending" : "Pending",
                        orderStatus: "Pending",
                    },
                ],
                { session }
            );

            for (const item of orderItems) {
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        isActive: true,
                        stock: { $gte: item.quantity },
                    },
                    {
                        $inc: {
                            stock: -item.quantity,
                        },
                    },
                    {
                        new: true,
                        session,
                    }
                );

                if (!updatedProduct) {
                    throw new ApiError(
                        400,
                        `Stock changed for ${item.productName}. Please try again`
                    );
                }
            }

            await Cart.updateOne(
                { userId },
                {
                    $set: {
                        items: [],
                        totalItems: 0,
                        totalAmount: 0,
                    },
                },
                { session }
            );
        });
    } finally {
        await session.endSession();
    }

    const order = await Order.findById(
        createdOrder[0]._id
    ).populate("userId", "name email");

    res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
    });
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate("items.productId", "productName images")
        .populate("userId", "name email");

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        totalOrders: orders.length,
        orders,
    });
});

export const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findById(id)
        .populate("userId", "name email phone")
        .populate(
            "items.productId",
            "productName images brand price discountPrice stock isActive"
        );

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const loggedInUserId = req.user._id.toString();
    const orderUserId = order.userId._id.toString();

    if (
        req.user.role !== "admin" &&
        loggedInUserId !== orderUserId
    ) {
        throw new ApiError(
            403,
            "You are not authorized to view this order"
        );
    }

    res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        order,
    });
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const session = await mongoose.startSession();

    let cancelledOrder;

    try {
        await session.withTransaction(async () => {
            const order = await Order.findById(id).session(session);

            if (!order) {
                throw new ApiError(404, "Order not found");
            }

            if (order.userId.toString() !== userId.toString()) {
                throw new ApiError(
                    403,
                    "You are not authorized to cancel this order"
                );
            }

            const cancellableStatuses = [
                "Pending",
                "Confirmed",
            ];

            if (!cancellableStatuses.includes(order.orderStatus)) {
                throw new ApiError(
                    400,
                    `Order cannot be cancelled because its status is ${order.orderStatus}`
                );
            }

            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    {
                        $inc: {
                            stock: item.quantity,
                        },
                    },
                    {
                        session,
                    }
                );
            }

            order.orderStatus = "Cancelled";
            order.cancelledAt = new Date();

            if (
                order.paymentMethod === "ONLINE" &&
                order.paymentStatus === "Paid"
            ) {
                order.paymentStatus = "Refunded";
            }

            await order.save({ session });

            cancelledOrder = order;
        });
    } finally {
        await session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order: cancelledOrder,
    });
});

export const getAllOrders = asyncHandler(async (req, res) => {
    const {
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const query = {};

    if (orderStatus) {
        query.orderStatus = orderStatus;
    }

    if (paymentStatus) {
        query.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
        query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
        query.createdAt = {};

        if (startDate) {
            const parsedStartDate = new Date(startDate);

            if (Number.isNaN(parsedStartDate.getTime())) {
                throw new ApiError(400, "Invalid start date");
            }

            query.createdAt.$gte = parsedStartDate;
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate);

            if (Number.isNaN(parsedEndDate.getTime())) {
                throw new ApiError(400, "Invalid end date");
            }

            parsedEndDate.setHours(23, 59, 59, 999);
            query.createdAt.$lte = parsedEndDate;
        }
    }

    if (search?.trim()) {
        const searchText = search.trim();

        const matchingUsers = await User.find({
            $or: [
                {
                    name: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: searchText,
                        $options: "i",
                    },
                },
            ],
        }).select("_id");

        const userIds = matchingUsers.map((user) => user._id);

        const searchConditions = [
            {
                "items.productName": {
                    $regex: searchText,
                    $options: "i",
                },
            },
            {
                "shippingAddress.fullName": {
                    $regex: searchText,
                    $options: "i",
                },
            },
            {
                "shippingAddress.phone": {
                    $regex: searchText,
                    $options: "i",
                },
            },
            {
                userId: {
                    $in: userIds,
                },
            },
        ];

        if (mongoose.Types.ObjectId.isValid(searchText)) {
            searchConditions.push({
                _id: searchText,
            });
        }

        query.$or = searchConditions;
    }

    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);

    const pageLimit = Math.min(
        Math.max(Number.parseInt(limit, 10) || 10, 1),
        100
    );

    const skip = (pageNumber - 1) * pageLimit;

    const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "totalAmount",
        "totalItems",
        "orderStatus",
        "paymentStatus",
    ];

    const selectedSortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const selectedSortOrder =
        sortOrder === "asc" ? 1 : -1;

    const [orders, totalOrders] = await Promise.all([
        Order.find(query)
            .populate("userId", "name email phone role")
            .populate(
                "items.productId",
                "productName images brand isActive"
            )
            .sort({
                [selectedSortField]: selectedSortOrder,
            })
            .skip(skip)
            .limit(pageLimit),

        Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalOrders / pageLimit);

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        pagination: {
            currentPage: pageNumber,
            totalPages,
            totalOrders,
            limit: pageLimit,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1,
        },
        orders,
    });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
        throw new ApiError(400, "Invalid order status");
    }

    const session = await mongoose.startSession();

    let updatedOrder;

    try {
        await session.withTransaction(async () => {
            const order = await Order.findById(id).session(session);

            if (!order) {
                throw new ApiError(404, "Order not found");
            }

            if (order.orderStatus === orderStatus) {
                throw new ApiError(
                    400,
                    `Order status is already ${orderStatus}`
                );
            }

            if (order.orderStatus === "Cancelled") {
                throw new ApiError(
                    400,
                    "Cancelled order status cannot be changed"
                );
            }

            if (order.orderStatus === "Delivered") {
                throw new ApiError(
                    400,
                    "Delivered order status cannot be changed"
                );
            }

            const statusFlow = [
                "Pending",
                "Confirmed",
                "Packed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
            ];

            if (orderStatus !== "Cancelled") {
                const currentStatusIndex = statusFlow.indexOf(
                    order.orderStatus
                );

                const newStatusIndex = statusFlow.indexOf(orderStatus);

                if (newStatusIndex === -1) {
                    throw new ApiError(400, "Invalid order status");
                }

                if (newStatusIndex !== currentStatusIndex + 1) {
                    throw new ApiError(
                        400,
                        `Order status must move from ${order.orderStatus} to ${statusFlow[currentStatusIndex + 1]
                        }`
                    );
                }
            }

            if (orderStatus === "Cancelled") {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                stock: item.quantity,
                            },
                        },
                        {
                            session,
                        }
                    );
                }

                order.cancelledAt = new Date();

                if (
                    order.paymentMethod === "ONLINE" &&
                    order.paymentStatus === "Paid"
                ) {
                    order.paymentStatus = "Refunded";
                }
            }

            if (orderStatus === "Delivered") {
                order.deliveredAt = new Date();

                if (order.paymentMethod === "COD") {
                    order.paymentStatus = "Paid";
                }
            }

            order.orderStatus = orderStatus;

            await order.save({ session });

            updatedOrder = order;
        });
    } finally {
        await session.endSession();
    }

    await updatedOrder.populate("userId", "name email phone");

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder,
    });
});

export const getOrderDashboard = asyncHandler(async (req, res) => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    packedOrders,
    shippedOrders,
    outForDeliveryOrders,
    deliveredOrders,
    cancelledOrders,
    codOrders,
    onlineOrders,
    paidOrders,
    pendingPayments,
    refundedOrders,
    revenue,
    todayOrders,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),

    Order.countDocuments({
      orderStatus: "Pending",
    }),

    Order.countDocuments({
      orderStatus: "Confirmed",
    }),

    Order.countDocuments({
      orderStatus: "Packed",
    }),

    Order.countDocuments({
      orderStatus: "Shipped",
    }),

    Order.countDocuments({
      orderStatus: "Out for Delivery",
    }),

    Order.countDocuments({
      orderStatus: "Delivered",
    }),

    Order.countDocuments({
      orderStatus: "Cancelled",
    }),

    Order.countDocuments({
      paymentMethod: "COD",
    }),

    Order.countDocuments({
      paymentMethod: "ONLINE",
    }),

    Order.countDocuments({
      paymentStatus: "Paid",
    }),

    Order.countDocuments({
      paymentStatus: "Pending",
    }),

    Order.countDocuments({
      paymentStatus: "Refunded",
    }),

    Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]),

    Order.countDocuments({
      createdAt: {
        $gte: today,
      },
    }),

    Order.find()
      .populate("userId", "name email")
      .sort({
        createdAt: -1,
      })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    message: "Order dashboard fetched successfully",

    dashboard: {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,

      codOrders,
      onlineOrders,

      paidOrders,
      pendingPayments,
      refundedOrders,

      totalRevenue:
        revenue.length > 0
          ? revenue[0].totalRevenue
          : 0,

      todayOrders,

      recentOrders,
    },
  });
});
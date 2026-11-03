const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupons",
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["forward", "return", "rto"],
      default: "forward"
    },

    address: {
      name: { type: String, default: "" },
      tag: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      zipcode: { type: String, default: "" },
      contact: { type: String, default: "" },
    },

    items: {
      type: Array,
      default: [],
    },

    discount: {
      type: Number,
      default: 0,
    },

    shippingcharges: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    shipmentData: {
      type: {
        shipment_id: {
          type: String,
          default: null,
        },
        shiprocket_order_id: {
          type: String,
          default: null,
        },
        awb_number: {
          type: String,
          default: null,
        },
        courier_id: {
          type: String,
          default: null,
        },
        courier_partner: {
          type: String,
          default: null,
        }
      },
      default: null
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "processing",
        "pickup",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    picuprequest: {
      type: {
        picupId: { type: String },
        picupTime: { type: String },
        picupdate: { type: String },
      },
      default: null
    },

    paymentData: {
      method: {
        type: String,
        enum: ["prepaid", "cod"],
        default: "prepaid",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      razorpay_order_id: {
        type: String,
        default: null,
      },
      razorpay_payment_id: {
        type: String,
        default: null,
      },
      completeAt: {
        type: Date,
        default: null,
      },
    },

    rtoData: {
      type: {
        status: String,
        completeAt: Date,
      },
      default: null,
    },

    returnData: {
      type: {

        order_id: { type: String },
        shipment_id: { type: String },
        awb: { type: String },
        courier_name: { type: String },
        courier_id: { type: String },
        pickup_scheduled_date:{ type: String },
        status: { type: String },
        reason: { type: String },
        completeAt: { type: Date }
      },
      default: null,
    },

    refundData: {
      type: {
        method: {
          type: String,
          enum: ["prepaid", "cod"],
          default: "prepaid"
        },
        status: {
          type: String,
          enum: ["pending", "refunded", "failed","not_required"],
          default: "pending"
        },
        refundId: {
          type: String,
          default: null
        },

        accountDetails: {
          type: {
            accountHolderName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String, },
            accountType: { type: String, enum: ["savings", "current"] }
          },
          default: null
        },
        refundedAt: { type: Date, default: null },
      },
      default: null
    },

    completeAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Orders", orderSchema);
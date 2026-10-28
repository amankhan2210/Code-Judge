const mongoose = require("mongoose")

const testCaseItemSchema = new mongoose.Schema(
  {
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    extraArgs: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: []
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isHidden: {
      type: Boolean,
      required: true,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    _id: true
  }
)
const testCaseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      unique: true,
      index: true
    },

    case: {
      type: [testCaseItemSchema],
      required: true,
      validate: {
        validator: function (cases) {
          return Array.isArray(cases) && cases.length > 0;
        },
        message: "At least one test case is required"
      }
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("TestCase", testCaseSchema);
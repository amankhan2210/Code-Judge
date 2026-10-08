const mongoose = require("mongoose")

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true
    },

    output: {
      type: String,
      required: true
    },

    explanation: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const questionSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    questionNumber: {
      type: Number,
      unique: true,
      sparse: true
    },

    description: {
      type: String,
      required: true
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true
    },

    // Categorization
    topics: [{
      type: String,
      trim: true
    }],

    companies: [{
      type: String,
      trim: true
    }],

    // Problem details
    constraints: [{
      type: String
    }],

    examples: [exampleSchema],

    hints: [{
      type: String
    }],

    followUp: {
      type: String,
      default: ""
    },

    // Execution configuration
    executionMode: {
      type: String,
      enum: ["function", "stdin"],
      default: "function"
    },

    supportedLanguages: [{
      type: String,
      enum: ["cpp", "java", "python", "javascript"]
    }],

    // User-facing code templates
    starterCode: {
      type: Map,
      of: String,
      default: {}
    },

    // Internal helper classes/functions
    helperCode: {
      type: Map,
      of: String,
      default: {}
    },

    // Input parsing, function invocation and output formatting
    driverCode: {
      type: Map,
      of: String,
      default: {}
    },

    // Hidden reference solutions
    solutionCode: {
      type: Map,
      of: String,
      default: {},
      select: false
    },

    // Checker configuration
    checkerType: {
      type: String,
      enum: ["exact", "token", "custom"],
      default: "token"
    },

    checkerName: {
      type: String,
      default: null
    },

    // Judge0 limits
    timeLimit: {
      type: Number,
      default: 2000
    },

    memoryLimit: {
      type: Number,
      default: 256
    },

    // Statistics
    testCaseCount: {
      type: Number,
      default: 0
    },

    totalSubmissions: {
      type: Number,
      default: 0
    },

    acceptedSubmissions: {
      type: Number,
      default: 0
    },

    acceptanceRate: {
      type: Number,
      default: 0
    },

    // Versioning
    version: {
      type: Number,
      default: 1
    },

    // Publishing
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    // Admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
)

// Indexes
questionSchema.index({ difficulty: 1, topics: 1 })
questionSchema.index({ companies: 1, difficulty: 1 })
questionSchema.index({ isPublished: 1, questionNumber: 1 })

module.exports = mongoose.model("Question", questionSchema)
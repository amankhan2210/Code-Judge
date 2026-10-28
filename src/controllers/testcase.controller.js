const mongoose = require("mongoose")
const TestCase = require('../models/testcase.model')
const Question = require('../models/question.model')
const XLSX = require('xlsx')



function parseJSON(value, field, rowNumber) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `Row ${rowNumber}: ${field} is required`
    )
  }
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(
      `Row ${rowNumber}: invalid JSON in ${field}`
    )
  }
}

function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(item => normalize(item));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = normalize(value[key]);
    }
    return result;
  }
  return value;
}

async function uploadTestCases (req, res){
  try {
    const { questionId } = req.params
    if (!mongoose.isValidObjectId(questionId)) return res.status(400).json({success: false,message: "Invalid question ID"})
    if (!req.file) return res.status(400).json({success: false,message: "Excel file is required"})
    const question = await Question.findById(questionId)
    if (!question) return res.status(404).json({success: false,message: "Question not found"})
  
    const workbook = XLSX.read(req.file.buffer, {type: "buffer"})
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return res.status(400).json({success: false,message: "Worksheet not found"})

    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, {defval: "",raw: false})
    if (!rows.length) return res.status(400).json({success: false, message: "Excel file is empty"})

    const requiredHeaders = ["input","extraArgs","expectedOutput", "visibility"]
    const headers = Object.keys(rows[0]).map(header => header.trim())
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length) return res.status(400).json({success: false,message: "Required Excel columns are missing",missingHeaders})

    const validatedCases = []
    const errors = []
    const excelCases = new Map()

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      try {
        const input = parseJSON(row.input,"input",rowNumber)
        const extraArgs = parseJSON(row.extraArgs,"extraArgs",rowNumber)
        const output = parseJSON(row.expectedOutput,"expectedOutput",rowNumber)

        if (!Array.isArray(extraArgs)) throw new Error(`Row ${rowNumber}: extraArgs must be an array`)
        const duplicateKey = JSON.stringify({input: normalize(input),extraArgs: normalize(extraArgs)})
        // NEW: Check duplicate within Excel
        if (excelCases.has(duplicateKey)) {
          const firstRow = excelCases.get(duplicateKey)
          console.error( `[EXCEL DUPLICATE] First row: ${firstRow.rowNumber}`)
          console.error(`[EXCEL DUPLICATE] Duplicate row: ${rowNumber}`)
          errors.push(
            `Row ${rowNumber}: duplicate of Excel row ` +
            `${firstRow.rowNumber}. Data: ${JSON.stringify(row)}`
          )
          return
        }
        // NEW: Remember first occurrence
        excelCases.set(duplicateKey, {rowNumber, data: row})
        // Validate visibility
        const visibility = String(row.visibility).trim().toLowerCase()
        if (!["public", "hidden"].includes(visibility)) {
          throw new Error(
            `Row ${rowNumber}: visibility must be public or hidden`
          )
        }

        const testCase = {
          input,
          extraArgs,
          output,
          isHidden: visibility === "hidden",
          isActive: true
        }
        // NEW: Preserve original row number for DB validation
        validatedCases.push({
          rowNumber,
          data: row,
          testCase,
          duplicateKey
        })
      } catch (error) {
        console.error(
          `[EXCEL ROW ${rowNumber}] Validation failed:`,
          error.message
        )
        errors.push(error.message)
      }
    })
    if (errors.length > 0) {
      console.error(
        "[ERROR] Excel validation failed. Nothing saved."
      )
      return res.status(400).json({
        success: false,
        message: "Excel validation failed. Nothing was saved.",
        errors
      })
    }

    // PHASE 2: DATABASE DUPLICATE VALIDATION
    const existingDoc = await TestCase.findOne({ questionId }).lean()
     
    // NEW: Build a lookup of existing DB test cases
    const dbCases = new Map()
    for (const testCase of existingDoc?.case || []) {
      const key = JSON.stringify({
        input: normalize(testCase.input),
        extraArgs: normalize(testCase.extraArgs ?? [])
      })

      if (!dbCases.has(key)) dbCases.set(key, [])
      dbCases.get(key).push(testCase)
    }
    // NEW: Compare every Excel case against DB
    for (const item of validatedCases) {
      if (dbCases.has(item.duplicateKey)) {
        const matchingCases = dbCases.get(item.duplicateKey)
        errors.push(
          `Row ${item.rowNumber}: test case already exists in database. ` +
          `Data: ${JSON.stringify(item.data)}`
        )
      }
    }
    // NEW: Reject the complete upload if any DB duplicate exists
    if (errors.length > 0) {
      console.error("[ERROR] DB validation failed. Nothing saved.")
      return res.status(400).json({
        success: false,
        message: "Database validation failed. Nothing was saved.",
        errors
      })
    }
    const cases = validatedCases.map(item => item.testCase)
    const saved = await TestCase.findOneAndUpdate(
      { questionId },
      {
        $set: { questionId },
        $push: {
          case: { $each: cases }
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )
    await Question.findByIdAndUpdate(questionId, {$set: {testCaseCount:saved.case.length}})

    return res.status(200).json({
      success: true,
      message: "Test cases uploaded successfully",
      uploadedCases: cases.length,
      totalCases: saved.case.length
    })

  } catch (error) {
    console.error("[FATAL] Upload failed:", error);
    console.error("[FATAL] Error message:", error.message)
    console.log("========== TEST CASE UPLOAD FAILED ==========\n")
    return res.status(500).json({
      success: false,
      message: "Failed to upload test cases"
    })
  }
}


module.exports = {
  uploadTestCases
}
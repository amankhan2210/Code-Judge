const Question = require('../models/question.model')

async function createQuestion(req, res) {
    try{
        const {
            title,
            description,
            difficulty,
            topics,
            companies,
            constraints,
            examples,
            hints,
            followUp,
            executionMode,
            supportedLanguages,
            starterCode,
            helperCode,
            driverCode,
            solutionCode,
            checkerType,
            checkerName,
            timeLimit,
            memoryLimit,
            isPublished,
            isPremium
        } = req.body
        if(!title || !description || !difficulty) return res.status(400).json({success: false,message: "Title, description and difficulty are required"})
        const slug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
        const existingQuestion = await Question.findOne({ slug })
        if(existingQuestion) return res.status(400).json({success: false,message: "Question with this title already exists"})
        const lastQuestion = await Question.findOne().sort({ createdAt: -1 }).select('questionNumber')
        const questionNumber = lastQuestion ? lastQuestion.questionNumber + 1 : 1
        const question = await Question.create({
            title,
            slug,
            questionNumber,
            description,
            difficulty,
            topics: topics || [],
            companies: companies || [],
            constraints: constraints || [],
            examples: examples || [],
            hints: hints || [],
            followUp: followUp || "",
            executionMode: executionMode || "function",
            supportedLanguages: supportedLanguages || [],
            starterCode: starterCode || {},
            helperCode: helperCode || {},
            driverCode: driverCode || {},
            solutionCode: solutionCode || {},
            checkerType: checkerType || "token",
            checkerName: checkerName || null,
            timeLimit: timeLimit || 2000,
            memoryLimit: memoryLimit || 256,
            isPublished: isPublished || false,
            isPremium: isPremium || false,
            // createdBy: req.user._id
        })
        return res.status(201).json({success: true,message: "Question created successfully",data: question})
    }
    catch(error){
        console.error("Create Question Error:", error)
        return res.status(500).json({success: false,message: "Something went wrong"})           
    }
}

module.exports = {
    createQuestion  
}
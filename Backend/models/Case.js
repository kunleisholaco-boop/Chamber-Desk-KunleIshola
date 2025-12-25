const mongoose = require('mongoose');
const crypto = require('crypto');

const CaseSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    caseType: {
        type: String,
        required: true,
        enum: [
            'Criminal',
            'Civil',
            'Corporate/Commercial',
            'Real Estate',
            'Family Law',
            'Employment/Labour',
            'Intellectual Property',
            'Immigration',
            'Banking & Finance',
            'Litigation / ADR',
            'Others'
        ]
    },
    subCategory: {
        type: String
    },
    caseTitle: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    dateIssueStarted: {
        type: Date,
        required: true
    },
    clientObjective: {
        type: String,
        required: true
    },
    parties: [{
        name: String,
        role: String,
        address: String,
        contact: String
    }],
    opposingCounselHistory: [{
        name: String,
        dateAdded: {
            type: Date,
            default: Date.now
        }
    }],
    witnesses: [{
        name: String,
        contact: String,
        relationship: String
    }],
    inCourt: {
        type: Boolean,
        default: false
    },
    courtInfo: [{
        courtName: String,
        courtLocation: String,
        caseNumber: String,
        presidingJudge: String,
        nextCourtDate: Date,
        previousOrders: String,
        dateAdded: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['Open', 'Pending', 'Closed', 'Completed-Won', 'Completed-Lost'],
        default: 'Pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: {
        type: Date
    },
    assignedLawyers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedParalegals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientReports: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        subject: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        replies: [{
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            authorType: {
                type: String,
                enum: ['client', 'hoc', 'lawyer'],
                required: true
            },
            authorName: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    taskBasedAccess: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hooks
CaseSchema.pre('save', function (next) {
    // Update the updatedAt field
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Case', CaseSchema);
